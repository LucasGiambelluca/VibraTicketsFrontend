import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Space, Button, Alert, Spin } from 'antd';
import { EnvironmentOutlined, CompassOutlined, CarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Componente de mapa de Google Maps para mostrar la ubicación de un venue
 * 
 * @param {Object} venue - Objeto del venue con address, latitude, longitude
 * @param {number} height - Altura del mapa en píxeles (default: 400)
 * @param {boolean} showDirections - Mostrar botón de direcciones (default: true)
 */
export default function VenueMap({ venue, height = 400, showDirections = true }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coordenadas por defecto (Buenos Aires, Argentina)
  const defaultLat = -34.6037;
  const defaultLng = -58.3816;

  // Usar coordenadas del venue o geocodificar la dirección
  const latitude = venue?.latitude || defaultLat;
  const longitude = venue?.longitude || defaultLng;
  const address = venue?.address || venue?.name || 'Ubicación no disponible';

  useEffect(() => {
    // Verificar si Google Maps está disponible
    if (!window.google) {
      setError('Google Maps no está disponible. Verifica tu API Key.');
      setLoading(false);
      return;
    }

    try {
      // Crear el mapa
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Crear marcador
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance,
        title: venue?.name || 'Venue',
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#667eea',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Crear InfoWindow
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 16px;">
              ${venue?.name || 'Venue'}
            </h3>
            <p style="margin: 0; color: #666; font-size: 14px;">
              ${address}
            </p>
          </div>
        `
      });

      // Abrir InfoWindow al hacer click en el marcador
      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      // Abrir InfoWindow por defecto
      infoWindow.open(mapInstance, marker);

      setMap(mapInstance);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar Google Maps:', err);
      setError('Error al cargar el mapa. Intenta nuevamente.');
      setLoading(false);
    }
  }, [venue, latitude, longitude, address]);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const handleOpenInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <Card 
        style={{ borderRadius: 16, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: 16, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ fontSize: 20, color: '#667eea' }} />
              <Title level={4} style={{ margin: 0 }}>Ubicación</Title>
            </div>
            <Text type="secondary">{address}</Text>
          </Space>
        </div>
        
        <div style={{ 
          height: height, 
          background: '#f0f2f5', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center'
        }}>
          <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>No se pudo cargar el mapa interactivo</Text>
            <Text type="secondary">Pero podés ver la ubicación directamente en Google Maps</Text>
          </div>
          <Button 
            type="primary" 
            icon={<EnvironmentOutlined />}
            onClick={handleOpenInMaps}
            style={{ background: '#667eea', border: 'none' }}
          >
            Abrir en Google Maps
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      style={{ borderRadius: 16, overflow: 'hidden' }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header del mapa */}
      <div style={{ padding: 16, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ fontSize: 20, color: '#667eea' }} />
            <Title level={4} style={{ margin: 0 }}>
              Ubicación
            </Title>
          </div>
          <Text type="secondary">{address}</Text>
        </Space>
      </div>

      {/* Mapa */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.9)',
            zIndex: 10
          }}>
            <Spin size="large" tip="Cargando mapa..." />
          </div>
        )}
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: `${height}px`,
            background: '#e5e3df'
          }} 
        />
      </div>

      {/* Botones de acción */}
      {showDirections && (
        <div style={{ padding: 16, background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
          <Space size="middle" wrap>
            <Button 
              type="primary" 
              icon={<CompassOutlined />}
              onClick={handleGetDirections}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Cómo llegar
            </Button>
            <Button 
              icon={<CarOutlined />}
              onClick={handleOpenInMaps}
            >
              Abrir en Google Maps
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );
}
