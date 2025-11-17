import React, { useState, useEffect } from 'react';
import { Typography, Breadcrumb, Row, Col, Card, Button, Tag, Space, Divider, Spin, message, Modal } from 'antd';
import { useParams, Link } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined, EditOutlined, BgColorsOutlined } from '@ant-design/icons';
import { eventsApi, showsApi, apiUtils, eventStylesApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import VenueMap from '../components/VenueMap';
import EventStyleEditor from '../components/EventStyleEditor';
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
  
  // Modal de edición de estilos
  const [stylesModalOpen, setStylesModalOpen] = useState(false);
  const [eventStyles, setEventStyles] = useState({});
  const [savingStyles, setSavingStyles] = useState(false);
  
  // Verificar si el usuario puede editar
  const canEdit = user && (user.role === 'ADMIN' || user.role === 'ORGANIZER');

  // Cargar Google Fonts dinámicamente si el evento tiene fuente personalizada
  useEffect(() => {
    if (event && event.font_family && event.font_family !== 'inherit') {
      const fontName = event.font_family.replace(/["']/g, '').split(',')[0].trim();
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [event?.font_family]);

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos del evento específico
        // ✅ GET /api/events/:eventId YA INCLUYE LOS SHOWS
        const eventResponse = await eventsApi.getEvent(eventId);
        if (eventResponse) {
          setEvent(eventResponse);
          
          // Los shows vienen incluidos en la respuesta del evento
          const showsList = eventResponse.shows || [];
          setShows(showsList);
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

  // Formatear fecha
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return 'Fecha por definir';
    }
  };

  // Formatear hora
  const formatEventTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm", { locale: es }) + " HS";
    } catch (error) {
      return "21:00 HS";
    }
  };
  
  // Handler para abrir modal de estilos
  const handleOpenStylesModal = () => {
    if (!event) return;
    
    setEventStyles({
      description: event.description || '',
      primary_color: event.primary_color || '#4F46E5',
      secondary_color: event.secondary_color || '#818CF8',
      text_color: event.text_color || '#1F2937',
      font_family: event.font_family || 'inherit'
    });
    setStylesModalOpen(true);
  };
  
  // Handler para guardar estilos
  const handleSaveStyles = async () => {
    if (!event) return;
    
    try {
      setSavingStyles(true);
      
      const stylesToSave = {
        description: eventStyles.description,
        primary_color: eventStyles.primary_color,
        secondary_color: eventStyles.secondary_color,
        text_color: eventStyles.text_color,
        font_family: eventStyles.font_family
      };
      
      await eventStylesApi.updateEventStyles(event.id, stylesToSave);
      
      message.success('🎨 Estilos actualizados correctamente');
      
      // Recargar el evento para ver los cambios
      const updatedEvent = await eventsApi.getEvent(eventId);
      setEvent(updatedEvent);
      
      setStylesModalOpen(false);
    } catch (error) {
      console.error('Error al guardar estilos:', error);
      const errorMsg = error.response?.data?.message || 'Error al actualizar estilos';
      message.error(errorMsg);
    } finally {
      setSavingStyles(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'transparent', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ 
        background: 'transparent', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text>Evento no encontrado</Text>
      </div>
    );
  }

  // Extraer estilos personalizados del evento
  const primaryColor = event?.primary_color || '#4F46E5';
  const secondaryColor = event?.secondary_color || '#818CF8';
  const textColor = event?.text_color || '#1F2937';
  const fontFamily = event?.font_family || 'inherit';
  
  return (
    <div style={{ 
      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, // Degradado intenso en toda la página
      minHeight: '100vh', 
      fontFamily: fontFamily 
    }}>
      {/* Hero Section */}
      <div style={{ 
        position: 'relative',
        height: 600,
        background: `url(${getEventBannerUrl(event)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        {/* Botón Editar Estilos (solo admin/organizer) */}
        {canEdit && (
          <Button
            type="primary"
            icon={<BgColorsOutlined />}
            onClick={handleOpenStylesModal}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            size="large"
          >
            Editar Estilos
          </Button>
        )}
        <div style={{ 
          padding: '40px 24px',
          color: 'white',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%'
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
              marginBottom: 24,
              fontFamily: fontFamily,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {event.name}
          </Title>
          <Space>
            <Tag 
              style={{ 
                background: primaryColor, 
                color: 'white', 
                border: 'none',
                padding: '4px 12px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Evento
            </Tag>
            <Tag 
              style={{ 
                background: secondaryColor, 
                color: 'white', 
                border: 'none',
                padding: '4px 12px',
                fontSize: '0.9rem'
              }}
            >
              {event.venue_name || event.venue || 'Venue por definir'}
            </Tag>
            {shows.length > 0 && (
              <Tag 
                style={{ 
                  background: '#10B981', 
                  color: 'white', 
                  border: 'none',
                  padding: '4px 12px',
                  fontSize: '0.9rem'
                }}
              >
                {shows.length} {shows.length === 1 ? 'función' : 'funciones'}
              </Tag>
            )}
          </Space>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <Row gutter={[32, 32]}>
          {/* Event Info */}
          <Col xs={24} lg={14}>
            <Card 
              title="Acerca del Evento" 
              style={{ 
                marginBottom: 24,
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Text style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                  {event.description}
                </Text>
                
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Space>
                      <EnvironmentOutlined style={{ color: primaryColor }} />
                      <div>
                        <Text strong>Lugar</Text>
                        <br />
                        <Text>{event.venue_name || 'Venue por definir'}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                          {event.venue_city || 'Ciudad por definir'}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <CalendarOutlined style={{ color: primaryColor }} />
                      <div>
                        <Text strong>Próxima Función</Text>
                        <br />
                        <Text>
                          {event.next_show_date 
                            ? formatEventDate(event.next_show_date)
                            : 'Por definir'}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                          {shows.length} {shows.length === 1 ? 'función disponible' : 'funciones disponibles'}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                </Row>
              </Space>
            </Card>

            {/* Mapa de Ubicación */}
            {mapsLoaded && event.venue_name && (
              <VenueMap 
                venue={{
                  name: event.venue_name,
                  address: event.venue_address || `${event.venue_name}, ${event.venue_city || 'Argentina'}`,
                  latitude: event.venue_latitude,
                  longitude: event.venue_longitude
                }}
                height={350}
              />
            )}
          </Col>

          {/* Shows Available */}
          <Col xs={24} lg={10}>
            <Card 
              title="Fechas Disponibles"
              style={{
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {shows.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    background: '#f9fafb',
                    borderRadius: 8
                  }}>
                    <Text type="secondary">
                      No hay funciones disponibles para este evento
                    </Text>
                  </div>
                ) : (
                  shows.map((show) => {
                    const showDate = new Date(show.startsAt || show.starts_at);
                    const isAvailable = show.available_seats > 0;
                    const isSoldOut = show.available_seats === 0;
                    const hasLowSeats = show.available_seats > 0 && show.available_seats < 50;

                    return (
                      <Card 
                        key={show.id}
                        size="small"
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: 12,
                          background: 'white',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}
                      >
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space direction="vertical" size={4}>
                              <Space>
                                <CalendarOutlined style={{ color: primaryColor }} />
                                <Text strong>
                                  {showDate.toLocaleDateString('es-AR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </Text>
                              </Space>
                              <Space>
                                <ClockCircleOutlined style={{ color: secondaryColor }} />
                                <Text>
                                  {showDate.toLocaleTimeString('es-AR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} HS
                                </Text>
                              </Space>
                              {show.min_price && (
                                <Text style={{ fontSize: '0.85rem', color: '#666' }}>
                                  Desde ${(show.min_price / 100).toLocaleString()}
                                </Text>
                              )}
                              {show.available_seats !== undefined && (
                                <Text style={{ fontSize: '0.85rem', color: '#666' }}>
                                  {show.available_seats} entradas disponibles
                                </Text>
                              )}
                            </Space>
                          </Col>
                          <Col>
                            <Space direction="vertical" align="end">
                              <Tag color={
                                isSoldOut ? 'red' :
                                hasLowSeats ? 'orange' : 'green'
                              }>
                                {isSoldOut ? 'AGOTADO' : 
                                 hasLowSeats ? 'POCAS ENTRADAS' : 'DISPONIBLE'}
                              </Tag>
                              <Link to={`/queue/${show.id}`}>
                                <Button 
                                  type="primary"
                                  disabled={isSoldOut}
                                  style={{
                                    background: isSoldOut ? '#d9d9d9' :
                                               `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    color: 'white'
                                  }}
                                >
                                  {isSoldOut ? 'Agotado' : 'Comprar'}
                                </Button>
                              </Link>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Sección Informativa */}
        <div style={{ 
          maxWidth: 1200, 
          margin: '60px auto 0',
          padding: '40px 24px'
        }}>
          <Row gutter={[32, 32]}>
            {/* Métodos de Pago */}
            <Col xs={24} sm={12} lg={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem',
                  marginBottom: 16,
                  background: 'white',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  💳
                </div>
                <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                  Métodos de Pago
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  Tarjetas de crédito/débito, MercadoPago y transferencias
                </Text>
              </div>
            </Col>

            {/* Mayores de Edad */}
            <Col xs={24} sm={12} lg={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem',
                  marginBottom: 16,
                  background: 'white',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  🔞
                </div>
                <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                  Mayores de 18 años
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  Se requiere DNI o documento oficial para el ingreso al evento
                </Text>
              </div>
            </Col>

            {/* E-Ticket */}
            <Col xs={24} sm={12} lg={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem',
                  marginBottom: 16,
                  background: 'white',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  🎫
                </div>
                <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                  E-Ticket Digital
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  Recibí tu entrada en tu email y presentá el código QR en tu celular
                </Text>
              </div>
            </Col>

            {/* Políticas */}
            <Col xs={24} sm={12} lg={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2.5rem',
                  marginBottom: 16,
                  background: 'white',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  📜
                </div>
                <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                  Políticas del Evento
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  Consulta los términos y condiciones antes de tu compra
                </Text>
              </div>
            </Col>
          </Row>

          {/* Información Adicional */}
          <Card 
            style={{ 
              marginTop: 40,
              background: 'white',
              borderRadius: 16,
              border: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: '1.1rem', color: primaryColor }}>
                      ✅ Compra Segura
                    </Text>
                    <br />
                    <Text type="secondary">
                      Todas las transacciones están protegidas y encriptadas
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '1.1rem', color: primaryColor }}>
                      📧 Entrega Inmediata
                    </Text>
                    <br />
                    <Text type="secondary">
                      Recibí tus entradas al instante en tu correo electrónico
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '1.1rem', color: primaryColor }}>
                      📱 Acceso Fácil
                    </Text>
                    <br />
                    <Text type="secondary">
                      Presenta tu QR desde tu celular, sin necesidad de imprimir
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: '1.1rem', color: primaryColor }}>
                      🎪 Términos y Condiciones
                    </Text>
                    <br />
                    <Text type="secondary">
                      - No se permiten alimentos ni bebidas del exterior<br />
                      - Prohibido fumar dentro del recinto<br />
                      - El evento puede ser fotografiado o filmado
                    </Text>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '1.1rem', color: primaryColor }}>
                      🔄 Política de Reembolso
                    </Text>
                    <br />
                    <Text type="secondary">
                      Las entradas no son reembolsables excepto en caso de cancelación del evento
                    </Text>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
      
      {/* Modal de Edición de Estilos */}
      <Modal
        title={
          <Space>
            <BgColorsOutlined />
            <span>Personalizar Estilos del Evento</span>
          </Space>
        }
        open={stylesModalOpen}
        onCancel={() => setStylesModalOpen(false)}
        footer={[
          <Button
            key="save"
            type="primary"
            onClick={handleSaveStyles}
            loading={savingStyles}
            icon={<BgColorsOutlined />}
          >
            💾 Guardar Estilos
          </Button>,
          <Button
            key="cancel"
            onClick={() => setStylesModalOpen(false)}
          >
            Cancelar
          </Button>
        ]}
        width={1200}
        centered
      >
        {event && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 8 }}>
              <Text strong style={{ fontSize: '1.1rem' }}>
                {event.name}
              </Text>
              <br />
              <Text type="secondary">
                ID: {event.id} | {event.venue_name || 'Sin venue'}
              </Text>
            </div>
            
            <EventStyleEditor
              initialStyles={eventStyles}
              onChange={(newStyles) => setEventStyles(newStyles)}
              showPreview={true}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
