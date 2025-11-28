import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Button, Input, Tag, Spin, Empty, Typography, Menu, Select, Drawer } from 'antd';
import { SearchOutlined, InfoCircleOutlined, EnvironmentOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEventsWithShows } from '../hooks/useEventsWithShows';
import { getEventImageUrl } from '../utils/imageUtils';

const { Text, Title } = Typography;
const { Search } = Input;

// Categorías laterales como en TicketBahía
const categories = [
  { key: 'all', label: 'Todos', icon: null },
  { key: 'theater', label: 'Teatro', icon: null },
  { key: 'concerts', label: 'Conciertos', icon: null },
  { key: 'shows', label: 'Shows', icon: null },
  { key: 'family', label: 'Familia', icon: null },
  { key: 'sports', label: 'Deportes', icon: null },
  { key: 'festivals', label: 'Festivales', icon: null },
  { key: 'conferences', label: 'Conferencias', icon: null },
];

export default function EventsCatalogTicketBahia() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const { events, loading, error } = useEventsWithShows({
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    status: 'active'
  });

  // Filtrar eventos basado en búsqueda y categoría
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    let filtered = [...events];
    
    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.venue_name && event.venue_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.venue_city && event.venue_city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtro por categoría (por ahora basado en el nombre del evento)
    if (selectedCategory !== 'all') {
      // Esta lógica se puede mejorar cuando tengamos categorías reales en el backend
      filtered = filtered.filter(event => {
        const eventNameLower = event.name.toLowerCase();
        switch(selectedCategory) {
          case 'theater':
            return eventNameLower.includes('teatro') || eventNameLower.includes('obra');
          case 'concerts':
            return eventNameLower.includes('concierto') || eventNameLower.includes('música') || 
                   eventNameLower.includes('banda') || eventNameLower.includes('recital');
          case 'shows':
            return eventNameLower.includes('show') || eventNameLower.includes('espectáculo');
          case 'family':
            return eventNameLower.includes('infantil') || eventNameLower.includes('niños') || 
                   eventNameLower.includes('familia');
          case 'sports':
            return eventNameLower.includes('deporte') || eventNameLower.includes('fútbol') || 
                   eventNameLower.includes('partido');
          case 'festivals':
            return eventNameLower.includes('festival') || eventNameLower.includes('fest');
          case 'conferences':
            return eventNameLower.includes('conferencia') || eventNameLower.includes('charla') || 
                   eventNameLower.includes('seminario');
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [events, searchTerm, selectedCategory]);

  const handleEventClick = (event) => {
    navigate(`/events/${event.id}`);
  };

  // Función para obtener precio mínimo del evento (mock por ahora)
  const getEventPrice = (event) => {
    // Esto es un mock - deberías obtener el precio real del backend
    const basePrices = [17000, 13000, 30000, 25000, 35000, 15000, 20000];
    const price = basePrices[event.id % basePrices.length] || 15000;
    return price.toLocaleString('es-AR');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', minHeight: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: '1rem', color: '#6b7280' }}>
            Cargando eventos...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Text type="warning">⚠️ Error al cargar eventos: {error}</Text>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f0f0f0'
    }}>
      <Row style={{ minHeight: '100vh' }}>
        {/* Sidebar de Categorías */}
        <Col 
          xs={0} 
          sm={0} 
          md={5} 
          lg={4}
          style={{
            background: 'white',
            borderRight: '1px solid #e8e8e8',
            paddingTop: '20px'
          }}
        >
          <div style={{ padding: '0 20px', marginBottom: '20px' }}>
            <Title level={4} style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Categorías
            </Title>
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedCategory]}
            style={{
              border: 'none',
              background: 'transparent'
            }}
            onClick={({ key }) => setSelectedCategory(key)}
          >
            {categories.map(cat => (
              <Menu.Item 
                key={cat.key}
                style={{
                  fontSize: '14px',
                  height: '42px',
                  lineHeight: '42px',
                  marginBottom: '2px',
                  borderRadius: '0',
                  transition: 'all 0.2s'
                }}
              >
                {cat.label}
              </Menu.Item>
            ))}
          </Menu>
        </Col>

        {/* Contenido Principal */}
        <Col xs={24} sm={24} md={19} lg={20}>
          <div style={{ padding: '24px' }}>
            {/* Barra de Búsqueda y Categorías para móvil */}
            <div style={{ 
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={16}>
                  <Search
                    placeholder="Buscar eventos"
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%'
                    }}
                    prefix={<SearchOutlined style={{ color: '#999' }} />}
                  />
                </Col>
                <Col xs={24} md={0}>
                  <Select
                    size="large"
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    style={{ width: '100%' }}
                    placeholder="Seleccionar categoría"
                  >
                    {categories.map(cat => (
                      <Select.Option key={cat.key} value={cat.key}>
                        {cat.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </div>

            {/* Lista de Eventos */}
            {filteredEvents.length === 0 ? (
              <Empty 
                description="No se encontraron eventos"
                style={{ 
                  background: 'white',
                  padding: '60px 20px',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredEvents.map((event) => {
                  const hasShows = event.show_count > 0;
                  const imageUrl = getEventImageUrl(event, 'square');
                  
                  return (
                    <div
                      key={event.id}
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: hoveredCard === event.id ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        transform: hoveredCard === event.id ? 'translateY(-2px)' : 'translateY(0)'
                      }}
                      onMouseEnter={() => setHoveredCard(event.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => handleEventClick(event)}
                    >
                      <Row gutter={0} align="middle">
                        {/* Imagen del Evento */}
                        <Col xs={8} sm={6} md={5} lg={4}>
                          <div style={{
                            width: '100%',
                            paddingBottom: '100%',
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
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        </Col>

                        {/* Información del Evento */}
                        <Col xs={16} sm={18} md={19} lg={20}>
                          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              {/* Título del Evento */}
                              <Title 
                                level={4} 
                                style={{ 
                                  margin: '0 0 8px 0',
                                  fontSize: '16px',
                                  fontWeight: '700',
                                  color: '#333',
                                  fontFamily: 'Arial, sans-serif',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                {event.name.toUpperCase()}
                              </Title>

                              {/* Venue y Ubicación */}
                              <div style={{ marginBottom: '8px' }}>
                                <Text style={{ 
                                  fontSize: '13px',
                                  color: '#666',
                                  marginRight: '20px'
                                }}>
                                  <InfoCircleOutlined style={{ marginRight: '6px', color: '#9e9e9e', fontSize: '12px' }} />
                                  {event.venue_name || 'VENUE POR CONFIRMAR'}
                                </Text>
                                {event.venue_city && (
                                  <Text style={{ 
                                    fontSize: '13px',
                                    color: '#666'
                                  }}>
                                    <EnvironmentOutlined style={{ marginRight: '6px', color: '#9e9e9e', fontSize: '12px' }} />
                                    {event.venue_city.toUpperCase()}
                                  </Text>
                                )}
                              </div>

                              {/* Fecha del próximo show */}
                              {event.next_show_date && (
                                <Text style={{ 
                                  fontSize: '13px',
                                  color: '#999',
                                  display: 'block'
                                }}>
                                  {new Date(event.next_show_date).toLocaleDateString('es-AR', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Text>
                              )}
                            </div>

                            {/* Precio y Botón */}
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              gap: '12px',
                              minWidth: '140px'
                            }}>
                              {hasShows && (
                                <div style={{ textAlign: 'center' }}>
                                  <Text style={{ 
                                    fontSize: '11px',
                                    color: '#888',
                                    display: 'block',
                                    marginBottom: '2px'
                                  }}>
                                    ENTRADAS DESDE
                                  </Text>
                                  <Text style={{ 
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    color: '#f44336',
                                    lineHeight: '1'
                                  }}>
                                    <sup style={{ fontSize: '14px' }}>$</sup>{getEventPrice(event)}
                                  </Text>
                                </div>
                              )}
                              
                              <Button
                                type="primary"
                                size="middle"
                                disabled={!hasShows}
                                style={{
                                  background: hasShows ? '#4dd0e1' : '#ccc',
                                  borderColor: hasShows ? '#4dd0e1' : '#ccc',
                                  borderRadius: '3px',
                                  fontWeight: '600',
                                  fontSize: '12px',
                                  padding: '6px 24px',
                                  height: '32px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  boxShadow: hasShows ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                              >
                                {hasShows ? 'MÁS INFO' : 'PRÓXIMAMENTE'}
                              </Button>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
