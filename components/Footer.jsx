import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { Link as RouterLink } from 'react-router-dom';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

export default function Footer() {
  return (
    <AntFooter style={{
      background: '#F9FAFB',
      color: '#6B7280',
      padding: '24px',
      textAlign: 'center',
      borderTop: '1px solid #E5E7EB'
    }}>
      <Space direction="vertical" size="middle">
        <Space split={<Text style={{ margin: '0 8px' }}>•</Text>}>
          <RouterLink to="/terms" style={{ color: 'inherit' }}>Términos y Condiciones</RouterLink>
          <RouterLink to="/privacy" style={{ color: 'inherit' }}>Política de Privacidad</RouterLink>
          <RouterLink to="/help" style={{ color: 'inherit' }}>Ayuda</RouterLink>
        </Space>
        <Text type="secondary">
          © {new Date().getFullYear()} RS Tickets. Todos los derechos reservados.
        </Text>
      </Space>
    </AntFooter>
  );
}
