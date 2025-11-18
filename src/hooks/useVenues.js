import { useState, useEffect } from 'react';
import { venuesApi } from '../services/apiService';

export const useVenues = (filters = {}) => {
  const [venues, setVenues] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadVenues = async (newFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
        ...filters,
        ...newFilters
      };

      const response = await venuesApi.getVenues(params);
      // Debug: console.log('useVenues.getVenues response:', response);
      
      // Verificar si la respuesta tiene la estructura esperada
      if (response && response.venues) {
        // Debug: console.log('useVenues: venues count:', response.venues.length);
        // Normalizar IDs a números (el backend puede devolver strings)
        const normalizedVenues = response.venues.map(venue => ({
          ...venue,
          id: Number(venue.id),
          max_capacity: Number(venue.max_capacity)
        }));
        
        setVenues(normalizedVenues);
        setPagination(response.pagination);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Si la respuesta es response.data
        // Debug: console.log('useVenues: response.data count:', response.data.length);
        const normalizedVenues = response.data.map(venue => ({
          ...venue,
          id: Number(venue.id),
          max_capacity: Number(venue.max_capacity)
        }));
        
        setVenues(normalizedVenues);
        setPagination(response.pagination);
      } else if (response && Array.isArray(response)) {
        // Si la respuesta es directamente un array
        // Debug: console.log('useVenues: array count:', response.length);
        const normalizedVenues = response.map(venue => ({
          ...venue,
          id: Number(venue.id),
          max_capacity: Number(venue.max_capacity)
        }));
        
        setVenues(normalizedVenues);
        setPagination(null);
      } else {
        // Si no hay datos válidos del backend
        setVenues([]);
        setPagination(null);
      }
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      
      // Mostrar error y array vacío
      console.error('❌ Error loading venues:', err);
      console.error('❌ Error completo:', err);
      console.error('❌ Error stack:', err.stack);
      
      if (errorMessage.includes('Backend no disponible') || errorMessage.includes('fetch')) {
        }
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const createVenue = async (venueData) => {
    try {
      setLoading(true);
      const result = await venuesApi.createVenue(venueData);
      await loadVenues(); // Recargar lista
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVenue = async (id, venueData) => {
    try {
      setLoading(true);
      const result = await venuesApi.updateVenue(id, venueData);
      await loadVenues(); // Recargar lista
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVenue = async (id) => {
    try {
      setLoading(true);
      await venuesApi.deleteVenue(id);
      await loadVenues(); // Recargar lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar venues automáticamente al montar el componente
    // y recargar cuando cambien los filters
    loadVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]); // Recargar cuando cambien los filters

  const refetch = async () => {
    setVenues([]); // Limpiar venues actuales
    setError(null);
    return await loadVenues();
  };

  return {
    venues,
    pagination,
    loading,
    error,
    loadVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    refetch
  };
};
