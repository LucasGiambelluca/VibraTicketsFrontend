import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Space, Button, Form, Input, Select, Row, Col, Divider, message, Alert, Spin, Steps, Statistic, Grid, Collapse } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClockCircleOutlined, ShoppingCartOutlined, TagOutlined, CreditCardOutlined, CheckCircleOutlined, LockOutlined, SafetyCertificateOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { holdsApi } from '../services/apiService';
import MercadoPagoButton from '../components/MercadoPagoButton';
import DiscountCodeAdvanced from '../components/checkout/DiscountCodeAdvanced';
import OrderSummary from '../components/checkout/OrderSummary';
import CountdownTimer from '../components/checkout/CountdownTimer';
import StickyMobileTotalBar from '../components/checkout/StickyMobileTotalBar';
// import Turnstile from '../components/Turnstile';

const { Title, Text } = Typography;

// Key for localStorage auto-save
const CHECKOUT_FORM_KEY = 'vibratickets_checkout_form';

export default function Checkout() {
  const { holdId: holdIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const [summaryOpen, setSummaryOpen] = useState(false);
  
  // Hooks
  const { user } = useAuth();

  // Estados del hold y orden
  const [holdData, setHoldData] = useState(location.state?.holdData || null);
  const [loadingHold, setLoadingHold] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  // const [captchaToken, setCaptchaToken] = useState(null);
  const payButtonRef = React.useRef(null);
  // const recaptchaRef = React.useRef(null);
  
  // Se obtendrán del holdData para mayor fiabilidad
  const [show, setShow] = useState(location.state?.show || null);
  const [event, setEvent] = useState(location.state?.event || null);
  
  const holdId = holdIdParam || location.state?.holdId || holdData?.holdId;
  
  // Cargar datos del hold al montar el componente
  useEffect(() => {
    const loadHoldData = async () => {
      try {
        setLoadingHold(true);
        if (!holdId) {
          message.error('No se encontró el ID de la reserva.');
          setTimeout(() => navigate('/events'), 3000);
          return;
        }
        
        const response = await holdsApi.getHold(holdId);
        setHoldData(response);

        // Asegurar que show y event estén seteados si vienen en la respuesta
        if (response.show) setShow(response.show);
        if (response.event) setEvent(response.event);
        
        if (response.expiresAt || response.expires_at) {
          const expiresAt = new Date(response.expiresAt || response.expires_at);
          const now = new Date();
          const diffMs = expiresAt - now;
          setTimeLeft(Math.max(0, Math.floor(diffMs / 1000)));
        }

        // RECOVERY: Check if there is a pending order for this hold
        // This is crucial for users returning from failed payments
        const storedOrderId = localStorage.getItem('lastOrderId');
        if (storedOrderId) {
          // Optional: Verify if this order belongs to this hold or user
          // For now, we assume if they are on this checkout page, they might want to pay this order
          console.log('Found stored orderId:', storedOrderId);
        }

      } catch (error) {
        console.error('❌ Error cargando hold:', error);
        // Si el error es porque el hold ya fue usado (HoldAlreadyUsed), 
        // podría ser que ya existe una orden. Intentar recuperar.
        if (error.response?.data?.error === 'HoldAlreadyUsed' || error.message?.includes('HoldAlreadyUsed')) {
             message.warning('Esta reserva ya fue procesada. Verificando orden...');
             // Aquí podríamos redirigir a una página de "Pagar Orden" si tuviéramos el ID
             // O intentar buscar la orden por holdId si el backend lo permite
        } else {
            message.error('No se pudo cargar la información de la reserva.');
            setTimeout(() => navigate('/'), 3000);
        }
      } finally {
        setLoadingHold(false);
      }
    };

    if (holdId) {
      // Siempre cargar datos frescos del backend para asegurar consistencia
      loadHoldData();
    }
  }, [holdId, navigate]);

  // Load saved form data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_FORM_KEY);
      if (saved) {
        const savedData = JSON.parse(saved);
        // Only use saved data if user doesn't have data already
        if (!user?.email) {
          form.setFieldsValue({
            name: savedData.name,
            surname: savedData.surname,
            email: savedData.email,
            phone: savedData.phone,
            areaCode: savedData.areaCode,
            idType: savedData.idType || 'DNI',
            idNumber: savedData.idNumber
          });
        }
      }
    } catch (e) {
      console.warn('Could not load saved form data:', e);
    }
  }, [form, user]);

  // Save form data to localStorage on change
  const handleFormValuesChange = (changedValues, allValues) => {
    try {
      localStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(allValues));
    } catch (e) {
      console.warn('Could not save form data:', e);
    }
  };

  // Handler for sticky bar pay button - scrolls to form and triggers validation
  const handleStickyPayClick = () => {
    form.validateFields()
      .then(() => {
        // Scroll to payment button and click it
        if (payButtonRef.current) {
          payButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Trigger the MercadoPago button click after scroll
          setTimeout(() => {
            const mpButton = payButtonRef.current?.querySelector('button');
            if (mpButton) mpButton.click();
          }, 500);
        }
      })
      .catch(() => {
        // Scroll to first error field
        const firstError = document.querySelector('.ant-form-item-has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
  };

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

  // Calcular totales (Memoized)
  const { subtotal, serviceCharge, discountAmount, total } = useMemo(() => {
    if (!holdData) return { subtotal: 0, serviceCharge: 0, discountAmount: 0, total: 0 };

    const totalCents = holdData.totalCents || holdData.total_cents || 0;
    if (!totalCents) return { subtotal: 0, serviceCharge: 0, discountAmount: 0, total: 0 };

    const subtotalCalc = totalCents / 100;
    const serviceChargeCalc = Math.round(subtotalCalc * 0.15); 
    const discountAmountCalc = appliedDiscount?.discountAmount || 0;
    const totalCalc = (subtotalCalc + serviceChargeCalc) - discountAmountCalc;

    return { 
      subtotal: subtotalCalc, 
      serviceCharge: serviceChargeCalc, 
      discountAmount: discountAmountCalc, 
      total: totalCalc 
    };
  }, [holdData, appliedDiscount]);

  const getPayerInfo = () => {
    const formValues = form.getFieldsValue();
    return {
      name: formValues.name || user?.name?.split(' ')[0],
      surname: formValues.surname || user?.name?.split(' ').slice(1).join(' '),
      email: formValues.email || user?.email,
      phone: formValues.phone,
      areaCode: formValues.areaCode,
      idType: formValues.idType || 'DNI',
      idNumber: formValues.idNumber
    };
  };

  const handlePaymentError = (error) => {
    console.error('❌ Error en pago:', error);
    if (error.response?.status === 401 || error.status === 401) {
      setTimeout(() => navigate('/login'), 2000);
    } else if (error.response?.status === 409 || error.status === 409) {
      message.error('Conflicto con la reserva. Por favor intenta nuevamente.', 4);
      setTimeout(() => navigate(-1), 1500);
    } else if (error.response?.status === 403 || error.status === 403) {
      // SaleNotStarted or other forbidden errors
      const msg = error.response?.data?.message || 'No tienes permiso para realizar esta acción.';
      message.error(msg, 5);
      setTimeout(() => navigate('/events'), 2000);
    } else {
      message.error('Error al procesar el pago. Intenta nuevamente.', 4);
    }
  };

  if (loadingHold) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Preparando tu compra...</Text>
      </div>
    );
  }

  if (!holdData) return null;

  return (
    <div className="fade-in" style={{ padding: '24px', paddingBottom: screens.xs ? '100px' : '24px', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header Steps */}
      <div style={{ marginBottom: '32px' }}>
        <Steps 
          current={2} 
          labelPlacement={screens.xs ? "vertical" : "horizontal"}
          size={screens.xs ? "small" : "default"}
          items={[
            { title: screens.xs ? null : 'Selección', icon: <ShoppingCartOutlined /> },
            { title: screens.xs ? null : 'Revisión', icon: <CheckCircleOutlined /> },
            { title: screens.xs ? null : 'Pago', icon: <CreditCardOutlined /> },
          ]}
          style={{
            padding: screens.xs ? '16px' : '24px',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      {/* Mobile Order Summary Collapsible */}
      {screens.xs && (
        <div style={{ marginBottom: 24 }}>
          <div 
            className="glass-card"
            onClick={() => setSummaryOpen(!summaryOpen)}
            style={{ 
              padding: '16px', 
              borderRadius: 12, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <Space>
              {/* <ShoppingCartOutlined style={{ color: '#667eea' }} /> */}
              <Text strong>
                {summaryOpen ? 'Ocultar Resumen' : 'Ver Resumen de Compra'}
              </Text>
            </Space>
            <Space>
              <Text strong style={{ color: '#52c41a' }}>${total.toLocaleString('es-AR')}</Text>
              {summaryOpen ? <UpOutlined /> : <DownOutlined />}
            </Space>
          </div>
          
          {summaryOpen && (
            <div className="fade-in-up" style={{ marginTop: 12 }}>
               <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px' }}>
                  <OrderSummary 
                    event={event}
                    show={show}
                    seats={holdData?.items || holdData?.seats || []}
                    holdData={holdData}
                    subtotal={subtotal}
                    serviceCharge={serviceCharge}
                    discountAmount={discountAmount}
                    total={total}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Row gutter={[32, 32]}>
        {/* Left Column: Payment Form */}
        <Col xs={24} lg={14} order={2} lgOrder={1}>
          <div className="glass-card" style={{ padding: '32px' }}>
            <Title level={3} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
              {/* <LockOutlined style={{ marginRight: '12px', color: '#52c41a' }} /> */}
              Datos de Facturación
            </Title>
            
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleFormValuesChange}
              initialValues={{
                email: user?.email,
                name: user?.name?.split(' ')[0],
                surname: user?.name?.split(' ').slice(1).join(' '),
                idType: 'DNI'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre" name="name" rules={[{ required: true, message: 'Requerido' }]}>
                    <Input placeholder="Juan" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Apellido" name="surname" rules={[{ required: true, message: 'Requerido' }]}>
                    <Input placeholder="Pérez" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="tu@email.com" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Cód. Área" name="areaCode" rules={[{ required: true }]}>
                    <Input placeholder="11" maxLength={4} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Teléfono" name="phone" rules={[{ required: true }]}>
                    <Input placeholder="12345678" maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Tipo Doc." name="idType" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value="DNI">DNI</Select.Option>
                      <Select.Option value="CI">CI</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Número" name="idNumber" rules={[{ required: true }]}>
                    <Input placeholder="12345678" maxLength={8} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Alert
                message="Pago Seguro"
                description="Tus datos están protegidos. Serás redirigido a Mercado Pago para completar la transacción."
                type="success"
                showIcon
                icon={<SafetyCertificateOutlined />}
                style={{ marginBottom: '24px', background: 'rgba(82, 196, 26, 0.1)', border: '1px solid #b7eb8f' }}
              />

              {/* Cloudflare Turnstile - TEMPORALMENTE DESACTIVADO */}
              {/* <Turnstile
                ref={recaptchaRef}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => {
                  setCaptchaToken(null);
                  message.error('Error al verificar Turnstile. Intenta nuevamente.');
                }}
                onExpire={() => setCaptchaToken(null)}
              /> */}

              <Form.Item style={{ marginBottom: 0 }}>
                <div ref={payButtonRef}>
                  <MercadoPagoButton
                    holdId={holdId}
                    totalAmount={total}
                    discountCode={appliedDiscount?.code}
                    discountAmount={discountAmount}
                    onError={handlePaymentError}
                    form={form}
                    onLoadingChange={setPaymentLoading}
                    // captchaToken={captchaToken}
                  />
                </div>
              </Form.Item>
            </Form>
          </div>
        </Col>

        {/* Right Column: Summary & Discount */}
        <Col xs={24} lg={10} order={1} lgOrder={2}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Timer Card - REMOVED for mobile cleanliness request */}
            {/* 
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', borderLeft: '4px solid #faad14' }}>
              <Text type="secondary">Tiempo restante para completar la compra</Text>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#faad14', marginTop: '8px' }}>
                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
            */}

            {/* Order Summary (Desktop only or if not xs) */}
            {!screens.xs && (
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Title level={4} style={{ margin: 0 }}>Resumen de Compra</Title>
                </div>
                <div style={{ padding: '24px' }}>
                  <OrderSummary 
                    event={event}
                    show={show}
                    seats={holdData?.items || holdData?.seats || []}
                    holdData={holdData}
                    subtotal={subtotal}
                    serviceCharge={serviceCharge}
                    discountAmount={discountAmount}
                    total={total}
                  />
                </div>
              </div>
            )}

            {/* Discount Code */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <DiscountCodeAdvanced
                orderTotal={Math.round(subtotal * 100)} // IMPORTANTE: El descuento se calcula solo sobre el subtotal (sin service charge)
                // Usar IDs del holdData como fuente de verdad
                eventId={holdData?.eventId || event?.id}
                showId={holdData?.showId || show?.id}
                onDiscountApplied={setAppliedDiscount}
                onDiscountRemoved={() => setAppliedDiscount(null)}
                userId={user?.id}
              />
            </div>


          </Space>
        </Col>
      </Row>

      {/* Sticky Mobile Total Bar */}
      {screens.xs && (
        <StickyMobileTotalBar
          total={total}
          onPayClick={handleStickyPayClick}
          loading={paymentLoading}
        />
      )}
    </div>
  );
}
