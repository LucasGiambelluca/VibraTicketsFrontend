// Simple debug script
const API_BASE_URL = 'http://localhost:3000';

// Simulación del API Client
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, config = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...config,
        headers: {
          ...config.headers
        }
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      return data;
    } catch (error) {
      console.error('Error en request:', error.message);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }
}

const apiClient = new ApiClient();

// Events API
const eventsApi = {
  getEvents: (params = {}) => {
    const { page = 1, limit = 20, search = '', status = 'active', sortBy = 'created_at', sortOrder = 'DESC' } = params;
    return apiClient.get('/api/events', { page, limit, search, status, sortBy, sortOrder });
  }
};

// Test function
async function testEventsApi() {
  console.log('🧪 Testing Events API...');
  
  try {
    const params = {
      page: 1,
      limit: 12,
      status: 'active',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };

    console.log('📋 Parámetros:', params);
    const response = await eventsApi.getEvents(params);
    
    console.log('📊 Tipo de respuesta:', typeof response);
    console.log('📊 Es array?', Array.isArray(response));
    
    if (response) {
      console.log('📊 Claves:', Object.keys(response));
      
      if (response.events) {
        console.log('✅ response.events encontrado:', response.events.length, 'eventos');
        console.log('📋 Primer evento:', response.events[0]);
        
        // Simular la lógica del hook useEvents
        console.log('🎯 RESULTADO: Hook debería establecer', response.events.length, 'eventos');
        return { success: true, events: response.events };
      } else if (Array.isArray(response)) {
        console.log('✅ Array directo:', response.length, 'eventos');
        return { success: true, events: response };
      } else {
        console.log('❌ Estructura inesperada');
        return { success: false, events: [] };
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Ejecutar
testEventsApi().then(result => {
  console.log('\n🎯 RESULTADO FINAL:', result);
});
