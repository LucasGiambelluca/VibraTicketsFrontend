import { apiClient } from '../api/client.js';

// Servicio para gestión de códigos de descuento
// ALINEADO CON LA GUÍA DE INTEGRACIÓN OFICIAL
export const discountService = {
  // ====== ENDPOINTS DE USUARIO ======
  
  // 1. Validar Código de Descuento en Checkout
  validateCode: async (validationData) => {
    const { code, orderTotal, eventId, showId } = validationData;
    const payload = {
      code: code.trim().toUpperCase(),
      orderTotal: orderTotal || 0,
      eventId: eventId || undefined,
      showId: showId || undefined
    };

    const response = await apiClient.post('/api/discount-codes/validate', payload);
    return response; // { success, discount: {...} }
  },

  // 2. Verificar Disponibilidad de un Código
  checkAvailability: async (code) => {
    if (!code) throw new Error('El código no puede estar vacío');
    const response = await apiClient.get(`/api/discount-codes/check-availability/${code.trim().toUpperCase()}`);
    return response; // { success, available, discount/reason }
  },

  // 3. Historial de Descuentos del Usuario
  getMyHistory: async () => {
    const response = await apiClient.get('/api/discount-codes/my-history');
    return response; // { success, history: [...] }
  },

  // ====== ENDPOINTS DE ADMINISTRACIÓN (Solo ADMIN) ======
  
  // 4. Crear Código de Descuento
  createCode: async (codeData) => {
    const payload = {
      code: codeData.code.toUpperCase(),
      description: codeData.description,
      discountType: codeData.discountType, // PERCENTAGE o FIXED_AMOUNT
      discountValue: codeData.discountValue,
      minimumPurchase: codeData.minimumPurchase || undefined,
      maximumDiscount: codeData.maximumDiscount || undefined,
      usageLimit: codeData.usageLimit || undefined,
      usageLimitPerUser: codeData.usageLimitPerUser || 1,
      validFrom: codeData.validFrom || undefined,
      validUntil: codeData.validUntil || undefined,
      applicableTo: codeData.applicableTo || 'ALL',
      restrictions: codeData.restrictions || []
    };

    const response = await apiClient.post('/api/discount-codes', payload);
    return response; // { success, message, discount: {id, code} }
  },

  // 5. Listar Códigos de Descuento
  listCodes: async (params = {}) => {
    // Parámetros: page, limit, includeExpired
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.includeExpired !== undefined) queryParams.append('includeExpired', params.includeExpired);
    
    const response = await apiClient.get(`/api/discount-codes?${queryParams}`);
    return response; // { success, codes: [...], pagination: {...} }
  },

  // 6. Actualizar Código de Descuento
  updateCode: async (codeId, updateData) => {
    // Convertir valores monetarios de pesos a la unidad esperada por el backend
    const payload = {
      description: updateData.description,
      discount_value: updateData.discountValue,
      minimum_purchase_amount: updateData.minimumPurchase,
      maximum_discount_amount: updateData.maximumDiscount,
      usage_limit: updateData.usageLimit,
      usage_limit_per_user: updateData.usageLimitPerUser,
      valid_until: updateData.validUntil,
      is_active: updateData.isActive
    };

    // Eliminar campos undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });

    const response = await apiClient.put(`/api/discount-codes/${codeId}`, payload);
    return response; // { success, message }
  },

  // 7. Activar Código de Descuento
  activateCode: async (codeId) => {
    const response = await apiClient.patch(`/api/discount-codes/${codeId}/activate`, {});
    return response; // { success, message, code: {...} }
  },

  // 8. Suspender Código de Descuento (Nuevo Endpoint)
  suspendCode: async (codeId) => {
    const response = await apiClient.patch(`/api/discount-codes/${codeId}/suspend`, {});
    return response; // { success, message, code: {...} }
  },

  // Mantener deactivateCode por compatibilidad, pero usar suspend internamente si se desea, 
  // o dejarlo como alias si el backend lo soporta. 
  // Según la guía, el endpoint es /suspend.
  deactivateCode: async (codeId) => {
    return discountService.suspendCode(codeId);
  },

  // 9. Eliminar Código de Descuento (Soft Delete)
  deleteCode: async (codeId) => {
    const response = await apiClient.delete(`/api/discount-codes/${codeId}`);
    return response; // { success, message }
  },

  // 10. Obtener Estadísticas de Código
  getStatistics: async (codeId) => {
    const response = await apiClient.get(`/api/discount-codes/${codeId}/statistics`);
    return response; // { success, statistics: {...} }
  },

  // Método auxiliar para obtener detalles de un código específico
  getCode: async (codeId) => {
    const response = await apiClient.get(`/api/discount-codes/${codeId}`);
    return response;
  }
};

export default discountService;
