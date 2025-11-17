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
      // 🔧 FIX: Normalizar holdId (backend puede devolver 'id' o 'holdId')
      const holdId = holdResponse.holdId || holdResponse.id;
      
      if (!holdId) {
        console.error('❌ ERROR: La respuesta del hold no tiene id:', holdResponse);
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
      console.error('❌ Error al crear hold:', error);
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
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            {isGeneralAdmission ? 'Selección de Entradas' : 'Selección de Asientos'}
          </Title>
          <Text type="secondary">
            {event?.name} - {show?.starts_at ? new Date(show.starts_at).toLocaleDateString('es-ES') : ''}
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{section.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: '#666', marginTop: 4 }}>
                    {isGeneralAdmission ? '🎫 Entrada General' : '🪑 Asientos Numerados'}
                  </div>
                </div>
              }
            >
              {isGeneralAdmission ? (
                // ENTRADA GENERAL - Solo selector de cantidad
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
                    <div>
                      <Text style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Precio por entrada:</Text>
                      <Text strong style={{ fontSize: 32, color: '#667eea' }}>
                        ${price.toLocaleString()}
                      </Text>
                    </div>
                    
                    <div>
                      <Text style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>Cantidad de entradas:</Text>
                      <InputNumber
                        min={1}
                        max={Math.min(section.available_seats, 10)}
                        value={generalQuantity}
                        onChange={handleQuantityChange}
                        size="large"
                        style={{ width: 120, fontSize: 24 }}
                      />
                    </div>
                    
                    <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 8 }}>
                      <Text type="secondary">
                        Disponibles: <strong>{section.available_seats}</strong> entradas
                      </Text>
                    </div>
                  </Space>
                </div>
              ) : (
                // ASIENTOS NUMERADOS - Mapa de butacas
                <div>
                  <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 8 }}>
                    <Text>Seleccioná tus asientos en el mapa. Máximo 10 asientos por compra.</Text>
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(10, 1fr)', 
                    gap: 8,
                    maxWidth: 600,
                    margin: '0 auto'
                  }}>
                    {/* TODO: Cargar asientos reales del backend */}
                    {Array.from({ length: section.capacity || 50 }, (_, i) => {
                      const seat = {
                        id: `${section.name}-${i + 1}`,
                        row: Math.floor(i / 10) + 1,
                        number: (i % 10) + 1,
                        available: i < section.available_seats // Simplificado
                      };
                      const isSelected = selectedSeats.find(s => s.id === seat.id);
                      return (
                        <Button
                          key={seat.id}
                          size="small"
                          type={isSelected ? 'primary' : 'default'}
                          disabled={!seat.available}
                          onClick={() => handleSeatClick(seat)}
                          style={{
                            minWidth: 40,
                            height: 32,
                            fontSize: 11,
                            backgroundColor: !seat.available ? '#f5f5f5' : 
                                           isSelected ? '#667eea' : '#fff'
                          }}
                        >
                          {i + 1}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Resumen de compra" style={{ position: 'sticky', top: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {isGeneralAdmission ? (
                  <div>
                    <Text strong>Entradas seleccionadas:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
                        {generalQuantity} {generalQuantity === 1 ? 'entrada' : 'entradas'}
                      </Tag>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Text strong>Asientos seleccionados:</Text>
                    <div style={{ marginTop: 8 }}>
                      {selectedSeats.length === 0 ? (
                        <Text type="secondary">Ninguno</Text>
                      ) : (
                        selectedSeats.map(seat => (
                          <Tag key={seat.id} color="blue" style={{ margin: 2 }}>
                            {seat.id}
                          </Tag>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {(isGeneralAdmission || selectedSeats.length > 0) && (
                  <>
                    <div>
                      <Text>Cantidad: {quantity}</Text>
                      <br />
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text>Subtotal:</Text>
                          <Text>${subtotal.toLocaleString()}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text type="secondary">Cargo por servicios (15%):</Text>
                          <Text type="secondary">${serviceCharge.toLocaleString()}</Text>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderTop: '1px solid #f0f0f0',
                          fontWeight: 'bold'
                        }}>
                          <Text strong style={{ fontSize: 16 }}>Total:</Text>
                          <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                            ${total.toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="primary" 
                      size="large" 
                      block 
                      loading={loading}
                      onClick={handleContinueClick}
                      style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                        height: 48
                      }}
                    >
                      {isAuthenticated ? 'Continuar con la compra' : 'Continuar como invitado'}
                    </Button>
                  </>
                )}

                <div style={{ marginTop: 16, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 16, height: 16, backgroundColor: '#1890ff', borderRadius: 2 }} />
                    <Text>Seleccionado</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 16, height: 16, backgroundColor: '#fff', border: '1px solid #d9d9d9', borderRadius: 2 }} />
                    <Text>Disponible</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, backgroundColor: '#f5f5f5', borderRadius: 2 }} />
                    <Text>Ocupado</Text>
                  </div>
                </div>
              </Space>
            </Card>
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
      >
        <GuestCheckoutForm
          onSubmit={handleGuestSubmit}
          loading={loading}
        />
      </Modal>
    </div>
  );
}
