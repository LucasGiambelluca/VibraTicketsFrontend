import React, { useState, useEffect } from 'react';
import { Carousel, Button, Spin } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homepageBannersApi } from '../services/apiService';
import { getImageUrl as getImageUtilUrl } from '../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vibratickets.online';

const HomeBannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      console.log('🔄 Cargando banners...');
      const response = await homepageBannersApi.getActiveBanners();
      console.log('✅ Respuesta de banners:', response);
      
      // Manejo flexible de la respuesta
      let bannersList = [];
      
      if (Array.isArray(response)) {
        bannersList = response;
      } else if (response?.banners && Array.isArray(response.banners)) {
        bannersList = response.banners;
      } else if (response?.data && Array.isArray(response.data)) {
        bannersList = response.data;
      } else if (response?.data?.banners && Array.isArray(response.data.banners)) {
        bannersList = response.data.banners;
      }
      
      console.log('📋 Banners procesados:', bannersList);
      
      // Si hay banners, usarlos; si no, usar placeholder
      if (bannersList.length > 0) {
        setBanners(bannersList);
      } else {
        console.log('⚠️ No hay banners activos, usando placeholder');
        setBanners([{
          id: 0,
          title: 'Descubre los mejores eventos',
          description: 'Conciertos, festivales y más',
          image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop',
          link_type: 'none'
        }]);
      }
    } catch (error) {
      console.error('❌ Error al cargar banners:', error);
      // Si falla, usar banner por defecto
      setBanners([{
        id: 0,
        title: 'Descubre los mejores eventos',
        description: 'Conciertos, festivales y más',
        image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop',
        link_type: 'none'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.link_type === 'event' && banner.event_id) {
      navigate(`/events/${banner.event_id}`);
    } else if (banner.link_type === 'external' && banner.link_url) {
      window.open(banner.link_url, '_blank');
    }
  };

  // Usar la función centralizada para obtener URL completa de la imagen
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop';
    return getImageUtilUrl(imageUrl, 'Banner');
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        backgroundImage: 'url(https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }} />
    );
  }

  return (
    <Carousel 
      autoplay 
      autoplaySpeed={20000}
      effect="fade"
      dots={{ className: 'custom-carousel-dots' }}
      style={{ width: '100%' }}
    >
      {banners.map((banner) => (
        <div key={banner.id}>
          <div
            style={{
              width: '100%',
              height: '600px',
              backgroundImage: `url(${getImageUrl(banner.image_url)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              cursor: banner.link_type !== 'none' ? 'pointer' : 'default',
              transition: 'transform 0.5s ease'
            }}
            onClick={() => handleBannerClick(banner)}
            onMouseEnter={(e) => {
              if (banner.link_type !== 'none') {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        </div>
      ))}
    </Carousel>
  );
};

export default HomeBannerCarousel;
