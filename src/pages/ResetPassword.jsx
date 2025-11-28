import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Result, Alert } from 'antd';
import { LockOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/apiService';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

/**
 * NOTA: Este componente se mantiene por compatibilidad con enlaces antiguos.
 * El nuevo sistema de recuperación usa códigos de 6 dígitos en /forgot-password
 */

export default function ResetPassword() {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [verifyingToken, setVerifyingToken] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    console.log('=== RESET PASSWORD PAGE ===');
    console.log('URL completa:', window.location.href);
    console.log('Search params:', searchParams.toString());
    console.log('Token extraído:', token);
    
    // Verificar que el token existe
    if (!token) {
      console.error('ERROR: Token no encontrado en URL');
      setValidToken(false);
      setVerifyingToken(false);
      message.error('Token de recuperación no válido');
      return;
    }
    
    console.log('Token válido, mostrando formulario');

    // Verificar token con el backend (opcional)
    const verifyToken = async () => {
      try {
        // Puedes agregar un endpoint para verificar el token
        // await authApi.verifyResetToken(token);
        setValidToken(true);
      } catch (error) {
        console.error('Error verificando token:', error);
        setValidToken(false);
        message.error('El enlace de recuperación ha expirado o no es válido');
      } finally {
        setVerifyingToken(false);
      }
    };

    // Por ahora solo verificamos que existe
    setVerifyingToken(false);
  }, [token]);

  const handleSubmit = async (values) => {
    console.log('=== RESET PASSWORD SUBMIT ===');
    console.log('Token:', token);
    console.log('Nueva contraseña:', values.password ? '***' : 'undefined');
    console.log('Confirmar contraseña:', values.confirmPassword ? '***' : 'undefined');

    if (!token) {
      console.error('ERROR: Token no válido');
      message.error('Token no válido');
      return;
    }

    setLoading(true);
    try {
      console.log('Llamando a authApi.resetPassword...');
      const response = await authApi.resetPassword({
        token: token,
        newPassword: values.password
      });
      console.log('Respuesta del backend:', response);
      
      setSuccess(true);
      message.success('Contraseña actualizada correctamente');
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        console.log('Redirigiendo a /customerlogin');
        navigate('/customerlogin');
      }, 3000);
    } catch (error) {
      console.error('ERROR al restablecer contraseña:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      message.error(error.response?.data?.message || error.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24
      }}>
        <Card style={{ maxWidth: 450, width: '100%', borderRadius: 16 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text>Verificando enlace de recuperación...</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24
      }}>
        <Card style={{ maxWidth: 500, width: '100%', borderRadius: 16 }}>
          <Result
            status="error"
            title="Enlace Inválido"
            subTitle="El enlace de recuperación ha expirado o no es válido. Por favor, solicitá uno nuevo."
            extra={[
              <Link to="/forgot-password" key="forgot">
                <Button type="primary" size="large">
                  Solicitar Nuevo Enlace
                </Button>
              </Link>,
              <Link to="/customerlogin" key="login">
                <Button size="large">
                  Volver al Login
                </Button>
              </Link>
            ]}
          />
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24
      }}>
        <Card style={{ maxWidth: 500, width: '100%', borderRadius: 16 }}>
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            status="success"
            title="Contraseña Actualizada"
            subTitle="Tu contraseña ha sido restablecida correctamente. Serás redirigido al login en unos segundos."
            extra={[
              <Link to="/customerlogin" key="login">
                <Button type="primary" size="large">
                  Ir al Login
                </Button>
              </Link>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24
    }}>
      <Card style={{ maxWidth: 450, width: '100%', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          <div style={{ textAlign: 'center' }}>
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
              Restablecer Contraseña
            </Title>
            <Text type="secondary">
              Ingresá tu nueva contraseña
            </Text>
          </div>

          {/* Aviso sobre el nuevo sistema */}
          <Alert
            message="Sistema Actualizado"
            description={
              <span>
                A partir de ahora usamos códigos de 6 dígitos para mayor seguridad.{' '}
                <Link to="/forgot-password" style={{ fontWeight: 600 }}>
                  Probá el nuevo sistema
                </Link>
              </span>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="password"
              label="Nueva Contraseña"
              rules={[
                { required: true, message: 'Ingresá tu nueva contraseña' },
                { min: 6, message: 'Mínimo 6 caracteres' }
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirmar Contraseña"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Confirmá tu contraseña' },
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
                prefix={<LockOutlined />}
                placeholder="Repetí tu contraseña"
                autoComplete="new-password"
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
                Restablecer Contraseña
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Link to="/customerlogin">
              <Button type="link">
                Volver al Login
              </Button>
            </Link>
          </div>

        </Space>
      </Card>
    </div>
  );
}
