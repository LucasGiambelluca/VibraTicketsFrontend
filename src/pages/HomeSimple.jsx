import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export default function HomeSimple() {
  return (
    <div style={{ 
      padding: '100px 24px',
      textAlign: 'center',
      minHeight: '100vh',
      background: '#f5f7fa'
    }}>
      <Title level={1}>VibraTicket Funcionando ✅</Title>
      <p>Si ves este mensaje, el sistema está cargando correctamente.</p>
      <p>Versión: Test de Diagnóstico</p>
    </div>
  );
}
