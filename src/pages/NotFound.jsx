import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="La página que buscás no existe."
        extra={<Button type="primary" onClick={() => navigate('/')}>Volver al inicio</Button>}
      />
    </div>
  );
}
