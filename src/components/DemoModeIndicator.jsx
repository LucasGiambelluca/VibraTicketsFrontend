import React, { useState } from 'react';
import { Card, Typography, Button, Space, Tag } from 'antd';
import { ExperimentOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function DemoModeIndicator({ show = true, onClose }) {
  const [visible, setVisible] = useState(show);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return (
    <Card
      size="small"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 320,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #d9d9d9'
      }}
      actions={[
        <Button 
          key="close" 
          type="text" 
          size="small" 
          icon={<CloseOutlined />}
          onClick={handleClose}
        >
          Cerrar
        </Button>
      ]}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExperimentOutlined style={{ color: '#1890ff' }} />
          <Tag color="blue">MODO DEMO</Tag>
        </div>
        
        <Text style={{ fontSize: '12px', color: '#666' }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Mostrando datos de ejemplo porque el backend no está disponible.
        </Text>
        
        <Text style={{ fontSize: '11px', color: '#999' }}>
          Para usar datos reales, inicia el backend en http://localhost:3000
        </Text>
      </Space>
    </Card>
  );
}
