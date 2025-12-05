import React, { useState, useRef } from 'react';
import { Card, Typography, Form, Input, Button, Space, message, Alert, Row, Col, Checkbox, Tooltip } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, IdcardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateDNI } from '../utils/validators';
// import Turnstile from '../components/Turnstile';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

export default function Register() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [captchaToken, setCaptchaToken] = useState(null);
  // const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (values) => {
    // Turnstile temporalmente desactivado
    /* if (!captchaToken) {
      message.error('Por favor completa el reCAPTCHA');
      return;
    } */

    setLoading(true);
    setError(null);
    
    try {
      const userData = {
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`,
        phone: values.phone,
        dni: values.dni,
        role: 'CUSTOMER',
        // captchaToken: captchaToken
      };
      
      // Llamar a la API real de registro
      const user = await register(userData);
      
      // Mostrar mensaje de éxito
      message.success('¡Cuenta creada exitosamente! Bienvenido ' + user.name);
      
      // Redirigir al home o dashboard
      navigate('/');
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      // Mostrar error específico
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al crear la cuenta. Intenta nuevamente.';
      
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
        <div className="mobile-register-header" style={{
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
            onClick={() => navigate('/login')}
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
      className="register-container"
      >
        <style>{`
          @media (max-width: 768px) {
            .register-container {
              padding: 0 !important;
              padding-top: 60px !important;
              background: white !important;
            }
            .register-row {
              padding: 16px !important;
            }
            .register-illustration {
              display: none !important;
            }
            .register-card {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
            }
            .mobile-register-header {
              display: flex !important;
            }
          }
        `}</style>
        
        <Row gutter={32} style={{ width: '100%', maxWidth: 1000 }} className="register-row">
        {/* Ilustración */}
        <Col xs={24} lg={12} className="register-illustration">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            minHeight: 400
          }}>
            <div style={{
              width: 300,
              height: 400,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Ilustración de mano con teléfono */}
              <div style={{
                fontSize: 120,
                transform: 'rotate(-15deg)',
                marginBottom: 40
              }}>
                📱
              </div>
              <div style={{
                position: 'absolute',
                bottom: 60,
                left: 60,
                right: 60,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: 16,
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ 
                  width: '100%', 
                  height: 8, 
                  background: 'rgba(255,255,255,0.3)', 
                  borderRadius: 4,
                  marginBottom: 8
                }} />
                <div style={{ 
                  width: '60%', 
                  height: 8, 
                  background: 'rgba(255,255,255,0.3)', 
                  borderRadius: 4,
                  marginBottom: 8
                }} />
                <div style={{ 
                  width: '80%', 
                  height: 8, 
                  background: 'rgba(255,255,255,0.3)', 
                  borderRadius: 4
                }} />
              </div>
            </div>
          </div>
        </Col>

        {/* Formulario */}
        <Col xs={24} lg={12}>
          <Card 
            className="register-card"
            style={{
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: 'none',
              height: 'fit-content'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img 
                src={logo} 
                alt="VibraTicket" 
                style={{ 
                  height: 50,
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
                Regístrate
              </Title>
              <Text type="secondary">
                Regístrate para acceder a nuestra plataforma de eventos
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
                  message="Error de registro"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(null)}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Nombre"
                    name="firstName"
                    rules={[{ required: true, message: 'Ingrese su nombre' }]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="Juan"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Apellido"
                    name="lastName"
                    rules={[{ required: true, message: 'Ingrese su apellido' }]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="Pérez"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Correo Electrónico"
                    name="email"
                    rules={[
                      { required: true, message: 'Ingrese su email' },
                      { type: 'email', message: 'Email inválido' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="juan@ejemplo.com"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Teléfono"
                    name="phone"
                    rules={[{ required: true, message: 'Ingrese su teléfono' }]}
                  >
                    <Input 
                      prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="+54 11 1234-5678"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* DNI - NUEVO CAMPO OBLIGATORIO */}
              <Form.Item
                label={
                  <span>
                    DNI{' '}
                    <Tooltip title="Documento Nacional de Identidad - Requerido para validar compras (máximo 5 boletos por evento)">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                name="dni"
                rules={[
                  { required: true, message: 'El DNI es obligatorio' },
                  {
                    validator: async (_, value) => {
                      if (!value) return;
                      const validation = validateDNI(value);
                      if (!validation.valid) {
                        throw new Error(validation.error);
                      }
                    }
                  }
                ]}
              >
                <Input 
                  prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="12345678"
                  maxLength={8}
                  style={{ borderRadius: 8 }}
                  onChange={(e) => {
                    // Solo permitir números
                    const value = e.target.value.replace(/\D/g, '');
                    form.setFieldsValue({ dni: value });
                  }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Contraseña"
                    name="password"
                    rules={[
                      { required: true, message: 'Ingrese su contraseña' },
                      { min: 8, message: 'Mínimo 8 caracteres' },
                      { 
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
                        message: 'Debe contener mayúscula, minúscula y número' 
                      }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="••••••••"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Confirmar Contraseña"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Confirme su contraseña' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Las contraseñas no coinciden'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="••••••••"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                name="terms" 
                valuePropName="checked"
                rules={[{ required: true, message: 'Debe aceptar los términos' }]}
              >
                <Checkbox>
                  Acepto los <Link to="/terms" style={{ color: '#1890ff' }}>Términos y Condiciones</Link>
                </Checkbox>
              </Form.Item>

              {/* Cloudflare Turnstile - TEMPORALMENTE DESACTIVADO */}
              {/* <Turnstile
                ref={recaptchaRef}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
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
                  Crear cuenta
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" style={{ color: '#1890ff' }}>
                    Inicia sesión
                  </Link>
                </Text>
              </div>
            </Form>

            {/* Social Login */}
            <div style={{ marginTop: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Text type="secondary">O regístrate con</Text>
              </div>
              <Row gutter={8}>
                <Col span={8}>
                  <Button 
                    block 
                    style={{ 
                      borderRadius: 8, 
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>📘</span>
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    block 
                    style={{ 
                      borderRadius: 8, 
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🔍</span>
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    block 
                    style={{ 
                      borderRadius: 8, 
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🍎</span>
                  </Button>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Footer - solo en desktop */}
      <div className="desktop-footer" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '12px 24px'
      }}>
        <style>{`
          @media (max-width: 768px) {
            .desktop-footer {
              display: none;
            }
          }
        `}</style>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Link to="/privacy" style={{ color: 'white', fontSize: '0.85rem' }}>
                Política de Privacidad
              </Link>
              <Link to="/terms" style={{ color: 'white', fontSize: '0.85rem' }}>
                Términos
              </Link>
              <Link to="/contact" style={{ color: 'white', fontSize: '0.85rem' }}>
                Contactanos
              </Link>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text style={{ color: 'white', fontSize: '0.85rem' }}>
                Redes Sociales
              </Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'white', fontSize: 16 }}>📘</span>
                <span style={{ color: 'white', fontSize: 16 }}>🐦</span>
                <span style={{ color: 'white', fontSize: 16 }}>📷</span>
                <span style={{ color: 'white', fontSize: 16 }}>💼</span>
              </div>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
    </>
  );
}
