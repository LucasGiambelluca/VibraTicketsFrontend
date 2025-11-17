import { useState, useEffect, useRef } from 'react';
import { eventsApi } from '../services/apiService';

export const useEvents = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Evitar múltiples cargas en React StrictMode
  const hasLoadedRef = useRef(false);

  const loadEvents = async (newFilters = {}) => {
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
      
      if (response && response.events && Array.isArray(response.events)) {
        setEvents(response.events);
        setPagination(response.pagination);
      } else if (response && Array.isArray(response)) {
        setEvents(response);
        setPagination(null);
      } else {
        setEvents([]);
        setPagination(null);
      }
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData) => {
    try {
      setLoading(true);
      const result = await eventsApi.createEvent(eventData);
      await loadEvents(); // Recargar lista
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId, eventData) => {
    try {
      setLoading(true);
      const result = await eventsApi.updateEvent(eventId, eventData);
      await loadEvents(); // Recargar lista
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      setLoading(true);
      await eventsApi.deleteEvent(eventId);
      await loadEvents(); // Recargar lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadEvents();
  }, []);

  const refetch = async () => {
    setError(null);
    return await loadEvents();
  };

  return {
    events,
    pagination,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch
  };
};
