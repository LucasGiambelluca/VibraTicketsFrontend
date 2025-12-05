import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Spin, Alert, Progress, Space, Button, Typography } from 'antd';
import { ticketsApi } from '../services/apiService';

const { Text } = Typography;

export default function TicketQR({ ticketId, ticketNumber }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ttl, setTtl] = useState(0);
  const [totalTtl, setTotalTtl] = useState(30);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Función para obtener el token actual
  const fetchToken = async () => {
    try {
      setLoading(true);
      // Usar el ID numérico del ticket (ticketId) para la API
      const response = await ticketsApi.getDynamicQR(ticketId);
      
      if (response.success || response.token) {
        setToken(response.token);
        setTtl(response.ttl || 30);
        setTotalTtl(30);
        setError(null);
      } else {
        throw new Error('No se pudo obtener el código seguro');
      }
    } catch (err) {
      console.error("Error fetching QR token", err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Efecto principal: Fetch inicial y polling
  useEffect(() => {
    fetchToken();
    
    // Refrescar cada 15 segundos (o cuando el TTL sea bajo)
    // El backend genera tokens válidos por 30s, refrescamos a la mitad para asegurar validez
    const interval = setInterval(fetchToken, 15000);
    
    return () => clearInterval(interval);
  }, [ticketId, refreshTrigger]);

  // Efecto secundario: Countdown local para UI
  useEffect(() => {
    const countdown = setInterval(() => {
      setTtl(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Alert
          message="Error de conexión"
          description={
            <Space direction="vertical">
              <Text type="secondary">{error}</Text>
              <Button size="small" onClick={() => setRefreshTrigger(prev => prev + 1)}>
                Reintentar
              </Button>
            </Space>
          }
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (!token && loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" tip={`Generando código seguro... (ID: ${ticketId})`} />
      </div>
    );
  }

  // El contenido del QR es un JSON string con la estructura solicitada
  const qrData = JSON.stringify({
    ticketNumber: ticketNumber,
    token: token,
    timestamp: Date.now()
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ 
        background: 'white', 
        padding: 16, 
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <QRCode 
          value={qrData}
          size={256}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </div>

      {/* Indicador de validez */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Progress 
          type="circle" 
          percent={(ttl / totalTtl) * 100} 
          width={32} 
          format={() => ''}
          strokeColor={{
            '0%': '#ff4d4f',
            '100%': '#52c41a',
          }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Actualizando en {ttl}s
        </Text>
      </div>
    </div>
  );
}
