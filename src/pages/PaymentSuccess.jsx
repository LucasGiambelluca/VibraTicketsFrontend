import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Spin, Typography, Space, Divider, Tag } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleOutlined, DownloadOutlined, HomeOutlined } from '@ant-design/icons';
import { paymentsApi, usersApi } from '../services/apiService';

const { Title, Text, Paragraph } = Typography;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Parámetros que envía Mercado Pago
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference'); // orderId
  const merchantOrderId = searchParams.get('merchant_order_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);

        // Obtener orderId de la URL o localStorage
        const orderId = searchParams.get('orderId') || 
                       externalReference || 
                       localStorage.getItem('lastOrderId');
        
        if (!orderId) {
          // Si es pago simulado, mostrar éxito directo
          if (searchParams.get('simulated') === 'true') {
            setPaymentInfo({
              status: 'approved',
              message: 'Pago simulado exitosamente',
              simulated: true
            });
            setLoading(false);
            return;
          }
          throw new Error('No se encontró información de la orden');
        }

        // Verificar estado del pago usando el endpoint correcto
        const paymentStatus = await paymentsApi.getPaymentStatus(orderId);
        // El backend devuelve: { orderId, paymentId, status, orderStatus, amount, approvedAt }
        setPaymentInfo({
          status: paymentStatus.status || 'approved',
          paymentId: paymentStatus.paymentId || paymentStatus.payment_id || paymentId,
          orderId: paymentStatus.orderId || orderId,
          amount: paymentStatus.amount || paymentStatus.totalAmount,
          approvedAt: paymentStatus.approvedAt || paymentStatus.approved_at,
          orderStatus: paymentStatus.orderStatus || paymentStatus.order_status,
          message: paymentStatus.orderStatus === 'PAID' 
            ? 'Pago procesado exitosamente'
            : 'Procesando pago...'
        });

        // Si el pago aún está pendiente y no hemos reintentado mucho, reintentar
        if (paymentStatus.orderStatus !== 'PAID' && retryCount < 10) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => verifyPayment(), 3000);
        } else if (paymentStatus.orderStatus === 'PAID') {
          // Limpiar orderId de localStorage si el pago fue exitoso
          localStorage.removeItem('lastOrderId');
          localStorage.removeItem('idem-order');
          localStorage.removeItem('idem-hold');
        }
      } catch (error) {
        console.error('❌ Error al verificar pago:', error);
        
        // Si el webhook aún no procesó y tenemos menos de 10 reintentos
        if (retryCount < 10) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => verifyPayment(), 3000);
          return;
        }
        
        // Después de 10 reintentos, mostrar mensaje de espera
        setPaymentInfo({
          status: 'pending',
          paymentId: paymentId,
          message: 'Tu pago está siendo procesado. Por favor, verifica en "Mis Entradas" en unos minutos.'
        });
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, status, externalReference, paymentId, retryCount]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Verificando tu pago...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 800, 
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      <Card>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title={
            <Title level={2} style={{ color: '#52c41a' }}>
              ¡Pago Exitoso!
            </Title>
          }
          subTitle="Tu compra ha sido procesada correctamente"
          extra={[
            <Button 
              type="primary" 
              size="large"
              icon={<DownloadOutlined />}
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
          <div>
            <Title level={4}>Detalles de la Transacción</Title>
            
            {paymentInfo && (
              <Space direction="vertical" style={{ width: '100%' }}>
                {paymentInfo.paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>ID de Pago:</Text>
                    <Text copyable>{paymentInfo.paymentId}</Text>
                  </div>
                )}
                
                {paymentInfo.orderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Orden:</Text>
                    <Text>#{paymentInfo.orderId}</Text>
                  </div>
                )}

                {paymentInfo.amount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Monto:</Text>
                    <Text style={{ fontSize: 18, color: '#52c41a', fontWeight: 'bold' }}>
                      ${(paymentInfo.amount / 100).toFixed(2)}
                    </Text>
                  </div>
                )}

                {paymentInfo.status && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Estado:</Text>
                    <Tag color="success">
                      {paymentInfo.status === 'approved' ? 'APROBADO' : paymentInfo.status.toUpperCase()}
                    </Tag>
                  </div>
                )}

                {paymentInfo.approvedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Fecha:</Text>
                    <Text>{new Date(paymentInfo.approvedAt).toLocaleString('es-AR')}</Text>
                  </div>
                )}
              </Space>
            )}

            {!paymentInfo && paymentId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>ID de Pago:</Text>
                <Text copyable>{paymentId}</Text>
              </div>
            )}
          </div>

          <Divider />

          <div>
            <Paragraph>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <strong>¡Tu compra está confirmada!</strong>
            </Paragraph>
            <Paragraph>
              Recibirás un email de confirmación con los detalles de tu compra y tus entradas.
            </Paragraph>
            <Paragraph>
              Podés descargar tus entradas desde la sección <strong>"Mis Entradas"</strong> en cualquier momento.
            </Paragraph>
          </div>

          <div style={{ 
            background: '#f0f5ff', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #adc6ff'
          }}>
            <Text strong>💡 Recordá:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Guardá el código QR de tus entradas</li>
              <li>Llegá con anticipación al evento</li>
              <li>Presentá tu entrada digital o impresa en la puerta</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  );
}
