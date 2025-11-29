import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Select, DatePicker, Button, Space, Typography, Tag, Empty, Spin, Pagination, Skeleton } from 'antd';
import { SearchOutlined, CalendarOutlined, EnvironmentOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEventsWithShows } from '../hooks/useEventsWithShows';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventImageUrl } from '../utils/imageUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function EventsCatalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    dateRange: null,
    status: 'active',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 12
  });

  const { events, loading, pagination, loadEvents } = useEventsWithShows(filters);

  useEffect(() => {
    loadEvents(filters);
  }, [filters]);

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

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // Actualizar URL params
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.category) params.set('category', newFilters.category);
    params.set('page', newFilters.page);
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      city: '',
      category: '',
      dateRange: null,
      status: 'active',
      page: 1,
      limit: 12
    };
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // Ciudades únicas de los eventos
  const cities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
  
  // Categorías (placeholder - agregar cuando el backend lo soporte)
  const categories = ['Música', 'Teatro', 'Deportes', 'Conferencias', 'Festivales'];

  return (
    <div className="events-catalog-container" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea05 0%, #764ba205 100%)',
      paddingTop: '100px',
      paddingBottom: '40px',
      paddingLeft: '24px',
      paddingRight: '24px'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <Title level={1} className="events-catalog-title" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '3rem',
            marginBottom: 12,
            marginTop: 0
          }}>
            Todos los Eventos
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Descubrí los mejores eventos en Argentina
          </Text>
        </div>

        {/* Filtros */}
        <div className="events-filters-container" style={{ 
          background: 'white',
          borderRadius: 24,
          padding: '32px',
          marginBottom: 40,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12)',
          border: '1px solid rgba(102, 126, 234, 0.08)'
        }}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            
            {/* Búsqueda Principal */}
            <Input
              className="events-search-input"
              size="large"
              placeholder="Buscar eventos por nombre..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
              style={{ 
                borderRadius: 16,
                border: '2px solid #f0f0f0',
                fontSize: '16px',
                padding: '12px 20px',
                height: 'auto',
                transition: 'all 0.3s ease',
                boxShadow: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#f0f0f0';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Filtros adicionales */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Select
                  size="large"
                  placeholder="📍 Ciudad"
                  value={filters.city || undefined}
                  onChange={(value) => handleFilterChange('city', value)}
                  allowClear
                  style={{ 
                    width: '100%',
                    borderRadius: 12
                  }}
                >
                  {cities.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Select
                  size="large"
                  placeholder="🎭 Categoría"
                  value={filters.category || undefined}
                  onChange={(value) => handleFilterChange('category', value)}
                  allowClear
                  style={{ 
                    width: '100%',
                    borderRadius: 12
                  }}
                >
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <RangePicker
                  size="large"
                  placeholder={['📅 Fecha desde', 'Fecha hasta']}
                  value={filters.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                  style={{ 
                    width: '100%',
                    borderRadius: 12
                  }}
                  format="DD/MM/YYYY"
                />
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Button
                  size="large"
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  block
                  style={{
                    borderRadius: 12,
                    height: 48,
                    border: '2px solid #f0f0f0',
                    color: '#666',
                    fontWeight: 500
                  }}
                >
                  Limpiar
                </Button>
              </Col>
            </Row>

            {/* Contador de resultados */}
            <div style={{ 
              textAlign: 'center',
              padding: '12px 0',
              borderTop: '1px solid #f0f0f0',
              marginTop: 8
            }}>
              <Text style={{ 
                color: '#667eea',
                fontSize: '15px',
                fontWeight: 500
              }}>
                {loading ? '🔄 Buscando...' : `✨ ${pagination?.total || events.length} eventos encontrados`}
              </Text>
            </div>

          </Space>
        </div>

        {/* Grid de Eventos */}
        {loading ? (
          <Row gutter={[24, 24]}>
            {[...Array(8)].map((_, i) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <Card 
                  bordered={false}
                  style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'none' }} 
                  bodyStyle={{ padding: 0 }}
                >
                  <div style={{ height: 200, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton.Image active style={{ transform: 'scale(1.5)' }} />
                  </div>
                  <div style={{ padding: 16 }}>
                    <Skeleton active title={false} paragraph={{ rows: 2, width: ['90%', '60%'] }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : events.length === 0 ? (
          <Empty
            description="No se encontraron eventos"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 60 }}
          >
            <Button type="primary" onClick={handleClearFilters}>
              Ver todos los eventos
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {events.map(event => {
                const hasShows = event.show_count > 0;
                
                // Obtener URL de imagen con fallbacks y placeholder
                const imageUrl = getEventImageUrl(event, 'square');
                
                // Obtener la Última fecha del último show (en vez de la próxima)
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
                
                // Estilos personalizados del evento
                const primaryColor = event.primary_color || '#4F46E5';
                const secondaryColor = event.secondary_color || '#818CF8';
                const textColor = event.text_color || '#1F2937';
                const fontFamily = event.font_family || 'inherit';
                
                // Descripción truncada
                const description = event.description || '';
                const maxDescLength = 80;
                const truncatedDesc = description.length > maxDescLength 
                  ? description.substring(0, maxDescLength) + '...' 
                  : description;

                return (
                  <Col xs={24} sm={12} lg={8} xl={6} key={event.id}>
                    <div
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer',
                        background: 'white',
                        height: '100%',
                        position: 'relative'
                      }}
                      onClick={() => handleEventClick(event.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                    >
                      {/* Imagen que ocupa toda la card */}
                      <div style={{ 
                        position: 'relative', 
                        width: '100%',
                        paddingBottom: '140%', // Aspect ratio más alto (similar a AllAccess)
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        overflow: 'hidden'
                      }}>
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
                            transition: 'transform 0.4s ease'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        />
                        {/* Overlay oscuro sutil */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
                          pointerEvents: 'none'
                        }} />
                        {/* Tag de disponibilidad */}
                        <Tag
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            background: hasShows ? primaryColor : '#E5E7EB',
                            color: hasShows ? 'white' : '#9CA3AF',
                            border: 'none'
                          }}
                        >
                          {hasShows ? 'Disponible' : 'Próximamente'}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Pagination
                  current={filters.page}
                  total={pagination.total}
                  pageSize={filters.limit}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total) => `Total ${total} eventos`}
                />
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
