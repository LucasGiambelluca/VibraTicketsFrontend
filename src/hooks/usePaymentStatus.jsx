import { useState, useEffect } from 'react';
import { paymentsApi } from '../services/apiService';

/**
 * Hook para consultar el estado de un pago (Polling)
 * @param {string|number} orderId - ID de la orden a monitorear
 * @param {boolean} shouldPoll - Si debe ejecutarse el polling (default: true)
 * @returns {string} status - Estado actual del pago ('PENDING', 'PAID', 'CANCELLED', etc.)
 */
export const usePaymentStatus = (orderId, shouldPoll = true) => {
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId || !shouldPoll) return;

    let isMounted = true;
    let intervalId = null;
    let timeoutId = null;

    const checkStatus = async () => {
      try {
        setLoading(true);
        const response = await paymentsApi.getPaymentStatus(orderId);
        const data = response.data || response;
        
        console.log('🔄 Polling payment status:', data);

        if (isMounted) {
          // Priorizar orderStatus si existe, sino usar status general
          const currentStatus = data.orderStatus || data.status;
          
          if (currentStatus === 'PAID' || currentStatus === 'approved') {
            setStatus('PAID');
            clearInterval(intervalId); // Detener polling si ya pagó
          } else if (currentStatus === 'CANCELLED' || currentStatus === 'rejected') {
            setStatus('CANCELLED');
            clearInterval(intervalId); // Detener polling si falló
          } else {
            setStatus('PENDING');
          }
        }
      } catch (error) {
        console.error('❌ Error polling payment status:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Primera verificación inmediata
    checkStatus();

    // Polling cada 5 segundos
    intervalId = setInterval(checkStatus, 5000);

    // Timeout de seguridad a los 5 minutos (300000 ms)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ Polling timeout reached (5 min)');
        clearInterval(intervalId);
      }
    }, 300000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId, shouldPoll]);

  return status;
};

export default usePaymentStatus;
