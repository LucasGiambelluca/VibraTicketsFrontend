import React, { useState, useRef } from 'react';
import { Card, Typography, Form, Input, Button, Checkbox, Space, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// TEMPORAL: reCAPTCHA deshabilitado hasta tener Site Key y backend configurado
// import ReCaptcha from '../components/ReCaptcha';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // TEMPORAL: Estados de reCAPTCHA deshabilitados
  // const [captchaToken, setCaptchaToken] = useState(null);
  // const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (values) => {
    // TEMPORAL: Validación de reCAPTCHA deshabilitada
    /* if (!captchaToken) {
      message.error('Por favor completa el reCAPTCHA');
      return;
    } */

    setLoading(true);
    setError(null);
    
    try {
      // // Llamar a la API real de autenticación
      const user = await login({
        email: values.email,
        password: values.password
        // TEMPORAL: captchaToken deshabilitado
        // captchaToken: captchaToken
      });
      
      // Mostrar mensaje de éxito
      message.success(`¡Bienvenido ${user.name || user.email}!`);
      
      // Redirigir según el rol del usuario
      if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Mostrar error específico
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al iniciar sesión. Verifica tus credenciales.';
      
      setError(errorMessage);
      message.error(errorMessage);
      
      // TEMPORAL: Reset de reCAPTCHA deshabilitado
      /* if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      } */
    } finally {
      setLoading(false);
    }
  };

  // reCAPTCHA temporalmente deshabilitado

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img 
            src={logo} 
            alt="VibraTicket" 
            style={{ 
              height: 60,
              width: 'auto',
              marginBottom: 16
            }} 
          />
          <Title level={2} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            Ingreso administradores
          </Title>
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
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Ingrese su email' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="admin@ticketera.com"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Ingrese su contraseña' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="••••••••"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>Recordarme</Checkbox>
          </Form.Item>

          {/* TEMPORAL: reCAPTCHA v2 deshabilitado */}
          {/* <ReCaptcha
            ref={recaptchaRef}
            onChange={handleCaptchaChange}
            onExpired={handleCaptchaExpired}
          /> */}

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                height: 48,
                fontSize: 16
              }}
            >
              Sign in
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size={8}>
              <Link to="/forgot-password" style={{ color: '#1890ff' }}>
                ¿Olvidaste tu contraseña?
              </Link>
              <Text type="secondary">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" style={{ color: '#1890ff' }}>
                  Regístrate
                </Link>
              </Text>
            </Space>
          </div>
        </Form>

      </Card>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
        textAlign: 'center'
      }}>
        <Text style={{ color: 'white', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} VibraTicket | Derechos Reservados
        </Text>
      </div>
    </div>
  );
}
