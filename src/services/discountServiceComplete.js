import axios from '../utils/axios';

class DiscountService {
  // ============================================
  // ENDPOINTS PARA USUARIOS
  // ============================================

  /**
   * Validar un código de descuento
   */
  async validateCode({ code, orderTotal, eventId = null, showId = null, userId = null }) {
    try {
      const response = await axios.post('/api/discount-codes/validate', {
        code: this.formatCode(code),
        orderTotal,
        eventId,
        showId,
        userId
      });
      
      return {
        valid: true,
        discount: response.data.discount,
        message: response.data.message
      };
    } catch (error) {
      return {
        valid: false,
        discount: null,
        message: error.response?.data?.error || error.response?.data?.message || 'Error validando código'
      };
    }
  }

  /**
   * Verificar disponibilidad de un código
   */
  async checkAvailability(code) {
    try {
      const response = await axios.get(`/api/discount-codes/check-availability/${this.formatCode(code)}`);
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Aplicar descuento a una orden existente
   */
  async applyToOrder(orderId, discountCode) {
    try {
      const response = await axios.post('/api/discount-codes/apply', {
        orderId,
        discountCode: this.formatCode(discountCode)
      });
      return response.data;
    } catch (error) {
      console.error('Error applying discount to order:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de descuentos del usuario
   */
  async getUserHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await axios.get(`/api/discount-codes/my-history?${queryParams}`);
      
      // Formatear la respuesta
      return {
        history: (response.data.history || []).map(item => ({
          ...item,
          discount_amount: item.discount_amount || 0,
          order_total_before: item.order_total_before || (item.order_total + item.discount_amount),
          order_total_after: item.order_total || item.order_total_after,
          formatted_date: this.formatDate(item.used_at)
        })),
        totalSaved: response.data.totalSaved || 0,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching discount history:', error);
      return { history: [], totalSaved: 0 };
    }
  }

  // ============================================
  // ENDPOINTS ADMINISTRATIVOS
  // ============================================

  /**
   * Crear nuevo código de descuento
   */
  async createCode(codeData) {
    try {
      // Convertir valores de dinero a formato esperado por el backend
      const data = {
        ...codeData,
        code: this.formatCode(codeData.code),
        minimumPurchase: codeData.minimumPurchase || 0,
        maximumDiscount: codeData.maximumDiscount || null,
        usageLimit: codeData.usageLimit || null,
        usageLimitPerUser: codeData.usageLimitPerUser || 1,
        discountType: codeData.discountType || 'PERCENTAGE',
        discountValue: Number(codeData.discountValue),
        isActive: codeData.isActive !== false // default true
      };

      // Convertir fechas si existen
      if (codeData.validFrom) {
        data.validFrom = new Date(codeData.validFrom).toISOString();
      }
      if (codeData.validUntil) {
        data.validUntil = new Date(codeData.validUntil).toISOString();
      }

      const response = await axios.post('/api/admin/discount-codes', data);
      return response.data;
    } catch (error) {
      console.error('Error creating discount code:', error);
      throw error;
    }
  }

  /**
   * Listar códigos de descuento
   */
  async listCodes({ page = 1, limit = 20, includeExpired = false, status = null, search = '' }) {
    try {
      const params = {
        page,
        limit,
        includeExpired
      };
      
      if (status) params.status = status;
      if (search) params.search = search;
      
      const response = await axios.get('/api/admin/discount-codes', { params });
      
      // Formatear la respuesta
      return {
        codes: (response.data.codes || []).map(code => ({
          ...code,
          discount_display: code.discount_type === 'PERCENTAGE' 
            ? `${code.discount_value}%`
            : `$${code.discount_value.toLocaleString('es-AR')}`,
          usage_status: `${code.usage_count || 0}/${code.usage_limit || '∞'}`,
          expiration_status: code.valid_until 
            ? new Date(code.valid_until) > new Date() 
              ? `Hasta ${this.formatDate(code.valid_until)}`
              : 'Expirado'
            : 'Sin expiración',
          is_expired: code.valid_until ? new Date(code.valid_until) < new Date() : false
        })),
        pagination: response.data.pagination || {
          total: response.data.codes?.length || 0,
          page,
          limit,
          totalPages: Math.ceil((response.data.codes?.length || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error listing discount codes:', error);
      return { codes: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
    }
  }

  /**
   * Obtener detalles de un código
   */
  async getCode(codeId) {
    try {
      const response = await axios.get(`/api/admin/discount-codes/${codeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discount code:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un código
   */
  async getStatistics(codeId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await axios.get(`/api/admin/discount-codes/${codeId}/statistics?${queryParams}`);
      
      // Formatear estadísticas
      return {
        ...response.data,
        code: response.data.code,
        description: response.data.description,
        discountType: response.data.discount_type,
        discountValue: response.data.discount_value,
        isActive: response.data.is_active,
        totalUsage: response.data.total_usage || 0,
        uniqueUsers: response.data.unique_users || 0,
        totalDiscounted: response.data.total_discounted || 0,
        averageDiscount: response.data.average_discount || 0,
        usageOverTime: response.data.usage_over_time || [],
        usageByEvent: response.data.usage_by_event || [],
        userTypeDistribution: response.data.user_type_distribution || [],
        recentOrders: response.data.recent_orders || [],
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        lastUsedAt: response.data.last_used_at,
        validUntil: response.data.valid_until,
        minimumPurchase: response.data.minimum_purchase,
        maximumDiscount: response.data.maximum_discount,
        usageLimit: response.data.usage_limit
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Retornar objeto vacío con estructura esperada
      return {
        totalUsage: 0,
        uniqueUsers: 0,
        totalDiscounted: 0,
        averageDiscount: 0,
        usageOverTime: [],
        usageByEvent: [],
        userTypeDistribution: [],
        recentOrders: []
      };
    }
  }

  /**
   * Actualizar código de descuento
   */
  async updateCode(codeId, updates) {
    try {
      const data = { ...updates };
      
      // Convertir fechas si existen
      if (data.validFrom) {
        data.validFrom = new Date(data.validFrom).toISOString();
      }
      if (data.validUntil) {
        data.validUntil = new Date(data.validUntil).toISOString();
      }
      
      // Asegurar tipos correctos
      if (data.discountValue) {
        data.discountValue = Number(data.discountValue);
      }
      if (data.minimumPurchase !== undefined) {
        data.minimumPurchase = Number(data.minimumPurchase);
      }
      if (data.maximumDiscount !== undefined) {
        data.maximumDiscount = data.maximumDiscount ? Number(data.maximumDiscount) : null;
      }
      
      const response = await axios.put(`/api/admin/discount-codes/${codeId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating discount code:', error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) código
   */
  async deleteCode(codeId) {
    try {
      const response = await axios.delete(`/api/admin/discount-codes/${codeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting discount code:', error);
      throw error;
    }
  }

  /**
   * Buscar códigos de descuento
   */
  async searchCodes(query) {
    try {
      const response = await axios.get(`/api/admin/discount-codes/search?q=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching codes:', error);
      return { codes: [] };
    }
  }

  /**
   * Exportar estadísticas
   */
  async exportStatistics(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await axios.get(
        `/api/admin/discount-codes/export?${queryParams}`,
        { responseType: 'blob' }
      );
      
      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `discount_codes_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting statistics:', error);
      throw error;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Calcular descuento sin validar en servidor
   */
  calculateDiscount(orderTotal, discountType, discountValue, maximumDiscount = null) {
    let discountAmount = 0;

    if (discountType === 'PERCENTAGE') {
      discountAmount = Math.floor(orderTotal * (discountValue / 100));
      if (maximumDiscount && discountAmount > maximumDiscount) {
        discountAmount = maximumDiscount;
      }
    } else { // FIXED_AMOUNT
      discountAmount = discountValue;
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
      }
    }

    return {
      discountAmount,
      finalTotal: orderTotal - discountAmount,
      savedPercentage: orderTotal > 0 ? ((discountAmount / orderTotal) * 100).toFixed(2) : '0'
    };
  }

  /**
   * Formatear código para display
   */
  formatCode(code) {
    if (!code) return '';
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Validar formato de código localmente
   */
  isValidCodeFormat(code) {
    const formatted = this.formatCode(code);
    return formatted.length >= 3 && formatted.length <= 20;
  }

  /**
   * Formatear fecha para display
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcular tiempo restante hasta expiración
   */
  getTimeUntilExpiration(validUntil) {
    if (!validUntil) return null;
    
    const now = new Date().getTime();
    const expiry = new Date(validUntil).getTime();
    const difference = expiry - now;
    
    if (difference <= 0) return 'Expirado';
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  }

  /**
   * Validar si un código puede ser usado
   */
  canUseCode(codeData, userId = null) {
    // Verificar si está activo
    if (!codeData.is_active) {
      return { canUse: false, reason: 'Código desactivado' };
    }
    
    // Verificar expiración
    if (codeData.valid_until && new Date(codeData.valid_until) < new Date()) {
      return { canUse: false, reason: 'Código expirado' };
    }
    
    // Verificar fecha de inicio
    if (codeData.valid_from && new Date(codeData.valid_from) > new Date()) {
      return { canUse: false, reason: 'Código aún no válido' };
    }
    
    // Verificar límite de uso total
    if (codeData.usage_limit && codeData.usage_count >= codeData.usage_limit) {
      return { canUse: false, reason: 'Límite de usos alcanzado' };
    }
    
    // Verificar límite de uso por usuario (requiere validación en backend)
    if (userId && codeData.usage_limit_per_user && codeData.user_usage_count >= codeData.usage_limit_per_user) {
      return { canUse: false, reason: 'Ya usaste este código el máximo permitido' };
    }
    
    return { canUse: true, reason: null };
  }
}

// Crear instancia singleton
export const discountService = new DiscountService();

// Export default para compatibilidad
export default discountService;
