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
 * @param {Function} props.onError - Callback opcional para manejar errores
 * @param {string} props.size - Tamaño del botón ('small', 'middle', 'large')
 * @param {boolean} props.block - Si el botón ocupa todo el ancho
 */
export default function MercadoPagoButton({ 
  holdId, 
  payer, 
  onError,
  size = 'large',
  block = true 
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!holdId) {
      const error = new Error('No se proporcionó un ID de reserva válido');
      message.error(error.message);
      if (onError) onError(error);
      return;
    }

    if (!payer || !payer.email) {
      const error = new Error('Debe proporcionar información del pagador');
      message.error(error.message);
      if (onError) onError(error);
      return;
    }

    setLoading(true);
    const loadingMessage = message.loading('Creando preferencia de pago...', 0);

    try {
      // 1) Crear ORDER desde el HOLD (requerido por backend)
      const orderResp = await ordersApi.createOrder({ holdId: parseInt(holdId) }, true);
      const orderId = orderResp?.id || orderResp?.orderId || orderResp?.data?.id || orderResp?.data?.orderId;
      if (!orderId) {
        throw new Error('No se pudo crear la orden. Intentalo nuevamente.');
      }

      // Guardar para pantallas de resultado
      try { localStorage.setItem('lastOrderId', String(orderId)); } catch {}

      // Preparar backUrls con orderId para redirección después del pago
      const backUrls = {
        success: `${window.location.origin}/payment/success?orderId=${orderId}`,
        failure: `${window.location.origin}/payment/failure?orderId=${orderId}`,
        pending: `${window.location.origin}/payment/pending?orderId=${orderId}`
      };

      const payerPayload = {
        email: payer.email,
        name: payer.name || 'Usuario',
        surname: payer.surname || 'VibraTicket',
        first_name: payer.name || 'Usuario', // compat
        last_name: payer.surname || 'VibraTicket', // compat
        phone: {
          area_code: String(payer.areaCode || '11'),
          number: String(payer.phone || '1234567890')
        },
        identification: {
          type: payer.idType || 'DNI',
          number: String(payer.idNumber || '12345678')
        },
        // Campos planos adicionales por compatibilidad con backends legacy
        areaCode: String(payer.areaCode || '11'),
        idType: payer.idType || 'DNI',
        idNumber: String(payer.idNumber || '12345678'),
        ...(payer.address && {
          address: {
            street: payer.address,
            number: String(payer.addressNumber || '123'),
            zip_code: String(payer.zipCode || '1234')
          }
        })
      };

      // 2) Crear preferencia de pago con orderId (nuevo requisito backend)
      const response = await paymentsApi.createPaymentPreference({
        orderId: parseInt(orderId),
        payer: payerPayload,
        backUrls
      }, true);
      
      // Obtener init_point (URL de redirección a MercadoPago)
      const initPoint = response?.initPoint || 
                       response?.init_point || 
                       response?.sandboxInitPoint || 
                       response?.sandbox_init_point;

      if (!initPoint) {
        throw new Error('El backend no devolvió una URL de pago válida (init_point)');
      }

      // Cerrar mensaje de loading
      loadingMessage();
      message.success('Redirigiendo a Mercado Pago...', 1.5);

      // Redirigir a Mercado Pago Checkout Pro
      setTimeout(() => {
        try {
          window.location.href = initPoint;
          } catch (redirectError) {
          console.error('❌ Error al intentar redirigir:', redirectError);
          message.error('Error al redirigir a MercadoPago. Intenta abrir en nueva pestaña.');
          // Fallback: abrir en nueva pestaña
          window.open(initPoint, '_blank');
        }
      }, 1500);

    } catch (error) {
      // Cerrar mensaje de loading
      loadingMessage();
      
      console.error('❌ Error creando preferencia de pago:', error);
      try {
        console.error('❌ Error response:', JSON.stringify(error.response, null, 2));
      } catch {
        console.error('❌ Error response (raw object):', error.response);
      }

      let errorMessage = 'Error al procesar el pago. Por favor, intenta nuevamente.';

      if (error.status === 401) {
        errorMessage = 'Usuario no autenticado. Por favor, inicia sesión.';
      } else if (error.status === 404) {
        errorMessage = 'Reserva/orden no encontrada o expirada.';
      } else if (error.status === 409) {
        // Conflictos frecuentes
        if (error.response?.error === 'SeatsInOtherOrders') {
          const seats = error.response?.seats || [];
          const seatList = seats.map(s => s.seatId || s.id).join(', ');
          errorMessage = `Algunos asientos ya están en otra orden activa (${seatList}). Volvé a la selección y elegí otros asientos o esperá a que la orden ${seats[0]?.blockedByOrderId || ''} se libere.`;
        } else if (error.response?.error === 'HoldExpired') {
          errorMessage = 'Tu reserva temporal (HOLD) expiró. Por favor, volvé a seleccionar asientos.';
        } else if (error.response?.error === 'HoldAlreadyUsed') {
          errorMessage = 'El HOLD ya fue utilizado para crear una orden. Recargá la página o volvé a seleccionar asientos.';
        } else {
          errorMessage = 'Conflicto al crear la orden de compra. Intentá nuevamente.';
        }
      } else if (error.response?.message) {
        errorMessage = error.response.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage, 5);
      
      if (onError) onError(error);
      setLoading(false);
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
