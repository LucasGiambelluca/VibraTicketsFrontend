import axios from '../utils/axios';

class OrderService {
  /**
   * Crear orden con soporte de descuentos
   */
  async createOrder({ holdId, discountCode = null }) {
    try {
      // Generar idempotency key para evitar duplicados
      const idempotencyKey = `order-${holdId}-${Date.now()}`;
      
      const response = await axios.post('/api/orders', 
        {
          holdId: parseInt(holdId),
          discountCode // El backend valida y aplica el descuento
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        }
      );
      
      return {
        success: true,
        orderId: response.data.id || response.data.orderId,
        order: response.data.order || response.data,
        discountApplied: response.data.discountApplied || null,
        totalSaved: response.data.totalSaved || 0
      };
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Manejar errores específicos
      if (error.response?.status === 409) {
        // Orden ya existe (idempotencia)
        if (error.response.data?.existingOrderId) {
          return {
            success: true,
            orderId: error.response.data.existingOrderId,
            existing: true
          };
        }
      }
      
      throw error;
    }
  }

  /**
   * Obtener detalles del hold
   */
  async getHoldDetails(holdId) {
    try {
      const response = await axios.get(`/api/holds/${holdId}`);
      
      // Formatear respuesta para consistencia
      return {
        ...response.data,
        id: response.data.id || holdId,
        holdId: response.data.holdId || response.data.id || holdId,
        items: response.data.items || response.data.seats || [],
        event: response.data.event || {},
        show: response.data.show || {},
        customerName: response.data.customerName || response.data.customer_name,
        customerEmail: response.data.customerEmail || response.data.customer_email,
        totalCents: response.data.totalCents || response.data.total_cents || 0,
        expiresAt: response.data.expiresAt || response.data.expires_at,
        status: response.data.status || 'active'
      };
    } catch (error) {
      console.error('Error fetching hold details:', error);
      
      // Si el hold no existe o expiró
      if (error.response?.status === 404 || error.response?.status === 410) {
        throw new Error('La reserva no existe o ha expirado');
      }
      
      throw error;
    }
  }

  /**
   * Obtener detalles de la orden
   */
  async getOrderDetails(orderId) {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      
      return {
        ...response.data,
        id: response.data.id || orderId,
        orderId: response.data.orderId || response.data.id || orderId,
        items: response.data.items || response.data.tickets || [],
        event: response.data.event || {},
        show: response.data.show || {},
        customer: response.data.customer || {},
        payment: response.data.payment || {},
        discount: response.data.discount || null,
        totalAmount: response.data.totalAmount || response.data.total_amount || 0,
        status: response.data.status || 'pending',
        createdAt: response.data.createdAt || response.data.created_at
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

  /**
   * Cancelar una orden
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const response = await axios.post(`/api/orders/${orderId}/cancel`, {
        reason
      });
      
      return {
        success: true,
        message: response.data.message || 'Orden cancelada exitosamente'
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de órdenes del usuario
   */
  async getUserOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await axios.get(`/api/orders/my-orders?${queryParams}`);
      
      return {
        orders: response.data.orders || [],
        pagination: response.data.pagination || {
          total: response.data.orders?.length || 0,
          page: params.page || 1,
          limit: params.limit || 10
        }
      };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return { orders: [], pagination: {} };
    }
  }

  /**
   * Reenviar email de confirmación
   */
  async resendConfirmationEmail(orderId) {
    try {
      const response = await axios.post(`/api/orders/${orderId}/resend-confirmation`);
      
      return {
        success: true,
        message: response.data.message || 'Email enviado exitosamente'
      };
    } catch (error) {
      console.error('Error resending confirmation:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de orden para checkout
   */
  async getOrderSummary(holdId) {
    try {
      const holdData = await this.getHoldDetails(holdId);
      
      // Calcular totales
      const subtotal = holdData.totalCents / 100;
      const serviceCharge = Math.round(subtotal * 0.15);
      const total = subtotal + serviceCharge;
      
      return {
        holdData,
        subtotal,
        serviceCharge,
        total,
        event: holdData.event,
        show: holdData.show,
        seats: holdData.items,
        customerInfo: {
          name: holdData.customerName,
          email: holdData.customerEmail
        }
      };
    } catch (error) {
      console.error('Error getting order summary:', error);
      throw error;
    }
  }

  /**
   * Verificar estado del hold
   */
  async checkHoldStatus(holdId) {
    try {
      const response = await axios.get(`/api/holds/${holdId}/status`);
      
      return {
        valid: response.data.valid || false,
        status: response.data.status || 'unknown',
        expiresAt: response.data.expiresAt || response.data.expires_at,
        remainingTime: response.data.remainingTime || 0
      };
    } catch (error) {
      console.error('Error checking hold status:', error);
      return {
        valid: false,
        status: 'expired',
        remainingTime: 0
      };
    }
  }

  /**
   * Extender tiempo del hold (si es permitido)
   */
  async extendHold(holdId, minutes = 5) {
    try {
      const response = await axios.post(`/api/holds/${holdId}/extend`, {
        minutes
      });
      
      return {
        success: true,
        newExpiresAt: response.data.expiresAt || response.data.expires_at,
        message: response.data.message || 'Tiempo extendido exitosamente'
      };
    } catch (error) {
      console.error('Error extending hold:', error);
      
      if (error.response?.status === 403) {
        throw new Error('No se puede extender más el tiempo de reserva');
      }
      
      throw error;
    }
  }

  /**
   * Calcular descuento localmente (preview)
   */
  calculateDiscountPreview(subtotal, discountData) {
    if (!discountData) return { discountAmount: 0, finalTotal: subtotal };
    
    let discountAmount = 0;
    
    if (discountData.discount_type === 'PERCENTAGE') {
      discountAmount = Math.floor(subtotal * (discountData.discount_value / 100));
      if (discountData.maximum_discount && discountAmount > discountData.maximum_discount) {
        discountAmount = discountData.maximum_discount;
      }
    } else {
      discountAmount = Math.min(discountData.discount_value, subtotal);
    }
    
    return {
      discountAmount,
      finalTotal: subtotal - discountAmount
    };
  }
}

// Crear instancia singleton
export const orderService = new OrderService();

// Export default para compatibilidad
export default orderService;
