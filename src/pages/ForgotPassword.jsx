import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authApi } from '../services/apiService';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // TODO: Implementar endpoint en backend
      // await authApi.forgotPassword(values.email);
      
      // Simulación temporal
      setEmail(values.email);
      setEmailSent(true);
      message.success('Email enviado correctamente');
    } catch (error) {
      console.error('Error:', error);
      message.error(error.response?.data?.message || 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
            status="success"
            title="Email Enviado"
            subTitle={
              <Space direction="vertical" size="small">
                <Text>
                  Hemos enviado un enlace de recuperación a:
                </Text>
                <Text strong>{email}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Revisá tu bandeja de entrada y seguí las instrucciones para restablecer tu contraseña.
                </Text>
              </Space>
            }
            extra={[
              <Link to="/login" key="login">
                <Button type="primary" size="large">
                  Volver al Login
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
              ¿Olvidaste tu contraseña?
            </Title>
            <Text type="secondary">
              Ingresá tu email y te enviaremos un enlace para restablecerla
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Ingresá tu email' },
                { type: 'email', message: 'Email inválido' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="tu@email.com"
                autoComplete="email"
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
                Enviar Enlace de Recuperación
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login">
              <Button type="link" icon={<ArrowLeftOutlined />}>
                Volver al Login
              </Button>
            </Link>
          </div>

        </Space>
      </Card>
    </div>
  );
}
