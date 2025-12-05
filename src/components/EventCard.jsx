import React from 'react';
import { Card, Tag, Button, Space } from 'antd';
import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEventImageUrl } from '../utils/imageUtils';

/**
 * EventCard - Componente minimalista para mostrar eventos
 * Diseñado según el estilo de Enigma Tickets
 */
export default function EventCard({ 
  type = 'normal',
  title,
  date,
  venue,
  imageUrl,
  eventId,
  price,
  status = 'available',
  sale_start_date
}) {
  const isFeatured = type === 'featured';
  const imageHeight = isFeatured ? 300 : 200;
  
  // Formatear fecha si viene como Date object
  const formattedDate = typeof date === 'string' 
    ? date 
    : date?.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

  // Lógica de inicio de venta
  const now = new Date();
  const saleStartDate = sale_start_date ? new Date(sale_start_date) : null;
  const isSalePending = saleStartDate && saleStartDate > now;

  const isAvailable = status === 'available' && !isSalePending;
  const isSoldOut = status === 'sold_out';

  // Formatear fecha de inicio de venta
  const saleStartString = saleStartDate?.toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card
      hoverable
      cover={
        <div 
          style={{ 
            height: imageHeight,
            background: imageUrl 
              ? `url(${imageUrl})` 
              : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          {/* Status badge */}
          {isSoldOut && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: '#ff4d4f',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              AGOTADO
            </div>
          )}
          
          {/* Coming Soon badge */}
          {isSalePending && !isSoldOut && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: '#1890ff',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              PRÓXIMAMENTE
            </div>
          )}
        </div>
      }
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease'
      }}
      bodyStyle={{
        padding: isFeatured ? '24px' : '20px'
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Title */}
        <h3 style={{
          fontSize: isFeatured ? '1.5rem' : '1.25rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.3
        }}>
          {title}
        </h3>

        {/* Metadata */}
        <Space direction={isFeatured ? 'vertical' : 'horizontal'} size="small" style={{ width: '100%' }}>
          <Space size="small">
            <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {formattedDate}
            </span>
          </Space>
          
          <Space size="small">
            <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {venue}
            </span>
          </Space>
        </Space>

        {/* Price */}
        {price && (
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            Desde ${typeof price === 'number' ? price.toLocaleString() : price}
          </div>
        )}

        {/* CTA Button */}
        <Link to={`/events/${eventId}`} style={{ display: 'block', width: '100%' }}>
          <Button
            type="primary"
            size={isFeatured ? 'large' : 'middle'}
            disabled={isSoldOut || isSalePending}
            style={{
              width: '100%',
              background: isSoldOut ? '#CCCCCC' : (isSalePending ? '#f0f2f5' : 'var(--primary-color)'),
              color: isSalePending ? '#595959' : 'white',
              border: isSalePending ? '1px solid #d9d9d9' : 'none',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 500,
              height: isFeatured ? '48px' : '40px'
            }}
          >
            {isSoldOut ? 'Agotado' : (isSalePending ? `Venta inicia: ${saleStartString}` : 'Ingresar para comprar')}
          </Button>
        </Link>
      </Space>
    </Card>
  );
}
