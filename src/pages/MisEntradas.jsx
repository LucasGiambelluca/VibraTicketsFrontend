import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Empty, Button, Typography, Divider, Tag, Space, message, Drawer, Select, QRCode, Input, Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, QrcodeOutlined, CheckCircleOutlined, SwapOutlined, SearchOutlined, FilterOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { ordersApi, testPaymentsApi, usersApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventImageUrl } from '../utils/imageUtils';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;
const { Option } = Select;

export default function MisEntradas() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar tickets del usuario
  useEffect(() => {
    const loadTickets = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Usar la ruta de test-payments que tiene los tickets reales
        let ticketsData = [];
        try {
          const response = await testPaymentsApi.getMyTickets();
          // La respuesta viene en formato: { success: true, data: { tickets: [...], count: X } }
          if (response?.data?.tickets) {
            ticketsData = response.data.tickets;
          } else if (response?.tickets) {
            ticketsData = response.tickets;
          } else if (Array.isArray(response)) {
            ticketsData = response;
          }
          
          } catch (ticketsError) {
          console.error('❌ Error al obtener tickets de test-payments:', ticketsError);
          // Fallback: obtener órdenes y extraer tickets
          try {
            const ordersResponse = await usersApi.getMyOrders();
            const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.orders || ordersResponse?.data?.orders || []);
            
            // Extraer tickets de cada orden
            for (const order of orders) {
              if (order.tickets && Array.isArray(order.tickets)) {
                ticketsData = [...ticketsData, ...order.tickets];
              }
            }
          } catch (ordersError) {
            console.error('❌ Error al obtener órdenes:', ordersError);
          }
        }

        setTickets(ticketsData);
      } catch (err) {
        console.error('❌ Error al cargar tickets:', err);
        setError(err.message || 'Error al cargar tus entradas');
        message.error('No se pudieron cargar tus entradas. Inténtalo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [isAuthenticated, user]);

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    // Filtro por estado
    if (filter === 'issued' && ticket.status !== 'ISSUED') return false;
    if (filter === 'redeemed' && ticket.status !== 'REDEEMED') return false;
    if (filter === 'cancelled' && ticket.status !== 'CANCELLED') return false;
    
    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const eventName = (ticket.event_name || ticket.eventName || '').toLowerCase();
      const venue = (ticket.venue || '').toLowerCase();
      const sector = (ticket.sector || '').toLowerCase();
      
      if (!eventName.includes(search) && !venue.includes(search) && !sector.includes(search)) {
        return false;
      }
    }
    
    return true;
  });

  // Función para obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'ISSUED': return 'green';
      case 'REDEEMED': return 'blue';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  // Función para obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'ISSUED': return 'Activo';
      case 'REDEEMED': return 'Usado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Banner Hero */}
      <div style={{ 
        position: 'relative',
        height: 600,
        background: `url(https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=2000&q=80)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        <div style={{ 
          padding: '40px 24px',
          color: 'white',
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <img 
              src={logo} 
              alt="VibraTicket" 
              style={{ 
                height: 60, 
                width: 'auto',
                filter: 'brightness(0) invert(1) drop-shadow(2px 2px 8px rgba(0,0,0,0.7))'
              }} 
            />
            <Title 
              level={1} 
              style={{ 
                color: 'white', 
                fontSize: '3rem', 
                margin: 0,
                textShadow: '2px 2px 8px rgba(0,0,0,0.7)'
              }}
            >
              Mis Entradas
            </Title>
          </div>
          <Text style={{ 
            color: 'white', 
            fontSize: '1.3rem',
            textShadow: '1px 1px 4px rgba(0,0,0,0.7)'
          }}>
            Administrá todas tus entradas en un solo lugar
          </Text>
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: 'calc(100vh - 600px)',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* Estadísticas */}
            {!loading && (
              <Space size="large" style={{ marginTop: 16 }}>
                <Text strong style={{ color: 'white' }}>
                  Total: <Tag color="blue">{tickets.length}</Tag>
                </Text>
                <Text strong style={{ color: 'white' }}>
                  Activos: <Tag color="green">{tickets.filter(t => t.status === 'ISSUED').length}</Tag>
                </Text>
                <Text strong style={{ color: 'white' }}>
                  Usados: <Tag color="blue">{tickets.filter(t => t.status === 'REDEEMED').length}</Tag>
                </Text>
              </Space>
            )}
            
            {/* Filtros */}
            <Row gutter={16} justify="center" style={{ marginTop: 24 }}>
              <Col>
                <Input
                  placeholder="Buscar eventos..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250, borderRadius: 8 }}
                  allowClear
                />
              </Col>
              <Col>
                <Select
                  value={filter}
                  style={{ width: 180 }}
                  onChange={setFilter}
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="all">Todos los tickets</Option>
                  <Option value="issued">Activos</Option>
                  <Option value="redeemed">Usados</Option>
                  <Option value="cancelled">Cancelados</Option>
                </Select>
              </Col>
            </Row>
          </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text style={{ color: 'white', fontSize: '1rem' }}>Cargando tus entradas...</Text>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px' }}>
            <CloseCircleOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
            <Title level={4}>Error al cargar entradas</Title>
            <Text type="secondary">{error}</Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </Card>
        )}

        {/* Not Authenticated */}
        {!isAuthenticated && !loading && (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px' }}>
            <Title level={4}>🔒 Debes iniciar sesión</Title>
            <Text type="secondary">Inicia sesión para ver tus entradas</Text>
            <div style={{ marginTop: 24 }}>
              <Link to="/login">
                <Button type="primary" size="large">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && isAuthenticated && filteredTickets.length === 0 && tickets.length === 0 && (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px' }}>
            <Empty
              description={
                <span>
                  <Title level={4}>No tenés entradas aún</Title>
                  <Text type="secondary">Comprá tu primera entrada para empezar</Text>
                </span>
              }
            />
            <div style={{ marginTop: 24 }}>
              <Link to="/">
                <Button type="primary" size="large">
                  Explorar Eventos
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* No Results State */}
        {!loading && !error && isAuthenticated && filteredTickets.length === 0 && tickets.length > 0 && (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px' }}>
            <Empty
              description={
                <span>
                  <Title level={4}>No se encontraron resultados</Title>
                  <Text type="secondary">Intentá con otros filtros</Text>
                </span>
              }
            />
            <div style={{ marginTop: 24 }}>
              <Button onClick={() => { setFilter('all'); setSearchTerm(''); }}>
                Limpiar Filtros
              </Button>
            </div>
          </Card>
        )}

        {/* Lista de Tickets */}
        {!loading && !error && isAuthenticated && filteredTickets.length > 0 && (
          <Row gutter={[24, 24]}>
            {filteredTickets.map((ticket) => {
              const eventName = ticket.event_name || ticket.eventName || 'Evento';
              const venue = ticket.venue || 'Venue';
              const showDate = ticket.show_date || ticket.showDate;
              const sector = ticket.sector || 'General';
              const seatNumber = ticket.seat_number || ticket.seatNumber || '';
              const qrCode = ticket.qr_code || ticket.qrCode;
              const status = ticket.status || 'ISSUED';
              
              // Obtener URL de imagen con fallbacks y placeholder
              let imageUrl;
              if (ticket.event && typeof ticket.event === 'object') {
                // Si ticket.event es un objeto, usar getEventImageUrl
                imageUrl = getEventImageUrl(ticket.event, 'horizontal');
              } else if (ticket.event_image_url || ticket.eventImageUrl) {
                // Si hay URL de imagen directa del ticket
                const imgUrl = ticket.event_image_url || ticket.eventImageUrl;
                imageUrl = imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL || 'https://vibratickets.online'}${imgUrl}`;
              } else {
                // Placeholder por defecto
                imageUrl = `https://via.placeholder.com/400x200/667eea/ffffff?text=${encodeURIComponent(eventName)}`;
              }

              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={ticket.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                          src={imageUrl}
                          alt={eventName}
                          style={{
                            width: '100%',
                            height: 160,
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=300&h=200&fit=crop';
                          }}
                        />
                        {/* Badge de Estado */}
                        <Tag 
                          color={getStatusColor(status)}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}
                        >
                          {status === 'ISSUED' && <CheckCircleOutlined />}
                          {status === 'REDEEMED' && <CheckCircleOutlined />}
                          {status === 'CANCELLED' && <CloseCircleOutlined />}
                          {' '}{getStatusText(status)}
                        </Tag>
                        
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          color: 'white',
                          padding: '20px 16px 12px'
                        }}>
                          <Text strong style={{ color: 'white', fontSize: '0.9rem', display: 'block' }}>
                            {eventName}
                          </Text>
                        </div>
                      </div>
                    }
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                  >
                    <div style={{ padding: '8px 0' }}>
                      {/* Fecha */}
                      {showDate && (
                        <Space style={{ marginBottom: 8, width: '100%' }}>
                          <CalendarOutlined style={{ color: '#1890ff' }} />
                          <Text style={{ fontSize: '0.85rem', color: '#666' }}>
                            {format(new Date(showDate), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </Text>
                        </Space>
                      )}
                      
                      {/* Venue */}
                      <Space style={{ marginBottom: 8, width: '100%' }}>
                        <EnvironmentOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ fontSize: '0.85rem', color: '#666' }}>
                          {venue}
                        </Text>
                      </Space>
                      
                      {/* Sector y Asiento */}
                      <Text strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>
                        {sector} {seatNumber && `- ${seatNumber}`}
                      </Text>
                      
                      {/* Botones */}
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Link to={`/ticket/${ticket.ticket_number}`} style={{ width: '100%' }}>
                          <Button
                            type="primary"
                            block
                            icon={<QrcodeOutlined />}
                            disabled={status === 'CANCELLED'}
                            style={{
                              background: status === 'CANCELLED' ? '#d9d9d9' :
                                'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                              border: 'none',
                              borderRadius: 8,
                              fontWeight: 600,
                              height: 40
                            }}
                          >
                            Ver QR Code
                          </Button>
                        </Link>
                        
                        {qrCode && status !== 'CANCELLED' && (
                          <Button
                            block
                            icon={<DownloadOutlined />}
                            onClick={() => {
                              // TODO: Implementar descarga de PDF
                              message.info('Descarga de PDF próximamente');
                            }}
                            style={{
                              borderRadius: 8,
                              height: 36
                            }}
                          >
                            Descargar PDF
                          </Button>
                        )}
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
        </div>
      </div>
    </div>
  );
}
