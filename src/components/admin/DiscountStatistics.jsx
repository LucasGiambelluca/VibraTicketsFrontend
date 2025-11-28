import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag,
  Typography, Space, Spin, Alert, Empty,
  Progress, Divider, Button, DatePicker, Badge
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
// Removed chart imports - will use simple statistics display
import { discountService } from '../../services/discountService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DiscountStatistics = ({ codeId }) => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, [codeId, dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      
      const data = await discountService.getStatistics(codeId, params);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await discountService.exportStatistics({ codeId });
    } catch (error) {
      console.error('Error exporting statistics:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: '16px' }}>
          Cargando estadísticas...
        </Text>
      </div>
    );
  }

  if (!statistics) {
    return (
      <Empty description="No hay estadísticas disponibles" />
    );
  }


  // Columnas para la tabla de órdenes recientes
  const orderColumns = [
    {
      title: 'Orden ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: 'Usuario',
      dataIndex: 'userName',
      key: 'userName',
      render: (name, record) => (
        <Space>
          <UserOutlined />
          <Text>{name}</Text>
          <Text type="secondary">{record.userEmail}</Text>
        </Space>
      )
    },
    {
      title: 'Evento',
      dataIndex: 'eventName',
      key: 'eventName',
      ellipsis: true
    },
    {
      title: 'Total Original',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      render: (amount) => `$${amount.toLocaleString('es-AR')}`
    },
    {
      title: 'Descuento',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amount) => (
        <Text type="danger">
          -${amount.toLocaleString('es-AR')}
        </Text>
      )
    },
    {
      title: 'Total Final',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${amount.toLocaleString('es-AR')}
        </Text>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('es-AR')
    }
  ];

  return (
    <div>
      {/* Controles */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={16}>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            format="DD/MM/YYYY"
            placeholder={['Fecha inicio', 'Fecha fin']}
          />
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadStatistics}>
              Actualizar
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Exportar
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Información del código */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle">
          <Col span={12}>
            <Space direction="vertical">
              <Title level={4} style={{ margin: 0 }}>
                {statistics.code}
              </Title>
              <Text type="secondary">{statistics.description}</Text>
            </Space>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space size="large">
              <Tag color={statistics.isActive ? 'success' : 'error'}>
                {statistics.isActive ? 'ACTIVO' : 'INACTIVO'}
              </Tag>
              <Tag color="blue">
                {statistics.discountType === 'PERCENTAGE' 
                  ? `${statistics.discountValue}%`
                  : `$${statistics.discountValue}`}
              </Tag>
              {statistics.validUntil && (
                <Tag icon={<CalendarOutlined />}>
                  Válido hasta {new Date(statistics.validUntil).toLocaleDateString('es-AR')}
                </Tag>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Usos"
              value={statistics.totalUsage}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            {statistics.usageLimit && (
              <Progress
                percent={(statistics.totalUsage / statistics.usageLimit) * 100}
                size="small"
                status={statistics.totalUsage >= statistics.usageLimit ? 'exception' : 'active'}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Usuarios Únicos"
              value={statistics.uniqueUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Descontado"
              value={statistics.totalDiscounted}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Descuento Promedio"
              value={statistics.averageDiscount}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos simplificados */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title={
            <Space>
              <LineChartOutlined />
              Uso en el Tiempo
            </Space>
          }>
            {statistics.usageOverTime && statistics.usageOverTime.length > 0 ? (
              <Table
                dataSource={statistics.usageOverTime}
                columns={[
                  {
                    title: 'Fecha',
                    dataIndex: 'date',
                    key: 'date',
                    render: (date) => new Date(date).toLocaleDateString('es-AR')
                  },
                  {
                    title: 'Cantidad de Usos',
                    dataIndex: 'count',
                    key: 'count',
                    render: (count) => <Tag color="blue">{count}</Tag>
                  }
                ]}
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="Sin datos de uso temporal" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title={
            <Space>
              <BarChartOutlined />
              Uso por Evento
            </Space>
          }>
            {statistics.usageByEvent && statistics.usageByEvent.length > 0 ? (
              <div>
                {statistics.usageByEvent.map((item, index) => (
                  <div key={index} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text ellipsis style={{ maxWidth: '70%' }}>{item.eventName}</Text>
                      <Badge count={item.count} style={{ backgroundColor: '#764ba2' }} />
                    </div>
                    <Progress 
                      percent={(item.count / Math.max(...statistics.usageByEvent.map(e => e.count))) * 100} 
                      showInfo={false}
                      strokeColor="#764ba2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="Sin datos por evento" />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title={
            <Space>
              <UserOutlined />
              Distribución por Tipo de Usuario
            </Space>
          }>
            {statistics.userTypeDistribution && statistics.userTypeDistribution.length > 0 ? (
              <div>
                {statistics.userTypeDistribution.map((item, index) => {
                  const total = statistics.userTypeDistribution.reduce((sum, i) => sum + i.value, 0);
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div key={index} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text>{item.type}</Text>
                        <Text strong>{percentage}% ({item.value})</Text>
                      </div>
                      <Progress 
                        percent={parseFloat(percentage)} 
                        showInfo={false}
                        strokeColor={index === 0 ? '#52c41a' : index === 1 ? '#1890ff' : '#faad14'}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="Sin datos de distribución" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Tabla de órdenes recientes */}
      <Card title={
        <Space>
          <ShoppingCartOutlined />
          Órdenes Recientes con este Código
        </Space>
      }>
        {statistics.recentOrders && statistics.recentOrders.length > 0 ? (
          <Table
            columns={orderColumns}
            dataSource={statistics.recentOrders}
            rowKey="orderId"
            pagination={{
              pageSize: 5,
              showSizeChanger: false
            }}
          />
        ) : (
          <Empty description="No hay órdenes recientes" />
        )}
      </Card>

      {/* Información adicional */}
      <Alert
        message="Información Adicional"
        description={
          <Space direction="vertical" size="small">
            <Text>• Creado el: {new Date(statistics.createdAt).toLocaleDateString('es-AR')}</Text>
            <Text>• Última modificación: {new Date(statistics.updatedAt).toLocaleDateString('es-AR')}</Text>
            {statistics.lastUsedAt && (
              <Text>• Último uso: {new Date(statistics.lastUsedAt).toLocaleDateString('es-AR')}</Text>
            )}
            {statistics.minimumPurchase > 0 && (
              <Text>• Compra mínima requerida: ${statistics.minimumPurchase}</Text>
            )}
            {statistics.maximumDiscount && (
              <Text>• Descuento máximo: ${statistics.maximumDiscount}</Text>
            )}
          </Space>
        }
        type="info"
        showIcon
        style={{ marginTop: '24px' }}
      />
    </div>
  );
};

export default DiscountStatistics;
