import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, Alert, Space, Statistic } from 'antd';
import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Countdown } = Statistic;

const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [percentage, setPercentage] = useState(100);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // Calcular porcentaje (asumiendo 10 minutos de hold)
        const totalTime = 10 * 60 * 1000; // 10 minutos en ms
        const elapsed = totalTime - difference;
        const currentPercentage = Math.max(0, 100 - (elapsed / totalTime) * 100);
        
        setTimeLeft({ minutes, seconds, totalMs: difference });
        setPercentage(currentPercentage);
        setIsExpired(false);
        
        return true; // Continuar
      } else {
        setTimeLeft(null);
        setPercentage(0);
        setIsExpired(true);
        
        if (onExpire) {
          onExpire();
        }
        
        return false; // Parar
      }
    };

    // Calcular inicial
    if (!calculateTimeLeft()) {
      return; // Ya expirado
    }

    // Actualizar cada segundo
    const timer = setInterval(() => {
      if (!calculateTimeLeft()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!expiresAt) {
    return null;
  }

  if (isExpired) {
    return (
      <Alert
        message="Tiempo Expirado"
        description="Tu reserva ha expirado. Por favor, vuelve a seleccionar los asientos."
        type="error"
        showIcon
        icon={<WarningOutlined />}
        style={{ borderRadius: '12px' }}
      />
    );
  }

  if (!timeLeft) {
    return (
      <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
        <Text type="secondary">Calculando tiempo restante...</Text>
      </Card>
    );
  }

  const isWarning = timeLeft.minutes < 2;
  const isDanger = timeLeft.minutes < 1;

  return (
    <Card 
      style={{ 
        borderRadius: '12px',
        background: isDanger 
          ? 'linear-gradient(135deg, #ff4d4f10, #ff7a4510)' 
          : isWarning 
            ? 'linear-gradient(135deg, #faad1410, #ffc53d10)'
            : 'linear-gradient(135deg, #667eea05, #764ba205)'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <ClockCircleOutlined 
          style={{ 
            fontSize: 32, 
            color: isDanger ? '#ff4d4f' : isWarning ? '#faad14' : '#667eea',
            marginBottom: 12
          }} 
        />
        
        <Title 
          level={2} 
          style={{ 
            margin: '0 0 8px 0',
            color: isDanger ? '#ff4d4f' : isWarning ? '#faad14' : '#667eea'
          }}
        >
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </Title>
        
        <Progress 
          percent={percentage} 
          showInfo={false}
          strokeColor={{
            '0%': isDanger ? '#ff4d4f' : isWarning ? '#faad14' : '#667eea',
            '100%': isDanger ? '#ff7a45' : isWarning ? '#ffc53d' : '#764ba2'
          }}
          size="small"
          style={{ marginBottom: 12 }}
        />
        
        <Text 
          type={isDanger ? 'danger' : isWarning ? 'warning' : 'secondary'} 
          style={{ fontSize: 14, fontWeight: 500 }}
        >
          {isDanger 
            ? '⚠️ Tu reserva expira muy pronto!' 
            : isWarning 
              ? '⏰ Date prisa, queda poco tiempo'
              : '⏱️ Tiempo restante para completar la compra'}
        </Text>

        {/* Countdown alternativo usando Ant Design */}
        {timeLeft.totalMs && (
          <div style={{ marginTop: 16, display: 'none' }}>
            <Countdown 
              value={Date.now() + timeLeft.totalMs} 
              format="mm:ss"
              valueStyle={{ 
                fontSize: 24,
                color: isDanger ? '#ff4d4f' : isWarning ? '#faad14' : '#667eea'
              }}
              onFinish={onExpire}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

// Versión simplificada para usar en el header
export const CountdownTimerCompact = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds });
      } else {
        setTimeLeft(null);
        if (onExpire) onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!timeLeft) return null;

  const isWarning = timeLeft.minutes < 2;

  return (
    <Space>
      <ClockCircleOutlined style={{ color: isWarning ? '#ff4d4f' : '#667eea' }} />
      <Text strong style={{ color: isWarning ? '#ff4d4f' : '#667eea' }}>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </Text>
    </Space>
  );
};

export default CountdownTimer;
