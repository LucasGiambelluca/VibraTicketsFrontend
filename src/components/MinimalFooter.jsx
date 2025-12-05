import React from 'react';
import { Layout, Row, Col, Space, Typography } from 'antd';
import { Instagram, Twitter, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/VibraTicketLogo2.png';

const { Footer } = Layout;
const { Text, Title } = Typography;

/**
 * MinimalFooter - Footer rediseñado estilo Enigma Tickets
 * Simple, centrado, minimalista
 */
export default function MinimalFooter() {
  return (
    <Footer 
      style={{ 
        background: 'var(--bg-tertiary)', // #FAFAFA
        padding: '60px 24px',
        marginTop: 80,
        textAlign: 'center',
        borderTop: '1px solid var(--border-light)'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Call to Action */}
          <Title 
            level={3} 
            style={{ 
              margin: 0,
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          >
            ¿Qué estás esperando? Comprá tus tickets
          </Title>

          {/* Logo y Redes Sociales */}
          <Space size="large" style={{ justifyContent: 'center', display: 'flex' }}>
            <img 
              src={logo} 
              alt="VibraTickets Logo" 
              style={{ 
                height: 40,
                objectFit: 'contain'
              }} 
            />
            
            <Space size="middle">
              <a 
                href="https://instagram.com/vibratickets" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: 24,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Instagram size={24} />
              </a>
              
              <a 
                href="https://twitter.com/vibratickets" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: 24,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Twitter size={24} />
              </a>
              
              <a 
                href="https://wa.me/5491234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: 24,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <MessageCircle size={24} />
              </a>
            </Space>
          </Space>

          {/* Links Legales */}
          <Space 
            size="large" 
            split={<span style={{ color: 'var(--border-color)' }}>|</span>}
            style={{ justifyContent: 'center', display: 'flex', flexWrap: 'wrap' }}
          >
            <Link 
              to="/terms" 
              style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Términos y Condiciones
            </Link>
            
            <Link 
              to="/privacy" 
              style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Políticas de Privacidad
            </Link>
            
            <a 
              href="https://www.argentina.gob.ar/aaip/datospersonales/reclama" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Botón de Arrepentimiento
            </a>
          </Space>

          {/* Copyright */}
          <Text 
            style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '0.85rem',
              display: 'block',
              marginTop: 16
            }}
          >
            © {new Date().getFullYear()} VibraTickets. Todos los derechos reservados.
          </Text>
        </Space>
      </div>
    </Footer>
  );
}
