import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Card, Button, Space, Row, Col, Tag, Spin, Breadcrumb, Divider, message, Empty, Alert, Skeleton } from 'antd';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { showsApi, eventsApi, holdsApi, queueApi, ordersApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useLoginModal } from '../contexts/LoginModalContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventBannerUrl } from '../utils/imageUtils';
import VirtualQueue from '../components/VirtualQueue';
import { Modal } from 'antd';

const { Title, Text } = Typography;

// Componente para el selector de cantidad
const QuantitySelector = ({ value, onChange, max, disabled = false }) => (
  <Space>
    <Button 
      shape="circle" 
      icon={<Minus size={16} />} 
      onClick={() => onChange(Math.max(0, value - 1))} 
      disabled={disabled || value === 0} 
    />
    <Text style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: 30, textAlign: 'center' }}>{value}</Text>
    <Button 
      shape="circle" 
      icon={<Plus size={16} />} 
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
  const [queueCheckAttempted, setQueueCheckAttempted] = useState(false); // Para evitar múltiples intentos
  const [pendingOrderModal, setPendingOrderModal] = useState({ visible: false, order: null }); // Modal de orden pendiente

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

  // Verificar si la cola está habilitada intentando unirse
  useEffect(() => {
    const checkAndJoinQueue = async () => {
      console.log('🎬 Starting queue check...', { showId, user: user?.email, queueCheckAttempted });
      
      // Evitar múltiples intentos
      if (queueCheckAttempted) {
        console.log('⏭️ Queue check already attempted, skipping');
        return;
      }

      // Si no hay usuario, asumir que no hay cola (fail-open)
      if (!user) {
        console.log('⚠️ User not logged in - allowing direct access');
        setQueueEnabled(false);
        setHasQueueAccess(true);
        setQueueCheckAttempted(true);
        return;
      }

      // Verificar si ya tenemos un token válido guardado
      const savedToken = sessionStorage.getItem(`queue_access_${showId}`);
      const savedExpires = sessionStorage.getItem(`queue_access_${showId}_expires`);
      
      if (savedToken) {
        // Si hay fecha de expiración, verificarla. Si no, asumir válido por ahora.
        const isValid = !savedExpires || new Date(savedExpires) > new Date();
        
        if (isValid) {
          console.log('✅ Found valid saved token, skipping queue check');
          setQueueEnabled(false);
          setHasQueueAccess(true);
          setQueueCheckAttempted(true);
          return;
        } else {
          console.log('⚠️ Saved token expired, clearing...');
          sessionStorage.removeItem(`queue_access_${showId}`);
          sessionStorage.removeItem(`queue_access_${showId}_expires`);
        }
      }

      try {
        console.log('🔍 Attempting to join queue for show:', showId, 'with email:', user.email);
        
        // Intentar unirse a la cola
        const response = await queueApi.joinQueue(showId, user.email);
        console.log('📊 Join queue SUCCESS! Response:', JSON.stringify(response, null, 2));
        
        // Verificar la posición en la cola
        const position = response.position || response.data?.position;
        console.log('📍 Position in queue:', position);
        
        // Verificar si es acceso directo (posición 1 o objeto con ACCESS_GRANTED)
        const isDirectAccess = position === 1 || 
                             (typeof position === 'object' && position?.status === 'ACCESS_GRANTED') ||
                             (typeof position === 'object' && position?.accessToken);

        if (isDirectAccess) {
          // ¡Eres el primero o tienes acceso! Auto-claim y permitir acceso directo
          console.log('🎉 You have DIRECT ACCESS! Auto-claiming...');
          
          try {
            // Si ya viene el token en la posición, usarlo directamente
            let token = position?.accessToken;
            let expiresAt = position?.expiresAt;

            // Si no hay token, hacer claim
            if (!token) {
               const accessData = await queueApi.claimAccess(showId);
               console.log('🎟️ Claim access SUCCESS! Response:', JSON.stringify(accessData, null, 2));
               token = accessData.accessToken || accessData.data?.accessToken;
               expiresAt = accessData.expiresAt || accessData.data?.expiresAt;
            }
            
            // Guardar en sessionStorage (según guía oficial)
            if (token) {
              sessionStorage.setItem(`queue_access_${showId}`, token);
              if (expiresAt) sessionStorage.setItem(`queue_access_${showId}_expires`, expiresAt);
            }
            
            console.log('✅ Access granted! Allowing direct checkout');
            console.log('🔓 Setting queueEnabled=false, hasQueueAccess=true (FAST PATH)');
            
            // Permitir acceso directo sin mostrar cola
            setQueueEnabled(false);
            setHasQueueAccess(true);
            message.success('¡Acceso otorgado! Podés continuar con tu compra.', 3);
          } catch (claimError) {
            console.error('❌ Failed to claim access:', claimError);
            // Si claim falla, mostrar cola de todas formas
            console.log('⚠️ Claim failed, falling back to queue display');
            setQueueEnabled(true);
            setHasQueueAccess(false);
          }
        } else {
          // Position > 1: hay gente esperando, mostrar cola
          console.log('🚦 Queue is ACTIVE - user must wait (position:', position, ')');
          console.log('🔒 Setting queueEnabled=true, hasQueueAccess=false');
          setQueueEnabled(true);
          setHasQueueAccess(false);
        }
        
        setQueueCheckAttempted(true);
        
      } catch (error) {
        console.log('❌ Error joining queue!');
        console.log('📋 Error details:', {
          status: error.status,
          responseStatus: error.response?.status,
          message: error.message,
          fullError: error
        });
        
        if (error.status === 409 || error.response?.status === 409) {
          // Ya está en la cola - verificar estado actual
          console.log('ℹ️ User already in queue (409) - Checking status...');
          
          try {
            const statusResponse = await queueApi.getPosition(showId);
            const pos = statusResponse.position || statusResponse.data?.position;
            
            // Verificar si es acceso directo o posición 1
            const isReady = pos == 1 || // Loose equality para string/number
                          (typeof pos === 'object' && pos?.status === 'ACCESS_GRANTED') ||
                          (typeof pos === 'object' && pos?.accessToken);

            if (isReady) {
               console.log('✅ User is already #1 or has access! Auto-claiming...');
               // Intentar claim si no tenemos token
               let token = (typeof pos === 'object') ? pos.accessToken : null;
               
               if (!token) {
                 try {
                   const accessData = await queueApi.claimAccess(showId);
                   token = accessData.accessToken || accessData.data?.accessToken;
                 } catch (e) {
                   console.error('Claim failed during 409 recovery', e);
                 }
               }

               if (token) {
                 sessionStorage.setItem(`queue_access_${showId}`, token);
                 setQueueEnabled(false);
                 setHasQueueAccess(true);
                 message.success('¡Tu turno ha llegado! Puedes comprar.');
                 return;
               }
            }
            
            // Si no es 1, mostrar cola
            console.log('🔒 Still in queue (pos: ' + pos + ') - showing VirtualQueue component');
            setQueueEnabled(true);
            setHasQueueAccess(false);

          } catch (statusError) {
             console.error('Error checking status after 409:', statusError);
             // Ante la duda, mostrar cola
             setQueueEnabled(true);
             setHasQueueAccess(false);
          }

        } else if (error.status === 429 || error.response?.status === 429 || 
                   error.message?.includes('TooManyRequests') || error.message?.includes('429')) {
          // Rate limit excedido - mostrar advertencia pero permitir acceso
          console.warn('⚠️ Rate limit exceeded (429) - allowing direct access as fallback');
          message.warning('El sistema está procesando muchas solicitudes. Podés proceder con la compra directamente.', 5);
          console.log('🔓 Setting queueEnabled=false, hasQueueAccess=true (FAIL-OPEN)');
          setQueueEnabled(false);
          setHasQueueAccess(true);
        } else if (error.status === 404 || error.response?.status === 404 || 
                   error.status === 400 || error.response?.status === 400) {
          // No hay cola para este show - permitir acceso directo
          console.log('✅ No queue for this show (404/400) - allowing direct access');
          console.log('🔓 Setting queueEnabled=false, hasQueueAccess=true');
          setQueueEnabled(false);
          setHasQueueAccess(true);
        } else {
          // Otro error - fail-open (permitir acceso)
          console.log('⚠️ Unexpected error - fail-open, allowing direct access');
          console.log('🔓 Setting queueEnabled=false, hasQueueAccess=true (FAIL-OPEN)');
          setQueueEnabled(false);
          setHasQueueAccess(true);
        }
        setQueueCheckAttempted(true);
      }
      
      console.log('✨ Queue check complete. Final state:', {
        queueEnabled,
        hasQueueAccess,
        queueCheckAttempted: true
      });
    };

    if (showId && !queueCheckAttempted) {
      checkAndJoinQueue();
    }
  }, [showId, user, queueCheckAttempted]);

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

  // Función para verificar órdenes pendientes (usada al hacer click en Comprar)
  const checkPendingOrdersForEvent = async () => {
    if (!user || !show) return null;

    try {
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
      
      console.log('📦 Checking pending orders. Show:', show);
      console.log('📦 Orders list:', ordersList);

      // Buscar orden PENDING para este evento (< 30 min)
      const pendingOrder = ordersList.find(order => {
        if (order.status !== 'PENDING') return false;
        
        const created = new Date(order.createdAt || order.created_at);
        const now = new Date();
        const diffMinutes = (now - created) / 1000 / 60;
        
        console.log(`🔍 Checking order #${order.id}: Status=${order.status}, Diff=${diffMinutes.toFixed(1)}m, EventId=${order.eventId} vs ShowEventId=${show.eventId}`);

        if (diffMinutes >= 30) return false;

        // Verificar coincidencia de evento
        if (show.eventId) {
          const match = String(order.eventId) === String(show.eventId);
          if (match) console.log('✅ Match found!');
          return match;
        }
        return false;
      });

      return pendingOrder || null;
    } catch (error) {
      console.error('Error checking pending orders:', error);
      return null;
    }
  };

  // Handler para retomar orden pendiente
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
      if (error.response?.status === 410) {
        message.error('La orden ha expirado. Podés iniciar una nueva compra.');
      } else {
        message.error('Error al retomar el pago. Podés intentar desde Mis Órdenes.');
        navigate('/mis-ordenes');
      }
    } finally {
      setPendingOrderModal({ visible: false, order: null });
    }
  };

  // Handler para iniciar nueva compra (descartando la pendiente)
  const handleStartNewPurchase = () => {
    setPendingOrderModal({ visible: false, order: null });
    // Limpiar selecciones y continuar con el flujo normal
    setSectionQuantities({});
    sessionStorage.removeItem(`hold_${showId}`);
    // Continuar con la compra después de cerrar el modal
    proceedWithPurchase();
  };

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
    console.log('🔍 Checking auth for purchase:', { user, email: user?.email });
    
    if (!user || !user.email) {
      console.warn('⚠️ User not authenticated or missing email, prompting login');
      message.warning('Debes iniciar sesión para continuar con la compra.');
      openLoginModal(() => {
        message.success('¡Ya podés continuar con tu compra! Presioná "Continuar" nuevamente.', 5);
      });
      return;
    }

    // 🔍 Verificar si hay órdenes pendientes para este evento
    const pendingOrder = await checkPendingOrdersForEvent();
    if (pendingOrder) {
      // Mostrar modal con opciones
      setPendingOrderModal({ visible: true, order: pendingOrder });
      return; // Esperar decisión del usuario
    }

    // Continuar con el flujo normal
    await proceedWithPurchase();
  };

  // Función que ejecuta la compra (separada del handleContinue para poder llamarla después del modal)
  const proceedWithPurchase = async () => {
    
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
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Hero Skeleton */}
      <div style={{ height: 250, background: '#e5e7eb', padding: '24px', display: 'flex', alignItems: 'flex-end' }} className="fade-in">
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <Skeleton active paragraph={{ rows: 1, width: ['30%'] }} title={{ width: '50%' }} />
        </div>
      </div>
      {/* Content Skeleton */}
      <div style={{ maxWidth: 900, margin: '-60px auto 0', position: 'relative', zIndex: 10, padding: '0 24px' }} className="fade-in">
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
    <div className="fade-in" style={{ background: 'var(--bg-color)', paddingBottom: '120px' /* Espacio para el footer fijo */ }}>
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
            <Breadcrumb.Item><span style={{ color: 'white' }}>Entradas</span></Breadcrumb.Item>
          </Breadcrumb>
          <Title level={1} style={{ color: 'white', marginTop: 8, marginBottom: 8 }}>{event.name}</Title>
          <Space wrap size="large">
            <Text style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} /> {format(showDate, "dd 'de' MMMM, yyyy", { locale: es })}</Text>
            <Text style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} /> {format(showDate, "HH:mm 'hs'", { locale: es })}</Text>
            <Text style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} /> {event.venue_name}</Text>
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
            style={{ borderRadius: 16, boxShadow: 'var(--shadow-lg)' }}
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
                      border: quantity > 0 ? '2px solid black' : '1px solid var(--border-color)',
                      boxShadow: quantity > 0 ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      <Row align="middle" justify="space-between" gutter={[16, 16]}>
                        <Col xs={24} sm={14}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Title level={5} style={{ margin: 0, fontSize: '1.1rem' }}>{section.name}</Title>
                            {section.kind === 'SEATED' && (
                              <Tag color="default" style={{ borderRadius: 12 }}>Numerado</Tag>
                            )}
                          </div>
                          
                          <Space direction="vertical" size={2}>
                            <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                              {isSoldOut ? (
                                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Agotado</span>
                              ) : (
                                availableCount < 20 ? (
                                  <span style={{ color: '#faad14', fontWeight: 'bold' }}>¡Últimas localidades!</span>
                                ) : (
                                  <span style={{ color: '#52c41a' }}>Disponible</span>
                                )
                              )}
                            </Text>
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
                    <Clock size={16} style={{ marginRight: 8 }} />
                    Venta disponible el {format(saleStartDate, "dd 'de' MMMM 'a las' HH:mm 'hs'", { locale: es })}
                  </Text>
                </div>
              );
            }

            return (
              <>
                <div>
                  <Text style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total: </Text>
                  <Text style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'black' }}>
                    ${totalPrice.toLocaleString('es-AR')}
                  </Text>
                  <Text style={{ marginLeft: 16, color: '#6B7280' }}>
                    ({totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'})
                  </Text>
                </div>
                <Button 
                  type="primary"
                  size="large"
                  icon={<ShoppingCart size={20} />}
                  onClick={handleContinue}
                  disabled={totalTickets === 0 || creatingHold}
                  loading={creatingHold}
                  style={{ 
                    borderRadius: 8, 
                    fontWeight: 'bold', 
                    background: 'black',
                    border: 'none',
                    height: 48,
                    padding: '0 32px'
                  }}
                >
                  Continuar
                </Button>
              </>
            );
          })()}
        </div>
      </div>

      {/* Modal de orden pendiente */}
      <Modal
        open={pendingOrderModal.visible}
        onCancel={() => setPendingOrderModal({ visible: false, order: null })}
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
