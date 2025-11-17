import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Alert, Spin, Statistic, Row, Col, Divider, message } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClockCircleOutlined, ShoppingCartOutlined, WarningOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { holdsApi, ordersApi } from '../services/apiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
      message.success('Orden creada. Redirigiendo a Mercado Pago...');

      const mpUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${orderResponse.mpPreferenceId}`;
      setTimeout(() => {
        window.location.href = mpUrl;
      }, 2000);

    } catch (error) {
      if (error.message?.includes('HoldExpired')) {
        setHoldExpired(true);
        message.error('Tu reserva expiro');
      } else {
        message.error('Error al crear la orden');
      }
    } finally {
      setCreatingOrder(false);
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
      <Title level={2}><ShoppingCartOutlined /> Checkout</Title>

      {!holdExpired ? (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><ClockCircleOutlined /> Tu reserva expira en:</span>
              <Countdown value={deadline} format="mm:ss" onFinish={handleCountdownFinish} valueStyle={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4d4f' }} />
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
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
                    <Text strong><CalendarOutlined /> Fecha y hora:</Text><br />
                    <Text>{format(new Date(show.startsAt || show.starts_at), "dd 'de' MMMM, yyyy - HH:mm 'hs'", { locale: es })}</Text>
                  </div>
                  {event?.venue_name && (
                    <div>
                      <Text strong><EnvironmentOutlined /> Lugar:</Text><br />
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
              <Alert message="Pago con Mercado Pago" description="Seras redirigido a Mercado Pago para completar el pago" type="info" showIcon />

              <Button type="primary" size="large" block onClick={handleCreateOrderAndPay} loading={creatingOrder} disabled={holdExpired || creatingOrder} style={{ height: 50, fontSize: '1.1rem', fontWeight: 'bold' }}>
                Proceder al pago
              </Button>

              <Button size="large" block onClick={handleCancelHold} disabled={creatingOrder}>
                Cancelar reserva
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
