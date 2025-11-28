import { useState } from 'react';
import { discountService } from '../services/discountService';

/**
 * Hook personalizado para manejo de códigos de descuento
 * Alineado con la guía oficial de integración
 */
export const useDiscountCode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discount, setDiscount] = useState(null);

  /**
   * Valida un código de descuento
   * @param {string} code - Código de descuento
   * @param {number} orderTotal - Total de la orden en centavos
   * @param {number} eventId - ID del evento (opcional)
   * @param {number} showId - ID del show (opcional)
   * @returns {Promise<Object|null>} Datos del descuento o null si inválido
   */
  const validateDiscount = async (code, orderTotal, eventId, showId) => {
    if (!code || !code.trim()) {
      setError('Ingresa un código de descuento');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await discountService.validateCode({
        code: code.trim().toUpperCase(),
        orderTotal,
        eventId,
        showId
      });

      if (response.success && response.discount) {
        // Convertir montos de centavos a pesos
        const discountData = {
          ...response.discount,
          // Montos en pesos para display
          discountAmountPesos: response.discount.discountAmount / 100,
          originalTotalPesos: response.discount.originalTotal / 100,
          finalTotalPesos: response.discount.finalTotal / 100,
          savingsPesos: response.discount.savings / 100,
          // Montos originales en centavos
          discountAmount: response.discount.discountAmount,
          originalTotal: response.discount.originalTotal,
          finalTotal: response.discount.finalTotal,
          savings: response.discount.savings
        };
        
        setDiscount(discountData);
        return discountData;
      } else {
        // Manejar respuesta con success: false
        handleErrorResponse(response);
        return null;
      }
    } catch (err) {
      // Manejar errores HTTP
      handleHttpError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica la disponibilidad de un código sin aplicarlo
   * @param {string} code - Código de descuento
   * @returns {Promise<Object|null>} Información del código o null
   */
  const checkAvailability = async (code) => {
    if (!code || !code.trim()) {
      return null;
    }

    try {
      const response = await discountService.checkAvailability(code);
      
      if (response.success) {
        return {
          available: response.available,
          discount: response.discount,
          reason: response.reason,
          expiredAt: response.expiredAt
        };
      }
      
      return null;
    } catch (err) {
      return null;
    }
  };

  /**
   * Obtiene el historial de descuentos del usuario
   * @returns {Promise<Array>} Lista de descuentos usados
   */
  const getHistory = async () => {
    try {
      const response = await discountService.getMyHistory();
      return response.success ? response.history : [];
    } catch (err) {
      return [];
    }
  };

  /**
   * Limpia el descuento actual
   */
  const clearDiscount = () => {
    setDiscount(null);
    setError(null);
  };

  /**
   * Maneja errores de respuesta con success: false
   */
  const handleErrorResponse = (response) => {
    const errorCode = response.code;
    let errorMessage = response.message || 'Código inválido';

    switch (errorCode) {
      case 'INVALID_DISCOUNT_CODE':
        errorMessage = 'El código ingresado no es válido o ha expirado';
        break;
      case 'MINIMUM_PURCHASE_NOT_MET':
        // El mensaje ya viene con el monto mínimo del backend
        break;
      case 'USER_USAGE_LIMIT_REACHED':
        errorMessage = 'Ya utilizaste este código anteriormente';
        break;
      case 'CODE_USAGE_LIMIT_REACHED':
        errorMessage = 'Este código ya alcanzó su límite de usos';
        break;
    }

    setError(errorMessage);
    setDiscount(null);
  };

  /**
   * Maneja errores HTTP
   */
  const handleHttpError = (err) => {
    let errorMessage = 'Error al validar el código';
    const status = err.response?.status;
    const errorCode = err.response?.data?.code;

    if (status === 401) {
      errorMessage = 'Debes iniciar sesión para usar códigos de descuento';
    } else if (status === 400) {
      switch (errorCode) {
        case 'INVALID_DISCOUNT_CODE':
          errorMessage = 'El código ingresado no es válido o ha expirado';
          break;
        case 'MINIMUM_PURCHASE_NOT_MET':
          errorMessage = err.response.data.message || 'No se alcanza el monto mínimo';
          break;
        case 'USER_USAGE_LIMIT_REACHED':
          errorMessage = 'Ya utilizaste este código anteriormente';
          break;
        case 'CODE_USAGE_LIMIT_REACHED':
          errorMessage = 'Este código ya alcanzó su límite de usos';
          break;
        default:
          errorMessage = err.response.data.message || 'Código inválido';
      }
    } else if (status === 404) {
      errorMessage = 'Servicio de descuentos no disponible';
    } else if (status === 500) {
      errorMessage = 'Error del servidor. Intenta nuevamente';
    } else if (!err.response) {
      errorMessage = 'Error de conexión. Verifica tu internet';
    }

    setError(errorMessage);
    setDiscount(null);
  };

  return {
    // Estados
    discount,
    loading,
    error,
    // Funciones
    validateDiscount,
    checkAvailability,
    getHistory,
    clearDiscount,
    // Helpers
    hasDiscount: !!discount,
    savingsAmount: discount?.savingsPesos || 0,
    discountPercentage: discount?.savingsPercentage || '0'
  };
};

export default useDiscountCode;
