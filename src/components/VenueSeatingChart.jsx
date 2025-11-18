import React from 'react';
import { Card, Badge, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Componente visual para mostrar un mapa de secciones del venue
 * Muestra las secciones de forma gráfica con información de disponibilidad
 */
const VenueSeatingChart = ({ sections, selectedQuantities, onSectionClick }) => {
  if (!sections || sections.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, background: '#f5f5f5', borderRadius: 8 }}>
        <Text type="secondary">No hay secciones configuradas para este show</Text>
      </div>
    );
  }

  // Obtener el escenario (si existe en los datos)
  const hasStage = sections.some(s => s.sector?.toLowerCase().includes('escenario'));

  // Función para obtener el color según disponibilidad
  const getSectionColor = (section, quantity) => {
    const selected = quantity > 0;
    const availableSeats = section.available_seats || 0;
    const isSoldOut = availableSeats === 0;

    if (selected) return '#1890ff'; // Azul para seleccionadas
    if (isSoldOut) return '#d9d9d9'; // Gris para agotadas
    if (availableSeats < 20) return '#ff7875'; // Rojo claro para pocas
    if (availableSeats < 50) return '#ffa940'; // Naranja para limitadas
    return '#52c41a'; // Verde para muchas disponibles
  };

  // Función para obtener el tamaño de la sección según capacidad
  const getSectionSize = (section) => {
    const capacity = section.capacity || section.max_capacity || 100;
    if (capacity > 200) return { width: 180, height: 120 };
    if (capacity > 100) return { width: 150, height: 100 };
    return { width: 120, height: 80 };
  };

  // Organizar secciones en una cuadrícula
  const gridColumns = Math.ceil(Math.sqrt(sections.length));

  return (
    <div style={{ width: '100%' }}>
      {/* Escenario */}
      {hasStage && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px',
          textAlign: 'center',
          borderRadius: '8px 8px 0 0',
          marginBottom: 24,
          fontWeight: 'bold',
          fontSize: '1.1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          🎭 ESCENARIO
        </div>
      )}

      {/* Mapa de Secciones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: 16,
        padding: 24,
        background: '#fafafa',
        borderRadius: 8,
        minHeight: 400
      }}>
        {sections.map((section) => {
          const sectionId = String(section.id);
          const quantity = selectedQuantities[sectionId] || 0;
          const availableSeats = section.available_seats || 0;
          const isSoldOut = availableSeats === 0;
          const isSelected = quantity > 0;
          const size = getSectionSize(section);
          const color = getSectionColor(section, quantity);

          return (
            <div
              key={section.id}
              onClick={() => !isSoldOut && onSectionClick && onSectionClick(section)}
              style={{
                ...size,
                background: color,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: isSoldOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected 
                  ? '0 8px 24px rgba(24, 144, 255, 0.35)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
                border: isSelected ? '3px solid #0050b3' : '2px solid transparent',
                opacity: isSoldOut ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSoldOut) {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isSelected ? 'scale(1.05)' : 'scale(1)';
                e.currentTarget.style.boxShadow = isSelected 
                  ? '0 8px 24px rgba(24, 144, 255, 0.35)'
                  : '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              {/* Badge de selección */}
              {isSelected && (
                <Badge
                  count={quantity}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#0050b3',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                />
              )}

              {/* Icono de estado */}
              {!isSoldOut && (
                <CheckCircleOutlined 
                  style={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'white',
                    fontSize: '1.2rem',
                    opacity: isSelected ? 1 : 0.5
                  }} 
                />
              )}
              {isSoldOut && (
                <CloseCircleOutlined 
                  style={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: '#999',
                    fontSize: '1.2rem'
                  }} 
                />
              )}

              {/* Nombre de la sección */}
              <Text 
                strong 
                style={{ 
                  color: 'white',
                  fontSize: '1rem',
                  marginBottom: 8,
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {section.name || section.sector || `Sección ${section.id}`}
              </Text>

              {/* Asientos disponibles */}
              {!isSoldOut && (
                <Space direction="vertical" align="center" size={2}>
                  <Text 
                    style={{ 
                      color: 'white',
                      fontSize: '0.85rem',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {availableSeats} disponibles
                  </Text>
                  <Text 
                    style={{ 
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    ${((section.price_cents || section.priceCents || 0) / 100).toLocaleString()}
                  </Text>
                </Space>
              )}

              {/* Estado agotado */}
              {isSoldOut && (
                <Tag 
                  color="default"
                  style={{ 
                    marginTop: 8,
                    fontWeight: 'bold'
                  }}
                >
                  AGOTADO
                </Tag>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div style={{ 
        marginTop: 24,
        padding: 16,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <Text strong style={{ marginRight: 16 }}>Leyenda:</Text>
        <Space wrap>
          <Space>
            <div style={{ width: 20, height: 20, background: '#1890ff', borderRadius: 4 }} />
            <Text style={{ fontSize: '0.9rem' }}>Seleccionada</Text>
          </Space>
          <Space>
            <div style={{ width: 20, height: 20, background: '#52c41a', borderRadius: 4 }} />
            <Text style={{ fontSize: '0.9rem' }}>Disponible</Text>
          </Space>
          <Space>
            <div style={{ width: 20, height: 20, background: '#ffa940', borderRadius: 4 }} />
            <Text style={{ fontSize: '0.9rem' }}>Limitadas</Text>
          </Space>
          <Space>
            <div style={{ width: 20, height: 20, background: '#ff7875', borderRadius: 4 }} />
            <Text style={{ fontSize: '0.9rem' }}>Pocas</Text>
          </Space>
          <Space>
            <div style={{ width: 20, height: 20, background: '#d9d9d9', borderRadius: 4 }} />
            <Text style={{ fontSize: '0.9rem' }}>Agotada</Text>
          </Space>
        </Space>
      </div>
    </div>
  );
};

export default VenueSeatingChart;
