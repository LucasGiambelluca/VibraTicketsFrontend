import React, { useState } from 'react';
import { Button, message } from 'antd';
import { ShoppingCartOutlined, LockOutlined } from '@ant-design/icons';
import { paymentsApi, ordersApi } from '../services/apiService';

/**
 * Componente reutilizable para botón de pago con Mercado Pago
 * 
 * @param {Object} props
 * @param {number|string} props.holdId - ID del hold/reserva
 * @param {Object} props.payer - Información del pagador (name, surname, email, phone, etc.)
 * @param {number} props.totalAmount - Monto total a pagar (incluyendo service charge y descuentos)
 * @param {string} props.discountCode - Código de descuento aplicado (opcional)
 * @param {number} props.discountAmount - Monto del descuento aplicado (opcional)
 * @param {Function} props.onError - Callback opcional para manejar errores
 * @param {string} props.size - Tamaño del botón ('small', 'middle', 'large')
 * @param {boolean} props.block - Si el botón ocupa todo el ancho
 */
export default function MercadoPagoButton({ 
  holdId, 
  payer,
  totalAmount,
  discountCode,
  discountAmount,
  onError,
  onLoadingChange, // Callback to sync loading state with parent
  form, // Ant Design Form instance for validation
  captchaToken, // reCAPTCHA token for bot protection
  size = 'large',
  block = true 
}) {
  const [loading, setLoading] = useState(false);
  
  // Sync loading state with parent
  React.useEffect(() => {
    if (onLoadingChange) onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  // Reset loading state when page is restored from bfcache (back button)
  React.useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        setLoading(false);
        // Limpiar flag de redirección si vuelven con el botón atrás
        try {
          sessionStorage.removeItem('mp_redirecting');
        } catch {}
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    
    // Also reset on mount just in case
    setLoading(false);
    try {
      sessionStorage.removeItem('mp_redirecting');
    } catch {}

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleClick = async () => {
    // Prevenir múltiples clicks si ya estamos redirigiendo
    if (sessionStorage.getItem('mp_redirecting') === 'true') {
      message.warning('Redirigiendo a Mercado Pago, por favor espera...');
      return;
    }

    console.log('=== INICIO PROCESO DE PAGO ===');
    
    // Turnstile temporalmente desactivado
    /* if (captchaToken === null) {
      message.error('Por favor completa el reCAPTCHA');
      return;
    } */
    
    // 1. Obtener datos del pagador (priorizar form si existe)
    let currentPayer = payer;
    
    if (form) {
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        currentPayer = {
          name: values.name,
          surname: values.surname,
          email: values.email,
          phone: values.phone,
          areaCode: values.areaCode,
          idType: values.idType,
          idNumber: values.idNumber,
          ...payer // Mantener otros datos que no estén en el form
        };
      } catch (error) {
        console.error('❌ Error de validación:', error);
        message.error('Por favor completa todos los campos requeridos.');
        return;
      }
    }

    console.log('holdId recibido:', holdId);
    console.log('payer procesado:', currentPayer);
    console.log('totalAmount esperado:', totalAmount);
    
    if (!holdId) {
      const error = new Error('No se proporcionó un ID de reserva válido');
      message.error(error.message);
      if (onError) onError(error);
      return;
    }

    if (!currentPayer || !currentPayer.email) {
      const error = new Error('Debe proporcionar información del pagador');
      message.error(error.message);
      if (onError) onError(error);
      return;
    }

    setLoading(true);
    const loadingMessage = message.loading('Creando preferencia de pago...', 0);

    try {
      // Paso 1: Crear orden con descuento opcional
      const createOrderPayload = { 
        holdId: parseInt(holdId)
      };
      
      if (discountCode && discountCode.trim()) {
        const codeFormatted = discountCode.trim().toUpperCase();
        createOrderPayload.discountCode = codeFormatted;
        createOrderPayload.discount_code = codeFormatted;
      }
      
      const orderResp = await ordersApi.createOrder(createOrderPayload, true);
      const orderId = orderResp?.id || orderResp?.orderId || orderResp?.data?.id || orderResp?.data?.orderId;
      
      if (!orderId) {
        throw new Error('No se pudo crear la orden. Intentalo nuevamente.');
      }

      try { localStorage.setItem('lastOrderId', String(orderId)); } catch {}

      const backUrls = {
        success: `${window.location.origin}/payment/success?orderId=${orderId}`,
        failure: `${window.location.origin}/payment/failure?orderId=${orderId}`,
        pending: `${window.location.origin}/payment/pending?orderId=${orderId}`
      };

      const payerPayload = {
        email: currentPayer.email,
        name: currentPayer.name || 'Usuario',
        surname: currentPayer.surname || 'VibraTicket',
        first_name: currentPayer.name || 'Usuario',
        last_name: currentPayer.surname || 'VibraTicket',
        phone: {
          area_code: String(currentPayer.areaCode || '11'),
          number: String(currentPayer.phone || '1234567890')
        },
        identification: {
          type: currentPayer.idType || 'DNI',
          number: String(currentPayer.idNumber || '12345678')
        },
        areaCode: String(currentPayer.areaCode || '11'),
        idType: currentPayer.idType || 'DNI',
        idNumber: String(currentPayer.idNumber || '12345678')
      };

      // 2) Crear preferencia de pago
      const preferencePayload = {
        orderId: parseInt(orderId),
        payer: payerPayload,
        customerEmail: currentPayer.email,
        customerName: `${currentPayer.name || 'Usuario'} ${currentPayer.surname || 'VibraTicket'}`,
        backUrls
      };

      const response = await paymentsApi.createPaymentPreference(preferencePayload, true);
      
      const initPoint = response?.initPoint || 
                       response?.init_point || 
                       response?.sandboxInitPoint || 
                       response?.sandbox_init_point ||
                       response?.data?.initPoint ||
                       response?.data?.init_point ||
                       response?.preference?.initPoint;

      if (!initPoint) {
        throw new Error('No se pudo obtener el enlace de pago.');
      }

      // VALIDACIÓN DE MONTO (Critical Fix)
      const totalAmountFromBackend = response?.totalAmount; // En centavos
      
      if (totalAmountFromBackend && totalAmount) {
        // Backend envía centavos. Frontend tiene pesos (totalAmount).
        // Convertir backend a pesos para comparar
        const backendPesos = totalAmountFromBackend / 100;
        
        // Si hay una diferencia mayor al 10% (tolerancia por redondeo), alertar
        if (Math.abs(backendPesos - totalAmount) > (totalAmount * 0.1)) {
          console.error(`⚠️ DISCREPANCIA DE MONTOS: Backend=$${backendPesos}, Frontend=$${totalAmount}`);
          
          // Detectar error de factor 100 (Backend envía $12 en vez de $1200)
          if (Math.abs(backendPesos * 100 - totalAmount) < 5) {
             console.warn('⚠️ Detectado posible error de centavos en backend (factor 100)');
             // Aquí podríamos bloquear, pero el usuario quiere pagar. 
             // Mostramos advertencia pero permitimos (o bloqueamos si es crítico).
             // Dado que el usuario se quejó, mejor bloqueamos y avisamos.
             loadingMessage(); // Cerrar loading
             message.error(`Error de configuración en el servidor: El monto a cobrar ($${backendPesos}) no coincide con el total ($${totalAmount}). Por favor contactá a soporte.`);
             setLoading(false);
             return; 
          }
        }
      }

      loadingMessage();
      message.success('Redirigiendo a Mercado Pago...', 1.5);

      // Paso 3: Marcar como "redirecting" y limpiar datos guardados
      try {
        sessionStorage.setItem('mp_redirecting', 'true');
        // Clear saved form data since payment is starting
        localStorage.removeItem('vibratickets_checkout_form');
      } catch {}

      // Redirigir a MercadoPago
      setTimeout(() => {
        window.location.href = initPoint;
      }, 300); // Pequeño delay para que el mensaje se vea

    } catch (error) {
      loadingMessage();
      console.error('Error en proceso de pago:', error);

      let errorMessage = 'Error al procesar el pago. Por favor, intenta nuevamente.';

      if (error.status === 401) {
        errorMessage = 'Usuario no autenticado. Por favor, inicia sesión.';
      } else if (error.status === 409) {
        if (error.response?.error === 'SeatsInOtherOrders') {
           errorMessage = 'Algunos asientos ya están en otra orden activa.';
        } else if (error.response?.error === 'HoldExpired') {
           errorMessage = 'Tu reserva temporal expiró.';
        } else {
           errorMessage = 'Conflicto al crear la orden. Intentá nuevamente.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage, 5);
      if (onError) onError(error);
      setLoading(false);
      
      // Limpiar flag de redirección en caso de error para permitir reintentar
      try {
        sessionStorage.removeItem('mp_redirecting');
      } catch {}
    }
  };

  return (
    <Button
      type="primary"
      size={size}
      block={block}
      loading={loading}
      onClick={handleClick}
      icon={<LockOutlined />}
      style={{
        background: 'linear-gradient(90deg, #009EE3, #0084C7)',
        border: 'none',
        height: size === 'large' ? 48 : undefined,
        fontSize: size === 'large' ? 16 : undefined,
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0, 158, 227, 0.3)'
      }}
    >
      {loading ? 'Redirigiendo...' : (
        <>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          Pagar con Mercado Pago
        </>
      )}
    </Button>
  );
}
