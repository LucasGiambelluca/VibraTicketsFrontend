import { useState, useEffect } from 'react';
import { adminApi, paymentsApi } from '../services/apiService';

/**
 * Hook para manejar la integración completa con Mercado Pago
 * Incluye funciones de admin (config) y cliente (pagos)
 */
export const useMercadoPago = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // ============================================
  // FUNCIONES DE ADMIN - Configuración
  // ============================================

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getMercadoPagoConfig();
      setConfig(response);
    } catch (err) {
      setError(err.message);
      console.error('Error loading MercadoPago config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (credentials) => {
    try {
      setLoading(true);
      await adminApi.setMercadoPagoConfig(credentials);
      await loadConfig(); // Recargar configuración
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await adminApi.testMercadoPagoConnection();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES DE CLIENTE - Pagos
  // ============================================

  /**
   * Crear preferencia de pago con sistema de reservas (NUEVO)
   * @param {Array} reservationIds - IDs de las reservas
   * @param {Object} payerInfo - Información del pagador
   * @param {Object} backUrls - URLs de retorno (success, failure, pending)
   * @returns {Promise<Object>} - { preferenceId, initPoint, totalAmount, ... }
   */
  const createPaymentPreference = async (reservationIds, payerInfo, backUrls) => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        reservationIds,
        payer: {
          name: payerInfo.name,
          surname: payerInfo.surname,
          email: payerInfo.email,
          phone: {
            area_code: payerInfo.areaCode || '11',
            number: payerInfo.phone
          },
          identification: {
            type: payerInfo.idType || 'DNI',
            number: payerInfo.idNumber
          },
          address: payerInfo.address ? {
            street_name: payerInfo.address.street,
            street_number: payerInfo.address.number,
            zip_code: payerInfo.address.zipCode
          } : undefined
        },
        backUrls: {
          success: backUrls.success || `${window.location.origin}/payment/success`,
          failure: backUrls.failure || `${window.location.origin}/payment/failure`,
          pending: backUrls.pending || `${window.location.origin}/payment/pending`
        }
      };

      const response = await paymentsApi.createPreferenceReservation(paymentData);
      
      return response;
    } catch (err) {
      setError(err.message || 'Error al crear preferencia de pago');
      console.error('Error creating payment preference:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Redirigir al usuario a Mercado Pago
   * @param {string} initPoint - URL de Mercado Pago
   */
  const redirectToMercadoPago = (initPoint) => {
    if (!initPoint) {
      throw new Error('initPoint es requerido');
    }
    window.location.href = initPoint;
  };

  /**
   * Verificar estado de un pago
   * @param {number} orderId - ID de la orden
   * @returns {Promise<Object>} - Estado del pago
   */
  const checkPaymentStatus = async (orderId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentsApi.getPaymentStatus(orderId);
      
      setPaymentStatus(response);
      return response;
    } catch (err) {
      setError(err.message || 'Error al verificar estado de pago');
      console.error('Error checking payment status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Procesar reembolso (solo admin)
   * @param {number} orderId - ID de la orden
   * @param {Object} refundData - { amount?, reason? }
   * @returns {Promise<Object>} - Resultado del reembolso
   */
  const processRefund = async (orderId, refundData = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentsApi.refundPayment(orderId, refundData);
      
      return response;
    } catch (err) {
      setError(err.message || 'Error al procesar reembolso');
      console.error('Error processing refund:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuración al montar (solo si es admin)
  useEffect(() => {
    // Solo cargar config si es necesario (admin)
    // loadConfig();
  }, []);

  return {
    // Estados
    config,
    loading,
    error,
    paymentStatus,

    // Funciones de Admin
    loadConfig,
    saveConfig,
    testConnection,
    refetch: loadConfig,

    // Funciones de Cliente (Pagos)
    createPaymentPreference,
    redirectToMercadoPago,
    checkPaymentStatus,
    processRefund
  };
};
