import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../services/apiService';

const SearchEvents = ({ onEventSelect, placeholder = "Buscar eventos..." }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const searchEvents = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      try {
        setLoading(true);
        const response = await eventsApi.searchEvents(query);
        setResults(response.events);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchEvents, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleEventSelect = (event) => {
    setQuery(event.name);
    setShowResults(false);
    
    // Navegar al evento
    navigate(`/events/${event.id}`);
    
    // Callback opcional
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="search-container" ref={searchRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '16px',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={() => query.length >= 2 && setShowResults(true)}
      />
      
      {showResults && (
        <div className="search-results" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {loading && (
            <div className="search-loading" style={{ padding: '12px 16px', color: '#666' }}>
              Buscando...
            </div>
          )}
          
          {!loading && results.length === 0 && (
            <div className="search-no-results" style={{ padding: '12px 16px', color: '#666' }}>
              No se encontraron eventos
            </div>
          )}
          
          {!loading && results.map(event => (
            <div
              key={event.id}
              className="search-result-item"
              onClick={() => handleEventSelect(event)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div className="result-name" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {event.name}
              </div>
              <div className="result-details" style={{ fontSize: '14px', color: '#666' }}>
                {event.venue_name && (
                  <span style={{ marginRight: '12px' }}>
                    📍 {event.venue_name} - {event.venue_city}
                  </span>
                )}
                {event.next_show_date && (
                  <span>
                    🕒 {new Date(event.next_show_date).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchEvents;
