import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Empty, Button, Typography, Tag, Space, message, Input, Spin, Divider, Alert } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, QrcodeOutlined, SearchOutlined, FilterOutlined, CloseCircleOutlined, DownloadOutlined, TagOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { usersApi, testPaymentsApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventImageUrl } from '../utils/imageUtils';

const { Title, Text } = Typography;

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
        
        // 1. Intentar obtener tickets del endpoint oficial de usuarios
        let ticketsData = [];
        try {
          const response = await usersApi.getMyTickets();
          if (response?.tickets) {
            ticketsData = response.tickets;
          } else if (Array.isArray(response)) {
            ticketsData = response;
          } else if (response?.data) {
            ticketsData = response.data;
          }
        } catch (usersError) {
          console.error('⚠️ Error al obtener tickets de usersApi:', usersError);
        }

        // 2. Si no hay tickets, intentar obtener órdenes y extraer tickets (Fallback)
        if (ticketsData.length === 0) {
          try {
            const ordersResponse = await usersApi.getMyOrders();
            const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.orders || ordersResponse?.data?.orders || []);
            
            for (const order of orders) {
              if (order.tickets && Array.isArray(order.tickets)) {
                ticketsData = [...ticketsData, ...order.tickets];
              }
            }
          } catch (ordersError) {
            console.error('⚠️ Error al obtener órdenes:', ordersError);
          }
        }

        // 3. Último recurso: testPaymentsApi (solo si sigue vacío)
        if (ticketsData.length === 0) {
          try {
            const response = await testPaymentsApi.getMyTickets();
            if (response?.data?.tickets) {
              ticketsData = response.data.tickets;
            } else if (response?.tickets) {
              ticketsData = response.tickets;
            } else if (Array.isArray(response)) {
              ticketsData = response;
            }
          } catch (testError) {
            console.warn('⚠️ Error en testPaymentsApi:', testError);
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

  // 🔔 Polling for real-time ticket status updates (chargebacks, etc.)
  useEffect(() => {
    if (!isAuthenticated || tickets.length === 0) {
      return;
    }

    // Poll every 10 seconds for ticket updates
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling for ticket updates...');
        
        let ticketsData = [];
        
        // Use same loading logic as initial load
        try {
          const response = await usersApi.getMyTickets();
          if (response?.tickets) {
            ticketsData = response.tickets;
          } else if (Array.isArray(response)) {
            ticketsData = response;
          } else if (response?.data) {
            ticketsData = response.data;
          }
        } catch (error) {
          console.error('⚠️ Error polling tickets:', error);
          return; // Don't update state if poll fails
        }

        // Check if any tickets changed status (especially CANCELLED)
        const cancelledTickets = ticketsData.filter(
          t => t.status === 'CANCELLED'
        );
        const previousCancelledCount = tickets.filter(
          t => t.status === 'CANCELLED'
        ).length;

        if (cancelledTickets.length > previousCancelledCount) {
          // New cancellation detected
          const newCancelledCount = cancelledTickets.length - previousCancelledCount;
          message.warning({
            content: `🚨 ${newCancelledCount} ticket(s) ${newCancelledCount > 1 ? 'were' : 'was'} cancelled`,
            duration: 10,
          });
        }

        // Update tickets
        setTickets(ticketsData);

      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(pollInterval);
      console.log('🛑 Stopped polling ticket updates');
    };
  }, [isAuthenticated, tickets, usersApi]);

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    // Filtro de eventos pasados
    const showDateStr = ticket.show_date || ticket.showDate;
    if (showDateStr) {
      const showDate = new Date(showDateStr);
      const now = new Date();
      // Si el evento ya pasó (ayer o antes), no mostrarlo
      // Damos un margen de 24hs post-evento para que aún se vea el día del show
      const oneDayAfter = new Date(showDate);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);
      
      if (now > oneDayAfter) return false;
    }

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ISSUED': return '#52c41a';
      case 'REDEEMED': return '#1890ff';
      case 'CANCELLED': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ISSUED': return 'Activo';
      case 'REDEEMED': return 'Usado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: 60 }}>
      {/* Header Simple */}
      <div style={{ 
        background: 'white', 
        padding: '32px 24px', 
        borderBottom: '1px solid #eaeaea',
        marginBottom: 32
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>Mis Entradas</Title>
              <Text type="secondary">Gestioná tus próximos eventos</Text>
            </div>
            
            {/* Filtros Compactos */}
            <Space>
              <Input
                placeholder="Buscar..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 200, borderRadius: 8 }}
                allowClear
              />
              <Button 
                icon={<FilterOutlined />} 
                onClick={() => setFilter(filter === 'all' ? 'issued' : 'all')}
                type={filter !== 'all' ? 'primary' : 'default'}
                style={{ borderRadius: 8 }}
              >
                {filter === 'all' ? 'Todos' : 'Activos'}
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        {/* Security Warning */}
        <Alert
          message="IMPORTANTE: Seguridad de tus Entradas"
          description="Por seguridad, tus códigos QR definitivos se habilitarán en esta pantalla 48 horas antes del inicio del evento."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 24, border: '1px solid #faad14' }}
        />
        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>Cargando tus entradas...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px' }}>
            <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
            <Title level={4}>Error al cargar entradas</Title>
            <Text type="secondary">{error}</Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
          </Card>
        )}

        {/* Empty State - Vibrant & Modern */}
        {!loading && !error && isAuthenticated && filteredTickets.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 24,
            color: 'white',
            boxShadow: '0 20px 40px rgba(118, 75, 162, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: -50, left: -50, width: 200, height: 200,
              background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute', bottom: -30, right: -30, width: 150, height: 150,
              background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                width: 80, height: 80, 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                backdropFilter: 'blur(10px)'
              }}>
                <TagOutlined style={{ fontSize: 40, color: 'white' }} />
              </div>
              
              <Title level={3} style={{ color: 'white', margin: '0 0 16px' }}>
                {filter !== 'all' ? 'No hay entradas con este filtro' : 'Aún no tenés entradas'}
              </Title>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, display: 'block', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                {filter !== 'all' 
                  ? 'Probá cambiando los filtros para ver tus otras entradas.' 
                  : '¡Es hora de vivir nuevas experiencias! Explorá los mejores eventos y asegurá tu lugar.'}
              </Text>

              <Link to="/">
                <Button 
                  size="large" 
                  style={{ 
                    height: 50,
                    padding: '0 32px',
                    borderRadius: 25,
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    background: 'white',
                    color: '#764ba2',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  Explorar Eventos
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Ticket List - Cards Modernas */}
        {!loading && !error && isAuthenticated && filteredTickets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {filteredTickets.map((ticket) => {
              const eventName = ticket.event_name || ticket.eventName || 'Evento';
              const venue = ticket.venue || 'Venue';
              const showDateStr = ticket.show_date || ticket.showDate;
              const sector = ticket.sector || 'General';
              const seatNumber = ticket.seat_number || ticket.seatNumber || '';
              const status = ticket.status || 'ISSUED';
              
              // Calcular si faltan más de 48hs
              let isTooEarlyForQR = false;
              if (showDateStr) {
                const showDate = new Date(showDateStr);
                const now = new Date();
                const diffMs = showDate - now;
                const diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours > 48) {
                  isTooEarlyForQR = true;
                }
              }

              // Imagen
              let imageUrl;
              if (ticket.event && typeof ticket.event === 'object') {
                imageUrl = getEventImageUrl(ticket.event, 'horizontal');
              } else if (ticket.event_image_url || ticket.eventImageUrl) {
                const imgUrl = ticket.event_image_url || ticket.eventImageUrl;
                imageUrl = imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL || 'https://vibratickets.online'}${imgUrl}`;
              } else {
                imageUrl = `https://via.placeholder.com/400x200/667eea/ffffff?text=${encodeURIComponent(eventName)}`;
              }

              const linkId = ticket.ticket_number || ticket.ticketNumber || ticket.id;

              const isBlocked = status === 'CANCELLED';

              return (
                <div key={ticket.id} className="ticket-card" style={{
                  display: 'flex',
                  background: isBlocked ? '#fff1f0' : 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  border: isBlocked ? '2px solid #ff4d4f' : '1px solid #f0f0f0',
                  opacity: isBlocked ? 0.9 : 1
                }}>
                  {/* Left: Image (Desktop only or small on mobile) */}
                  <div style={{ 
                    width: 180, 
                    minWidth: 180,
                    background: `url(${imageUrl}) center/cover no-repeat`,
                    position: 'relative',
                    display: window.innerWidth < 576 ? 'none' : 'block',
                    filter: isBlocked ? 'grayscale(100%)' : 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {sector}
                    </div>
                  </div>

                  {/* Middle: Info */}
                  <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Title level={4} style={{ margin: 0, fontSize: '1.2rem', color: isBlocked ? '#cf1322' : 'inherit' }}>
                        {eventName} {isBlocked && '(BLOQUEADO)'}
                      </Title>
                      <Tag color={getStatusColor(status)} style={{ borderRadius: 12, marginRight: 0 }}>
                        {getStatusText(status)}
                      </Tag>
                    </div>
                    
                    {isBlocked ? (
                      <div style={{ color: '#cf1322', fontWeight: 'bold', margin: '8px 0' }}>
                        🚫 TICKET ANULADO POR CONTRACARGO
                      </div>
                    ) : (
                      <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                        <Space>
                          <CalendarOutlined style={{ color: '#667eea' }} />
                          <Text type="secondary">
                            {showDateStr ? format(new Date(showDateStr), "dd 'de' MMMM, yyyy • HH:mm'hs'", { locale: es }) : 'Fecha por confirmar'}
                          </Text>
                        </Space>
                        <Space>
                          <EnvironmentOutlined style={{ color: '#667eea' }} />
                          <Text type="secondary">{venue}</Text>
                        </Space>
                        <Space>
                          <TagOutlined style={{ color: '#667eea' }} />
                          <Text strong>{sector} {seatNumber && `• Asiento ${seatNumber}`}</Text>
                        </Space>
                      </Space>
                    )}
                  </div>

                  {/* Right: Action (Dashed border separator) */}
                  <div style={{ 
                    borderLeft: '2px dashed #f0f0f0', 
                    padding: 24, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 160,
                    background: isBlocked ? '#fff1f0' : '#fafafa'
                  }}>
                    {isBlocked ? (
                      <>
                        <CloseCircleOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 8 }} />
                        <Text strong style={{ color: '#ff4d4f', textAlign: 'center' }}>NO VÁLIDO</Text>
                        <Link to={`/ticket/${linkId}`} style={{ width: '100%', marginTop: 8 }}>
                          <Button danger size="middle" block>
                            Ver Motivo
                          </Button>
                        </Link>
                      </>
                    ) : ticket.availability_status === 'pending' ? (
                      <>
                        <div style={{ 
                          background: '#f6ffed', 
                          border: '1px solid #b7eb8f',
                          borderRadius: '50%',
                          width: 48, height: 48,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 12
                        }}>
                          <LockOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                        </div>
                        <Text strong style={{ color: '#52c41a', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
                          Lugar Asegurado
                        </Text>
                        <Link to={`/ticket/${linkId}`} style={{ width: '100%' }}>
                          <Button 
                            size="middle"
                            block
                            style={{ borderRadius: 8 }}
                          >
                            Ver Detalle
                          </Button>
                        </Link>
                      </>
                    ) : isTooEarlyForQR ? (
                      // 🔒 ESTADO: Faltan más de 48hs
                      <>
                        <div style={{ 
                          background: '#fff7e6', 
                          border: '1px solid #ffd591',
                          borderRadius: '50%',
                          width: 48, height: 48,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 12
                        }}>
                          <LockOutlined style={{ fontSize: 24, color: '#faad14' }} />
                        </div>
                        <Text strong style={{ color: '#faad14', fontSize: 13, marginBottom: 4, textAlign: 'center' }}>
                          QR Protegido
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', marginBottom: 8, lineHeight: 1.2 }}>
                          Se habilitará 48hs antes del evento
                        </Text>
                        <Link to={`/ticket/${linkId}`} style={{ width: '100%' }}>
                          <Button 
                            size="middle"
                            block
                            style={{ borderRadius: 8 }}
                          >
                            Ver Detalle
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to={`/ticket/${linkId}`} style={{ width: '100%' }}>
                          <Button 
                            type="primary" 
                            icon={<QrcodeOutlined />} 
                            size="large"
                            block
                            disabled={status === 'CANCELLED'}
                            style={{ 
                              borderRadius: 8, 
                              height: 44,
                              background: status === 'CANCELLED' ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              border: 'none'
                            }}
                          >
                            Ver QR
                          </Button>
                        </Link>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 12 }}>
                          #{ticket.ticket_number?.slice(-6) || '------'}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* CSS para ocultar imagen en móvil si es necesario */}
      <style>{`
        @media (max-width: 768px) {
          .ticket-card {
            flex-direction: column !important;
          }
          .ticket-card > div:first-child {
            width: 100% !important;
            height: 120px !important;
            display: block !important;
          }
          .ticket-card > div:last-child {
            border-left: none !important;
            border-top: 2px dashed #f0f0f0 !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
