import React, { useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Spin, Empty, Typography } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEventsWithShows } from '../hooks/useEventsWithShows';
import { getEventImageUrl } from '../utils/imageUtils';

const { Text, Title } = Typography;

export default function MainEvents() {
  const navigate = useNavigate();
  const { events, loading, error } = useEventsWithShows({
    page: 1,
    limit: 12,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Cargar Google Fonts para eventos con fuentes personalizadas
  useEffect(() => {
    if (events && events.length > 0) {
      const uniqueFonts = new Set();
      events.forEach(event => {
        if (event.font_family && event.font_family !== 'inherit') {
          const fontName = event.font_family.replace(/[\"']/g, '').split(',')[0].trim();
          uniqueFonts.add(fontName);
        }
      });
      
      uniqueFonts.forEach(fontName => {
        const existingLink = document.querySelector(`link[href*="${fontName.replace(/ /g, '+')}"]`);
        if (!existingLink) {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });
    }
  }, [events]);

  const handleEventClick = (event) => {
    navigate(`/events/${event.id}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: '1rem', color: '#6b7280' }}>
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
          <Text style={{ color: '#6b7280' }}>
            No hay eventos disponibles en este momento.
          </Text>
        } />
      </div>
    );
  }

  return (
    <Row gutter={[32, 32]}>
      {events.map((event) => {
        const hasShows = event.show_count > 0;
        
        // Obtener la Última fecha del último show (en vez de la próxima)
        let lastShowDate = null;
        try {
          // Priorizar last_show_date si viene del backend
          if (event.last_show_date) {
            lastShowDate = new Date(event.last_show_date);
            if (isNaN(lastShowDate.getTime())) lastShowDate = null;
          } else if (event.next_show_date) {
            // Fallback a next_show_date si no hay last_show_date
            lastShowDate = new Date(event.next_show_date);
            if (isNaN(lastShowDate.getTime())) lastShowDate = null;
          }
        } catch (e) {
          lastShowDate = null;
        }
        
        // Estilos personalizados del evento (colores y tipografía)
        const primaryColor = event.primary_color || '#4F46E5';
        const secondaryColor = event.secondary_color || '#818CF8';
        const textColor = event.text_color || '#1F2937';
        const fontFamily = event.font_family || 'inherit';
        
        // Descripción truncada
        const description = event.description || '';
        const maxDescLength = 100;
        const truncatedDesc = description.length > maxDescLength 
          ? description.substring(0, maxDescLength) + '...' 
          : description;

        // Obtener URL de imagen con fallbacks y placeholder
        const imageUrl = getEventImageUrl(event, 'square');

        return (
          <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
            <Card
              hoverable
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                height: '100%'
              }}
              bodyStyle={{ 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              cover={
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '100%',
                    paddingBottom: '100%', // Aspect ratio 1:1 CUADRADO
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  <img
                    alt={event.name}
                    src={imageUrl}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {/* Tag de disponibilidad */}
                  <Tag
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      background: hasShows ? primaryColor : '#E5E7EB',
                      color: hasShows ? 'white' : '#9CA3AF',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    {hasShows ? '✓ Disponible' : 'Próximamente'}
                  </Tag>
                </div>
              }
            >
              {/* Nombre del evento */}
              <Title 
                level={4} 
                style={{ 
                  margin: 0,
                  fontSize: '1.1rem',
                  fontFamily: fontFamily,
                  color: textColor,
                  fontWeight: '700',
                  lineHeight: '1.3',
                  minHeight: '2.6rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer'
                }}
                onClick={() => handleEventClick(event)}
              >
                {event.name}
              </Title>

              {/* Venue */}
              {(event.venue_name || event.venue_city) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <EnvironmentOutlined style={{ color: primaryColor, fontSize: '14px' }} />
                  <Text style={{ 
                    fontSize: '0.85rem', 
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {event.venue_name || event.venue_city || 'Venue por confirmar'}
                  </Text>
                </div>
              )}

              {/* Fecha */}
              {lastShowDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarOutlined style={{ color: primaryColor, fontSize: '14px' }} />
                  <Text style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {lastShowDate.toLocaleDateString('es-AR', { 
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </div>
              )}

              {/* Botón */}
              <Button
                type="primary"
                block
                size="large"
                disabled={!hasShows}
                onClick={() => handleEventClick(event)}
                style={{
                  marginTop: '8px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  height: '42px',
                  background: hasShows 
                    ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                    : '#E5E7EB',
                  border: 'none',
                  color: hasShows ? 'white' : '#9CA3AF'
                }}
              >
                {hasShows ? 'Ver Entradas' : 'Próximamente'}
              </Button>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
