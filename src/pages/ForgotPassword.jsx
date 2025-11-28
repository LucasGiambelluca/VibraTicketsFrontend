import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Alert, Steps } from 'antd';
import { 
  MailOutlined, ArrowLeftOutlined, LockOutlined, 
  CheckCircleOutlined, SafetyOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authApi } from '../services/apiService';
import CodeInput from '../components/CodeInput';
import CountdownTimer from '../components/CountdownTimer';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * Flujo completo de recuperación de contraseña con códigos de 6 dígitos
 * Pasos:
 * 1. Ingresar email
 * 2. Ingresar código (6 dígitos) y nueva contraseña
 * 3. Confirmación exitosa
 */
export default function ForgotPassword() {
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  // Estados del flujo
  const [step, setStep] = useState(0); // 0: email, 1: código+password, 2: éxito
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [codeExpired, setCodeExpired] = useState(false);

  // Ofuscar email para mostrar
  const obfuscateEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    return `${local[0]}****@${domain}` ;
  };

  // Paso 1: Solicitar código
  const handleRequestCode = async (values) => {
    setLoading(true);
    
    try {
      console.log('Solicitando código de recuperación para:', values.email);
      const response = await authApi.requestPasswordReset(values.email);
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        setEmail(values.email);
        setStep(1);
        setTimeRemaining(response.expiresIn || 60);
        setCodeExpired(false);
        message.success('Código enviado a tu email');
      } else {
        message.error(response.message || 'Error al solicitar el código');
      }
    } catch (error) {
      console.error('Error al solicitar código:', error);
      const errorMsg = error.message?.includes('Backend no disponible') 
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.'
        : error.response?.data?.message || error.message || 'Error al solicitar el código';
      message.error(errorMsg, 5);
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Restablecer contraseña con código
  const handleResetPassword = async (values) => {
    if (code.length !== 6) {
      message.error('El código debe tener 6 dígitos');
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      message.error('Las contraseñas no coinciden');
      return;
    }

    if (codeExpired) {
      message.error('El código ha expirado. Solicitá uno nuevo.');
      return;
    }

    setLoading(true);

    try {
      console.log('Restableciendo contraseña...');
      const response = await authApi.resetPasswordWithCode(email, code, values.newPassword);
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        message.success('¡Contraseña restablecida exitosamente!');
        setStep(2);
      } else {
        message.error(response.message || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      const errorMsg = error.message?.includes('Backend no disponible')
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.'
        : error.response?.data?.message || error.message || 'Error al restablecer la contraseña';
      message.error(errorMsg, 5);
    } finally {
      setLoading(false);
    }
  };

  // Manejar expiración del código
  const handleCodeExpired = () => {
    setCodeExpired(true);
    message.warning('El código ha expirado. Solicitá uno nuevo.');
  };

  // Volver al paso 1 para solicitar nuevo código
  const handleRequestNewCode = () => {
    setStep(0);
    setCode('');
    setCodeExpired(false);
    passwordForm.resetFields();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24
    }}>
      <Card style={{ 
        maxWidth: step === 1 ? 600 : 500, 
        width: '100%', 
        borderRadius: 16, 
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)' 
      }}>
        {/* Logo y Título */}
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
            Recuperar Contraseña
          </Title>
        </div>

        {/* Progress Steps */}
        <Steps current={step} style={{ marginBottom: 32 }}>
          <Step title="Email" icon={<MailOutlined />} />
          <Step title="Verificación" icon={<SafetyOutlined />} />
          <Step title="Listo" icon={<CheckCircleOutlined />} />
        </Steps>

        {/* PASO 1: Ingresar Email */}
        {step === 0 && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
              Ingresá tu email y te enviaremos un código de verificación
            </Text>

            <Form
              form={emailForm}
              layout="vertical"
              onFinish={handleRequestCode}
              size="large"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Ingresá tu email' },
                  { type: 'email', message: 'Email inválido' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Enviar Código
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link to="/customerlogin">
                <Button type="link" icon={<ArrowLeftOutlined />}>
                  Volver al Login
                </Button>
              </Link>
            </div>
          </Space>
        )}

        {/* PASO 2: Ingresar Código y Nueva Contraseña */}
        {step === 1 && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="Código Enviado"
              description={
                <div>
                  <Text>Revisa tu email <Text strong>{obfuscateEmail(email)}</Text></Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    El código tiene 6 dígitos y expira en 60 segundos
                  </Text>
                </div>
              }
              type="info"
              showIcon
            />

            {/* Countdown Timer */}
            <CountdownTimer
              initialSeconds={60}
              onExpire={handleCodeExpired}
              onTick={(remaining) => setTimeRemaining(remaining)}
            />

            {/* Input de Código */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8, textAlign: 'center' }}>
                Ingresá el código de 6 dígitos:
              </Text>
              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={(completedCode) => {
                  console.log('Código completo:', completedCode);
                  message.info('Código ingresado, ahora definí tu nueva contraseña');
                }}
                disabled={codeExpired}
              />
            </div>

            {/* Formulario de Nueva Contraseña */}
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleResetPassword}
              size="large"
            >
              <Form.Item
                name="newPassword"
                label="Nueva Contraseña"
                rules={[
                  { required: true, message: 'Ingresá tu nueva contraseña' },
                  { min: 6, message: 'Mínimo 6 caracteres' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mínimo 6 caracteres"
                  disabled={code.length !== 6 || codeExpired}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirmar Contraseña"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Confirmá tu contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Repetí tu contraseña"
                  disabled={code.length !== 6 || codeExpired}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  disabled={code.length !== 6 || codeExpired}
                  style={{
                    background: code.length === 6 && !codeExpired
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#d9d9d9',
                    border: 'none',
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Cambiar Contraseña
                </Button>
              </Form.Item>
            </Form>

            {/* Opciones adicionales */}
            <div style={{ textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              {codeExpired ? (
                <Button type="link" onClick={handleRequestNewCode}>
                  Solicitar nuevo código
                </Button>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ¿No recibiste el código?{' '}
                  <Button type="link" size="small" onClick={handleRequestNewCode}>
                    Reenviar
                  </Button>
                </Text>
              )}
            </div>
          </Space>
        )}

        {/* PASO 3: Confirmación Exitosa */}
        {step === 2 && (
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ 
              fontSize: 64, 
              color: '#52c41a',
              marginBottom: 16
            }}>
              <CheckCircleOutlined />
            </div>
            
            <Title level={3} style={{ color: '#52c41a', marginBottom: 8 }}>
              ¡Contraseña Restablecida!
            </Title>
            
            <Paragraph type="secondary">
              Tu contraseña ha sido cambiada exitosamente.
              <br />
              Ya podés iniciar sesión con tu nueva contraseña.
            </Paragraph>

            <Link to="/customerlogin" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                block
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Ir al Login
              </Button>
            </Link>
          </Space>
        )}
      </Card>
    </div>
  );
}
