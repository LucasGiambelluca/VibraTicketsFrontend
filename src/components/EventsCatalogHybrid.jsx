import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Input, Select, DatePicker, Button, Space, Typography, Tag, Empty, Spin, Pagination } from 'antd';
import { Search, Calendar, MapPin, Filter, X, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEventsWithShows } from '../hooks/useEventsWithShows';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEventImageUrl } from '../utils/imageUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function EventsCatalogHybrid() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredCard, setHoveredCard] = useState(null);
  
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

  // Función para obtener precio mínimo del evento (mock por ahora)
  const getEventPrice = (event) => {
    const basePrices = [17000, 13000, 30000, 25000, 35000, 15000, 20000, 45000, 12000];
    const price = basePrices[event.id % basePrices.length] || 15000;
    return price.toLocaleString('es-AR');
  };

  // Ciudades únicas de los eventos
  const cities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
  
  // Categorías (placeholder - agregar cuando el backend lo soporte)
  const categories = ['Música', 'Teatro', 'Deportes', 'Conferencias', 'Festivales'];

  return (
    <>
      {/* Fondo Oscuro Premium */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        zIndex: 0
      }} />

      <div className="fade-in" style={{ 
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        paddingTop: '40px', // Reduced since App has padding, but we want some space
        paddingBottom: '40px',
        paddingLeft: '24px',
        paddingRight: '24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <Title level={1} style={{
            color: '#fff',
            fontSize: '3.5rem',
            marginBottom: 16,
            marginTop: 0,
            textShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            Descubrí Tu Próxima Experiencia
          </Title>
          <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}>
            Los mejores eventos, conciertos y espectáculos en un solo lugar
          </Text>
        </div>

        {/* Filtros Simplificados */}
        <div className="glass-card" style={{ 
          padding: '24px',
          marginBottom: 48,
          borderRadius: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <Input
              size="large"
              placeholder="Buscar por nombre, artista o venue..."
              prefix={<Search size={20} style={{ color: '#667eea' }} />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
              style={{ 
                borderRadius: 16,
                border: 'none',
                fontSize: '16px',
                padding: '12px 20px',
                height: '56px',
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            />
          </div>
          
          <Select
            size="large"
            placeholder="Ciudad"
            suffixIcon={<MapPin size={16} style={{ color: '#667eea' }} />}
            value={filters.city || undefined}
            onChange={(value) => handleFilterChange('city', value)}
            allowClear
            style={{ width: 200, height: 56 }}
            dropdownStyle={{ borderRadius: 16, padding: 8 }}
          >
            {cities.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>

          <Select
            size="large"
            placeholder="Categoría"
            suffixIcon={<Filter size={16} style={{ color: '#667eea' }} />}
            value={filters.category || undefined}
            onChange={(value) => handleFilterChange('category', value)}
            allowClear
            style={{ width: 200, height: 56 }}
            dropdownStyle={{ borderRadius: 16, padding: 8 }}
          >
            {categories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>

          {/* Date Range hidden behind a button or simplified if needed, keeping it for now but styled */}
          <RangePicker
            size="large"
            placeholder={['Desde', 'Hasta']}
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            style={{ 
              width: 260, 
              height: 56, 
              borderRadius: 16, 
              border: 'none',
              background: 'rgba(255,255,255,0.9)'
            }}
            separator={<span style={{ color: '#999' }}>→</span>}
          />
        </div>

        {/* Lista de Eventos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 24 }}>
              <Text style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>
                Buscando los mejores eventos...
              </Text>
            </div>
          </div>
        ) : !events || events.length === 0 ? (
          <div className="glass-card" style={{ 
            padding: '80px 40px',
            textAlign: 'center',
            borderRadius: 24
          }}>
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={16}>
                  <Text style={{ fontSize: 18, color: '#fff' }}>
                    No encontramos eventos que coincidan con tu búsqueda
                  </Text>
                  <Button 
                    type="primary" 
                    onClick={handleClearFilters}
                    style={{ 
                      background: '#fff', 
                      color: '#667eea',
                      border: 'none',
                      height: 40,
                      padding: '0 24px',
                      borderRadius: 20,
                      fontWeight: 600
                    }}
                  >
                    Ver todos los eventos
                  </Button>
                </Space>
              }
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {events.map((event) => {
                const hasShows = event.show_count > 0;
                const imageUrl = getEventImageUrl(event, 'square');
                
                let nextShowDate = null;
                try {
                  if (event.next_show_date) {
                    nextShowDate = new Date(event.next_show_date);
                    if (isNaN(nextShowDate.getTime())) nextShowDate = null;
                  }
                } catch (e) {
                  nextShowDate = null;
                }

                // Lógica de inicio de venta
                const now = new Date();
                const saleStartDate = event.sale_start_date ? new Date(event.sale_start_date) : null;
                const isSalePending = saleStartDate && saleStartDate > now;
                
                // Formatear fecha de inicio de venta
                const saleStartString = saleStartDate?.toLocaleString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div
                    key={event.id}
                    className="glass-card"
                    style={{
                      borderRadius: '24px',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      transform: hoveredCard === event.id ? 'translateY(-4px) scale(1.01)' : 'translateY(0)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={() => setHoveredCard(event.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleEventClick(event.id)}
                  >
                    <Row gutter={0} align="middle">
                      {/* Imagen del Evento */}
                      <Col xs={24} sm={8} md={6} lg={5}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '220px',
                          position: 'relative',
                          background: `linear-gradient(135deg, ${event.primary_color || '#667eea'}, ${event.secondary_color || '#764ba2'})`,
                          overflow: 'hidden'
                        }}>
                          <img
                            src={imageUrl}
                            alt={event.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.5s ease',
                              transform: hoveredCard === event.id ? 'scale(1.1)' : 'scale(1)'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)'
                          }} />
                        </div>
                      </Col>

                      {/* Información del Evento */}
                      <Col xs={24} sm={16} md={18} lg={19}>
                        <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                          <div style={{ flex: 1, minWidth: '280px' }}>
                            <div style={{ marginBottom: 12 }}>
                              {hasShows && !isSalePending ? (
                                <Tag color="#87d068" style={{ border: 'none', padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>DISPONIBLE</Tag>
                              ) : isSalePending ? (
                                <Tag color="#1890ff" style={{ border: 'none', padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>PRÓXIMAMENTE</Tag>
                              ) : (
                                <Tag color="#f50" style={{ border: 'none', padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>AGOTADO</Tag>
                              )}
                              {event.category && <Tag style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 12 }}>{event.category}</Tag>}
                            </div>
                            
                            <Title 
                              level={3} 
                              style={{ 
                                margin: '0 0 16px 0',
                                fontSize: '24px',
                                fontWeight: '800',
                                color: '#fff',
                                letterSpacing: '-0.5px'
                              }}
                            >
                              {event.name}
                            </Title>

                            <Space size={24} style={{ color: 'rgba(255,255,255,0.7)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={16} />
                                {event.venue_name || 'Venue por confirmar'}, {event.venue_city}
                              </span>
                              {nextShowDate && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Calendar size={16} />
                                  {nextShowDate.toLocaleDateString('es-AR', { 
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </span>
                              )}
                            </Space>
                          </div>

                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-end',
                            gap: '12px'
                          }}>
                            {hasShows && (
                              <div style={{ textAlign: 'right' }}>
                                <Text style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                                  Entradas desde
                                </Text>
                                <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                                  ${getEventPrice(event)}
                                </Text>
                              </div>
                            )}
                            
                            <Button
                              type="primary"
                              size="large"
                              disabled={!hasShows || isSalePending}
                              style={{
                                background: hasShows && !isSalePending ? '#fff' : 'rgba(255,255,255,0.1)',
                                color: hasShows && !isSalePending ? '#667eea' : 'rgba(255,255,255,0.5)',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '700',
                                height: '48px',
                                padding: '0 32px',
                                boxShadow: hasShows && !isSalePending ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
                              }}
                            >
                              {hasShows ? (isSalePending ? `VENTA: ${saleStartString}` : 'CONSEGUIR ENTRADAS') : 'PRÓXIMAMENTE'}
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ 
                marginTop: 48, 
                display: 'flex', 
                justifyContent: 'center'
              }}>
                <Pagination
                  current={pagination.currentPage}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  itemRender={(page, type, originalElement) => {
                    if (type === 'page') {
                      return <a style={{ 
                        color: pagination.currentPage === page ? '#fff' : 'rgba(255,255,255,0.6)',
                        background: pagination.currentPage === page ? '#667eea' : 'transparent',
                        borderRadius: '8px',
                        border: 'none'
                      }}>{page}</a>;
                    }
                    return originalElement;
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
}
