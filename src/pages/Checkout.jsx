import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Form, Input, Select, Row, Col, Divider, message, Alert, Spin, Statistic, Tag } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { holdsApi, paymentsApi, ordersApi } from '../services/apiService';
import MercadoPagoButton from '../components/MercadoPagoButton';

const { Title, Text } = Typography;

export default function Checkout() {
  const { holdId: holdIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Hooks
  const { user } = useAuth();

  // Estados del hold y orden
  const [holdData, setHoldData] = useState(location.state?.holdData || null);
  const [orderData, setOrderData] = useState(null);
  const [loadingHold, setLoadingHold] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Datos del show y evento desde el state
  const show = location.state?.show || null;
  const event = location.state?.event || null;
  
  // 🔧 FIX: Obtener holdId de params o del state
  const holdId = holdIdParam || location.state?.holdId || holdData?.holdId;
  
  // Cargar datos del hold al montar el componente
  useEffect(() => {
    const loadHoldData = async () => {
      try {
        setLoadingHold(true);
        
        // 🚨 VALIDACIÓN: Verificar que holdId existe
        if (!holdId) {
          console.error('❌ ERROR: holdId es undefined o null');
          message.error('No se encontró el ID de la reserva. Por favor, intenta nuevamente.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        const response = await holdsApi.getHold(holdId);
        setHoldData(response);
        
        // Calcular tiempo restante
        if (response.expiresAt || response.expires_at) {
          const expiresAt = new Date(response.expiresAt || response.expires_at);
          const now = new Date();
          const diffMs = expiresAt - now;
          setTimeLeft(Math.max(0, Math.floor(diffMs / 1000)));
        }
      } catch (error) {
        console.error('❌ Error cargando hold:', error);
        message.error('No se pudo cargar la información de la reserva.');
        // Redirigir de vuelta si el hold no existe o expiró
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setLoadingHold(false);
      }
    };

    if (holdId && !holdData) {
      loadHoldData();
    } else if (holdData) {
      setLoadingHold(false);
      }
  }, [holdId, holdData, navigate]);


  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          message.error('La reserva ha expirado. Redirigiendo...');
          setTimeout(() => navigate('/'), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  // Calcular totales desde el hold
  const calculateTotals = () => {
    if (!holdData) {
      return { subtotal: 0, serviceCharge: 0, total: 0 };
    }
    
    // Soporte para snake_case y camelCase
    const totalCents = holdData.totalCents || holdData.total_cents || 0;
    
    if (!totalCents) {
      return { subtotal: 0, serviceCharge: 0, total: 0 };
    }
    
    const subtotal = totalCents / 100;
    const serviceCharge = Math.round(subtotal * 0.15);
    const total = subtotal + serviceCharge;
    
    return { subtotal, serviceCharge, total };
  };

  const { subtotal, serviceCharge, total } = calculateTotals();

  // Preparar datos del pagador para el botón de Mercado Pago
  const getPayerInfo = () => {
    const formValues = form.getFieldsValue();
    return {
      name: formValues.name || user?.name?.split(' ')[0] || 'Usuario',
      surname: formValues.surname || user?.name?.split(' ').slice(1).join(' ') || 'VibraTicket',
      email: formValues.email || user?.email,
      phone: formValues.phone || '1234567890',
      areaCode: formValues.areaCode || '11',
      idType: formValues.idType || 'DNI',
      idNumber: formValues.idNumber || '12345678'
    };
  };

  // Handler de error del botón de Mercado Pago
  const handlePaymentError = (error) => {
    console.error('❌ Error en pago:', error);
    // 401: No autenticado
    if (error.response?.status === 401 || error.status === 401) {
      setTimeout(() => navigate('/login'), 2000);
    }
    // 409: Conflictos (asientos en otra orden, hold expirado/usado)
    else if (error.response?.status === 409 || error.status === 409) {
      const errCode = error.response?.error || error.error;
      if (errCode === 'SeatsInOtherOrders') {
        const seats = error.response?.seats || [];
        const seatList = seats.map(s => s.seatId || s.id).join(', ');
        message.error(`Algunos asientos ya están en otra orden activa (${seatList}). Te llevamos de vuelta para que elijas otros.`, 5);
        setTimeout(() => navigate(-1), 1800);
      } else if (errCode === 'HoldExpired') {
        message.error('Tu reserva temporal (HOLD) expiró. Volvé a seleccionar asientos.', 4);
        setTimeout(() => navigate(-1), 1500);
      } else if (errCode === 'HoldAlreadyUsed') {
        message.error('El HOLD ya fue utilizado para crear una orden. Recargá o volvé a seleccionar.', 4);
        setTimeout(() => navigate(-1), 1500);
      } else {
        message.error('Conflicto al procesar tu compra. Volviendo al paso anterior...', 4);
        setTimeout(() => navigate(-1), 1500);
      }
    }
    // 404: Recurso no encontrado (hold/order)
    else if (error.response?.status === 404 || error.status === 404) {
      message.error('No encontramos la reserva/orden. Volviendo al inicio...', 4);
      setTimeout(() => navigate('/'), 3000);
    }
  };


  // Mostrar spinner mientras se carga el hold
  if (loadingHold) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Cargando información de la reserva...</Text>
        </div>
      </div>
    );
  }

  // Si no hay holdData, mostrar error
  if (!holdData) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: '60vh' }}>
        <Alert
          message="Reserva no encontrada"
          description="No se pudo cargar la información de la reserva. Por favor, intentá nuevamente."
          type="error"
          showIcon
        />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>

      {/* Countdown de expiración */}
      {timeLeft > 0 && (
        <Alert
          message={
            <Space>
              <ClockCircleOutlined />
              <span>Tu reserva expira en:</span>
              <Statistic.Countdown 
                value={Date.now() + timeLeft * 1000} 
                format="mm:ss"
                valueStyle={{ fontSize: 16, color: timeLeft < 300 ? '#ff4d4f' : '#52c41a' }}
              />
            </Space>
          }
          type={timeLeft < 300 ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Resumen de la orden">
            <Space direction="vertical" style={{ width: '100%' }}>
              {event && (
                <div>
                  <Text strong>Evento:</Text> <Text>{event.name}</Text>
                </div>
              )}
              
              {show && (
                <div>
                  <Text strong>Fecha:</Text> <Text>
                    {new Date(show.startsAt || show.starts_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </div>
              )}
              
              {event && (
                <div>
                  <Text strong>Venue:</Text> <Text>{event.venue_name || event.venueName || 'N/A'}</Text>
                </div>
              )}
              
              <Divider />
              
              <div>
                <Text strong>Asientos reservados:</Text>
                <div style={{ marginTop: 8 }}>
                  {(() => {
                    // Soporte para diferentes estructuras de respuesta
                    const items = holdData.items || holdData.seats || [];
                    if (items.length > 0) {
                      return (
                        <div>
                          <Text>Cantidad: {items.length} asientos</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            IDs: {items.map(item => item.seatId || item.seat_id || item.id || item).join(', ')}
                          </Text>
                        </div>
                      );
                    }
                    
                    // Fallback: mostrar info del holdData completo
                    return (
                      <div>
                        <Text type="secondary">Cargando información de asientos...</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Hold ID: {holdData.id || holdData.holdId || holdId}
                        </Text>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <Divider />
              
              {/* Desglose de precios */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Subtotal:</Text>
                  <Text>${subtotal.toLocaleString()}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Cargo por servicios (15%):</Text>
                  <Text>${serviceCharge.toLocaleString()}</Text>
                </div>
              </div>
              
              <Divider />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: 18,
                fontWeight: 'bold',
                padding: '12px 0',
                background: '#f0f0f0',
                borderRadius: 8,
                paddingLeft: 12,
                paddingRight: 12
              }}>
                <Text strong>Total a pagar:</Text>
                <Text strong style={{ color: '#52c41a' }}>${total.toLocaleString()}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Información de pago"
          >
            <Alert
              message="Pago Seguro con Mercado Pago"
              description="Serás redirigido a Mercado Pago para completar tu pago de forma segura. Aceptamos tarjetas de crédito, débito, efectivo y otros medios de pago."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                email: user?.email,
                name: user?.name?.split(' ')[0],
                surname: user?.name?.split(' ').slice(1).join(' '),
                idType: 'DNI'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Nombre"
                    name="name"
                    rules={[{ required: true, message: 'Ingresá tu nombre' }]}
                  >
                    <Input placeholder="Juan" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Apellido"
                    name="surname"
                    rules={[{ required: true, message: 'Ingresá tu apellido' }]}
                  >
                    <Input placeholder="Pérez" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Ingresá tu email' },
                  { type: 'email', message: 'Email inválido' }
                ]}
              >
                <Input placeholder="tu@email.com" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Cód. Área"
                    name="areaCode"
                    rules={[{ required: true, message: 'Requerido' }]}
                  >
                    <Input placeholder="11" maxLength={4} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    label="Teléfono"
                    name="phone"
                    rules={[
                      { required: true, message: 'Ingresá tu teléfono' },
                      { pattern: /^[0-9]{7,10}$/, message: '7-10 dígitos' }
                    ]}
                  >
                    <Input placeholder="12345678" maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Tipo Doc."
                    name="idType"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Select.Option value="DNI">DNI</Select.Option>
                      <Select.Option value="CI">CI</Select.Option>
                      <Select.Option value="LC">LC</Select.Option>
                      <Select.Option value="LE">LE</Select.Option>
                      <Select.Option value="Otro">Otro</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    label="Número de Documento"
                    name="idNumber"
                    rules={[
                      { required: true, message: 'Ingresá tu documento' },
                      { pattern: /^[0-9]{7,8}$/, message: '7-8 dígitos' }
                    ]}
                  >
                    <Input placeholder="12345678" maxLength={8} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <div style={{ marginTop: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Button onClick={() => navigate(-1)} block size="large">
                    Volver
                  </Button>
                  
                  <Form.Item
                    shouldUpdate
                    style={{ marginBottom: 0 }}
                  >
                    {() => {
                      const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);
                      const allFieldsTouched = form.isFieldsTouched(true);
                      
                      return (
                        <MercadoPagoButton
                          holdId={holdId}
                          payer={getPayerInfo()}
                          onError={handlePaymentError}
                        />
                      );
                    }}
                  </Form.Item>

                </Space>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
