import React from 'react';
import { Row, Col, Spin, Empty, Typography } from 'antd';
import { useEventsWithShows } from '../hooks/useEventsWithShows';
import { getEventImageUrl } from '../utils/imageUtils';
import EventCard from './EventCard';

const { Text } = Typography;

export default function MainEvents() {
  const { events, loading, error } = useEventsWithShows({
    page: 1,
    limit: 12,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Cargando próximos eventos...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fffbe6', borderRadius: 8 }}>
        <Text type="warning">⚠️ Error al cargar eventos: {error}</Text>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Empty description={
          <Text style={{ color: 'var(--text-secondary)' }}>
            No hay eventos disponibles en este momento.
          </Text>
        } />
      </div>
    );
  }

  // Separar eventos destacados (primeros 4) y normales (resto)
  const featuredEvents = events.slice(0, 4);
  const normalEvents = events.slice(4);

  return (
    <>
      {/* Eventos Destacados */}
      {featuredEvents.length > 0 && (
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 32,
            textAlign: 'left'
          }}>
            Eventos Destacados
          </h2>
          <Row gutter={[24, 24]}>
            {featuredEvents.map((event) => {
              const hasShows = event.show_count > 0;
              let lastShowDate = null;
              
              try {
                if (event.last_show_date) {
                  lastShowDate = new Date(event.last_show_date);
                  if (isNaN(lastShowDate.getTime())) lastShowDate = null;
                } else if (event.next_show_date) {
                  lastShowDate = new Date(event.next_show_date);
                  if (isNaN(lastShowDate.getTime())) lastShowDate = null;
                }
              } catch (e) {
                lastShowDate = null;
              }

              const dateString = lastShowDate 
                ? lastShowDate.toLocaleDateString('es-AR', { 
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })
                : 'Fecha por confirmar';

              const imageUrl = getEventImageUrl(event, 'square');
              const status = hasShows ? 'available' : 'sold_out';

              return (
                <Col xs={24} sm={12} lg={6} key={event.id}>
                  <EventCard
                    type="featured"
                    title={event.name}
                    date={dateString}
                    venue={event.venue_name || event.venue_city || 'Venue por confirmar'}
                    imageUrl={imageUrl}
                    eventId={event.id}
                    status={status}
                    sale_start_date={event.sale_start_date}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {/* Próximos Eventos */}
      {normalEvents.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 32,
            textAlign: 'left'
          }}>
            Próximos Eventos
          </h2>
          <Row gutter={[24, 24]}>
            {normalEvents.map((event) => {
              const hasShows = event.show_count > 0;
              let lastShowDate = null;
              
              try {
                if (event.last_show_date) {
                  lastShowDate = new Date(event.last_show_date);
                  if (isNaN(lastShowDate.getTime())) lastShowDate = null;
                } else if (event.next_show_date) {
                  lastShowDate = new Date(event.next_show_date);
                  if (isNaN(lastShowDate.getTime())) lastShowDate = null;
                }
              } catch (e) {
                lastShowDate = null;
              }

              const dateString = lastShowDate 
                ? lastShowDate.toLocaleDateString('es-AR', { 
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })
                : 'Fecha por confirmar';

              const imageUrl = getEventImageUrl(event, 'square');
              const status = hasShows ? 'available' : 'sold_out';

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                  <EventCard
                    type="normal"
                    title={event.name}
                    date={dateString}
                    venue={event.venue_name || event.venue_city || 'Venue por confirmar'}
                    imageUrl={imageUrl}
                    eventId={event.id}
                    status={status}
                    sale_start_date={event.sale_start_date}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </>
  );
}

