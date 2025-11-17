import React from 'react';
import { Typography, Space } from 'antd';
import HomeBannerCarousel from '../components/HomeBannerCarousel';
import SearchBar from '../components/SearchEvents';
import MainEvents from '../components/MainEvents';
import '../components/HomeBannerCarousel.css';

const { Title, Text } = Typography;

export default function Home() {
  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
      {/* Banner Carousel */}
      <HomeBannerCarousel />

      {/* Contenido Principal */}
      <div style={{ 
        maxWidth: 1280, 
        margin: '0 auto', 
        padding: '40px 24px 60px',
        position: 'relative'
      }}>
        {/* Barra de Búsqueda */}
        <div style={{ 
          marginBottom: '48px',
          maxWidth: '800px',
          margin: '0 auto 48px'
        }}>
          <SearchBar />
        </div>

        {/* Sección de Eventos */}
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title 
              level={2} 
              style={{ 
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: 8,
                color: '#1F2937'
              }}
            >
              Próximos Eventos
            </Title>
            <Text 
              style={{ 
                fontSize: '1.1rem', 
                color: '#4B5563',
              }}
            >
              Descubrí los mejores shows y encontrá tus entradas
            </Text>
          </div>
          <MainEvents />
        </Space>
      </div>
    </div>
  );
}
