import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Tag, message, Spin, Modal, Divider } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { holdsApi, showsApi, authApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import GuestCheckoutForm from '../components/GuestCheckoutForm';

const { Title, Text } = Typography;

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Unified quantity state for all section types
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [availableSeats, setAvailableSeats] = useState([]);
  
  // Data from navigation state
  const [section, setSection] = useState(location.state?.section || null);
  const [show, setShow] = useState(location.state?.show || null);
  const [event, setEvent] = useState(location.state?.event || null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!section || !show) {
        message.error('No se encontró información de la sección');
        navigate(-1);
        return;
      }
      
      // Load available seats for numbered sections
      const isGA = section?.kind === 'GENERAL';
      if (!isGA) {
        try {
          const seats = await showsApi.getShowSeats(showId);
          const available = seats.filter(seat => 
            seat.status === 'AVAILABLE' && 
            seat.sector === section.name
          );
          // Sort seats to assign best ones first (e.g., by row and number)
          available.sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row; // Lower row first
            return a.number - b.number; // Lower number first
          });
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
  
  // Calculate max available seats
  const maxAvailable = isGeneralAdmission 
    ? section.available_seats 
    : availableSeats.length;

  const handleQuantityChange = (value) => {
    if (value < 1) value = 1;
    if (value > maxAvailable) {
      message.warning(`Solo hay ${maxAvailable} entradas disponibles`);
      value = maxAvailable;
    }
    if (value > 10) {
      message.warning('Máximo 10 entradas por compra');
      value = 10;
    }
    setQuantity(value);
  };

  const handleContinueClick = () => {
    if (quantity < 1) {
      message.error('Seleccioná al menos una entrada');
      return;
    }

    if (!isAuthenticated) {
      setShowGuestForm(true);
    } else {
      handleCreateReservation();
    }
  };

  const handleGuestSubmit = async (guestData) => {
    // Attempt registration if requested
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
        message.warning('No se pudo crear la cuenta, pero puedes continuar con la compra');
      }
    }
    
    handleCreateReservation(guestData);
  };

  const handleCreateReservation = async (guestData = null) => {
    setLoading(true);
    try {
      message.loading('Asignando mejores lugares...', 0);

      const customerInfo = guestData ? {
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone || ''
      } : {
        name: user?.name || 'Usuario',
        email: user?.email || 'usuario@example.com',
        phone: user?.phone || ''
      };

      let seatIds = [];
      
      if (isGeneralAdmission) {
        // For GA, we need to find N available seats in the backend or just send quantity if API supported it
        // Current API expects seatIds. We need to fetch them if we haven't already.
        // If availableSeats is empty (because we didn't fetch for GA in useEffect), fetch now.
        let gaSeats = availableSeats;
        if (gaSeats.length === 0) {
           const allSeats = await showsApi.getShowSeats(showId);
           gaSeats = allSeats.filter(s => s.status === 'AVAILABLE' && s.sector === section.name);
        }
        
        if (gaSeats.length < quantity) {
          throw new Error(`Solo hay ${gaSeats.length} asientos disponibles`);
        }
        seatIds = gaSeats.slice(0, quantity).map(s => s.id);
      } else {
        // For Numbered, auto-assign the first N available seats
        if (availableSeats.length < quantity) {
          throw new Error(`Solo quedan ${availableSeats.length} asientos disponibles`);
        }
        seatIds = availableSeats.slice(0, quantity).map(s => parseInt(s.id) || s.id);
      }

      const holdData = {
        showId: parseInt(showId),
        seatIds: seatIds,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name
      };

      const holdResponse = await holdsApi.createHold(holdData);
      const holdId = holdResponse.holdId || holdResponse.id;
      
      if (!holdId) throw new Error('El backend no devolvió un ID de reserva válido');
      
      message.destroy();
      message.success('¡Lugares reservados exitosamente!');

      navigate(`/checkout/${holdId}`, {
        state: { 
          holdId: holdId,
          holdData: { ...holdResponse, holdId },
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

  const subtotal = price * quantity;
  const serviceCharge = Math.round(subtotal * 0.15);
  const total = subtotal + serviceCharge;

  if (loadingData) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>Buscando disponibilidad...</div>
      </div>
    );
  }

  return (
    <div className="fade-in seat-selection-container" style={{ 
      minHeight: '80vh',
      padding: '20px',
      maxWidth: 600, // Reduced max-width for simpler look
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Card 
        style={{ 
          borderRadius: 24, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          border: 'none',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 24px',
          textAlign: 'center',
          color: 'white'
        }}>
          <Title level={3} style={{ color: 'white', margin: 0, marginBottom: 8 }}>
            {event?.name}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
            {section.name} • {isGeneralAdmission ? 'General' : 'Numerado'}
          </Text>
        </div>

        <div style={{ padding: '32px 24px' }}>
          {/* Quantity Selector */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 16, color: '#666', display: 'block', marginBottom: 20 }}>
              ¿Cuántas entradas querés?
            </Text>
            
            <div className="seat-selection-quantity" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 24 
            }}>
              <Button 
                shape="circle"
                size="large"
                icon={<MinusOutlined />}
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                style={{ width: 56, height: 56, border: '1px solid #d9d9d9' }}
              />
              
              <div style={{ width: 60, textAlign: 'center' }}>
                <Text style={{ fontSize: 48, fontWeight: 700, color: '#333', lineHeight: 1 }}>
                  {quantity}
                </Text>
              </div>

              <Button 
                shape="circle"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= Math.min(maxAvailable, 10)}
                style={{ 
                  width: 56, 
                  height: 56, 
                  background: '#667eea', 
                  borderColor: '#667eea', 
                  color: 'white' 
                }}
              />
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Tag color={maxAvailable > 10 ? 'success' : 'warning'} style={{ borderRadius: 12, padding: '4px 12px' }}>
                {maxAvailable > 0 ? `${maxAvailable} disponibles` : 'Agotado'}
              </Tag>
            </div>
          </div>

          <Divider />

          {/* Pricing Summary */}
          <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Precio unitario</Text>
              <Text>${price.toLocaleString()}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Subtotal ({quantity} x ${price.toLocaleString()})</Text>
              <Text>${subtotal.toLocaleString()}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text type="secondary">Cargo por servicio</Text>
              <Text>${serviceCharge.toLocaleString()}</Text>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '1px solid #e8e8e8', 
              paddingTop: 16,
              alignItems: 'center'
            }}>
              <Text strong style={{ fontSize: 18 }}>Total</Text>
              <Text strong style={{ fontSize: 24, color: '#667eea' }}>
                ${total.toLocaleString()}
              </Text>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            type="primary" 
            size="large" 
            block 
            loading={loading}
            onClick={handleContinueClick}
            icon={<ShoppingCartOutlined />}
            style={{
              height: 56,
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
            }}
          >
            Continuar
          </Button>
          
          {!isGeneralAdmission && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Se asignarán automáticamente los mejores asientos disponibles juntos.
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Guest Modal */}
      <Modal
        title="Completar Información"
        open={showGuestForm}
        onCancel={() => setShowGuestForm(false)}
        footer={null}
        width={500}
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
