import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

/**
 * Componente ReCAPTCHA v2 reutilizable
 * 
 * @param {Object} props
 * @param {Function} props.onChange - Callback cuando cambia el valor del captcha
 * @param {Function} props.onExpired - Callback cuando expira el captcha
 * @param {Function} props.onError - Callback cuando hay un error
 * @param {string} props.theme - Tema del captcha: 'light' o 'dark' (default: 'light')
 * @param {string} props.size - Tamaño: 'normal', 'compact' (default: 'normal')
 */
const ReCaptcha = forwardRef(({ 
  onChange, 
  onExpired, 
  onError,
  theme = 'light',
  size = 'normal'
}, ref) => {
  const recaptchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Exponer métodos al componente padre mediante ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    },
    getValue: () => {
      if (recaptchaRef.current) {
        return recaptchaRef.current.getValue();
      }
      return null;
    },
    execute: () => {
      if (recaptchaRef.current) {
        return recaptchaRef.current.execute();
      }
      return null;
    }
  }));

  // Validar que existe la site key
  if (!siteKey) {
    console.error('❌ VITE_RECAPTCHA_SITE_KEY no está configurada en .env');
    return (
      <div style={{ 
        padding: '12px 16px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: 8,
        color: '#856404',
        fontSize: '0.85rem'
      }}>
        ⚠️ reCAPTCHA no configurado. Agrega <code>VITE_RECAPTCHA_SITE_KEY</code> en tu archivo .env
      </div>
    );
  }

  const handleChange = (token) => {
    if (onChange) {
      onChange(token);
    }
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
  };

  const handleError = () => {
    console.error('❌ Error en reCAPTCHA');
    if (onError) {
      onError();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={handleExpired}
        onErrored={handleError}
        theme={theme}
        size={size}
      />
    </div>
  );
});

ReCaptcha.displayName = 'ReCaptcha';

export default ReCaptcha;
