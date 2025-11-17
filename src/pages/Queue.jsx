import React, { useState, useEffect, useRef } from 'react';
import { Typography, Card, Button, Space, notification, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleQueue from '../components/SimpleQueue';
import { queueApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

export default function Queue() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [queueSize, setQueueSize] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  
  const pollingIntervalRef = useRef(null);
  const isJoiningRef = useRef(false);
  const checkPositionRef = useRef(null);
  const isClaimingRef = useRef(false);

  // Unirse a la cola al montar el componente
  useEffect(() => {
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Validar que el usuario esté autenticado
    if (!user || !user.id) {
      message.error('Debes iniciar sesión para unirte a la cola');
      navigate('/login', { state: { from: `/queue/${showId}` } });
      return;
    }

    // Función para mostrar notificaciones
    const showNotification = (title, body) => {
      // Notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }

      // Notificación de Ant Design
      notification.success({
        message: title,
        description: body,
        placement: 'topRight',
        duration: 4
      });
    };

    // Función para verificar la posición en la cola
    const checkPosition = async () => {
      try {
        // 🆕 userId se toma del JWT automáticamente
        const response = await queueApi.getQueuePosition(showId);
        
        // ✅ Validar que la respuesta existe y tiene datos válidos
        if (!response) {
          console.error('❌ Respuesta vacía del backend');
          return;
        }
        
        
        // Validar que tiene las propiedades necesarias
        if (typeof response.position === 'undefined') {
          console.error('❌ La respuesta no incluye "position"');
          console.error('📦 Respuesta recibida:', response);
          return;
        }
        
        const oldPosition = position;
        setPosition(response.position);
        setQueueSize(response.queueSize);
        setEstimatedWaitTime(response.estimatedWaitTime);
        
        // Notificaciones en hitos importantes
        if (response.position <= 10 && oldPosition > 10) {
          showNotification('🚀 ¡Ya casi es tu turno!', 'Quedan menos de 10 personas delante de ti');
        }
        
        // Notificación cuando eres el siguiente (posición 1)
        if (response.position === 1 && oldPosition > 1) {
          showNotification('⌛ Eres el siguiente', 'Prepárate, pronto será tu turno');
        }
        
        // ⭐ IMPORTANTE: Redirigir cuando hasAccess === true O cuando tengamos accessToken
        // El backend puede usar hasAccess (nuevo) o accessToken (viejo)
        const shouldRedirect = response.hasAccess || (response.position <= 1 && response.accessToken);
        
        if (shouldRedirect) {
          // Detener polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          // Guardar accessToken
          const token = response.accessToken;
          
          if (!token) {
            console.error('❌ ERROR: No hay accessToken pero position <= 1');
            message.error('Error: No se recibió el token de acceso. Recargá la página.');
            return;
          }
          
          setAccessToken(token);
          sessionStorage.setItem(`queue-access-${showId}`, token);
          sessionStorage.setItem(`queue-access-${showId}-expires`, response.expiresAt);
          
          showNotification('✅ ¡Es tu turno!', 'Serás redirigido a la selección de entradas');
          
          // Redirigir a ShowDetail después de 2 segundos
          setTimeout(() => {
            navigate(`/shows/${showId}`, {
              state: {
                accessToken: token,
                fromQueue: true
              }
            });
          }, 2000);
        } else if (response.position <= 1 && !response.accessToken && !response.hasAccess) {
          // Caso especial: Position 1 pero sin token: intentar reclamar acceso
          if (isClaimingRef.current) {
            return;
          }
          try {
            isClaimingRef.current = true;
            const claim = await queueApi.claimAccess(showId);
            if (claim && claim.accessToken) {
              const token = claim.accessToken;
              setAccessToken(token);
              sessionStorage.setItem(`queue-access-${showId}`, token);
              sessionStorage.setItem(`queue-access-${showId}-expires`, claim.expiresAt);
              showNotification('✅ ¡Es tu turno!', 'Acceso concedido. Serás redirigido a la selección de entradas');
              // Detener polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              setTimeout(() => {
                navigate(`/shows/${showId}`, {
                  state: { accessToken: token, fromQueue: true }
                });
              }, 2000);
            } else {
              }
          } catch (e) {
            console.error('❌ Error en claim-access:', e);
            // Manejos frecuentes
            if (e.status === 409) {
              } else if (e.status === 423) {
              } else if (e.status === 429) {
              } else if (e.status === 403) {
              }
          } finally {
            isClaimingRef.current = false;
          }
        } else if (response.hasAccess && !response.accessToken) {
          // Caso raro: hasAccess=true pero falta accessToken
          console.error('❌ ERROR: hasAccess=true pero no hay accessToken');
          message.error('Error: Acceso concedido pero falta token. Recargá la página.');
        }
      } catch (err) {
        console.error('❌ Error al consultar posición:', err);
        console.error('❌ Tipo de error:', err.constructor.name);
        console.error('❌ Mensaje:', err.message);
        console.error('❌ Response:', err.response);
        console.error('❌ Status:', err.status);
        
        // 🔄 Error 409: Usuario ya no está en la cola (fue removido)
        if (err.status === 409 || err.message?.includes('409')) {
          console.error('⚠️ ERROR 409 - Usuario no está en la cola o fue removido');
          message.warning({
            content: 'Fuiste removido de la cola. Reingresando...',
            duration: 3
          });
          
          // Detener polling e intentar unirse de nuevo
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          // Recargar la página para reiniciar el proceso
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
        // 🔥 Error 500: El backend tiene un problema
        else if (err.status === 500 || err.message?.includes('500')) {
          console.error('🔥 ERROR 500 DEL BACKEND - El servidor tiene un problema');
          message.error({
            content: 'Error del servidor. Reintentando en el próximo ciclo...',
            duration: 3
          });
        }
        // 🌐 Error de red
        else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
          console.error('🌐 ERROR DE RED - No se puede conectar al backend');
          message.error({
            content: 'Problema de conexión. Verificá que el backend esté corriendo.',
            duration: 3
          });
        }
        // ❓ Otros errores
        else {
          console.error('❓ ERROR DESCONOCIDO:', err);
        }
        
        // Continuar con el polling (no detenerlo por un error temporal)
      }
    };

    // Guardar referencia a checkPosition para que esté disponible fuera del useEffect
    checkPositionRef.current = checkPosition;

    // Función para iniciar el polling de posición
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(async () => {
        await checkPosition();
      }, 10000); // Cada 10 segundos
    };

    const joinQueue = async (isRetry = false) => {
      if (isJoiningRef.current) return;
      isJoiningRef.current = true;
      
      try {
        // 🆕 userInfo opcional - backend toma userId del JWT automáticamente
        const userInfo = {
          name: user.name || user.email?.split('@')[0],
          email: user.email
        };
        
        const response = await queueApi.joinQueue(showId, userInfo);
        setPosition(response.position);
        setQueueSize(response.queueSize);
        setEstimatedWaitTime(response.estimatedWaitTime);
        setSessionId(response.sessionId);
        
        // ⭐ Si ya tiene acceso inmediato (posición 1 desde el inicio)
        if (response.hasAccess && response.accessToken) {
          setAccessToken(response.accessToken);
          sessionStorage.setItem(`queue-access-${showId}`, response.accessToken);
          sessionStorage.setItem(`queue-access-${showId}-expires`, response.expiresAt);
          
          setLoading(false);
          message.success('¡Es tu turno! Redirigiendo a la selección de entradas...');
          
          // Redirigir inmediatamente
          setTimeout(() => {
            navigate(`/shows/${showId}`, {
              state: {
                accessToken: response.accessToken,
                fromQueue: true
              }
            });
          }, 2000);
          return;
        }
        
        setLoading(false);
        message.success(`Te uniste a la cola. Posición: ${response.position}`);
        
        // ✅ Verificar posición INMEDIATAMENTE (no esperar 10 segundos)
        await checkPosition();
        
        // Iniciar polling de posición
        startPolling();
      } catch (err) {
        console.error('❌ Error al unirse a la cola:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.message);
        
        // 🔄 Error 409: Usuario ya está en la cola
        if (err.status === 409 || err.message?.includes('409') || err.message?.includes('already in queue')) {
          if (!isRetry) {
            message.info('Ya estabas en la cola. Reingresando...');
            
            try {
              // Salir de la cola primero
              await queueApi.leaveQueue(showId);
              // Esperar 500ms y reintentar
              setTimeout(() => {
                isJoiningRef.current = false;
                joinQueue(true); // Reintentar
              }, 500);
              return;
            } catch (leaveErr) {
              console.error('❌ Error al salir de la cola:', leaveErr);
              // Continuar de todos modos, tal vez ya no está en la cola
            }
          } else {
            // Ya reintentó una vez y sigue fallando
            console.error('❌ Reintento falló. Error 409 persiste.');
            setError('Ya estás en la cola pero hubo un problema al reingresar');
            setLoading(false);
            message.error({
              content: 'Error: Ya estás en esta cola. Esperá 15 minutos o contactá a soporte.',
              duration: 5
            });
            return;
          }
        }
        
        // Otros errores
        setError(err.message || 'No se pudo unir a la cola');
        setLoading(false);
        message.error('Error al unirse a la cola. Intentá nuevamente.');
      } finally {
        isJoiningRef.current = false;
      }
    };

    joinQueue();

    // Cleanup al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [showId, user, navigate]);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '40px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Uniéndose a la cola virtual...</Text>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '40px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <Title level={4} type="danger">❌ Error</Title>
          <Text>{error}</Text>
          <div style={{ marginTop: 24 }}>
            <Button type="primary" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '40px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="queue-container" style={{ maxWidth: 500, width: '100%' }}>
        <SimpleQueue 
          position={position || 0}
          totalUsers={queueSize || 0}
          onComplete={() => {}} // El polling maneja la redirección
        />
        
        {/* Información adicional */}
        <Card style={{ 
          marginTop: 24, 
          background: position === 1 ? 'rgba(255, 237, 132, 0.95)' : 'rgba(255,255,255,0.95)',
          border: position === 1 ? '2px solid #faad14' : 'none'
        }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* Mensaje especial para posición 1 */}
            {position === 1 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: '#fff7e6',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                  ⏳ ¡Eres el siguiente!
                </Title>
                <Text>Prepárate, pronto será tu turno</Text>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>📍 Posición:</Text>
              <Text style={{ fontWeight: position === 1 ? 'bold' : 'normal', color: position === 1 ? '#faad14' : 'inherit' }}>
                {position === 1 ? 'Siguiente en la fila' : position}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>👥 Personas en cola:</Text>
              <Text>{queueSize}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>⏱️ Tiempo estimado:</Text>
              <Text>{position === 1 ? 'Muy pronto' : (estimatedWaitTime ? `${Math.ceil(estimatedWaitTime / 60)} min` : '-')}</Text>
            </div>
          </Space>
        </Card>

        {/* Consejos */}
        <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.9)' }}>
          <Title level={5}>💡 Consejos mientras esperas:</Title>
          <Space direction="vertical" size={4}>
            <Text>• Mantén esta pestaña abierta</Text>
            <Text>• No actualices la página</Text>
            <Text>• Te notificaremos cuando sea tu turno</Text>
            <Text>• Tendrás 15 minutos para completar tu compra</Text>
          </Space>
        </Card>

        {/* Botón de debug temporal */}
        {process.env.NODE_ENV === 'development' && (
          <Card style={{ marginTop: 16, background: 'rgba(255,0,0,0.1)', border: '1px solid red' }}>
            <Title level={5}>🐞 DEBUG (solo desarrollo)</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                danger
                onClick={async () => {
                  if (checkPositionRef.current) {
                    await checkPositionRef.current();
                  } else {
                    console.error('❌ checkPosition no disponible');
                  }
                }}
                block
              >
                🔄 Consultar Posición Ahora
              </Button>
              <Text style={{ fontSize: '0.85rem' }}>
                Abre la consola (F12) para ver los logs detallados
              </Text>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}
