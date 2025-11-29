import React from 'react';
import { Typography, Space, Grid } from 'antd';
import HomeBannerCarousel from '../components/HomeBannerCarousel';
import SearchBar from '../components/SearchEvents';
import MainEvents from '../components/MainEvents';
import '../components/HomeBannerCarousel.css';

const { Title, Text } = Typography;

export default function Home() {
  const screens = Grid.useBreakpoint();
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

      <div className="fade-in" style={{ position: 'relative', zIndex: 1 }}>
        {/* Banner Carousel */}
        <HomeBannerCarousel />

        {/* Contenido Principal */}
        <div style={{ 
          maxWidth: 1400, 
          margin: '0 auto', 
          padding: '40px 24px 60px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Barra de Búsqueda */}
          {/* Barra de Búsqueda */}
          <div style={{ 
            marginBottom: '48px',
            maxWidth: '800px',
            margin: screens.xs ? '0 auto 32px' : '-30px auto 48px', // Reset negative margin on mobile
            position: 'relative',
            zIndex: 10
          }}>
            <div className="glass-card" style={{ padding: screens.xs ? '16px' : '24px', borderRadius: '16px' }}>
              <SearchBar />
            </div>
          </div>

          {/* Sección de Eventos */}
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title 
                level={2} 
                style={{ 
                  fontSize: screens.xs ? '2rem' : '3rem',
                  fontWeight: 800,
                  marginBottom: 8,
                  background: 'linear-gradient(45deg, #fff, #e0e0e0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                Próximos Eventos
              </Title>
              <Text 
                style={{ 
                  fontSize: '1.2rem', 
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 300
                }}
              >
                Descubrí los mejores shows y encontrá tus entradas
              </Text>
            </div>
            <MainEvents />
          </Space>
        </div>
      </div>
    </>
  );
}
