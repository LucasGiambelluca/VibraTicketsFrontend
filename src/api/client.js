// API Client basado en la documentación de endpoints
// Usar proxy de Vite en desarrollo (vacío) o URL de producción
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, config = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    // Preparar headers con JWT si existe
    const headers = {
      'ngrok-skip-browser-warning': 'true', // Para producción con Ngrok
      ...config.headers
    };
    
    // Agregar token JWT si existe
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...config,
        headers
      });
      
      // Verificar si la respuesta es válida
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }
        
        // Manejo especial de error 401 (token expirado/inválido)
        // IMPORTANTE: Solo limpiar localStorage y redirigir si NO es un intento de login
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Solo redirigir si no estamos ya en la página de login
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
        }
        
        // Crear error con información completa
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = errorData;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Manejar errores de conexión
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        const backendError = new Error(`Backend no disponible - Verifica que el servidor esté corriendo en ${this.baseURL}`);
        backendError.originalError = error;
        throw backendError;
      }
      
      // Agregar contexto al error
      if (error instanceof Error) {
        error.url = url;
        error.method = config.method || 'GET';
      }
      
      // Re-lanzar otros errores con más contexto
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}, options = {}) {
    // Asegurar que el JSON se serializa correctamente
    const jsonBody = JSON.stringify(data);
    const requestConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers // Permitir headers personalizados
      },
      body: jsonBody
    };
    
    return this.request(endpoint, requestConfig);
  }

  async postFormData(endpoint, formData) {
    for (let [key, value] of formData.entries()) {
      }
    
    return this.request(endpoint, {
      method: 'POST',
      body: formData
      // No establecer Content-Type para FormData, el navegador lo hará automaticamente
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  async putFormData(endpoint, formData) {
    return this.request(endpoint, {
      method: 'PUT',
      body: formData,
      headers: {} // No Content-Type para FormData
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// ============================================
// AXIOS con Interceptors JWT
// ============================================
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos según la guía
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // Para producción con Ngrok
  }
});

// ============================================
// INTERCEPTOR DE REQUEST - Agregar JWT Token
// ============================================
api.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Agregar token al header Authorization
      config.headers.Authorization = `Bearer ${token}`;
      }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTOR DE RESPONSE - Manejo de Errores
// ============================================
api.interceptors.response.use(
  (response) => {
    // Respuesta exitosa
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
      
      // Error 401: Token expirado o inválido
      // IMPORTANTE: Solo limpiar y redirigir si NO es un intento de login
      if (status === 401) {
        const isLoginAttempt = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register');
        
        if (!isLoginAttempt) {
          // Limpiar localStorage solo si no es un intento de login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirigir al login solo si no estamos ya ahí
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
        }
        // Si es un intento de login fallido, simplemente rechazar el error sin redirigir
      }
      
      // Error 403: Sin permisos
      else if (status === 403) {
        console.warn('⚠️ Acceso denegado - Sin permisos suficientes');
      }
      
      // Error 429: Rate limiting
      else if (status === 429) {
        console.warn('⚠️ Demasiadas solicitudes - Rate limit excedido');
      }
      
      // Otros errores del servidor
      else {
        console.error('❌ Error del servidor:', status, data);
      }
    } 
    else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      // Error de red - backend no disponible
      console.error('❌ Error de red - Backend no disponible');
    } 
    else {
      // Otros errores
      console.error('❌ API error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
