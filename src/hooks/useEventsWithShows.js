import { useState, useEffect, useRef } from 'react';
import { eventsApi, showsApi } from '../services/apiService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Hook mejorado que carga eventos Y sus shows para mostrar información completa
 * Este hook enriquece los eventos con datos de shows (show_count, next_show_date, etc.)
 */
export const useEventsWithShows = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  const loadEventsWithShows = async (newFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: 1,
        limit: 12,
        status: 'active',
        sortBy: 'created_at',
        sortOrder: 'DESC',
        ...filters,
        ...newFilters
      };

      const response = await eventsApi.getEvents(params);
      
      
      let eventsList = [];
      
      // Extraer lista de eventos de la respuesta
      if (response && response.events && Array.isArray(response.events)) {
        eventsList = response.events;
        setPagination(response.pagination);
      } else if (response && Array.isArray(response)) {
        eventsList = response;
        setPagination(null);
        } else {
        setEvents([]);
        return;
      }

      if (eventsList.length > 0) {
        }

      // Siempre agregar valores por defecto para evitar errores
      const eventsWithDefaults = eventsList.map(event => ({
        ...event,
        show_count: event.show_count ?? 0,
        next_show_date: event.next_show_date ?? null,
        available_seats: event.available_seats ?? 0,
        venue_name: event.venue_name ?? event.venue ?? null,
        venue_city: event.venue_city ?? null
      }));
      
      setEvents(eventsWithDefaults);
      
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      console.error('❌ ERROR en loadEventsWithShows:', err);
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;
    loadEventsWithShows();
  }, []);

  const refetch = async () => {
    setEvents([]);
    setError(null);
    return await loadEventsWithShows();
  };

  return {
    events,
    pagination,
    loading,
    error,
    loadEvents: loadEventsWithShows,
    refetch
  };
};
