import { useState, useCallback, useRef, useEffect } from 'react';
import { queueService } from '../services/queueService';

const QUEUE_THRESHOLD = 10; // Si hay menos de 10 personas, ir directo
const POLLING_INTERVAL = 5000;

export function useVirtualQueue(showId) {
  const [state, setState] = useState({ status: 'idle' });
  const pollingRef = useRef(null);
  const userId = useRef(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // OPCIÓN B: Verificar primero y decidir flujo
  const startQueueFlow = useCallback(async () => {
    setState({ status: 'checking' });

    try {
      console.log('🎬 [Option B] Starting queue flow with pre-check...');
      
      // 1. PRE-CHECK: Verificar estado de la cola
      const status = await queueService.getStatus(showId);
      console.log('📊 Queue status:', status);

      // FAST-PASS: Si la cola está vacía o con poca gente
      if (status.queueSize < QUEUE_THRESHOLD) {
        console.log(`✨ FAST-PASS! Queue size (${status.queueSize}) < threshold (${QUEUE_THRESHOLD})`);
        setState({ status: 'bypassed' }); // Señal para ir directo
        return { bypass: true };
      }

      console.log(`⏳ Queue has ${status.queueSize} people, joining...`);

      // 2. Hay cola, proceder a unirse
      const joinData = await queueService.join(showId, userId.current);
      console.log('📍 Joined queue at position:', joinData.position);

      // 3. Si eres el primero, auto-claim
      if (joinData.position === 1) {
        console.log('🎉 You are FIRST! Auto-claiming...');
        const accessData = await queueService.claimAccess(showId, userId.current);
        console.log('🎟️ Access granted:', accessData);
        
        setState({ 
          status: 'granted', 
          token: accessData.accessToken 
        });
        return { 
          bypass: false, 
          granted: true, 
          token: accessData.accessToken 
        };
      }

      // 4. Hay que esperar
      console.log('🚦 Must wait in queue...');
      setState({
        status: 'waiting',
        position: joinData.position,
        estimatedTime: joinData.estimatedWaitTime
      });

      startPolling();
      return { bypass: false, waiting: true };

    } catch (error) {
      console.error('❌ Error in queue flow:', error);
      
      if (error.status === 409) {
        // Ya estábamos en cola, obtener posición
        console.log('ℹ️ Already in queue, checking position...');
        await checkPosition();
        return { bypass: false, waiting: true };
      }

      setState({
        status: 'error',
        message: error.message || 'Error al un irse a la cola'
      });
      return { error: true };
    }
  }, [showId]);

  const checkPosition = useCallback(async () => {
    try {
      const data = await queueService.getPosition(showId, userId.current);
      console.log('📍 Current position:', data.position);

      setState({
        status: 'waiting',
        position: data.position,
        estimatedTime: data.estimatedWaitTime
      });

      if (data.position === 1) {
        console.log('🎉 Your turn! Claiming access...');
        const accessData = await queueService.claimAccess(showId, userId.current);
        
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }

        console.log('✅ Access granted!');
        setState({
          status: 'granted',
          token: accessData.accessToken
        });
      }
    } catch (error) {
      if (error.status === 404) {
        console.warn('⚠️ Not in queue anymore (404)');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        setState({
          status: 'error',
          message: 'Tu turno expiró'
        });
      }
    }
  }, [showId]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    
    console.log('🔄 Starting polling...');
    pollingRef.current = setInterval(() => {
      checkPosition();
    }, POLLING_INTERVAL);
  }, [checkPosition]);

  const leaveQueue = useCallback(async () => {
    console.log('👋 Leaving queue...');
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    try {
      await queueService.leave(showId, userId.current);
    } catch (error) {
      console.error('Error leaving queue:', error);
    }

    setState({ status: 'idle' });
  }, [showId]);

  return {
    state,
    startQueueFlow,
    leaveQueue
  };
}
