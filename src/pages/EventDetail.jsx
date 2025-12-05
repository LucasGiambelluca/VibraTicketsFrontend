import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Breadcrumb, Row, Col, Card, Button, Tag, Space, Divider, Spin, message, Modal, Skeleton, ConfigProvider } from 'antd';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { 
  CreditCard, 
  UserCheck, 
  Ticket, 
  FileText, 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  Info, 
  RefreshCw,
  MapPin,
  Calendar
} from 'lucide-react';
import { eventsApi, apiUtils, eventStylesApi, ordersApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import VenueMap from '../components/VenueMap';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { getEventBannerUrl } from '../utils/imageUtils';

const { Title, Text } = Typography;

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoaded: mapsLoaded } = useGoogleMaps();
  const navigate = useNavigate();
  const [pendingOrderModal, setPendingOrderModal] = useState({ visible: false, order: null, targetShowId: null });
  
  // Calcular el próximo show
  const nextShow = useMemo(() => {
    if (!shows || shows.length === 0) return null;
    const now = new Date();
    const futureShows = shows
      .filter(show => {
        const showDate = new Date(show.startsAt || show.starts_at);
        return showDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.startsAt || a.starts_at);
        const dateB = new Date(b.startsAt || b.starts_at);
        return dateA - dateB;
      });
    return futureShows.length > 0 ? futureShows[0] : shows[shows.length - 1];
  }, [shows]);

  // Cargar Google Fonts dinámicamente
  useEffect(() => {
    if (event && event.font_family && event.font_family !== 'inherit') {
      const fontName = event.font_family.replace(/["']/g, '').split(',')[0].trim();
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [event?.font_family]);

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);
        const eventResponse = await eventsApi.getEvent(eventId);
        if (eventResponse) {
          setEvent(eventResponse);
          setShows(eventResponse.shows || []);
        } else {
          throw new Error('Evento no encontrado');
        }
      } catch (err) {
        console.error('❌ Error cargando evento:', err);
        const errorInfo = apiUtils.handleApiError(err);
        setError(errorInfo.message);
        message.error(`Error al cargar el evento: ${errorInfo.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  // 🐞 AUTO-DEBUG: Log orders on mount
  useEffect(() => {
    const debugOrders = async () => {
      if (!user) return;
      try {
        console.log('🚀 EventDetail Mounted. Checking orders for debug...');
        const response = await ordersApi.getMyOrders();
        console.log('🐞 Raw response:', response);
        
        let ordersList = [];
        if (Array.isArray(response)) ordersList = response;
        else if (response?.data?.orders) ordersList = response.data.orders;
        else if (response?.orders) ordersList = response.orders;
        else if (Array.isArray(response?.data)) ordersList = response.data;
        
        console.log('🐞 Parsed orders:', ordersList);
        
        const pending = ordersList.filter(o => o.status === 'PENDING');
        console.log('🐞 Pending orders:', pending);
        
        if (event) {
          const match = pending.find(o => String(o.eventId) === String(event.id));
          console.log('🐞 Match for this event:', match);
        }
      } catch (e) {
        console.error('🐞 Error debugging orders:', e);
      }
    };
    
    if (event) {
      debugOrders();
    }
  }, [user, event]);

  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return 'Fecha por definir';
    }
  };

  const formatEventTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm", { locale: es }) + " HS";
    } catch (error) {
      return "21:00 HS";
    }
  };

  const [checkingPendingOrder, setCheckingPendingOrder] = useState(false);

  // Verificar órdenes pendientes al hacer click en Comprar
  const handleBuyClick = async (showId) => {
    if (!user) {
      navigate(`/shows/${showId}`);
      return;
    }

    try {
      setCheckingPendingOrder(true);
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
      
      // Buscar orden PENDING para este evento (< 30 min)
      console.log('🔍 Checking pending orders for event:', event.id);
      const pendingOrder = ordersList.find(order => {
        if (order.status !== 'PENDING') return false;
        
        const created = new Date(order.createdAt || order.created_at);
        const now = new Date();
        const diffMinutes = (now - created) / 1000 / 60;
        
        console.log(`Checking order #${order.id}: Status=${order.status}, Diff=${diffMinutes.toFixed(1)}m, EventId=${order.eventId} vs Current=${event.id}`);
        
        if (diffMinutes >= 30) return false;

        // Verificar coincidencia de evento
        if (event.id) {
          // Comparar como strings para evitar problemas de tipos
          return String(order.eventId) === String(event.id);
        }
        return false;
      });

      console.log('Found pending order:', pendingOrder);

      if (pendingOrder) {
        setPendingOrderModal({ visible: true, order: pendingOrder, targetShowId: showId });
      } else {
        navigate(`/shows/${showId}`);
      }
    } catch (error) {
      console.error('Error checking pending orders:', error);
      navigate(`/shows/${showId}`);
    } finally {
      setCheckingPendingOrder(false);
    }
  };

  const handleResumePendingOrder = async () => {
    if (!pendingOrderModal.order) return;
    
    try {
      const response = await ordersApi.resumeOrder(pendingOrderModal.order.id);
      const data = response.data || response;
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        navigate('/mis-ordenes');
      }
    } catch (error) {
      console.error('Error resuming order:', error);
      navigate('/mis-ordenes');
    } finally {
      setPendingOrderModal({ visible: false, order: null, targetShowId: null });
    }
  };

  const handleStartNewPurchase = () => {
    const targetShowId = pendingOrderModal.targetShowId;
    setPendingOrderModal({ visible: false, order: null, targetShowId: null });
    if (targetShowId) {
      navigate(`/shows/${targetShowId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        padding: '60px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        background: 'var(--bg-color)'
      }}>
        <div style={{ height: 400, background: '#f0f0f0', borderRadius: 16, marginBottom: 40 }} className="fade-in" />
        <Row gutter={[48, 48]}>
          <Col xs={24} lg={14}>
             <Skeleton active paragraph={{ rows: 6 }} />
             <div style={{ marginTop: 40 }}>
               <Skeleton active paragraph={{ rows: 4 }} />
             </div>
          </Col>
          <Col xs={24} lg={10}>
             <Skeleton.Input active size="large" block style={{ height: 300, borderRadius: 16 }} />
          </Col>
        </Row>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-color)'
      }}>
        <Text>Evento no encontrado</Text>
      </div>
    );
  }

  const primaryColor = event?.primary_color || '#000000';
  const fontFamily = event?.font_family || 'var(--font-family)';
  
  return (
    <div className="fade-in" style={{ 
      background: 'var(--bg-color)', 
      minHeight: '100vh', 
      fontFamily: fontFamily 
    }}>
      {/* Hero Section Minimalista */}
      <div style={{ 
        position: 'relative',
        height: 400, // Reducido de 600px
        background: `url(${getEventBannerUrl(event)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        {/* Overlay sutil */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'
        }} />



        <div style={{ 
          position: 'relative',
          padding: '40px 24px',
          color: 'white',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          zIndex: 2
        }}>
          <Breadcrumb 
            items={[
              { title: <Link to="/" style={{ color: 'rgba(255,255,255,0.8)' }}>Inicio</Link> }, 
              { title: <span style={{ color: 'rgba(255,255,255,0.8)' }}>Eventos</span> }, 
              { title: <span style={{ color: 'white' }}>{event.name}</span> }
            ]} 
            style={{ marginBottom: 16 }}
          />
          <Title 
            level={1} 
            style={{ 
              color: 'white', 
              fontSize: '3rem', 
              marginBottom: 16,
              fontFamily: fontFamily,
              fontWeight: 700
            }}
          >
            {event.name}
          </Title>
          <Space size="middle">
            <Tag style={{ background: 'white', color: 'black', border: 'none', fontWeight: 600 }}>
              {event.venue_name || 'Venue por definir'}
            </Tag>
            {shows.length > 0 && (
              <Tag style={{ background: 'var(--accent-color)', color: 'white', border: 'none', fontWeight: 600 }}>
                {shows.length} {shows.length === 1 ? 'función' : 'funciones'}
              </Tag>
            )}
          </Space>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <Row gutter={[48, 48]}>
          {/* Columna Izquierda: Info + Mapa */}
          <Col xs={24} lg={14}>
            <div style={{ marginBottom: 48 }}>
              <Title level={3} style={{ marginBottom: 24 }}>Acerca del Evento</Title>
              <Text style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {event.description}
              </Text>
            </div>

            <div style={{ marginBottom: 48 }}>
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Space align="start">
                    <MapPin size={24} color="var(--text-primary)" />
                    <div>
                      <Text strong style={{ fontSize: '1.1rem' }}>Lugar</Text>
                      <br />
                      <Text style={{ color: 'var(--text-secondary)' }}>{event.venue_name}</Text>
                      <br />
                      <Text type="secondary">{event.venue_city}</Text>
                    </div>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space align="start">
                    <Calendar size={24} color="var(--text-primary)" />
                    <div>
                      <Text strong style={{ fontSize: '1.1rem' }}>Próxima Función</Text>
                      <br />
                      <Text style={{ color: 'var(--text-secondary)' }}>
                        {nextShow ? formatEventDate(nextShow.startsAt || nextShow.starts_at) : 'Por definir'}
                      </Text>
                    </div>
                  </Space>
                </Col>
              </Row>
            </div>

            {mapsLoaded && event.venue_name && (
              <div style={{ borderRadius: 'var(--border-radius)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <VenueMap 
                  venue={{
                    name: event.venue_name,
                    address: event.venue_address || `${event.venue_name}, ${event.venue_city || 'Argentina'}`,
                    latitude: event.venue_latitude,
                    longitude: event.venue_longitude
                  }}
                  height={300}
                />
              </div>
            )}
          </Col>

          {/* Columna Derecha: Tickets */}
          <Col xs={24} lg={10}>
            <div style={{ 
              background: 'white', 
              padding: 32, 
              borderRadius: 'var(--border-radius)', 
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              position: 'sticky',
              top: 100
            }}>
              <Title level={4} style={{ marginBottom: 24 }}>Seleccioná tu función</Title>
              
              {event.sale_start_date && new Date(event.sale_start_date) > new Date() ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px 16px',
                  background: '#f0f5ff',
                  borderRadius: '8px',
                  border: '1px solid #adc6ff'
                }}>
                  <ClockCircleOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={5} style={{ color: '#1890ff', marginBottom: '8px' }}>
                    Próximamente
                  </Title>
                  <Text style={{ display: 'block', marginBottom: '8px' }}>
                    La venta de entradas comenzará el:
                  </Text>
                  <Text strong style={{ fontSize: '1.1rem' }}>
                    {new Date(event.sale_start_date).toLocaleString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} hs
                  </Text>
                </div>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {shows.length === 0 ? (
                    <Text type="secondary">No hay funciones disponibles.</Text>
                  ) : (
                    shows.map((show) => {
                      const showDate = new Date(show.startsAt || show.starts_at);
                      const isSoldOut = show.available_seats === 0;

                      return (
                        <div 
                          key={show.id}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-sm)',
                            padding: 16,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Row justify="space-between" align="middle">
                            <Col>
                              <Text strong style={{ fontSize: '1rem', display: 'block' }}>
                                {showDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </Text>
                              <Text type="secondary">
                                {showDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} HS
                              </Text>
                            </Col>
                            <Col>
                              <Button 
                                type="primary" 
                                size="large"
                                disabled={isSoldOut || checkingPendingOrder} // Disable while checking
                                onClick={() => handleBuyClick(show.id)}
                                style={{
                                  background: isSoldOut ? '#ccc' : 'black',
                                  borderColor: isSoldOut ? '#ccc' : 'black',
                                  height: 40,
                                  padding: '0 24px'
                                }}
                              >
                                {isSoldOut ? 'Agotado' : 'Comprar'}
                              </Button>
                            </Col>
                          </Row>
                        </div>
                      );
                    })
                  )}
                </Space>
              )}
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '60px 0' }} />

        {/* Iconos Minimalistas */}
        <Row gutter={[48, 48]} justify="center">
          <Col xs={12} md={6} style={{ textAlign: 'center' }}>
            <CreditCard size={40} strokeWidth={1.5} style={{ marginBottom: 16, color: 'var(--text-primary)' }} />
            <Title level={5}>Medios de Pago</Title>
            <Text type="secondary">Tarjetas, MercadoPago y efectivo</Text>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'center' }}>
            <UserCheck size={40} strokeWidth={1.5} style={{ marginBottom: 16, color: 'var(--text-primary)' }} />
            <Title level={5}>Mayores de 18</Title>
            <Text type="secondary">Ingreso con DNI físico</Text>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'center' }}>
            <Ticket size={40} strokeWidth={1.5} style={{ marginBottom: 16, color: 'var(--text-primary)' }} />
            <Title level={5}>E-Ticket</Title>
            <Text type="secondary">Entrada digital con QR</Text>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'center' }}>
            <FileText size={40} strokeWidth={1.5} style={{ marginBottom: 16, color: 'var(--text-primary)' }} />
            <Title level={5}>Políticas</Title>
            <Text type="secondary">Revisá los términos del evento</Text>
          </Col>
        </Row>

        <div style={{ 
          marginTop: 60, 
          padding: 40, 
          background: 'var(--bg-secondary)', 
          borderRadius: 'var(--border-radius)' 
        }}>
          <Row gutter={[48, 32]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="large">
                <Space align="start">
                  <ShieldCheck size={24} />
                  <div>
                    <Text strong>Compra Segura</Text>
                    <br />
                    <Text type="secondary">Tus datos están protegidos con encriptación SSL.</Text>
                  </div>
                </Space>
                <Space align="start">
                  <Mail size={24} />
                  <div>
                    <Text strong>Entrega Inmediata</Text>
                    <br />
                    <Text type="secondary">Recibí tus tickets en tu email al instante.</Text>
                  </div>
                </Space>
                <Space align="start">
                  <Smartphone size={24} />
                  <div>
                    <Text strong>Acceso Fácil</Text>
                    <br />
                    <Text type="secondary">Mostrá el QR desde tu celular, sin imprimir.</Text>
                  </div>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="large">
                <Space align="start">
                  <Info size={24} />
                  <div>
                    <Text strong>Información Importante</Text>
                    <br />
                    <Text type="secondary">Prohibido ingresar con alimentos o bebidas.</Text>
                  </div>
                </Space>
                <Space align="start">
                  <RefreshCw size={24} />
                  <div>
                    <Text strong>Política de Reembolso</Text>
                    <br />
                    <Text type="secondary">Tickets no reembolsables salvo cancelación.</Text>
                  </div>
                </Space>
              </Space>
            </Col>
          </Row>
        </div>
      </div>



      {/* Modal de orden pendiente */}
      <Modal
        open={pendingOrderModal.visible}
        onCancel={() => setPendingOrderModal({ visible: false, order: null, targetShowId: null })}
        footer={null}
        centered
        width={450}
        title={null}
        closable={true}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: '#fff7e6', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ fontSize: 32 }}>⏳</span>
          </div>
          
          <Title level={4} style={{ margin: '0 0 8px' }}>
            Tenés una reserva pendiente
          </Title>
          
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Ya iniciaste una compra para este evento hace unos minutos. 
            ¿Querés retomar el pago o elegir nuevos lugares?
          </Text>

          {pendingOrderModal.order && (
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 24,
              textAlign: 'left'
            }}>
              <Text strong>{pendingOrderModal.order.eventName || event?.name || 'Este evento'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {pendingOrderModal.order.items_count || pendingOrderModal.order.quantity || '?'} entrada(s) • 
                ${((pendingOrderModal.order.totalCents || pendingOrderModal.order.total_cents || 0) / 100).toLocaleString('es-AR')}
              </Text>
            </div>
          )}

          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Button 
              type="primary" 
              size="large" 
              block
              onClick={handleResumePendingOrder}
              style={{ height: 48, borderRadius: 12, background: '#52c41a', borderColor: '#52c41a' }}
            >
              Retomar Pago
            </Button>
            
            <Button 
              size="large" 
              block
              onClick={handleStartNewPurchase}
              style={{ height: 48, borderRadius: 12 }}
            >
              Elegir Nuevos Lugares
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
