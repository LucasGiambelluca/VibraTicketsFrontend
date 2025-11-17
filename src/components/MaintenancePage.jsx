import React from 'react';
import { Result, Typography, Space } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '60px 40px',
        maxWidth: 600,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Logo */}
          <div style={{ marginBottom: 24 }}>
            <img
              src={logo}
              alt="VibraTicket"
              style={{
                height: 120,
                width: 'auto',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'
              }}
            />
          </div>

          {/* Icono de mantenimiento */}
          <div style={{
            fontSize: 64,
            color: '#faad14',
            marginBottom: 16
          }}>
            <ToolOutlined />
          </div>

          {/* Título */}
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            Servicio en Mantenimiento
          </Title>

          {/* Descripción */}
          <Text style={{ fontSize: 16, color: '#666', display: 'block', marginTop: 16 }}>
            Estamos realizando tareas de mantenimiento para mejorar tu experiencia.
          </Text>

          <Text style={{ fontSize: 14, color: '#999', display: 'block' }}>
            Por favor, intenta nuevamente en unos minutos.
          </Text>

          {/* Información adicional */}
          <div style={{
            marginTop: 32,
            padding: 20,
            background: '#f5f5f5',
            borderRadius: 12,
            border: '1px solid #e8e8e8'
          }}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#333' }}>
              ¿Necesitas ayuda?
            </Text>
            <Text style={{ fontSize: 14, color: '#666' }}>
              Contactanos en: <a href="mailto:soporte@vibraticket.com">soporte@vibraticket.com</a>
            </Text>
          </div>
        </Space>
      </div>
    </div>
  );
}
