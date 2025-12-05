import React, { useState, useRef } from 'react';
import { Card, Typography, Form, Input, Button, Space, message, Alert, Divider, Checkbox } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/VibraTicketLogo2.png';
import GoogleAuthButton from '../components/GoogleAuthButton';
import FacebookAuthButton from '../components/FacebookAuthButton';
// import Turnstile from '../components/Turnstile';

const { Title, Text } = Typography;

export default function CustomerLogin() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [captchaToken, setCaptchaToken] = useState(null);
  // const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Obtener la URL de retorno (si el usuario fue redirigido aquí)
  const from = location.state?.from || '/';

  const handleSubmit = async (values) => {
    // Turnstile temporalmente desactivado
    /* if (!captchaToken) {
      message.error('Por favor completa el reCAPTCHA');
      return;
    } */

    setLoading(true);
    setError(null);
    
    try {
      // Llamar a la API de autenticación
      const user = await login({
        email: values.email,
        password: values.password,
        // captchaToken: captchaToken
      });
      
      // Mostrar mensaje de éxito
      message.success(`¡Bienvenido ${user.name || user.email}!`);
      
      // Redirigir según el rol
      // Redirigir a donde venía o al inicio
      navigate(from);
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Mostrar error específico
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al iniciar sesión. Verifica tus credenciales.';
      
      setError(errorMessage);
      message.error(errorMessage);
      
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Turnstile handlers desactivados
  /* const handleTurnstileSuccess = (token) => {
    setCaptchaToken(token);
  };

  const handleTurnstileError = () => {
    setCaptchaToken(null);
    message.error('Error al verificar Turnstile. Intenta nuevamente.');
  };

  const handleTurnstileExpire = () => {
    setCaptchaToken(null);
  }; */

  return (
    <>
      {/* Header con botón de volver - solo en mobile */}
      <div style={{
        display: 'none',
        '@media (maxWidth: 768px)': {
          display: 'block'
        }
      }}>
        <div className="mobile-login-header" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'white',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 1000
        }}>
          <Button 
            type="text" 
            icon={<span style={{ fontSize: 20 }}>←</span>}
            onClick={() => navigate(from)}
            style={{ marginRight: 16 }}
          >
            Volver
          </Button>
          <img src={logo} alt="VibraTicket" style={{ height: 32 }} />
        </div>
      </div>

      {/* Contenedor principal */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '40px'
      }}
      className="login-container"
      >
        <style>{`
          @media (max-width: 768px) {
            .login-container {
              padding: 0 !important;
              padding-top: 60px !important;
              background: white !important;
            }
            .login-card {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
            }
            .mobile-login-header {
              display: flex !important;
            }
          }
        `}</style>
        
        <Card 
          className="login-card"
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e8e8e8'
          }}
        >
          {/* Logo y Título - ocultar logo en mobile porque está en el header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img 
              src={logo} 
              alt="VibraTicket" 
              className="desktop-logo"
              style={{ 
                height: 50,
                width: 'auto',
                marginBottom: 24
              }} 
            />
            <style>{`
              @media (max-width: 768px) {
                .desktop-logo {
                  display: none;
                }
              }
            `}</style>
            <Title level={2} style={{ 
              marginBottom: 8,
              fontWeight: 600,
              color: '#1a1a1a'
            }}>
              Iniciar Sesión
            </Title>
            <Text style={{ color: '#666', fontSize: '14px' }}>
              Ingresá a tu cuenta para comprar entradas
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            {error && (
              <Alert
                message="Error de autenticación"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Por favor ingresá tu email' },
                { type: 'email', message: 'Email inválido' }
              ]}
            >
              <Input 
                placeholder="tu@email.com"
                style={{ 
                  borderRadius: 8,
                  padding: '10px 12px'
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333' }}>Contraseña</span>}
              name="password"
              rules={[{ required: true, message: 'Por favor ingresá tu contraseña' }]}
            >
              <Input.Password 
                placeholder="Ingresá tu contraseña"
                style={{ 
                  borderRadius: 8,
                  padding: '10px 12px'
                }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
                <Checkbox>Recordarme</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" style={{ color: '#1890ff' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Cloudflare Turnstile - TEMPORALMENTE DESACTIVADO */}
            {/* <Turnstile
              ref={recaptchaRef}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            /> */}

            <Form.Item style={{ marginBottom: 20 }}>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  background: '#1890ff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 500,
                  height: 44,
                  fontSize: 15
                }}
              >
                Iniciar Sesión
              </Button>
            </Form.Item>

            {/* Divider para métodos alternativos */}
            <Divider style={{ margin: '20px 0 16px 0' }}>
              <Text style={{ color: '#999', fontSize: '13px' }}>O ingresá con</Text>
            </Divider>

            {/* Botones de OAuth - Google y Facebook */}
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <GoogleAuthButton 
                text="Continuar con Google"
                onSuccess={(user) => {
                  // El componente ya maneja la navegación
                  console.log('✅ Login con Google exitoso:', user);
                }}
                onError={(error) => {
                  console.error('❌ Error en login con Google:', error);
                }}
              />
              
              <FacebookAuthButton 
                text="Continuar con Facebook"
                onSuccess={(user) => {
                  // El componente ya maneja la navegación
                  console.log('✅ Login con Facebook exitoso:', user);
                }}
                onError={(error) => {
                  console.error('❌ Error en login con Facebook:', error);
                }}
              />
            </Space>

            {/* Links de registro y admin */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                ¿No tenés cuenta?{' '}
                <Link to="/register" style={{ color: '#1890ff', fontWeight: 500 }}>
                  Registrate
                </Link>
              </Text>
            </div>
          </Form>
        </Card>

        {/* Footer discreto - solo en desktop */}
        <div className="desktop-footer" style={{
          position: 'fixed',
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: 'center'
        }}>
          <style>{`
            @media (max-width: 768px) {
              .desktop-footer {
                display: none;
              }
            }
          `}</style>
          <Text style={{ color: '#999', fontSize: '12px' }}>
            © {new Date().getFullYear()} VibraTicket
          </Text>
        </div>
      </div>
    </>
  );
}
