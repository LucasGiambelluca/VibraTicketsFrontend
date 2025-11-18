import { useEffect } from 'react';

/**
 * Hook para limpiar tokens de cola expirados del localStorage
 * Se ejecuta al montar el componente y cada 5 minutos
 */
export const useQueueCleanup = () => {
  useEffect(() => {
    const cleanupExpiredTokens = () => {
      const keys = Object.keys(localStorage);
      const now = new Date();

      keys.forEach(key => {
        if (key.startsWith('queue_access_') && key.endsWith('_expires')) {
          const expiresAt = new Date(localStorage.getItem(key));
          if (expiresAt < now) {
            const tokenKey = key.replace('_expires', '');
            localStorage.removeItem(tokenKey);
            localStorage.removeItem(key);
            console.log(`[Queue Cleanup] Removed expired token: ${tokenKey}`);
          }
        }
      });
    };

    // Limpiar al montar
    cleanupExpiredTokens();
    
    // Limpiar cada 5 minutos
    const interval = setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
