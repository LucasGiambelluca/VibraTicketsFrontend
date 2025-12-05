import React from 'react';
import { Typography, Space, Grid } from 'antd';
import HomeBannerCarousel from '../components/HomeBannerCarousel';
import MainEvents from '../components/MainEvents';
import WhatsAppButton from '../components/WhatsAppButton';
import MinimalFooter from '../components/MinimalFooter';

const { Title, Text } = Typography;

export default function Home() {
  const screens = Grid.useBreakpoint();
  
  return (
    <>
      {/* Fondo Blanco Limpio */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'var(--bg-color)', // Blanco
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 64 }}>
        {/* Banner Carousel - Solo Desktop */}
        {screens.md && (
          <div style={{ paddingTop: 40 }}>
            <HomeBannerCarousel />
          </div>
        )}

        {/* Contenido Principal */}
        <div style={{ 
          maxWidth: 1400, 
          margin: '0 auto', 
          padding: screens.xs ? '40px 20px 60px' : (screens.md ? '40px 40px 80px' : '60px 40px 80px')
        }}>
          {/* Sección de Eventos */}
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Title 
                level={2} 
                style={{ 
                  fontSize: screens.xs ? '2rem' : '2.5rem',
                  fontWeight: 700,
                  marginBottom: 8,
                  color: 'var(--text-primary)'
                }}
              >
                Próximos Eventos
              </Title>
              <Text 
                style={{ 
                  fontSize: '1.1rem', 
                  color: 'var(--text-secondary)',
                  fontWeight: 400
                }}
              >
                Descubrí los mejores shows y encontrá tus entradas
              </Text>
            </div>
            
            <MainEvents />
          </Space>
        </div>
        
        {/* Footer */}
        <MinimalFooter />
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </>
  );
}
