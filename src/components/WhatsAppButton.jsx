import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * WhatsAppButton - Botón flotante de WhatsApp
 * Diseñado según el estilo de Enigma Tickets
 */
export default function WhatsAppButton({ phoneNumber = '5491234567890', message = 'Hola! Tengo una consulta sobre VibraTickets' }) {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'var(--accent-color)', // #25D366
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
        cursor: 'pointer',
        zIndex: 999,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
      }}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle 
        size={30} 
        color="white" 
      />
    </button>
  );
}
