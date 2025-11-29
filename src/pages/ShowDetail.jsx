import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Card, Button, Space, Row, Col, Tag, Spin, Breadcrumb, Divider, message, Empty, Alert, Skeleton } from 'antd';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, ShoppingCartOutlined, ArrowLeftOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { showsApi, eventsApi, holdsApi, queueApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useLoginModal } from '../contexts/LoginModalContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventBannerUrl } from '../utils/imageUtils';
import VirtualQueue from '../components/VirtualQueue';

const { Title, Text } = Typography;

// Componente para el selector de cantidad
const QuantitySelector = ({ value, onChange, max, disabled = false }) => (
  <Space>
    <Button 
      shape="circle" 
      icon={<MinusOutlined />} 
      onClick={() => onChange(Math.max(0, value - 1))} 
      disabled={disabled || value === 0} 
    />
    <Text style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: 30, textAlign: 'center' }}>{value}</Text>
    <Button 
      shape="circle" 
      icon={<PlusOutlined />} 
      onClick={() => onChange(Math.min(max, value + 1))} 
      disabled={disabled || value >= max || max === 0} 
    />
  </Space>
);

export default function ShowDetail() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [show, setShow] = useState(null);
  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]); // Secciones del show
  const [seats, setSeats] = useState([]); // Asientos disponibles del show
  const [loading, setLoading] = useState(true);
  const [creatingHold, setCreatingHold] = useState(false); // Loading al crear hold
  const [error, setError] = useState(null);
  const [sectionQuantities, setSectionQuantities] = useState({}); // Cantidades por sección
  const [queueEnabled, setQueueEnabled] = useState(false); // Si la cola está habilitada
  const [hasQueueAccess, setHasQueueAccess] = useState(true); // Si tiene acceso a la cola (default: true para fail-open)

  // Función para recargar asientos (reutilizable)
  // IMPORTANTE: Retorna los asientos para uso inmediato (no esperar state update)
  const loadSeats = async () => {
    try {
      // 🚧 WORKAROUND: Obtener tickets del show para filtrar asientos vendidos
      let soldSeatIds = [];
      try {
        const ticketsResponse = await showsApi.getShowTickets(showId);
        const ticketsList = Array.isArray(ticketsResponse) 
          ? ticketsResponse 
          : (ticketsResponse?.tickets || ticketsResponse?.data || []);
        
        // Extraer seat_ids de los tickets
        soldSeatIds = ticketsList
          .map(ticket => ticket.seat_id || ticket.seatId)
          .filter(Boolean); // Remover nulls/undefined
        
      } catch (ticketsError) {
        // Continuar sin el filtro de tickets
      }
      
      const seatsResponse = await showsApi.getShowSeats(showId);
      const seatsList = Array.isArray(seatsResponse) 
        ? seatsResponse 
        : (seatsResponse?.seats || seatsResponse?.data || []);
      
      // 🔍 LOG DETALLADO: Ver status de los primeros 10 asientos
      seatsList.slice(0, 10).forEach(seat => {
        const hasSold = soldSeatIds.includes(seat.id);
      });
      
      // Filtrar asientos: AVAILABLE + NO tienen ticket asociado
      const availableSeats = seatsList.filter(seat => {
        const isAvailable = seat.status === 'AVAILABLE';
        const hasSoldTicket = soldSeatIds.includes(seat.id);
        
        // 🚧 WORKAROUND: Excluir asientos con tickets aunque status sea AVAILABLE
        if (hasSoldTicket) {
          return false; // No disponible - tiene ticket
        }
        
        return isAvailable;
      });
      
      // Mostrar IDs de asientos disponibles
      
      // 🚨 VERIFICACIÓN CRÍTICA: ¿Los asientos 1 y 2 están en disponibles?
      const hasOne = availableSeats.some(s => String(s.id) === '1');
      const hasTwo = availableSeats.some(s => String(s.id) === '2');
      
      if (availableSeats.length === 0) {
        message.warning('No hay asientos disponibles en este momento. Pueden estar reservados por otros usuarios.');
      }
      
      setSeats(availableSeats);
      
      // ⭐ IMPORTANTE: Retornar los asientos para uso inmediato
      return availableSeats;
    } catch (seatsError) {
      setSeats([]);
      return [];
    }
  };

  // Verificar si la cola está habilitada y si tiene acceso
  useEffect(() => {
    const checkQueueStatus = async () => {
      try {
        const response = await queueApi.getStatus(showId);
        const isQueueOpen = response.data?.isOpen || false;
        setQueueEnabled(isQueueOpen);
        
        // Verificar si ya tiene un token de acceso guardado
        const savedToken = localStorage.getItem(`queue_access_${showId}`);
        const expiresAt = localStorage.getItem(`queue_access_${showId}_expires`);
        
        if (savedToken && expiresAt && new Date(expiresAt) > new Date()) {
          setHasQueueAccess(true);
        } else if (isQueueOpen) {
          // Si la cola está abierta pero no tiene acceso, limpiar tokens viejos
          localStorage.removeItem(`queue_access_${showId}`);
          localStorage.removeItem(`queue_access_${showId}_expires`);
          setHasQueueAccess(false);
        } else {
          // Si la cola no está habilitada, permitir acceso directo
          setHasQueueAccess(true);
        }
      } catch (error) {
        // Si el endpoint no existe (404) o hay cualquier error, 
        // asumir que la cola NO está habilitada y permitir acceso directo (fail-open)
        setQueueEnabled(false);
        setHasQueueAccess(true);
      }
    };

    if (showId) {
      checkQueueStatus();
    }
  }, [showId]);

  // Callback cuando se obtiene acceso de la cola
  const handleAccessGranted = (accessToken) => {
    setHasQueueAccess(true);
    message.success('¡Acceso otorgado! Ya podés seleccionar tus entradas');
  };

  useEffect(() => {
    // Solo cargar datos si tiene acceso válido
    if (!hasQueueAccess) {
      return;
    }
    
    const loadShowData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 1. Cargar datos del show
        const showResponse = await showsApi.getShow(showId);
        setShow(showResponse);

        const eventId = showResponse.eventId || showResponse.event_id;
        
        if (eventId) {
          // 2. Cargar datos del evento
          const eventResponse = await eventsApi.getEvent(eventId);
          setEvent(eventResponse);
        }

        // 3. Cargar SECCIONES del SHOW
        try {
          const sectionsResponse = await showsApi.getShowSections(showId);
          const sectionsList = Array.isArray(sectionsResponse) 
            ? sectionsResponse 
            : (sectionsResponse?.sections || sectionsResponse?.data || []);
          
          if (sectionsList.length > 0) {
            setSections(sectionsList);
            
            // Intentar recuperar cantidades previas de sessionStorage
            const savedQuantities = sessionStorage.getItem(`show-${showId}-quantities`);
            
            if (savedQuantities) {
              try {
                const parsed = JSON.parse(savedQuantities);
                setSectionQuantities(parsed);
                message.info('Se recuperaron tus selecciones anteriores', 3);
              } catch (e) {
                // Inicializar en 0 si falla
                const initialQuantities = sectionsList.reduce((acc, section) => ({ 
                  ...acc, 
                  [String(section.id)]: 0 
                }), {});
                setSectionQuantities(initialQuantities);
              }
            } else {
              // Inicializar cantidades en 0 - normalizar IDs a string
              const initialQuantities = sectionsList.reduce((acc, section) => ({ 
                ...acc, 
                [String(section.id)]: 0 
              }), {});
              setSectionQuantities(initialQuantities);
            }
          } else {
            message.warning('Este show no tiene secciones configuradas. Contactá al organizador.');
          }
        } catch (sectionsError) {
          message.error('No se pudieron cargar las secciones del show.');
        }

        // 4. Cargar ASIENTOS disponibles del SHOW
        await loadSeats();
      } catch (err) {
        setError(err.message || 'Error al cargar datos');
        message.error('No se pudo cargar la información del show.');
      } finally {
        setLoading(false);
      }
    };
    if (showId && hasQueueAccess) loadShowData();
  }, [showId, hasQueueAccess]);

  const handleQuantityChange = (sectionId, newQuantity) => {
    // Normalizar sectionId a string para consistencia
    const normalizedId = String(sectionId);
    
    // Calcular el total de tickets si aplicamos este cambio
    const newQuantities = { ...sectionQuantities, [normalizedId]: newQuantity };
    const newTotal = Object.values(newQuantities).reduce((sum, qty) => sum + qty, 0);
    
    // ⚠️ VALIDACIÓN: Máximo 5 tickets por evento
    if (newTotal > 5) {
      message.warning('Máximo 5 boletos por evento por persona', 3);
      return;
    }
    
    setSectionQuantities(prev => {
      const updated = { ...prev, [normalizedId]: newQuantity };
      
      // Guardar en sessionStorage para preservar al navegar
      sessionStorage.setItem(`show-${showId}-quantities`, JSON.stringify(updated));
      
      return updated;
    });
  };

  const handleClearSelections = () => {
    const initialQuantities = sections.reduce((acc, section) => ({ 
      ...acc, 
      [String(section.id)]: 0 
    }), {});
    setSectionQuantities(initialQuantities);
    sessionStorage.removeItem(`show-${showId}-quantities`);
    message.success('Selecciones limpiadas');
  };

  const { totalTickets, totalPrice } = useMemo(() => {
    let totalTickets = 0;
    let totalPrice = 0;
    
    // Validar que sections esté disponible
    if (!sections || sections.length === 0) {
      return { totalTickets: 0, totalPrice: 0 };
    }
    
    for (const sectionId in sectionQuantities) {
      const quantity = sectionQuantities[sectionId];
      if (quantity > 0) {
        // Comparación flexible: convertir ambos a string para comparar
        const section = sections.find(s => String(s.id) === String(sectionId));
        if (section) {
          totalTickets += quantity;
          // price_cents o priceCents dependiendo del backend
          const priceInCents = section.price_cents || section.priceCents || 0;
          totalPrice += quantity * (priceInCents / 100);
        }
      }
    }
    
    return { totalTickets, totalPrice };
  }, [sectionQuantities, sections]);

  const handleContinue = async () => {
    if (totalTickets === 0) {
      message.warning('Debes seleccionar al menos una entrada.');
      return;
    }
    
    // ⚠️ VALIDACIÓN ADICIONAL: Máximo 5 tickets por evento
    if (totalTickets > 5) {
      message.error('No podés comprar más de 5 boletos por evento');
      return;
    }

    // Validar que el usuario esté autenticado
    if (!user || !user.email) {
      message.warning('Debes iniciar sesión para continuar con la compra.');
      // Abrir modal de login con callback para continuar después del login
      openLoginModal(() => {
        // Después del login exitoso, intentar continuar automáticamente
        setTimeout(() => {
          try {
            handleContinue();
          } catch (error) {
            message.error('Hubo un error al procesar tu solicitud. Por favor, intentá nuevamente.');
          }
        }, 500);
      });
      return;
    }
    
    // Validar que se hayan cargado las secciones
    if (!sections || sections.length === 0) {
      message.error('No se pudieron cargar las secciones del show. Por favor, recargá la página.');
      return;
    }
    
    try {
      setCreatingHold(true);
      
      // 1. Obtener secciones seleccionadas con cantidades
      const selectedSections = Object.entries(sectionQuantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([sectionId, quantity]) => {
          // Comparación flexible: string vs number
          const section = sections.find(s => String(s.id) === String(sectionId));
          
          if (!section) {
            throw new Error(`No se encontró la sección con ID: ${sectionId}`);
          }
          
          // Usar el campo correcto para el nombre
          const sectionName = section.name || section.sector || `Sección ${sectionId}`;
          
          return {
            sectionId: parseInt(sectionId),
            sectionName,
            quantity,
            section // ⭐ Incluir el objeto completo para referencia
          };
        });

      // Recargar asientos para asegurar disponibilidad en tiempo real
      const freshSeats = await loadSeats();
      
      // Verificar si hay asientos cargados
      if (!freshSeats || freshSeats.length === 0) {
        message.error('No hay asientos disponibles para este show. Pueden estar reservados por otros usuarios.');
        setCreatingHold(false);
        return;
      }

      // Log de todos los sectores únicos disponibles
      const uniqueSectors = [...new Set(freshSeats.map(s => s.sector))];
      // 2. Asignar asientos específicos de cada sección
      const selectedSeatIds = [];
      
      for (const selection of selectedSections) {
        // Validar que tenemos un sectionName válido
        if (!selection.sectionName || typeof selection.sectionName !== 'string' || selection.sectionName.trim() === '') {
          message.error(`Error: No se pudo identificar la sección seleccionada (ID: ${selection.sectionId})`);
          setCreatingHold(false);
          return;
        }
        
        // Buscar asientos disponibles de esta sección
        // ⭐ USAR freshSeats (recién cargados) en lugar de seats (estado viejo)
        const sectionSeats = freshSeats.filter(seat => {
          const matchesSector = seat.sector === selection.sectionName;
          const isAvailable = seat.status === 'AVAILABLE';
          
          // Log detallado de cada asiento
          if (seat.status === 'AVAILABLE') {
            }
          
          return matchesSector && isAvailable;
        });
        
        if (sectionSeats.length < selection.quantity) {
          message.error(`No hay suficientes asientos disponibles en ${selection.sectionName}. Disponibles: ${sectionSeats.length}, Solicitados: ${selection.quantity}`);
          setCreatingHold(false);
          return;
        }
        
        // Tomar los primeros N asientos disponibles
        const seatsToReserve = sectionSeats.slice(0, selection.quantity);
        selectedSeatIds.push(...seatsToReserve.map(seat => seat.id));
      }

      
      // Verificar que se seleccionaron asientos
      if (selectedSeatIds.length === 0) {
        message.error('No se pudieron asignar asientos. Por favor, intentá nuevamente o contactá al organizador.');
        setCreatingHold(false);
        return;
      }

      // 3. Obtener accessToken si la cola está habilitada
      let accessToken = null;
      if (queueEnabled) {
        accessToken = localStorage.getItem(`queue_access_${showId}`);
        const expiresAt = localStorage.getItem(`queue_access_${showId}_expires`);
        
        if (!accessToken || !expiresAt || new Date(expiresAt) < new Date()) {
          message.error('Tu acceso ha expirado. Debes unirte a la cola nuevamente.');
          setHasQueueAccess(false);
          setCreatingHold(false);
          return;
        }
      }

      // 4. Crear HOLD (reserva temporal de 15 minutos) con accessToken si aplica
      const holdData = {
        showId: parseInt(showId),
        seatIds: selectedSeatIds,
        customerEmail: user.email,
        customerName: user.name || user.email.split('@')[0]
      };
      
      // Solo agregar accessToken si la cola está habilitada
      if (queueEnabled && accessToken) {
        holdData.accessToken = accessToken; // 🔐 Token de acceso de la cola virtual
      }

      const holdResponse = await holdsApi.createHold(holdData);
      message.success(`¡Asientos reservados! Tenés ${holdResponse.ttlMinutes || 15} minutos para completar la compra.`, 5);

      // 5. Navegar a checkout con el holdId
      navigate(`/checkout/${holdResponse.holdId}`, { 
        state: { 
          holdId: holdResponse.holdId,
          holdData: holdResponse,
          show,
          event,
          expiresAt: holdResponse.expiresAt
        } 
      });
      // NO limpiar sessionStorage aquí - se limpiará después del pago exitoso

    } catch (error) {
      // Manejar errores de disponibilidad (409 Conflict)
      if (error.status === 409 || error.message?.includes('409') || error.message?.includes('conflict')) {
        
        // Intentar parsear los asientos no disponibles del backend
        let unavailableInfo = '';
        if (error.response?.unavailableSeats || error.data?.unavailableSeats) {
          const unavailableSeats = error.response?.unavailableSeats || error.data?.unavailableSeats;
          // Crear mensaje detallado
          const seatsList = unavailableSeats.map(seat => {
            const reason = seat.reason === 'sold' ? 'vendido' : 
                          seat.reason === 'held' ? 'reservado por otro usuario' : 
                          seat.reason || 'no disponible';
            return `${seat.seatNumber} (${reason})`;
          }).join(', ');
          
          unavailableInfo = `\n\nAsientos no disponibles: ${seatsList}`;
        }
        
        if (error.message?.includes('HoldAlreadyExists')) {
          message.warning('Ya tenés una reserva activa. Continuá con el pago antes de hacer una nueva.');
        } else {
          message.error({
            content: `Los asientos ya no están disponibles. Por favor, reintentá con otros asientos.${unavailableInfo}`,
            duration: 8
          });
        }
        // Recargar asientos disponibles
        await loadSeats();
        
      } else if (error.message?.includes('Backend no disponible')) {
        message.error('No se pudo conectar con el servidor. Verificá que el backend esté corriendo.');
      } else if (error.message?.includes('SeatsNotAvailable') || error.message?.includes('not available')) {
        message.error('Algunos asientos ya no están disponibles. Recargando...');
        // Recargar asientos para reflejar el estado actual
        await loadSeats();
      } else if (error.message?.includes('BadRequest') || error.status === 400) {
        message.error('Datos inválidos. Por favor, intentá nuevamente.');
      } else if (error.message?.includes('404') || error.status === 404) {
        message.error('Endpoint no encontrado. El backend no tiene implementado POST /api/holds');
      } else if (error.message?.includes('500') || error.status === 500) {
        message.error('Error interno del servidor. Verificá los logs del backend.');
      } else {
        message.error('Error al reservar asientos: ' + error.message);
        // Recargar asientos para reflejar el estado actual
        await loadSeats();
      }
    } finally {
      setCreatingHold(false);
    }
  };

  if (loading) return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Hero Skeleton */}
      <div style={{ height: 250, background: '#e5e7eb', padding: '24px', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <Skeleton active paragraph={{ rows: 1, width: ['30%'] }} title={{ width: '50%' }} />
        </div>
      </div>
      {/* Content Skeleton */}
      <div style={{ maxWidth: 900, margin: '-60px auto 0', position: 'relative', zIndex: 10, padding: '0 24px' }}>
        <Card style={{ borderRadius: 16, minHeight: 400 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    </div>
  );
  if (error) return <div style={{ padding: 40, textAlign: 'center' }}><Text type="danger">Error: {error}</Text></div>;
  if (!show || !event) return <div style={{ padding: 40, textAlign: 'center' }}><Empty description="No se encontró el show." /></div>;

  const showDate = new Date(show.startsAt || show.starts_at);
  const eventId = show.eventId || show.event_id;

  return (
    <div style={{ background: '#F9FAFB', paddingBottom: '120px' /* Espacio para el footer fijo */ }}>
      {/* Hero Section */}
      <div className="show-detail-hero" style={{ 
        height: 250,
        background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url(${
event ? getEventBannerUrl(event) : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=600&fit=crop'
        })`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex', alignItems: 'flex-end', padding: '24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', color: 'white' }}>
          <Breadcrumb separator={<span style={{ color: 'rgba(255,255,255,0.7)' }}>/</span>}>
            <Breadcrumb.Item><Link to="/" style={{ color: 'white' }}>Inicio</Link></Breadcrumb.Item>
            <Breadcrumb.Item><Link to={`/events/${eventId}`} style={{ color: 'white' }}>{event.name}</Link></Breadcrumb.Item>
            <Breadcrumb.Item>Entradas</Breadcrumb.Item>
          </Breadcrumb>
          <Title level={1} style={{ color: 'white', marginTop: 8, marginBottom: 8 }}>{event.name}</Title>
          <Space wrap size="large">
            <Text style={{ color: 'white' }}><CalendarOutlined /> {format(showDate, "dd 'de' MMMM, yyyy", { locale: es })}</Text>
            <Text style={{ color: 'white' }}><ClockCircleOutlined /> {format(showDate, "HH:mm 'hs'", { locale: es })}</Text>
            <Text style={{ color: 'white' }}><EnvironmentOutlined /> {event.venue_name}</Text>
          </Space>
        </div>
      </div>

      {/* Content */}
      <div className="show-detail-content" style={{ maxWidth: 900, margin: '-60px auto 0', position: 'relative', zIndex: 10, padding: '0 24px' }}>
        
        {/* Mostrar cola si está habilitada y no tiene acceso */}
        {queueEnabled && !hasQueueAccess && (
          <div style={{ marginBottom: 24 }}>
            <VirtualQueue 
              showId={showId} 
              onAccessGranted={handleAccessGranted}
            />
          </div>
        )}

        {/* Mostrar secciones solo si tiene acceso o la cola no está habilitada */}
        {(!queueEnabled || hasQueueAccess) && (
          <Card 
            style={{ borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
            extra={totalTickets > 0 && (
              <Button 
                type="text" 
                onClick={handleClearSelections}
                style={{ color: '#999' }}
            >
              Limpiar selecciones
            </Button>
          )}
        >
          <Title level={3} style={{ marginBottom: 16 }}>Seleccioná tus entradas</Title>
          
          {/* Mensaje de límite de 5 boletos */}
          <Alert
            message="Límite de compra: 5 boletos por evento"
            description={
              totalTickets > 0 ? (
                <span>
                  Ya seleccionaste <strong>{totalTickets}</strong> de 5 boletos.{' '}
                  {totalTickets < 5 ? (
                    <span style={{ color: '#52c41a' }}>Te quedan <strong>{5 - totalTickets}</strong> disponible{5 - totalTickets !== 1 ? 's' : ''}.</span>
                  ) : (
                    <span style={{ color: '#ff4d4f' }}>Has alcanzado el límite.</span>
                  )}
                </span>
              ) : (
                'Podés seleccionar hasta 5 boletos por evento.'
              )
            }
            type={totalTickets >= 5 ? 'warning' : 'info'}
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          {sections.length > 0 ? (
            <Row gutter={[16, 16]}>
              {sections.map(section => {
                // Contar asientos disponibles reales de esta sección
                const availableCount = seats.filter(seat => 
                  seat.sector === section.name && 
                  seat.status === 'AVAILABLE'
                ).length;
                
                const isSoldOut = availableCount === 0;
                const quantity = sectionQuantities[String(section.id)] || 0;
                
                return (
                  <Col xs={24} key={section.id}>
                    <div style={{ 
                      background: 'white', 
                      borderRadius: 16, 
                      padding: 20,
                      border: quantity > 0 ? '2px solid #667eea' : '1px solid #f0f0f0',
                      boxShadow: quantity > 0 ? '0 4px 12px rgba(102, 126, 234, 0.15)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      <Row align="middle" justify="space-between" gutter={[16, 16]}>
                        <Col xs={24} sm={14}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Title level={5} style={{ margin: 0, fontSize: '1.1rem' }}>{section.name}</Title>
                            {section.kind === 'SEATED' && (
                              <Tag color="purple" style={{ borderRadius: 12 }}>Numerado</Tag>
                            )}
                          </div>
                          
                          <Space direction="vertical" size={2}>
                            <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                              {isSoldOut ? 'Agotado' : `Disponibles: ${availableCount}`}
                            </Text>
                            {availableCount > 0 && availableCount < 20 && (
                              <Text type="warning" style={{ fontSize: '0.85rem' }}>
                                ¡Quedan pocos lugares!
                              </Text>
                            )}
                          </Space>
                        </Col>
                        
                        <Col xs={24} sm={10}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: '#f9fafb',
                            padding: '12px 16px',
                            borderRadius: 12
                          }}>
                            <Text style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                              ${((section.price_cents || section.priceCents || 0) / 100).toLocaleString('es-AR')}
                            </Text>
                            
                            <QuantitySelector 
                              value={quantity}
                              onChange={(q) => handleQuantityChange(String(section.id), q)}
                              max={Math.min(
                                section.capacity || 5, 
                                5 - (totalTickets - quantity)
                              )}
                              disabled={isSoldOut || (event?.sale_start_date && new Date() < new Date(event.sale_start_date))}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty description="No hay secciones disponibles para este show. Contactá al organizador." />
          )}
        </Card>
        )}
      </div>

      {/* Footer Fijo de Compra */}
      <div className="show-detail-footer" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        background: 'white', padding: '16px 24px', 
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 1000
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {(() => {
            const now = new Date();
            const saleStartDate = event?.sale_start_date ? new Date(event.sale_start_date) : null;
            const isSaleStarted = !saleStartDate || now >= saleStartDate;

            if (!isSaleStarted) {
              return (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <Text style={{ fontSize: '1.1rem', color: '#faad14', fontWeight: 'bold' }}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Venta disponible el {format(saleStartDate, "dd 'de' MMMM 'a las' HH:mm 'hs'", { locale: es })}
                  </Text>
                </div>
              );
            }

            return (
              <>
                <div>
                  <Text style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total: </Text>
                  <Text style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4F46E5' }}>
                    ${totalPrice.toLocaleString('es-AR')}
                  </Text>
                  <Text style={{ marginLeft: 16, color: '#6B7280' }}>
                    ({totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'})
                  </Text>
                </div>
                <Button 
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleContinue}
                  disabled={totalTickets === 0 || creatingHold}
                  loading={creatingHold}
                  style={{ borderRadius: 12, fontWeight: 'bold', background: 'linear-gradient(90deg, #4F46E5, #818CF8)' }}
                >
                  Continuar
                </Button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
