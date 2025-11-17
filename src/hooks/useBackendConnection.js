import { useState, useEffect, useCallback } from 'react';
import { healthApi } from '../services/apiService';

export const useBackendConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);

  const checkConnection = useCallback(async () => {
    try {
      setIsChecking(true);
      setError(null);
      
      const response = await healthApi.getHealth();
      setIsConnected(true);
      setLastCheck(new Date());
      return true;
    } catch (err) {
      setIsConnected(false);
      setLastCheck(new Date());
      setError(err.message);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Verificar conexión al montar el componente
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Verificar conexión periódicamente (cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  // Verificar conexión cuando la ventana vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      if (!isConnected) {
        checkConnection();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isConnected, checkConnection]);

  return {
    isConnected,
    isChecking,
    lastCheck,
    error,
    checkConnection
  };
};
