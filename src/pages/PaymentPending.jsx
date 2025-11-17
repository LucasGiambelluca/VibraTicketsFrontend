import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Typography, Space, Divider, Alert, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClockCircleOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { paymentsApi } from '../services/apiService';

const { Title, Text, Paragraph } = Typography;

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Parámetros que envía Mercado Pago
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const orderId = searchParams.get('orderId') || externalReference;

  useEffect(() => {
    // Verificar estado cada 5 segundos (máximo 6 veces = 30 segundos)
    if (orderId && retryCount < 6) {
      const timer = setTimeout(() => {
        checkPaymentStatus();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderId, retryCount]);

  const checkPaymentStatus = async () => {
    try {
      setChecking(true);
      
      const paymentStatus = await paymentsApi.getPaymentStatus(orderId);
      
      if (paymentStatus.orderStatus === 'PAID') {
        navigate(`/payment/success?orderId=${orderId}`);
      } else if (paymentStatus.status === 'rejected' || paymentStatus.status === 'cancelled') {
        navigate(`/payment/failure?orderId=${orderId}&status=${paymentStatus.status}`);
      } else {
        // Aún pendiente, incrementar contador
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
      setRetryCount(prev => prev + 1);
    } finally {
      setChecking(false);
    }
  };

  const handleManualCheck = () => {
    setRetryCount(0);
    checkPaymentStatus();
  };

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 800, 
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      <Card>
        <Result
          status="warning"
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title={
            <Title level={2} style={{ color: '#faad14' }}>
              Pago Pendiente
            </Title>
          }
          subTitle="Tu pago está siendo procesado por Mercado Pago"
          extra={[
            <Button 
              type="primary" 
              size="large"
              icon={checking ? <Spin size="small" /> : <ReloadOutlined />}
              onClick={handleManualCheck}
              disabled={checking}
              key="check"
              style={{
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {checking ? 'Verificando...' : 'Verificar Estado'}
            </Button>,
            <Button 
              size="large"
              onClick={() => navigate('/mis-entradas')}
              key="tickets"
            >
              Ver Mis Entradas
            </Button>,
            <Button 
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              key="home"
            >
              Volver al Inicio
            </Button>
          ]}
        />

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {(paymentId || orderId) && (
            <div>
              <Title level={4}>Información del Pago</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>ID de Pago:</Text>
                    <Text copyable>{paymentId}</Text>
                  </div>
                )}
                {orderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Orden:</Text>
                    <Text>#{orderId}</Text>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Estado:</Text>
                  <Text style={{ color: '#faad14' }}>PENDIENTE</Text>
                </div>
              </Space>
            </div>
          )}

          <Alert
            message="¿Qué significa esto?"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  Tu pago está siendo procesado por Mercado Pago. Esto puede tardar unos minutos.
                </Paragraph>
                <ul style={{ marginBottom: 0 }}>
                  <li>Si pagaste con tarjeta de débito, puede tardar hasta 2 días hábiles</li>
                  <li>Si pagaste con efectivo (Rapipago/Pago Fácil), se confirmará cuando se acredite</li>
                  <li>Te enviaremos un email cuando el pago esté confirmado</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
          />

          <div style={{ 
            background: '#f0f5ff', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #adc6ff'
          }}>
            <Text strong>🔄 Verificación automática:</Text>
            <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
              {retryCount < 6 ? (
                <>Estamos verificando el estado de tu pago automáticamente cada 5 segundos. 
                Intento {retryCount + 1} de 6.</>
              ) : (
                <>La verificación automática ha finalizado. 
                Podés verificar manualmente o revisar en "Mis Entradas" más tarde.</>
              )}
            </Paragraph>
          </div>

          <div style={{ 
            background: '#fff7e6', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #ffd591'
          }}>
            <Text strong>⚠️ Importante:</Text>
            <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
              Tu reserva de asientos está confirmada. Una vez que se acredite el pago, 
              recibirás tus entradas por email y podrás verlas en la sección "Mis Entradas".
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
}
