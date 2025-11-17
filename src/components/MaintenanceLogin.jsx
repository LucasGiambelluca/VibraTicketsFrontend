import React, { useState } from 'react';
import { Card, Input, Button, Typography, message, Space } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

const MAINTENANCE_PASSWORD = 'vibratickets2025';

export default function MaintenanceLogin({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simular pequeño delay para seguridad
    setTimeout(() => {
      if (password === MAINTENANCE_PASSWORD) {
        // Guardar en localStorage
        localStorage.setItem('maintenance_auth', 'true');
        message.success('✅ Acceso autorizado');
        onAuthenticated();
      } else {
        message.error('❌ Contraseña incorrecta');
        setPassword('');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          {/* Logo */}
          <div>
            <img 
              src={logo} 
              alt="VibraTicket" 
              style={{ 
                height: 80,
                width: 'auto',
                marginBottom: 16
              }} 
            />
          </div>

          {/* Icono de Mantenimiento */}
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            <LockOutlined style={{ fontSize: 40, color: 'white' }} />
          </div>

          {/* Título */}
          <div>
            <Title level={2} style={{ 
              marginBottom: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Sitio en Mantenimiento
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Estamos preparando algo especial para vos
            </Text>
          </div>

          {/* Mensaje */}
          <Card 
            size="small" 
            style={{ 
              background: '#f0f5ff',
              border: '1px solid #adc6ff',
              borderRadius: 8
            }}
          >
            <Text style={{ fontSize: 14 }}>
              🚧 El sitio está temporalmente en mantenimiento.<br/>
              <strong>Ingresá la contraseña de acceso</strong> para continuar.
            </Text>
          </Card>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: '#667eea' }} />}
                placeholder="Contraseña de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  borderRadius: 8,
                  fontSize: 15
                }}
                autoFocus
              />

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                disabled={!password}
                block
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                🔓 Acceder al Sitio
              </Button>
            </Space>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              © {new Date().getFullYear()} VibraTicket | Todos los derechos reservados
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
