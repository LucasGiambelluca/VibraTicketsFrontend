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
  discountAmount,
  onError,
  form, // Ant Design Form instance for validation
  size = 'large',
  block = true 
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    console.log('=== INICIO PROCESO DE PAGO ===');
    console.log('holdId recibido:', holdId);
    console.log('payer recibido:', payer);
    console.log('totalAmount:', totalAmount);
    console.log('💰 DESCUENTO - discountCode:', discountCode);
    console.log('💰 DESCUENTO - discountAmount:', discountAmount);
    
    if (!holdId) {
      const error = new Error('No se proporcionó un ID de reserva válido');
      console.error('ERROR: holdId no válido');
      message.error(error.message);
      if (onError) onError(error);
      return;
    }

    // Validar formulario si se proporciona
    if (form) {
      try {
        await form.validateFields();
      } catch (error) {
        console.error('❌ Error de validación:', error);
        message.error('Por favor completa todos los campos requeridos.');
        return;
      }
    }

    if (!payer || !payer.email) {
      const error = new Error('Debe proporcionar información del pagador');
      console.error('ERROR: Información del pagador inválida');
      message.error(error.message);
      if (onError) onError(error);
      return;
    }

    setLoading(true);
    const loadingMessage = message.loading('Creando preferencia de pago...', 0);

    try {
      // Paso 1: Crear orden con descuento opcional
      
      // 1) Crear ORDER desde el HOLD con descuento opcional (según guía oficial)
      const createOrderPayload = { 
        holdId: parseInt(holdId)
      };
      
      // Agregar código de descuento si existe
      // Enviar en AMBOS formatos para compatibilidad
      if (discountCode && discountCode.trim()) {
        const codeFormatted = discountCode.trim().toUpperCase();
        createOrderPayload.discountCode = codeFormatted;  // camelCase
        createOrderPayload.discount_code = codeFormatted; // snake_case
        console.log('✅ Código de descuento agregado al payload:', codeFormatted);
      } else {
        console.log('⚠️ No hay código de descuento para aplicar');
      }
      
      console.log('📦 Payload para crear orden:', JSON.stringify(createOrderPayload, null, 2));
      
      const orderResp = await ordersApi.createOrder(createOrderPayload, true);
      
      console.log('📥 Respuesta del backend al crear orden:');
      console.log('- orderId:', orderResp?.id || orderResp?.orderId);
      console.log('- totalCents:', orderResp?.totalCents || orderResp?.total_cents);
      console.log('- subtotalCents:', orderResp?.subtotalCents || orderResp?.subtotal_cents);
      console.log('- discountApplied:', orderResp?.discount);
      console.log('- Respuesta completa:', JSON.stringify(orderResp, null, 2));
      
      const orderId = orderResp?.id || orderResp?.orderId || orderResp?.data?.id || orderResp?.data?.orderId;
      
      if (!orderId) {
        console.error('ERROR: No se pudo extraer orderId de la respuesta:', orderResp);
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

      // 2) Crear preferencia de pago con orderId
      // IMPORTANTE: El backend lee el descuento desde la orden.
      // NO enviar discountAmount ni totalAmount aquí.
      const preferencePayload = {
        orderId: parseInt(orderId),
        payer: payerPayload,
        customerEmail: payer.email,
        customerName: `${payer.name || 'Usuario'} ${payer.surname || 'VibraTicket'}`,
        backUrls
      };

      // El descuento ya está aplicado en la orden.
      // El backend calculará el total correcto automáticamente.
      
      const response = await paymentsApi.createPaymentPreference(preferencePayload, true);
      
      // Obtener init_point (URL de redirección a MercadoPago)
      // Intentar múltiples ubicaciones posibles en el response
      const initPoint = response?.initPoint || 
                       response?.init_point || 
                       response?.sandboxInitPoint || 
                       response?.sandbox_init_point ||
                       response?.data?.initPoint ||
                       response?.data?.init_point ||
                       response?.data?.sandboxInitPoint ||
                       response?.data?.sandbox_init_point ||
                       response?.preference?.initPoint ||
                       response?.preference?.init_point;

      if (!initPoint) {
        throw new Error('No se pudo obtener el enlace de pago. Intentá nuevamente.');
      }

      // Obtener totalAmount del backend (viene en centavos)
      const totalAmountFromBackend = response?.totalAmount;
      
      if (totalAmountFromBackend) {
        const totalEnMoneda = (totalAmountFromBackend / 100).toFixed(2);
        
        // Mostrar el total final al usuario
        loadingMessage();
        message.success(`Total a pagar: $${totalEnMoneda}. Redirigiendo a Mercado Pago...`, 2);
      } else {
        // Si no viene totalAmount, usar el mensaje anterior
        loadingMessage();
        message.success('Redirigiendo a Mercado Pago...', 1.5);
      }

      // Paso 3: Redirigir a MercadoPago
      window.location.href = initPoint;

    } catch (error) {
      // Cerrar mensaje de loading
      loadingMessage();

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
