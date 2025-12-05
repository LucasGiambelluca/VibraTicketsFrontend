import React, { useState, useEffect } from 'react';
import { Carousel, Button, Spin } from 'antd';
import { Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { homepageBannersApi } from '../services/apiService';
import { getImageUrl as getImageUtilUrl } from '../utils/imageUtils';



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
      
      if (bannersList.length > 0) {
        setBanners(bannersList);
      } else {
        // Placeholder con datos de ejemplo
        setBanners([{
          id: 0,
          title: 'Descubre los mejores eventos',
          description: 'Conciertos, festivales y más',
          event_date: 'Próximamente',
          venue: 'Múltiples ubicaciones',
          image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop',
          link_type: 'none'
        }]);
      }
    } catch (error) {
      console.error('❌ Error al cargar banners:', error);
      setBanners([{
        id: 0,
        title: 'Descubre los mejores eventos',
        description: 'Conciertos, festivales y más',
        event_date: 'Próximamente',
        venue: 'Múltiples ubicaciones',
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

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop';
    return getImageUtilUrl(imageUrl, 'Banner');
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 1400,
      margin: '0 auto',
      padding: '0 40px 60px'
    }}>
      <Carousel 
        autoplay 
        autoplaySpeed={5000}
        dots={true}
        style={{ 
          borderRadius: 'var(--border-radius)',
          overflow: 'hidden'
        }}
      >
        {banners.map((banner) => (
          <div key={banner.id}>
            <div
              style={{
                width: '100%',
                height: '400px',
                backgroundImage: `url(${getImageUrl(banner.image_url)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                cursor: banner.link_type !== 'none' ? 'pointer' : 'default',
                borderRadius: 'var(--border-radius)',
                overflow: 'hidden'
              }}
              onClick={() => handleBannerClick(banner)}
            >
              {/* Overlay gradient */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '40px'
              }}>
                {/* Event Info */}
                <div style={{
                  color: 'white',
                  maxWidth: '600px'
                }}>
                  <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: 'white',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {banner.title}
                  </h2>
                  
                  {banner.description && (
                    <p style={{
                      fontSize: '1.1rem',
                      margin: '0 0 20px 0',
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 400
                    }}>
                      {banner.description}
                    </p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                  }}>
                    {banner.event_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} />
                        <span style={{ fontSize: '0.95rem' }}>{banner.event_date}</span>
                      </div>
                    )}
                    {banner.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} />
                        <span style={{ fontSize: '0.95rem' }}>{banner.venue}</span>
                      </div>
                    )}
                  </div>

                  {banner.link_type !== 'none' && (
                    <Button
                      type="primary"
                      size="large"
                      style={{
                        background: 'white',
                        color: 'var(--primary-color)',
                        border: 'none',
                        borderRadius: 'var(--border-radius-sm)',
                        fontWeight: 600,
                        height: '48px',
                        padding: '0 32px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerClick(banner);
                      }}
                    >
                      Ingresar para comprar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default HomeBannerCarousel;
