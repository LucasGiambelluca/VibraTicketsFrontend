import { useState, useEffect } from 'react';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../utils/loadGoogleMaps';

/**
 * Hook personalizado para cargar y usar Google Maps API
 * @returns {Object} - { isLoaded, error, google }
 */
export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si ya está cargado
    if (isGoogleMapsLoaded()) {
      setIsLoaded(true);
      return;
    }

    // Obtener API Key del .env
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('API Key de Google Maps no configurada');
      return;
    }

    // Cargar Google Maps
    loadGoogleMaps(apiKey)
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Error al cargar Google Maps:', err);
        setError(err.message);
      });
  }, []);

  return {
    isLoaded,
    error,
    google: isLoaded ? window.google : null
  };
}
