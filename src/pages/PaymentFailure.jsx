import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Typography, Space, Divider, Alert } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CloseCircleOutlined, HomeOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorDetails, setErrorDetails] = useState(null);

  // Parámetros que envía Mercado Pago
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const orderId = searchParams.get('orderId') || externalReference;

  useEffect(() => {
    // Limpiar datos de localStorage en caso de fallo
    localStorage.removeItem('lastOrderId');
    localStorage.removeItem('idem-order');
    localStorage.removeItem('idem-hold');

    // Determinar el tipo de error
    if (status === 'rejected') {
      setErrorDetails({
        title: 'Pago Rechazado',
        message: 'Tu tarjeta fue rechazada. Por favor, verificá los datos o intentá con otro medio de pago.',
        icon: 'error'
      });
    } else if (status === 'cancelled') {
      setErrorDetails({
        title: 'Pago Cancelado',
        message: 'Cancelaste el proceso de pago. Podés volver a intentarlo cuando quieras.',
        icon: 'warning'
      });
    } else {
      setErrorDetails({
        title: 'Error en el Pago',
        message: 'Ocurrió un error al procesar tu pago. Por favor, intentá nuevamente.',
        icon: 'error'
      });
    }
  }, [status]);

  const handleRetry = () => {
    // Si tenemos orderId, volver al checkout
    if (orderId) {
      navigate(`/checkout/${orderId}`);
    } else {
      // Si no, volver a la selección de asientos
      navigate(-2);
    }
  };

  const getErrorMessage = () => {
    switch (status) {
      case 'rejected':
        return 'Tu tarjeta fue rechazada. Por favor, verificá los datos o intentá con otro medio de pago.';
      case 'cancelled':
        return 'Cancelaste el proceso de pago. Podés volver a intentarlo cuando quieras.';
      default:
        return 'Ocurrió un error al procesar tu pago. Por favor, intentá nuevamente.';
    }
  };

  const getSuggestion = () => {
    switch (status) {
      case 'rejected':
        return 'Intentá con otro medio de pago o verificá los datos de tu tarjeta.';
      case 'cancelled':
        return 'Podés volver a intentarlo cuando quieras.';
      default:
        return 'Intentá nuevamente o contactá a tu banco.';
    }
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
          status={errorDetails?.icon || 'error'}
          icon={status === 'cancelled' ? 
            <WarningOutlined style={{ color: '#faad14' }} /> : 
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          }
          title={
            <Title level={2} style={{ color: status === 'cancelled' ? '#faad14' : '#ff4d4f' }}>
              {errorDetails?.title || 'Error en el Pago'}
            </Title>
          }
          subTitle={errorDetails?.message || 'No se pudo procesar tu pago.'}
          extra={[
            <Button 
              type="primary" 
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              key="retry"
              style={{
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Reintentar Pago
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
              <Title level={4}>Detalles del Intento</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>ID de Pago:</Text>
                    <Text>{paymentId}</Text>
                  </div>
                )}
                {orderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Orden:</Text>
                    <Text>#{orderId}</Text>
                  </div>
                )}
                {status && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Estado:</Text>
                    <Text style={{ color: '#ff4d4f' }}>
                      {status === 'rejected' ? 'RECHAZADO' : 
                       status === 'cancelled' ? 'CANCELADO' : 
                       status?.toUpperCase()}
                    </Text>
                  </div>
                )}
              </Space>
            </div>
          )}

          <div style={{ 
            background: '#fff7e6', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #ffd591'
          }}>
            <Text strong>💡 Consejos:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Verificá que los datos de tu tarjeta sean correctos</li>
              <li>Asegurate de tener fondos suficientes</li>
              <li>Intentá con otra tarjeta o medio de pago</li>
              <li>Si el problema persiste, contactá a tu banco</li>
            </ul>
          </div>

          <Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
            ¿Necesitás ayuda? <a href="/help">Contactá a soporte</a>
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
