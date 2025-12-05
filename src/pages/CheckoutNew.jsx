import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Alert, Spin, Statistic, Row, Col, Divider, message } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Clock, ShoppingCart, TriangleAlert, Calendar, MapPin } from 'lucide-react';
import { holdsApi, ordersApi } from '../services/apiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePaymentStatus } from '../hooks/usePaymentStatus';


const { Title, Text } = Typography;
const { Countdown } = Statistic;

export default function CheckoutNew() {
  const { holdId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado del hold y orden
  const [holdData, setHoldData] = useState(location.state?.holdData || null);
  const [loading, setLoading] = useState(!location.state?.holdData);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [holdExpired, setHoldExpired] = useState(false);
  
  // Datos adicionales del state
  const show = location.state?.show;
  const event = location.state?.event;
  const expiresAt = location.state?.expiresAt || holdData?.expiresAt;

  // Estado para Payment Brick
  const [preferenceId, setPreferenceId] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleCountdownChange = (val) => {
    if (val < 2 * 60 * 1000 && !showWarning && !holdExpired) {
      setShowWarning(true);
    }
  };

  // Cargar datos del hold si no vienen en el state
  useEffect(() => {
    const loadHoldData = async () => {
      if (holdData) {
        return;
      }

      try {
        setLoading(true);
        const response = await holdsApi.getHold(holdId);
        setHoldData(response);
        
        if (response.status === 'EXPIRED' || response.isExpired) {
          setHoldExpired(true);
          message.error('Tu reserva ha expirado');
        }
      } catch (error) {
        message.error('No se pudo cargar la reserva');
        setTimeout(() => navigate(-1), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (holdId) {
      loadHoldData();
    }
  }, [holdId]);

  // Inicializar Payment Brick cuando hay preferenceId
  useEffect(() => {
    if (preferenceId) {
      const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, {
        locale: 'es-AR'
      });
      const bricksBuilder = mp.bricks();

      const renderBrick = async () => {
        const settings = {
          initialization: {
            amount: holdData.totalCents / 100, // Monto total
            preferenceId: preferenceId,
          },
          customization: {
            paymentMethods: {
              ticket: "all",
              bankTransfer: "all",
              creditCard: "all",
              debitCard: "all",
              mercadoPago: "all",
            },
            visual: {
              style: {
                theme: 'default',
              }
            }
          },
          callbacks: {
            onReady: () => {
              console.log('Brick listo');
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
              // Con preferenceId, el brick suele manejar el flujo, pero si es necesario procesar:
              return new Promise((resolve, reject) => {
                // Si el brick requiere procesar el pago manualmente (Core):
                fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/process_payment`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(formData),
                })
                .then((response) => response.json())
                .then((data) => {
                   if (data.status === 'approved') {
                     resolve();
                     message.success('¡Pago exitoso!');
                     window.location.href = '/mis-entradas';
                   } else if (data.status === 'in_process' || data.status === 'pending') {
                     resolve();
                     setPaymentStatus('PROCESSING');
                   } else {
                     reject();
                     // Manejo detallado de errores de pago
                     if (data.status_detail === 'cc_rejected_insufficient_amount') {
                       message.error('Fondos insuficientes. Por favor, prueba con otra tarjeta.');
                     } else if (data.status_detail === 'cc_rejected_call_for_authorize') {
                       message.error('Debes autorizar el pago con tu banco.');
                     } else if (data.status_detail === 'cc_rejected_bad_filled_card_number') {
                       message.error('Revisa el número de tarjeta.');
                     } else if (data.status_detail === 'cc_rejected_bad_filled_security_code') {
                       message.error('Revisa el código de seguridad.');
                     } else if (data.status_detail === 'cc_rejected_bad_filled_date') {
                       message.error('Revisa la fecha de vencimiento.');
                     } else {
                       message.error('Pago rechazado. Intenta con otro medio de pago.');
                     }
                   }
                })
                .catch((error) => {
                   reject();
                   console.error(error);
                   message.error('Error al procesar el pago');
                });
              });
            },
            onError: (error) => {
              console.error(error);
              message.error('Error en el componente de pago');
            },
          },
        };

        window.paymentBrickController = await bricksBuilder.create(
          "payment",
          "paymentBrick_container",
          settings
        );
      };

      renderBrick();
    }
  }, [preferenceId, holdData]);

  // Estado para polling de pago
  const [pollingOrderId, setPollingOrderId] = useState(null);
  // Usar el hook de polling
  const paymentStatus = usePaymentStatus(pollingOrderId, !!pollingOrderId);

  // Efecto para reaccionar a cambios de estado del hook
  useEffect(() => {
    if (paymentStatus === 'PAID') {
      message.success('¡Pago acreditado!');
      setTimeout(() => window.location.href = '/mis-entradas', 1500);
    } else if (paymentStatus === 'CANCELLED') {
      message.error('El pago fue rechazado.');
    }
  }, [paymentStatus]);

  // Timeout de 5 minutos para marcar como demorado (UI local)
  const [isDelayed, setIsDelayed] = useState(false);
  useEffect(() => {
    if (pollingOrderId && paymentStatus === 'PENDING') {
      const timeout = setTimeout(() => {
        setIsDelayed(true);
      }, 5 * 60 * 1000);
      return () => clearTimeout(timeout);
    }
  }, [pollingOrderId, paymentStatus]);

  const handleCountdownFinish = () => {
    setHoldExpired(true);
    message.error('Tu reserva ha expirado');
  };

  const handleCreateOrderAndPay = async () => {
    if (holdExpired) {
      message.error('La reserva ha expirado');
      return;
    }

    try {
      setCreatingOrder(true);
      const orderResponse = await ordersApi.createOrder({ holdId: parseInt(holdId) });
      
      localStorage.setItem('currentOrderId', orderResponse.orderId);
      message.success('Orden creada. Cargando opciones de pago...');

      // En lugar de redirigir, seteamos el preferenceId para mostrar el Brick
      if (orderResponse.mpPreferenceId) {
        setPreferenceId(orderResponse.mpPreferenceId);
        // Guardar orderId para polling si es necesario (aunque el brick suele dar el ID)
        // Pero aquí usamos el ID de la orden de nuestro sistema
        setPollingOrderId(orderResponse.orderId);
      } else {
        throw new Error('No se recibió ID de preferencia de MercadoPago');
      }

    } catch (error) {
      if (error.message?.includes('HoldExpired')) {
        setHoldExpired(true);
        message.error('Tu reserva expiro');
      } else if (error.status === 403 && error.code === 'SaleNotStarted') {
        message.error('La venta para este evento aún no ha comenzado');
        navigate('/');
      } else {
        console.error(error);
        message.error('Error al crear la orden');
      }
      setCreatingOrder(false); // Solo dejar de cargar si hubo error
    }
  };

  const handleCancelHold = async () => {
    try {
      await holdsApi.cancelHold(holdId);
      message.success('Reserva cancelada');
      navigate(-1);
    } catch (error) {
      message.error('Error al cancelar');
      navigate(-1);
    }
  };

  // Renderizado de estados de pago
  if (paymentStatus === 'PENDING' && pollingOrderId && !isDelayed) {
    return (
      <div style={{ padding: 40, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
        <Title level={3} style={{ marginTop: 24 }}>Procesando tu pago...</Title>
        <Text type="secondary">Por favor, no cierres esta ventana.</Text>
      </div>
    );
  }

  if (isDelayed) {
    return (
      <div style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <Alert
          message="Pago Demorado"
          description={
            <Space direction="vertical">
              <Text>Tu pago se está procesando. A veces MercadoPago tarda unos minutos en confirmar.</Text>
              <Text strong>No te preocupes: si el pago se acredita, recibirás un email confirmando tu lugar automáticamente.</Text>
              <Text type="warning">No es necesario que compres de nuevo.</Text>
            </Space>
          }
          type="warning"
          showIcon
          icon={<Clock size={32} />}
        />
        <Button type="primary" onClick={() => navigate('/mis-entradas')} style={{ marginTop: 24 }}>
          Ir a Mis Entradas
        </Button>
      </div>
    );
  }

  if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILURE') {
    return (
      <div style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <Alert
          message="Pago Rechazado"
          description="La entidad financiera rechazó el pago. Puedes intentar nuevamente con otro medio de pago."
          type="error"
          showIcon
          icon={<TriangleAlert size={32} />}
        />
        <Button 
          type="primary" 
          onClick={() => {
            // Reiniciar estado para permitir reintento
            setPollingOrderId(null);
            setIsDelayed(false);
            window.location.reload();
          }} 
          style={{ marginTop: 24 }}
        >
          Intentar pagar nuevamente
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Cargando reserva...</Text>
      </div>
    );
  }

  if (!holdData) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Alert message="Reserva no encontrada" type="error" showIcon />
        <Button type="primary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>Volver</Button>
      </div>
    );
  }

  const deadline = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 15 * 60 * 1000;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}><ShoppingCart size={28} style={{ marginRight: 8 }} /> Checkout</Title>


      {!holdExpired ? (
        <>
          {showWarning && (
            <Alert 
              message="¡Tu reserva está por expirar!" 
              description="Tienes menos de 2 minutos para completar la compra." 
              type="warning" 
              showIcon 
              style={{ marginBottom: 16, border: '1px solid #faad14' }} 
              closable
            />
          )}
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Clock size={16} style={{ marginRight: 8 }} /> Tu reserva expira en:</span>
                <Countdown 
                  value={deadline} 
                  format="mm:ss" 
                  onFinish={handleCountdownFinish} 
                  onChange={handleCountdownChange}
                  valueStyle={{ fontSize: '1.5rem', fontWeight: 'bold', color: showWarning ? '#ff4d4f' : '#3f8600' }} 
                />
              </div>
            }
            type={showWarning ? "error" : "info"}
            showIcon
            style={{ marginBottom: 24 }}
          />
        </>
      ) : (
        <Alert message="Reserva Expirada" description="Debes volver a seleccionar los asientos" type="error" showIcon style={{ marginBottom: 24 }} />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card title="Resumen de tu compra">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {event && (
                <>
                  <div>
                    <Text strong>Evento:</Text><br />
                    <Title level={4} style={{ margin: '4px 0' }}>{event.name}</Title>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                </>
              )}

              {show && (
                <>
                  <div>
                    <Text strong><Calendar size={16} style={{ marginRight: 8 }} /> Fecha y hora:</Text><br />
                    <Text>{format(new Date(show.startsAt || show.starts_at), "dd 'de' MMMM, yyyy - HH:mm 'hs'", { locale: es })}</Text>
                  </div>
                  {event?.venue_name && (
                    <div>
                      <Text strong><MapPin size={16} style={{ marginRight: 8 }} /> Lugar:</Text><br />
                      <Text>{event.venue_name}</Text>
                    </div>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                </>
              )}

              <div>
                <Text strong>Asientos reservados:</Text>
                <div style={{ marginTop: 12 }}>
                  {holdData.seats?.map((seat, index) => (
                    <div key={seat.seatId || index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f5f5f5', borderRadius: 8, marginBottom: 8 }}>
                      <div>
                        <Text strong>{seat.sector}</Text><br />
                        <Text type="secondary">Asiento {seat.seatNumber || seat.seat_number}</Text>
                      </div>
                      <Text strong style={{ fontSize: '1.1rem' }}>${((seat.priceCents || seat.price_cents || 0) / 100).toLocaleString('es-AR')}</Text>
                    </div>
                  ))}
                </div>
              </div>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Total:</Title>
                <Title level={3} style={{ margin: 0, color: '#4F46E5' }}>${((holdData.totalCents || 0) / 100).toLocaleString('es-AR')}</Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Metodo de pago">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {!preferenceId ? (
                <>
                  <Alert message="Pago con Mercado Pago" description="Seras redirigido a Mercado Pago para completar el pago" type="info" showIcon />

                  <Button type="primary" size="large" block onClick={handleCreateOrderAndPay} loading={creatingOrder} disabled={holdExpired || creatingOrder} style={{ height: 50, fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Proceder al pago
                  </Button>

                  <Button size="large" block onClick={handleCancelHold} disabled={creatingOrder}>
                    Cancelar reserva
                  </Button>
                </>
              ) : (
                <div id="paymentBrick_container"></div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
