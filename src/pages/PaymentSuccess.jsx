import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Spin, Typography, Space, Divider, Tag, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleOutlined, DownloadOutlined, HomeOutlined, SyncOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { paymentsApi } from '../services/apiService';

const { Title, Text, Paragraph } = Typography;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Parámetros que envía Mercado Pago
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference'); // orderId
  
  // Obtener orderId de la URL o localStorage
  // MP a veces envía collection_id como payment_id
  const orderId = searchParams.get('orderId') || 
                  externalReference || 
                  localStorage.getItem('lastOrderId');

  useEffect(() => {
    if (!orderId) {
      // Si es pago simulado, mostrar éxito directo
      if (searchParams.get('simulated') === 'true') {
        setPaymentInfo({
          status: 'approved',
          orderStatus: 'PAID',
          amount: 15000, // Dummy
          approvedAt: new Date().toISOString(),
          simulated: true
        });
        setLoading(false);
        setPolling(false);
        return;
      }
      
      setLoading(false);
      setPolling(false);
      setError('No se encontró información de la orden');
      return;
    }

    // Si ya tenemos info y está pagado, no pollear más
    if (paymentInfo?.orderStatus === 'PAID') return;

    const MAX_RETRIES = 20; // 20 * 3s = 60s
    const POLLING_INTERVAL = 3000;

    const checkStatus = async () => {
      try {
        const response = await paymentsApi.getPaymentStatus(orderId);
        // Response: { orderId, status, orderStatus, amount, approvedAt }
        
        setPaymentInfo(response);

        if (response.orderStatus === 'PAID' || response.orderStatus === 'CONFIRMED') {
          setLoading(false);
          setPolling(false);
          // Limpiar localStorage
          localStorage.removeItem('lastOrderId');
          localStorage.removeItem('idem-order');
          localStorage.removeItem('idem-hold');
        } else if (response.orderStatus === 'CANCELLED' || response.orderStatus === 'REJECTED') {
          setLoading(false);
          setPolling(false);
          setError('El pago fue rechazado o cancelado.');
        } else {
          // Sigue PENDING
          if (retryCount >= MAX_RETRIES) {
            setLoading(false);
            setPolling(false);
            setTimeoutReached(true);
          } else {
            setRetryCount(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
        // Si falla la API, reintentamos igual
        if (retryCount >= MAX_RETRIES) {
          setLoading(false);
          setPolling(false);
          setError('No se pudo verificar el estado del pago. Por favor contacta a soporte.');
        } else {
          setRetryCount(prev => prev + 1);
        }
      }
    };

    let timerId;
    if (polling) {
      // Ejecutar inmediatamente la primera vez
      if (retryCount === 0) {
        checkStatus();
      }
      
      timerId = setTimeout(checkStatus, POLLING_INTERVAL);
    }

    return () => clearTimeout(timerId);
  }, [orderId, polling, retryCount, searchParams]);

  // Renderizado de estados
  
  // 1. Cargando / Polling
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        background: 'transparent'
      }}>
        <Card style={{ textAlign: 'center', width: 400, borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <Space direction="vertical" size="large">
            <Spin size="large" indicator={<SyncOutlined spin style={{ fontSize: 48, color: '#1890ff' }} />} />
            <div>
              <Title level={4}>Procesando pago...</Title>
              <Text type="secondary">Estamos confirmando tu transacción con Mercado Pago.</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>Intento {retryCount}/20</Text>
          </Space>
        </Card>
      </div>
    );
  }

  // 2. Error / Cancelado
  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', minHeight: '60vh' }}>
        <Card style={{ borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <Result
            status="error"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Hubo un problema con tu pago"
            subTitle={error}
            extra={[
              <Button type="primary" key="retry" onClick={() => navigate('/checkout/' + orderId)}>
                Reintentar Pago
              </Button>,
              <Button key="home" onClick={() => navigate('/')}>
                Volver al Inicio
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // 3. Timeout (Pago en proceso)
  if (timeoutReached) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', minHeight: '60vh' }}>
        <Card style={{ borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <Result
            status="warning"
            icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            title="Pago en proceso"
            subTitle="Tu pago se está procesando pero está tardando más de lo esperado. No te preocupes, te avisaremos por email cuando se confirme."
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/')}>
                Volver al Inicio
              </Button>,
              <Button key="contact" onClick={() => navigate('/soporte')}>
                Contactar Soporte
              </Button>
            ]}
          />
          <Divider />
          <Text type="secondary">
            ID de Orden: <Text strong>{orderId}</Text>
          </Text>
        </Card>
      </div>
    );
  }

  // 4. Éxito (PAID)
  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 800, 
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      <Card style={{ borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title={
            <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
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
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
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

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Estado:</Text>
                  <Tag color="success">APROBADO</Tag>
                </div>

                {paymentInfo.approvedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Fecha:</Text>
                    <Text>{new Date(paymentInfo.approvedAt).toLocaleString('es-AR')}</Text>
                  </div>
                )}
              </Space>
            )}
          </div>

          <div style={{ 
            background: '#f6ffed', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #b7eb8f'
          }}>
            <Paragraph style={{ marginBottom: 0 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <strong>¡Tu compra está confirmada!</strong> Recibirás un email con tus entradas.
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
}
