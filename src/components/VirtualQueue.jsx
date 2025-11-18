import React, { useState, useEffect, useCallback } from 'react';
import { Card, Progress, Button, Typography, Space, Spin, Alert, message } from 'antd';
import { ClockCircleOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { queueApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoginModal } from '../contexts/LoginModalContext';

const { Title, Text, Paragraph } = Typography;

const VirtualQueue = ({ showId, onAccessGranted }) => {
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();
  const navigate = useNavigate();
  
  const [queueState, setQueueState] = useState({
    inQueue: false,
    position: null,
    queueSize: 0,
    estimatedWaitTime: 0,
    sessionId: null,
    accessToken: null,
    loading: false,
    error: null
  });

  // Polling interval (cada 3 segundos)
  const POLL_INTERVAL = 3000;

  // Unirse a la cola
  const joinQueue = async () => {
    if (!user) {
      message.warning('Debes iniciar sesión para unirte a la cola');
      openLoginModal(() => {
        // Después del login, intentar unirse automáticamente
        setTimeout(() => joinQueue(), 500);
      });
      return;
    }

    setQueueState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await queueApi.joinQueue(showId, user.email);
      
      setQueueState(prev => ({
        ...prev,
        inQueue: true,
        position: response.data.position,
        queueSize: response.data.queueSize,
        estimatedWaitTime: response.data.estimatedWaitTime,
        sessionId: response.data.sessionId,
        loading: false
      }));

      message.success('Te has unido a la cola virtual');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al unirse a la cola';
      setQueueState(prev => ({ ...prev, loading: false, error: errorMsg }));
      message.error(errorMsg);
    }
  };

  // Actualizar posición en la cola
  const updatePosition = useCallback(async () => {
    if (!queueState.inQueue || queueState.accessToken) return;

    try {
      const response = await queueApi.getPosition(showId);
      
      setQueueState(prev => ({
        ...prev,
        position: response.data.position,
        queueSize: response.data.queueSize,
        estimatedWaitTime: response.data.estimatedWaitTime
      }));

      // Si estamos en posición 1, intentar reclamar acceso
      if (response.data.position === 1) {
        await claimAccess();
      }
    } catch (error) {
      if (error.response?.data?.error === 'NotInQueue') {
        setQueueState(prev => ({ ...prev, inQueue: false }));
      }
    }
  }, [showId, queueState.inQueue, queueState.accessToken]);

  // Reclamar acceso
  const claimAccess = async () => {
    try {
      const response = await queueApi.claimAccess(showId);
      
      setQueueState(prev => ({
        ...prev,
        accessToken: response.data.accessToken,
        position: 0
      }));

      message.success('¡Acceso otorgado! Puedes proceder con tu compra', 5);

      // Guardar token en localStorage para el checkout
      localStorage.setItem(`queue_access_${showId}`, response.data.accessToken);
      localStorage.setItem(`queue_access_${showId}_expires`, response.data.expiresAt);

      // Callback para el componente padre
      if (onAccessGranted) {
        onAccessGranted(response.data.accessToken);
      }
    } catch (error) {
      console.error('Error reclamando acceso:', error);
    }
  };

  // Salir de la cola
  const leaveQueue = async () => {
    try {
      await queueApi.leaveQueue(showId);
      
      setQueueState({
        inQueue: false,
        position: null,
        queueSize: 0,
        estimatedWaitTime: 0,
        sessionId: null,
        accessToken: null,
        loading: false,
        error: null
      });

      message.info('Has salido de la cola');
    } catch (error) {
      message.error('Error al salir de la cola');
    }
  };

  // Polling automático
  useEffect(() => {
    if (!queueState.inQueue || queueState.accessToken) return;

    const interval = setInterval(updatePosition, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [queueState.inQueue, queueState.accessToken, updatePosition]);

  // Formatear tiempo de espera
  const formatWaitTime = (seconds) => {
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  // Calcular progreso
  const calculateProgress = () => {
    if (!queueState.position || !queueState.queueSize) return 0;
    return Math.round(((queueState.queueSize - queueState.position + 1) / queueState.queueSize) * 100);
  };

  // Si ya tiene acceso
  if (queueState.accessToken) {
    return (
      <Card
        style={{
          maxWidth: 600,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
          
          <Title level={3} style={{ margin: 0 }}>¡Acceso Otorgado!</Title>
          
          <Paragraph>
            Tienes acceso exclusivo para comprar tus entradas.
            Este acceso expirará en 15 minutos.
          </Paragraph>

          <Button
            type="primary"
            size="large"
            onClick={() => {
              // Scroll hacia las secciones o recargar la página
              if (onAccessGranted) {
                onAccessGranted(queueState.accessToken);
              }
            }}
            style={{ width: '100%' }}
          >
            Ver Entradas Disponibles
          </Button>
        </Space>
      </Card>
    );
  }

  // Si está en la cola
  if (queueState.inQueue) {
    return (
      <Card
        style={{
          maxWidth: 600,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>Estás en la Cola Virtual</Title>
            <Text type="secondary">
              Mantén esta ventana abierta. Te notificaremos cuando sea tu turno.
            </Text>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Title level={1} style={{ margin: 0, color: '#1890ff' }}>
              {queueState.position}
            </Title>
            <Text>Tu posición en la cola</Text>
          </div>

          <Progress
            percent={calculateProgress()}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <UserOutlined />
                <Text>Personas en cola:</Text>
              </Space>
              <Text strong>{queueState.queueSize}</Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <ClockCircleOutlined />
                <Text>Tiempo estimado:</Text>
              </Space>
              <Text strong>{formatWaitTime(queueState.estimatedWaitTime)}</Text>
            </div>
          </Space>

          {queueState.position === 1 && (
            <Alert
              message="¡Eres el siguiente!"
              description="Estamos procesando tu acceso..."
              type="success"
              showIcon
              icon={<Spin />}
            />
          )}

          <Button
            danger
            block
            onClick={leaveQueue}
          >
            Salir de la Cola
          </Button>
        </Space>
      </Card>
    );
  }

  // Estado inicial - No está en la cola
  return (
    <Card
      style={{
        maxWidth: 600,
        margin: '0 auto',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
        <Title level={3}>Cola Virtual Activada</Title>
        
        <Paragraph>
          Este evento tiene alta demanda. Únete a la cola virtual para acceder
          a la compra de entradas de forma ordenada y segura.
        </Paragraph>

        {queueState.error && (
          <Alert
            message="Error"
            description={queueState.error}
            type="error"
            closable
            onClose={() => setQueueState(prev => ({ ...prev, error: null }))}
          />
        )}

        <Button
          type="primary"
          size="large"
          loading={queueState.loading}
          onClick={joinQueue}
          style={{ width: '100%' }}
        >
          Unirse a la Cola
        </Button>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Al unirte, aceptas esperar tu turno para acceder a la compra
        </Text>
      </Space>
    </Card>
  );
};

export default VirtualQueue;
