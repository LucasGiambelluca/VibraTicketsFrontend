import React, { useState, useEffect } from 'react';
import { Typography, Card, List, Tag, Button, Space, message, Spin, Empty, Modal, Divider } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ShoppingCartOutlined, CalendarOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { format, startOfMonth, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

const { Title, Text } = Typography;

export default function MisOrdenes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getMyOrders();
      
      let ordersList = [];
      if (Array.isArray(response)) {
        ordersList = response;
      } else if (response?.data?.orders) {
        ordersList = response.data.orders;
      } else if (response?.orders) {
        ordersList = response.orders;
      } else if (Array.isArray(response?.data)) {
        ordersList = response.data;
      }
      
      // Filtrar solo PENDING y PAID del mes actual
      const startOfCurrentMonth = startOfMonth(new Date());
      const filteredOrders = ordersList.filter(order => {
        const isPendingOrPaid = order.status === 'PENDING' || order.status === 'PAID';
        const orderDate = new Date(order.createdAt || order.created_at);
        const isThisMonth = isAfter(orderDate, startOfCurrentMonth) || orderDate.getTime() === startOfCurrentMonth.getTime();
        return isPendingOrPaid && isThisMonth;
      });
      
      // Ordenar por fecha descendente
      setOrders(filteredOrders.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)));
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error('No se pudieron cargar tús órdenes.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumePayment = async (orderId, e) => {
    e?.stopPropagation(); // Evitar que se abra el modal
    try {
      setRetryingId(orderId);
      message.loading({ content: 'Preparando pago...', key: 'resume' });
      
      const response = await ordersApi.resumeOrder(orderId);
      const data = response.data || response;

      if (data.checkoutUrl) {
        message.success({ content: 'Redirigiendo a pago...', key: 'resume' });
        window.location.href = data.checkoutUrl;
      } else if (data.initPoint) {
         window.location.href = data.initPoint;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('Error resuming order:', error);
      if (error.response?.status === 410) {
        message.error({ content: 'La orden ha expirado. Por favor iniciá una nueva compra.', key: 'resume' });
        setModalVisible(false);
        loadOrders(); 
      } else {
        message.error({ content: 'No se pudo reanudar el pago. Intentá nuevamente.', key: 'resume' });
      }
    } finally {
      setRetryingId(null);
    }
  };

  // Helper para obtener el total
  const getOrderTotal = (order) => {
    if (order.totalCents) return order.totalCents / 100;
    if (order.total_cents) return order.total_cents / 100;
    if (order.total) return order.total;
    return 0;
  };

  const isRetryable = (order) => {
    if (order.status !== 'PENDING') return false;
    const created = new Date(order.createdAt || order.created_at);
    const now = new Date();
    const diffMinutes = (now - created) / 1000 / 60;
    return diffMinutes < 30;
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Tarjeta de orden clickeable
  const OrderCard = ({ order }) => {
    const isPending = order.status === 'PENDING';
    const total = getOrderTotal(order);
    const eventName = order.eventName || order.event?.name || `Orden #${order.id}`;
    
    return (
      <Card 
        hoverable
        onClick={() => openOrderDetail(order)}
        style={{ 
          marginBottom: 16, 
          borderRadius: 16,
          border: isPending ? '2px solid #faad14' : '1px solid #f0f0f0',
          background: isPending ? '#fffbe6' : '#fff',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        bodyStyle={{ padding: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space direction="vertical" size={4}>
            <Text strong style={{ fontSize: 16 }}>{eventName}</Text>
            <Space>
              <CalendarOutlined style={{ color: '#888' }} />
              <Text type="secondary">
                {format(new Date(order.createdAt || order.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
              </Text>
            </Space>
            <Text strong style={{ fontSize: 18, color: isPending ? '#faad14' : '#52c41a' }}>
              ${total.toLocaleString('es-AR')}
            </Text>
          </Space>
          
          <Space direction="vertical" align="end">
            <Tag 
              color={isPending ? 'warning' : 'success'} 
              icon={isPending ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
              style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20 }}
            >
              {isPending ? 'PENDIENTE' : 'PAGADO'}
            </Tag>
            <Button type="text" icon={<EyeOutlined />} style={{ color: '#888' }}>
              Ver detalle
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  // Modal de detalle de orden
  const OrderDetailModal = () => {
    if (!selectedOrder) return null;
    
    const order = selectedOrder;
    const isPending = order.status === 'PENDING';
    const total = getOrderTotal(order);
    const eventName = order.eventName || order.event?.name || `Orden #${order.id}`;
    const tickets = order.tickets || order.items || [];
    const canRetry = isRetryable(order);

    return (
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        centered
        title={
          <Space>
            <span>Orden #{order.id}</span>
            <Tag color={isPending ? 'warning' : 'success'}>
              {isPending ? 'PENDIENTE' : 'PAGADO'}
            </Tag>
          </Space>
        }
      >
        <div style={{ padding: '16px 0' }}>
          {/* Info del evento */}
          <div style={{ 
            background: isPending ? '#fffbe6' : '#f6ffed', 
            padding: 16, 
            borderRadius: 12,
            marginBottom: 16 
          }}>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>{eventName}</Title>
            <Space direction="vertical" size={4}>
              <Space>
                <CalendarOutlined />
                <Text>
                  Fecha de compra: {format(new Date(order.createdAt || order.created_at), "dd 'de' MMMM yyyy, HH:mm'hs'", { locale: es })}
                </Text>
              </Space>
              {order.venueName && (
                <Space>
                  <EnvironmentOutlined />
                  <Text>{order.venueName}</Text>
                </Space>
              )}
            </Space>
          </div>

          {/* Lista de tickets/items */}
          <Divider orientation="left" style={{ margin: '16px 0 12px' }}>
            Detalle de la compra
          </Divider>
          
          {tickets.length > 0 ? (
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              {tickets.map((ticket, idx) => {
                const price = (ticket.price || ticket.seat?.price || 0) / 100;
                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Text>
                      {ticket.sectionName || ticket.seat?.sector || ticket.section || 'Entrada General'}
                      {ticket.seat?.number && ` - ${ticket.seat.number}`}
                    </Text>
                    <Text strong>
                      ${price.toLocaleString('es-AR')}
                    </Text>
                  </div>
                );
              })}
              
              {/* Service Charge - Always display */}
              {(() => {
                const subtotal = tickets.reduce((sum, t) => sum + ((t.price || t.seat?.price || 0) / 100), 0);
                const serviceCharge = subtotal * 0.15; // Always 15% of subtotal
                
                return (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                      marginTop: 4
                    }}>
                      <Text strong>Subtotal</Text>
                      <Text strong>
                        ${subtotal.toLocaleString('es-AR')}
                      </Text>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '8px 0',
                      alignItems: 'center'
                    }}>
                      <Space size={4}>
                        <Text type="secondary">Cargo por servicio</Text>
                        <Tag color="blue" style={{ fontSize: '10px', marginLeft: 4 }}>15%</Tag>
                      </Space>
                      <Text type="secondary">
                        ${serviceCharge.toLocaleString('es-AR')}
                      </Text>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
              <Text type="secondary">
                {order.items_count || order.quantity || 1} entrada(s)
              </Text>
            </div>
          )}

          {/* Total */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: isPending ? '#fff7e6' : '#f6ffed',
            padding: 16,
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text strong style={{ fontSize: 16 }}>Total</Text>
            <Title level={3} style={{ margin: 0, color: isPending ? '#faad14' : '#52c41a' }}>
              ${total.toLocaleString('es-AR')}
            </Title>
          </div>

          {/* Acciones */}
          {isPending && (
            <div style={{ textAlign: 'center' }}>
              {canRetry ? (
                <>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    loading={retryingId === order.id}
                    onClick={(e) => handleResumePayment(order.id, e)}
                    style={{ 
                      background: '#faad14', 
                      borderColor: '#faad14',
                      width: '100%',
                      height: 48,
                      fontSize: 16,
                      borderRadius: 12
                    }}
                  >
                    Completar Pago
                  </Button>
                  <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                    Tenés 30 minutos desde la creación para completar el pago
                  </Text>
                </>
              ) : (
                <div style={{ padding: 16, background: '#fff2f0', borderRadius: 12 }}>
                  <Text type="danger">
                    Esta orden ha expirado. Por favor iniciá una nueva compra.
                  </Text>
                </div>
              )}
            </div>
          )}

          {order.status === 'PAID' && (
            <Button 
              type="primary" 
              size="large"
              onClick={() => {
                setModalVisible(false);
                navigate('/mis-entradas');
              }}
              style={{ width: '100%', height: 48, borderRadius: 12 }}
            >
              Ver Mis Entradas
            </Button>
          )}
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 16 }}>Cargando tus órdenes...</Text>
      </div>
    );
  }

  const currentMonthName = format(new Date(), "MMMM yyyy", { locale: es });

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Mis Órdenes</Title>
        <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>
          {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
        </Tag>
      </div>

      {orders.length === 0 ? (
        <Empty 
          description={`No tenés órdenes en ${currentMonthName}`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/')}>Ver Eventos</Button>
        </Empty>
      ) : (
        <List
          dataSource={orders}
          renderItem={order => <OrderCard order={order} />}
        />
      )}

      <OrderDetailModal />
    </div>
  );
}
