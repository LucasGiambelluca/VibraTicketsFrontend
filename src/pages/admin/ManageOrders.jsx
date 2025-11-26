import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  message, 
  Tag, 
  Space, 
  Modal, 
  Typography,
  Tooltip,
  Spin,
  Empty,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  DeleteOutlined, 
  ReloadOutlined, 
  ExclamationCircleOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { manageOrdersApi } from '../../services/apiService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Cargar órdenes pendientes al montar el componente
  useEffect(() => {
    loadPendingOrders();
  }, []);

  // Función para cargar órdenes pendientes
  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        message.error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      if (user?.role !== 'ADMIN') {
        message.error('No tienes permisos de administrador.');
        return;
      }
      
      // Verificar si el token está expirado
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            message.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            return;
          }
        }
      } catch (e) {
        console.warn('Error verificando token');
      }
      
      const response = await manageOrdersApi.getPendingOrders();
      
      // El backend puede devolver un array directamente o un objeto con data
      let ordersData = [];
      
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (response && response.rows && Array.isArray(response.rows)) {
        ordersData = response.rows;
      }
      setOrders(ordersData);
      
      if (ordersData.length === 0) {
        message.info('No hay órdenes pendientes en este momento');
      } else {
        message.success(`Se cargaron ${ordersData.length} órdenes pendientes`);
      }
    } catch (error) {
      console.error('Error cargando órdenes pendientes:', error.message);
      
      // Mostrar mensaje de error más específico
      if (error.status === 401 || error.message?.includes('401')) {
        message.error('No tienes permisos para ver las órdenes. Verifica que seas administrador.');
      } else if (error.status === 500 || error.message?.includes('500')) {
        message.error('Error en el servidor. Verifica que el backend esté corriendo.');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        message.error('No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000');
      } else {
        message.error(error.message || 'Error al cargar las órdenes pendientes');
      }
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cancelar una orden
  const handleCancelOrder = (orderId) => {
    confirm({
      title: '¿Estás seguro de cancelar esta orden?',
      icon: <ExclamationCircleOutlined />,
      content: 'Esta acción liberará los asientos reservados y no se podrá deshacer.',
      okText: 'Sí, cancelar orden',
      okType: 'danger',
      cancelText: 'No, mantener orden',
      onOk: async () => {
        try {
          setCancellingOrderId(orderId);
          const response = await manageOrdersApi.cancelOrder(orderId);
          
          message.success(response.message || `Orden #${orderId} cancelada exitosamente`);
          
          // Recargar la lista de órdenes
          await loadPendingOrders();
        } catch (error) {
          console.error('Error cancelando orden:', error);
          
          // Manejar errores específicos
          if (error.status === 404) {
            message.error('La orden no fue encontrada');
          } else if (error.status === 409) {
            message.error(error.message || 'La orden no se puede cancelar porque no está pendiente');
          } else {
            message.error('Error al cancelar la orden');
          }
        } finally {
          setCancellingOrderId(null);
        }
      }
    });
  };

  // Calcular estadísticas
  const calculateStats = () => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100;
    const totalItems = orders.reduce((sum, order) => sum + (order.itemCount || 0), 0);
    
    return { totalOrders, totalAmount, totalItems };
  };

  const stats = calculateStats();

  // Columnas de la tabla
  const columns = [
    {
      title: 'ID Orden',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
      render: (orderId) => (
        <Text strong>#{orderId}</Text>
      ),
      sorter: (a, b) => a.orderId - b.orderId,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          PENDING: { color: 'warning', text: 'Pendiente' },
          PAID: { color: 'success', text: 'Pagada' },
          CANCELLED: { color: 'default', text: 'Cancelada' },
          EXPIRED: { color: 'error', text: 'Expirada' }
        };
        
        const config = statusConfig[status] || { color: 'default', text: status };
        
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: 'Pendiente', value: 'PENDING' },
        { text: 'Pagada', value: 'PAID' },
        { text: 'Cancelada', value: 'CANCELLED' },
        { text: 'Expirada', value: 'EXPIRED' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Usuario',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email) => (
        <Space>
          <UserOutlined />
          <Text>{email || 'N/A'}</Text>
        </Space>
      ),
      sorter: (a, b) => (a.userEmail || '').localeCompare(b.userEmail || ''),
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      align: 'center',
      render: (count) => (
        <Space>
          <ShoppingCartOutlined />
          <Text>{count || 0}</Text>
        </Space>
      ),
      sorter: (a, b) => (a.itemCount || 0) - (b.itemCount || 0),
    },
    {
      title: 'Total',
      dataIndex: 'total_cents',
      key: 'total_cents',
      width: 120,
      align: 'right',
      render: (cents) => {
        const amount = (cents || 0) / 100;
        return (
          <Text strong style={{ color: '#52c41a' }}>
            ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Text>
        );
      },
      sorter: (a, b) => (a.total_cents || 0) - (b.total_cents || 0),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => {
        if (!date) return 'N/A';
        const dayjsDate = dayjs(date);
        return (
          <Tooltip title={dayjsDate.format('DD/MM/YYYY HH:mm:ss')}>
            <Space direction="vertical" size={0}>
              <Text>{dayjsDate.format('DD/MM/YYYY')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {dayjsDate.fromNow()}
              </Text>
            </Space>
          </Tooltip>
        );
      },
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Cancelar orden">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={cancellingOrderId === record.orderId}
              onClick={() => handleCancelOrder(record.orderId)}
            >
              Cancelar
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2} style={{ margin: 0 }}>
                Gestión de Órdenes Pendientes
              </Title>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadPendingOrders}
                loading={loading}
              >
                Actualizar
              </Button>
            </div>
            <Text type="secondary">
              Administra y cancela órdenes que están en estado pendiente de pago
            </Text>
          </Space>
        </Card>

        {/* Estadísticas */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Órdenes Pendientes"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total en Órdenes"
                value={stats.totalAmount}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Items Totales"
                value={stats.totalItems}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla de órdenes */}
        <Card>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="orderId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} órdenes`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            locale={{
              emptyText: (
                <Empty
                  description="No hay órdenes pendientes"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    </div>
  );
}
