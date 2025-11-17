import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Card, Typography, Row, Col, Button, Tag, Spin, message } from "antd";
import { Link } from "react-router-dom";
import { useEvents } from "../src/hooks/useEvents";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DemoModeIndicator from "../src/components/DemoModeIndicator";
// import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';

// gsap.registerPlugin(ScrollTrigger);

const { Title, Text } = Typography;

// Componente optimizado para cada evento
const EventCard = React.memo(({ event, index }) => {
  const cardRef = React.useRef(null);

  // Formatear fecha
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Formatear hora
  const formatEventTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm", { locale: es }) + " HS";
    } catch (error) {
      return "21:00 HS";
    }
  };

  // Determinar status del evento
  const getEventStatus = (event) => {
    if (!event.shows || event.shows.length === 0) return "SIN SHOWS";
    
    const now = new Date();
    const futureShows = event.shows.filter(show => new Date(show.startsAt) > now);
    
    if (futureShows.length === 0) return "FINALIZADO";
    
    // Aquí podrías agregar lógica para determinar si está agotado o con pocas entradas
    return "DISPONIBLE";
  };

  useEffect(() => {
    // Animaciones GSAP comentadas temporalmente
  }, [index]);

  const eventStatus = getEventStatus(event);
  const eventDate = formatEventDate(event.next_show_date || event.startsAt);
  const eventTime = formatEventTime(event.next_show_date || event.startsAt);
  
  // Imagen por defecto si no hay imagen
  const eventImage = event.image_url 
    ? (event.image_url.startsWith('http') ? event.image_url : `http://localhost:3000${event.image_url}`)
    : `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop&crop=face`;
  
  console.log('🖼️ Imagen del evento:', {
    eventId: event.id,
    eventName: event.name,
    image_url: event.image_url,
    finalImageUrl: eventImage
  });
  
  // Precio mínimo de los shows
  const minPrice = event.shows && event.shows.length > 0 
    ? Math.min(...event.shows.flatMap(show => 
        show.sections ? show.sections.map(section => section.priceCents / 100) : [0]
      ))
    : 0;

  // Determinar showId objetivo para iniciar la fila virtual
  const now = new Date();
  const firstFutureShow = (event.shows || []).find(s => {
    try {
      return new Date(s.startsAt) > now;
    } catch (_) {
      return false;
    }
  });
  const targetShowId = firstFutureShow?.id || '101'; // Fallback demo

  return (
    <Col xs={24} sm={12} lg={8}>
      <Card
        ref={cardRef}
        hoverable
        cover={
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img 
              alt={event.name} 
              src={eventImage} 
              loading="lazy"
              onError={(e) => {
                console.log('❌ Error cargando imagen:', eventImage);
                e.target.src = `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop&crop=face`;
              }}
              onLoad={() => {
                console.log('✅ Imagen cargada correctamente:', eventImage);
              }}
              style={{ 
                height: "240px", 
                width: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease"
              }} 
            />
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: eventStatus === 'FINALIZADO' ? '#ff4d4f' : 
                         eventStatus === 'SIN SHOWS' ? '#faad14' : '#52c41a',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              {eventStatus}
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              color: 'white',
              padding: '20px 16px 16px',
            }}>
              <Text style={{ color: 'white', fontSize: '12px', opacity: 0.9 }}>
                {event.venue_name ? `${event.venue_name} - ${event.venue_city}` : event.venue || 'Venue por definir'}
              </Text>
            </div>
          </div>
        }
        style={{ 
          borderRadius: "16px", 
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "none",
          transition: "all 0.3s ease"
        }}
        className="event-card"
      >
        <div style={{ padding: '4px 0' }}>
          <Title level={4} style={{ marginBottom: 4, fontSize: '1.3rem' }}>
            {event.name}
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {event.description || 'Evento especial'}
          </Text>
          <div style={{ margin: '12px 0 8px' }}>
            <Text style={{ fontSize: '0.85rem', color: '#666' }}>
              📅 {eventDate} • {eventTime}
            </Text>
            <br />
            <Text style={{ fontSize: '0.85rem', color: '#666' }}>
              📍 {event.venue_name ? `${event.venue_name} - ${event.venue_city}` : event.venue || 'Venue por definir'}
            </Text>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: 16
          }}>
            <div>
              <Text style={{ fontSize: '0.75rem', color: '#999' }}>Desde</Text>
              <br />
              <Text strong style={{ fontSize: '1.1rem', color: '#52c41a' }}>
                ${minPrice > 0 ? minPrice.toLocaleString() : 'Consultar'}
              </Text>
            </div>
            <Link to={`/queue/${targetShowId}`}>
              <Button 
                type="primary" 
                disabled={eventStatus === 'FINALIZADO' || eventStatus === 'SIN SHOWS'}
                style={{
                  background: (eventStatus === 'FINALIZADO' || eventStatus === 'SIN SHOWS') ? '#d9d9d9' :
                             "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  boxShadow: (eventStatus === 'FINALIZADO' || eventStatus === 'SIN SHOWS') ? 'none' : "0 2px 8px rgba(102, 126, 234, 0.3)",
                  minWidth: 100
                }}
              >
                {eventStatus === 'FINALIZADO' ? 'Finalizado' : 
                 eventStatus === 'SIN SHOWS' ? 'Sin shows' : 'Comprar'}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </Col>
  );
});

EventCard.displayName = 'EventCard';

export default function MainEvents() {
  const [showDemoMode, setShowDemoMode] = useState(false);
  
  // Usar el hook useEvents para manejar el estado de eventos
  const { events, loading, error, refetch } = useEvents({
    status: 'active',
    limit: 6,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Memoizar eventos para evitar re-renders innecesarios
  const memoizedEvents = useMemo(() => {
    console.log('🎭 ===== MAINEVENT RECIBIENDO DATOS =====');
    console.log('🎭 MainEvents - Eventos recibidos del hook:', events);
    console.log('🎭 MainEvents - Tipo de events:', typeof events);
    console.log('🎭 MainEvents - Es array?', Array.isArray(events));
    console.log('🎭 MainEvents - Número de eventos:', events?.length || 0);
    console.log('🎭 MainEvents - Loading:', loading);
    console.log('🎭 MainEvents - Error:', error);
    console.log('🎭 MainEvents - Primer evento:', events?.[0]);
    console.log('🎭 ===== FIN MAINEVENT DATOS =====');
    return events;
  }, [events, loading, error]);

  useEffect(() => {
    // ScrollTrigger cleanup comentado temporalmente
    // return () => {
    //   ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    // };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        padding: "40px 24px", 
        background: "transparent",
        maxWidth: 1200,
        margin: "0 auto",
        textAlign: 'center'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Cargando eventos...</Text>
        </div>
      </div>
    );
  }

  if (memoizedEvents.length === 0 && !loading) {
    return (
      <div style={{ 
        padding: "40px 24px", 
        background: "transparent",
        maxWidth: 1200,
        margin: "0 auto",
        textAlign: 'center'
      }}>
        <Text type="secondary">
          {error ? 
            `Error al cargar eventos: ${error}. Verifica que el backend esté corriendo en http://localhost:3000` : 
            'No hay eventos disponibles en este momento.'
          }
        </Text>
        {error && (
          <div style={{ marginTop: 16 }}>
            <Button onClick={refetch} type="primary">
              Reintentar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "40px 24px", 
      background: "transparent",
      maxWidth: 1200,
      margin: "0 auto"
    }}>
      <Row gutter={[16, 16]}>
        {memoizedEvents.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </Row>
      
      {/* Mostrar indicador de modo demo si hay error */}
      {error && memoizedEvents.length > 0 && (
        <DemoModeIndicator 
          show={true} 
          onClose={() => setShowDemoMode(false)} 
        />
      )}
    </div>
  );
}
