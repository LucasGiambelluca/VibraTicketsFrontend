import axios from 'axios';
import { message } from 'antd';

// Crear instancia de axios con configuración base
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  withCredentials: true, // IMPORTANTE: Enviar cookies en cada petición
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
instance.interceptors.request.use(
  (config) => {
    // Ya no necesitamos inyectar el token manualmente desde localStorage
    // El navegador enviará la cookie httpOnly automáticamente
    
    // Log de desarrollo (solo en dev)
    if (import.meta.env.DEV) {
      console.log('🔵 Request:', config.method?.toUpperCase(), config.url, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
instance.interceptors.response.use(
  (response) => {
    // Log de desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ Response:', response.config.method?.toUpperCase(), response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    // Log de errores
    if (import.meta.env.DEV) {
      console.error('❌ Response Error:', error.response?.status, error.response?.data);
    }

    // Manejo de errores por código de estado
    if (error.response) {
      switch (error.response.status) {
        case 400:
          // Bad Request - mostrar mensaje específico del servidor si existe
          if (error.response.data?.error) {
            message.error(error.response.data.error);
          } else if (error.response.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error('Solicitud inválida. Verifica los datos ingresados.');
          }
          break;
          
        case 401:
          // Unauthorized - redirigir a login
          message.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          // Redirigir a login después de un pequeño delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          break;
          
        case 403:
          // Forbidden - sin permisos
          message.error('No tienes permisos para realizar esta acción');
          break;
          
        case 404:
          // Not Found
          if (error.response.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error('Recurso no encontrado');
          }
          break;
          
        case 409:
          // Conflict - generalmente para recursos duplicados
          if (error.response.data?.error) {
            message.error(error.response.data.error);
          } else if (error.response.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error('Conflicto al procesar la solicitud');
          }
          break;
          
        case 422:
          // Unprocessable Entity - errores de validación
          if (error.response.data?.errors) {
            const firstError = Object.values(error.response.data.errors)[0];
            message.error(Array.isArray(firstError) ? firstError[0] : firstError);
          } else if (error.response.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error('Error de validación en los datos enviados');
          }
          break;
          
        case 429:
          // Too Many Requests
          message.error('Demasiadas solicitudes. Por favor, espera un momento.');
          break;
          
        case 500:
          // Internal Server Error
          message.error('Error del servidor. Por favor, intenta más tarde.');
          break;
          
        case 502:
        case 503:
        case 504:
          // Bad Gateway / Service Unavailable / Gateway Timeout
          message.error('El servicio no está disponible temporalmente. Por favor, intenta más tarde.');
          break;
          
        default:
          // Otros errores
          if (error.response.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error(`Error ${error.response.status}: ${error.response.statusText}`);
          }
      }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      message.error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else {
      // Algo sucedió al configurar la solicitud
      message.error('Error al procesar la solicitud');
    }
    
    return Promise.reject(error);
  }
);

// Método helper para hacer requests con reintentos
instance.retryRequest = async (config, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await instance(config);
    } catch (error) {
      lastError = error;
      
      // Solo reintentar en errores de red o 5xx
      if (!error.response || error.response.status >= 500) {
        // Esperar con backoff exponencial
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } else {
        // No reintentar otros errores
        throw error;
      }
    }
  }
  
  throw lastError;
};

export default instance;
