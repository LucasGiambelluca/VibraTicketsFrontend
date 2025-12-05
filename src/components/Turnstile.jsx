import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

/**
 * Cloudflare Turnstile component - simpler alternative to reCAPTCHA
 * No domain whitelisting needed, better UX
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback when verification succeeds
 * @param {Function} props.onError - Callback when verification fails
 * @param {Function} props.onExpire - Callback when token expires
 * @param {string} props.theme - Theme: 'light', 'dark', 'auto' (default: 'light')
 * @param {string} props.size - Size: 'normal', 'compact' (default: 'normal')
 */
const TurnstileWidget = forwardRef(({ 
  onSuccess, 
  onError,
  onExpire,
  theme = 'light',
  size = 'normal'
}, ref) => {
  const turnstileRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    },
    remove: () => {
      if (turnstileRef.current) {
        turnstileRef.current.remove();
      }
    }
  }));

  // Validate site key exists
  console.log('🔍 Turnstile - Checking siteKey:', siteKey);
  console.log('🔍 All env vars:', import.meta.env);
  
  if (!siteKey) {
    console.error('❌ VITE_TURNSTILE_SITE_KEY no está configurada en .env');
    return (
      <div style={{ 
        padding: '12px 16px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: 8,
        color: '#856404',
        fontSize: '0.85rem',
        marginBottom: 16
      }}>
        ⚠️ Turnstile no configurado. Agrega <code>VITE_TURNSTILE_SITE_KEY</code> en tu archivo .env
        <br />
        <small>Debug: siteKey = {String(siteKey)}</small>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme,
          size
        }}
      />
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
