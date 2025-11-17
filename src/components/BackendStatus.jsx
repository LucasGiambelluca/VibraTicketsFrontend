import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { healthApi } from '../services/apiService';

const BackendStatus = () => {
  const [isConnected, setIsConnected] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkBackendStatus = async () => {
    setChecking(true);
    try {
      await healthApi.getHealth();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) return null;

  if (!isConnected) {
    return (
      <Alert
        message="Backend no disponible"
        description="El backend no está corriendo en http://localhost:3000. Se están mostrando datos de ejemplo."
        type="warning"
        showIcon
        style={{ margin: '16px 24px' }}
        action={
          <Button 
            size="small" 
            onClick={checkBackendStatus}
            loading={checking}
          >
            Verificar
          </Button>
        }
      />
    );
  }

  return (
    <Alert
      message="Backend conectado"
      description="Conectado exitosamente al backend."
      type="success"
      showIcon
      style={{ margin: '16px 24px' }}
      closable
    />
  );
};

export default BackendStatus;
