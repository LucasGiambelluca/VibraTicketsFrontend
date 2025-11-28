import { useState, useEffect } from 'react';
import { ticketsApi } from '../services/apiService';

/**
 * Hook para consultar disponibilidad de boletos de un evento
 * Consulta cuántos boletos puede comprar el usuario basándose en:
 * - Límite por evento (5 tickets máximo)
 * - DNI del usuario
 * - Tickets ya comprados
 * 
 * @param {number|string} eventId - ID del evento
 * @param {boolean} enabled - Si debe consultar (requiere autenticación)
 * @returns {object} - { availability, loading, error, refetch }
 */
export function useTicketAvailability(eventId, enabled = true) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailability = async () => {
    if (!enabled || !eventId) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Si no hay token, indicar que requiere autenticación
      if (!token) {
        setAvailability({
          available: 5,
          maxPerEvent: 5,
          canPurchase: false,
          requiresAuth: true,
          message: 'Debes iniciar sesión para comprar boletos'
        });
        setLoading(false);
        return;
      }

      // Consultar disponibilidad al backend
      const response = await ticketsApi.getAvailability(eventId);

      if (response.data) {
        setAvailability(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error consultando disponibilidad:', err);
      
      // Manejar errores específicos
      const errorData = err.response?.data;
      
      if (errorData) {
        setError(errorData.message || 'Error consultando disponibilidad');
        
        // Si el error indica DNI requerido, establecer availability apropiado
        if (errorData.error === 'DNIRequired' || errorData.reason === 'dni_required') {
          setAvailability({
            available: 0,
            maxPerEvent: 5,
            canPurchase: false,
            requiresAuth: false,
            reason: 'dni_required',
            message: 'Debes completar tu DNI en tu perfil para comprar boletos'
          });
        }
      } else {
        setError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [eventId, enabled]);

  return {
    availability,
    loading,
    error,
    refetch: fetchAvailability
  };
}
