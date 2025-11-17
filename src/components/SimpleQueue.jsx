import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, Space } from 'antd';
import { ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Agregar animación pulse
const pulseKeyframes = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }
`;

// Inyectar los keyframes en el documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = pulseKeyframes;
  if (!document.head.querySelector('[data-pulse-animation]')) {
    styleSheet.setAttribute('data-pulse-animation', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default function SimpleQueue({ position, totalUsers, onComplete }) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [initialTotal, setInitialTotal] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Guardar el total inicial cuando entra por primera vez
  useEffect(() => {
    if (initialTotal === null && totalUsers > 0) {
      setInitialTotal(totalUsers);
    }
  }, [totalUsers, initialTotal]);

  // Calcular el progreso real basándose en el total inicial
  useEffect(() => {
    console.log('👥 Total users:', totalUsers, 'type:', typeof totalUsers);
    console.log('🎯 Initial total:', initialTotal);
    
    if (!position || !initialTotal || position <= 0 || initialTotal <= 0) {
      setDisplayProgress(0);
      return;
    }
    
    // ⭐ Usar el total INICIAL para el cálculo, no el actual
    // Si entraste en posición 130 de 130, y ahora estás en posición 117 de 117:
    // Progreso = (130 - 117) / 130 = 13/130 = 10%
    const realProgress = ((initialTotal - position) / initialTotal) * 100;
    // Asegurar que el progreso esté entre 0 y 100
    const clampedProgress = Math.max(0, Math.min(100, realProgress));
    setDisplayProgress(clampedProgress);
    
    // Si llega a 100% (posición 1), llamar a onComplete
    if (position <= 1 && onComplete) {
      setTimeout(() => onComplete(), 500);
    }
  }, [position, initialTotal, onComplete]);

  // 🔥 Countdown cuando estás en las últimas 10 posiciones
  useEffect(() => {
    if (position <= 10 && position > 0) {
      setCountdown(position);
      
      // Si estás en posición 10 o menos, iniciar countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Cada 1 segundo
      
      return () => clearInterval(countdownInterval);
    } else {
      setCountdown(null);
    }
  }, [position]);

  // Calcular personas delante de ti
  const peopleAhead = Math.max(0, position - 1);
  
  // Mostrar countdown si está activo
  const showCountdown = countdown !== null && countdown >= 0 && position <= 10;
  
  return (
    <Card style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      textAlign: 'center',
      padding: '32px 24px'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Título principal */}
        <div>
          <Title level={2} style={{ 
            marginBottom: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {showCountdown ? '¡Ya casi es tu turno!' : 'Sala de Espera'}
          </Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>
            {showCountdown 
              ? 'Prepárate para seleccionar tus tickets...'
              : (
                  <>
                    Pronto te daremos acceso a la selección de tickets.
                    <br />
                    Gracias por tu paciencia.
                  </>
                )
            }
          </Text>
        </div>

        {/* 🔥 COUNTDOWN cuando estás en las últimas 10 posiciones */}
        {showCountdown && (
          <div style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            padding: '24px',
            borderRadius: 16,
            marginTop: 16,
            animation: 'pulse 1s infinite',
            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)'
          }}>
            <Text style={{ 
              fontSize: '18px', 
              color: 'white',
              display: 'block',
              marginBottom: 8,
              fontWeight: 600
            }}>
              🔥 INGRESO EN:
            </Text>
            <Title level={1} style={{ 
              margin: 0, 
              color: 'white',
              fontSize: '72px',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {countdown}
            </Title>
          </div>
        )}

        {/* Información de la cola */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: 12,
          marginTop: 16
        }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <TeamOutlined style={{ fontSize: 20, color: '#667eea' }} />
                <Text strong>Personas delante de ti:</Text>
              </Space>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#667eea' }}>
                {peopleAhead}
              </Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <ClockCircleOutlined style={{ fontSize: 20, color: '#667eea' }} />
                <Text strong>Tiempo estimado:</Text>
              </Space>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                {position <= 1 ? 'Muy pronto' : `${Math.ceil(peopleAhead * 0.5)} min`}
              </Text>
            </div>
          </Space>
        </div>

        {/* Barra de progreso única */}
        <div style={{ width: '100%', marginTop: 24 }}>
          <div style={{ marginBottom: 12, textAlign: 'left' }}>
            <Text style={{ fontSize: '14px', color: '#666' }}>
              Tu posición: <strong>{position}</strong> {initialTotal && `(empezaste en ${initialTotal})`}
            </Text>
          </div>
          
          <Progress 
            percent={displayProgress} 
            strokeColor={{
              '0%': '#667eea',
              '50%': '#764ba2',
              '100%': '#52c41a',
            }}
            trailColor="#f0f0f0"
            strokeWidth={12}
            format={(percent) => `${Math.round(percent)}%`}
            status={displayProgress >= 99 ? 'success' : 'active'}
          />
        </div>

        {/* Consejos */}
        <div style={{
          background: '#fff7e6',
          padding: 16,
          borderRadius: 8,
          textAlign: 'left',
          marginTop: 16,
          border: '1px solid #ffd591'
        }}>
          <Space direction="vertical" size={4}>
            <Text>• Mantén esta pestaña abierta</Text>
            <Text>• No actualices la página</Text>
            <Text>• Te notificaremos cuando sea tu turno</Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
