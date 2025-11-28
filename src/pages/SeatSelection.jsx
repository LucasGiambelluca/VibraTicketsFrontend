import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Tag, message, InputNumber, Spin, Modal, Alert } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { holdsApi, showsApi, authApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import GuestCheckoutForm from '../components/GuestCheckoutForm';

const { Title, Text } = Typography;

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [generalQuantity, setGeneralQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  
  // Datos del show y sección desde el state de navegación
  const [section, setSection] = useState(location.state?.section || null);
  const [show, setShow] = useState(location.state?.show || null);
  const [event, setEvent] = useState(location.state?.event || null);

  // Cargar datos si no vienen del state
  useEffect(() => {
    const loadData = async () => {
      if (!section || !show) {
        message.error('No se encontró información de la sección');
        navigate(-1);
        return;
      }
      
      // Cargar asientos disponibles del show si no es GA
      const isGA = section?.kind === 'GENERAL';
      if (!isGA) {
        try {
          const seats = await showsApi.getShowSeats(showId);
          const available = seats.filter(seat => 
            seat.status === 'AVAILABLE' && 
            seat.sector === section.name
          );
          setAvailableSeats(available);
        } catch (error) {
          console.error('❌ Error cargando asientos:', error);
          message.error('No se pudieron cargar los asientos disponibles');
        }
      }
      
      setLoadingData(false);
    };
    loadData();
  }, [showId, section]);

  const isGeneralAdmission = section?.kind === 'GENERAL';
  const price = section?.price_cents ? section.price_cents / 100 : 0;

  const handleSeatClick = (seat) => {
    if (!seat.available) return;
    
    const seatWithSection = { ...seat, section: section.name, price };
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    
    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 10) {
        message.warning('Máximo 10 asientos por compra');
        return;
      }
      setSelectedSeats(prev => [...prev, seatWithSection]);
    }
  };

  const handleQuantityChange = (value) => {
    if (value < 1) value = 1;
    if (value > section.available_seats) {
      message.warning(`Solo hay ${section.available_seats} entradas disponibles`);
      value = section.available_seats;
    }
    if (value > 10) {
      message.warning('Máximo 10 entradas por compra');
      value = 10;
    }
    setGeneralQuantity(value);
  };

  const handleContinueClick = () => {
    // Validar selección
    if (isGeneralAdmission) {
      if (generalQuantity < 1) {
        message.error('Seleccioná al menos una entrada');
        return;
      }
    } else {
      if (selectedSeats.length === 0) {
        message.error('Seleccioná al menos un asiento');
        return;
      }
    }

    // Si no está autenticado, mostrar formulario de guest
    if (!isAuthenticated) {
      setShowGuestForm(true);
    } else {
      // Si está autenticado, crear reserva directamente
      handleCreateReservation();
    }
  };

  const handleGuestSubmit = async (guestData) => {
    setGuestInfo(guestData);
    
    // Si seleccionó crear cuenta, intentar registrar primero
    if (guestData.createAccount && guestData.password) {
      try {
        await authApi.register({
          email: guestData.email,
          password: guestData.password,
          name: guestData.name,
          phone: guestData.phone,
          role: 'CUSTOMER'
        });
        message.success('Cuenta creada exitosamente');
      } catch (error) {
        console.error('Error creando cuenta:', error);
        // No bloquear la compra si falla el registro
        message.warning('No se pudo crear la cuenta, pero puedes continuar con la compra');
      }
    }
    
    // Crear reserva con info de guest
    await handleCreateReservation(guestData);
  };

  const handleCreateReservation = async (guestData = null) => {
    setLoading(true);
    try {
      message.loading('Creando reserva temporal...', 0);

      // Determinar customerInfo (guest o usuario autenticado)
      const customerInfo = guestData ? {
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone || ''
      } : {
        name: user?.name || 'Usuario',
        email: user?.email || 'usuario@example.com',
        phone: user?.phone || ''
      };

      // Asignar asientos específicos
      let seatIds = [];
      
      if (isGeneralAdmission) {
        // Para GA, buscar los primeros N asientos disponibles de esta sección
        const sectionSeats = availableSeats.length > 0 
          ? availableSeats 
          : await showsApi.getShowSeats(showId).then(seats => 
              seats.filter(s => s.status === 'AVAILABLE' && s.sector === section.name)
            );
        
        if (sectionSeats.length < generalQuantity) {
          throw new Error(`Solo hay ${sectionSeats.length} asientos disponibles`);
        }
        
        seatIds = sectionSeats.slice(0, generalQuantity).map(s => s.id);
        } else {
        // Para asientos numerados, usar los seleccionados
        if (selectedSeats.length === 0) {
          throw new Error('Debes seleccionar al menos un asiento');
        }
        seatIds = selectedSeats.map(s => parseInt(s.id) || s.id);
        }

      // Crear HOLD (reserva temporal de 15 minutos)
      const holdData = {
        showId: parseInt(showId),
        seatIds: seatIds,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name
      };

      const holdResponse = await holdsApi.createHold(holdData);
      // FIX: Normalizar holdId (backend puede devolver 'id' o 'holdId')
      const holdId = holdResponse.holdId || holdResponse.id;
      
      if (!holdId) {
        console.error('ERROR: La respuesta del hold no tiene id:', holdResponse);
        throw new Error('El backend no devolvió un ID de reserva válido');
      }
      
      message.destroy();
      message.success(`¡Asientos reservados! Tenés ${holdResponse.ttlMinutes || 15} minutos para completar la compra.`, 5);

      // Navegar a checkout con el holdId
      navigate(`/checkout/${holdId}`, {
        state: { 
          holdId: holdId,
          holdData: { ...holdResponse, holdId }, // Asegurar que holdData tenga holdId
          show,
          event,
          expiresAt: holdResponse.expiresAt
        }
      });
    } catch (error) {
      message.destroy();
      console.error('Error al crear hold:', error);
      message.error(error.message || 'Error al crear la reserva. Intentá nuevamente.');
      setLoading(false);
    } finally {
      setShowGuestForm(false);
    }
  };

  const quantity = isGeneralAdmission ? generalQuantity : selectedSeats.length;
  const subtotal = price * quantity;
  const serviceCharge = Math.round(subtotal * 0.15); // 15% cargo por servicios
  const total = subtotal + serviceCharge;

  if (loadingData) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Cargando información...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {isGeneralAdmission ? 'Seleccioná tus Entradas' : 'Elegí tus Asientos'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>
            {event?.name} • {show?.starts_at ? new Date(show.starts_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
          </Text>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 16 }}>
                <Title level={3} style={{ margin: 0, fontSize: '1.5rem' }}>{section.name}</Title>
                <Text type="secondary">
                  {isGeneralAdmission ? 'Entrada General' : 'Asientos Numerados'}
                </Text>
              </div>

              {isGeneralAdmission ? (
                // ENTRADA GENERAL - Selector Moderno
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                  <Text style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>Cantidad de entradas</Text>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                    <Button 
                      shape="circle"
                      size="large"
                      onClick={() => handleQuantityChange(generalQuantity - 1)}
                      disabled={generalQuantity <= 1}
                      style={{ width: 50, height: 50, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>-</span>
                    </Button>
                    
                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                      <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#667eea', lineHeight: 1 }}>
                        {generalQuantity}
                      </Text>
                    </div>

                    <Button 
                      shape="circle"
                      size="large"
                      onClick={() => handleQuantityChange(generalQuantity + 1)}
                      disabled={generalQuantity >= Math.min(section.available_seats, 10)}
                      style={{ width: 50, height: 50, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#667eea', color: 'white' }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
                    </Button>
                  </div>

                  <div style={{ 
                    background: 'rgba(102, 126, 234, 0.08)', 
                    padding: '16px 32px', 
                    borderRadius: '16px',
                    textAlign: 'center'
                  }}>
                    <Text style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 4 }}>Precio por unidad</Text>
                    <Text strong style={{ fontSize: 24, color: '#333' }}>
                      ${price.toLocaleString()}
                    </Text>
                  </div>
                  
                  <div style={{ marginTop: 24 }}>
                    <Tag color={section.available_seats > 20 ? 'success' : 'warning'} style={{ padding: '4px 12px', borderRadius: 12 }}>
                      {section.available_seats} disponibles
                    </Tag>
                  </div>
                </div>
              ) : (
                // ASIENTOS NUMERADOS - Mapa de butacas mejorado
                <div>
                  <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <div style={{ 
                      background: '#e0e0e0', 
                      height: 8, 
                      width: '80%', 
                      margin: '0 auto 8px', 
                      borderRadius: '4px 4px 0 0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>ESCENARIO</Text>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(10, 1fr)', 
                    gap: 10,
                    maxWidth: 500,
                    margin: '0 auto',
                    padding: 20
                  }}>
                    {Array.from({ length: section.capacity || 50 }, (_, i) => {
                      const seat = {
                        id: `${section.name}-${i + 1}`,
                        row: Math.floor(i / 10) + 1,
                        number: (i % 10) + 1,
                        available: i < section.available_seats
                      };
                      const isSelected = selectedSeats.find(s => s.id === seat.id);
                      
                      return (
                        <div
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          style={{
                            aspectRatio: '1',
                            borderRadius: '8px',
                            background: !seat.available ? '#e0e0e0' : isSelected ? '#667eea' : '#fff',
                            border: isSelected ? 'none' : '1px solid #d9d9d9',
                            cursor: seat.available ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            color: isSelected ? '#fff' : '#666',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 10px rgba(102, 126, 234, 0.4)' : 'none',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4 }} />
                      <Text style={{ fontSize: 12 }}>Disponible</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, background: '#667eea', borderRadius: 4 }} />
                      <Text style={{ fontSize: 12 }}>Seleccionado</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, background: '#e0e0e0', borderRadius: 4 }} />
                      <Text style={{ fontSize: 12 }}>Ocupado</Text>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', position: 'sticky', top: 24 }}>
              <Title level={4} style={{ marginTop: 0 }}>Resumen</Title>
              
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary">Entradas ({quantity})</Text>
                    <Text strong>${subtotal.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Cargo servicio</Text>
                    <Text type="secondary">${serviceCharge.toLocaleString()}</Text>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingTop: 8
                }}>
                  <Text style={{ fontSize: 16 }}>Total</Text>
                  <Text strong style={{ fontSize: 24, color: '#667eea' }}>
                    ${total.toLocaleString()}
                  </Text>
                </div>

                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  loading={loading}
                  onClick={handleContinueClick}
                  style={{
                    height: 56,
                    borderRadius: 16,
                    fontSize: 18,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                    marginTop: 16
                  }}
                >
                  Continuar
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Space>

      {/* Modal de Guest Checkout */}
      <Modal
        title="Completar Información"
        open={showGuestForm}
        onCancel={() => setShowGuestForm(false)}
        footer={null}
        width={600}
        centered
        className="glass-modal"
      >
        <GuestCheckoutForm
          onSubmit={handleGuestSubmit}
          loading={loading}
        />
      </Modal>
    </div>
  );
}
