import React, { useState } from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useBackendConnection } from '../hooks/useBackendConnection';

export default function BackendStatusBanner() {
  const [showBanner, setShowBanner] = useState(true);
  const { isConnected, isChecking, lastCheck, checkConnection } = useBackendConnection();

  // No mostrar banner si está conectado o si el usuario lo cerró
  if (!showBanner || isConnected) {
    return null;
  }

  const getBannerProps = () => {
    if (isChecking) {
      return {
        type: 'info',
        message: 'Verificando conexión con el backend...',
        showIcon: true
      };
    }

    return {
      type: 'warning',
      message: 'Backend no disponible',
      description: `No se puede conectar con el servidor backend en http://localhost:3000. 
                   La aplicación mostrará datos de ejemplo. 
                   ${lastCheck ? `Última verificación: ${lastCheck.toLocaleTimeString()}` : ''}`,
      showIcon: true,
      action: (
        <div>
          <Button 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={checkConnection}
            loading={isChecking}
            style={{ marginRight: 8 }}
          >
            Reintentar
          </Button>
          <Button 
            size="small" 
            icon={<CloseOutlined />} 
            onClick={() => setShowBanner(false)}
          >
            Ocultar
          </Button>
        </div>
      )
    };
  };

  return (
    <Alert
      {...getBannerProps()}
      style={{ 
        margin: 0,
        borderRadius: 0,
        borderLeft: 0,
        borderRight: 0,
        borderTop: 0
      }}
      closable={false}
    />
  );
}
