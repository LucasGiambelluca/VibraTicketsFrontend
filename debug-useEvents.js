// Debug version of useEvents hook
import { eventsApi } from './src/services/apiService.js';

async function testUseEvents() {
  console.log('🧪 Testing useEvents logic...');
  
  try {
    const params = {
      page: 1,
      limit: 12,
      status: 'active',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };

    console.log('📋 Parámetros de consulta:', params);
    const response = await eventsApi.getEvents(params);
    console.log('📊 Respuesta de getEvents:', response);
    console.log('📊 Tipo de respuesta:', typeof response);
    console.log('📊 Es array?', Array.isArray(response));
    
    if (response) {
      console.log('📊 Claves de la respuesta:', Object.keys(response));
      if (response.events) {
        console.log('📊 Número de eventos en response.events:', response.events.length);
      }
    }
    
    // Verificar si la respuesta tiene la estructura esperada
    if (response && response.events) {
      console.log('✅ Usando response.events, estableciendo', response.events.length, 'eventos');
      console.log('📋 Eventos:', response.events);
      return { events: response.events, pagination: response.pagination };
    } else if (response && Array.isArray(response)) {
      // Si la respuesta es directamente un array
      console.log('✅ Respuesta es array directo, estableciendo', response.length, 'eventos');
      return { events: response, pagination: null };
    } else {
      console.log('❌ Estructura de respuesta inesperada');
      return { events: [], pagination: null };
    }
    
  } catch (err) {
    console.error('❌ Error en testUseEvents:', err);
    return { events: [], pagination: null, error: err.message };
  }
}

// Ejecutar el test
testUseEvents().then(result => {
  console.log('🎯 Resultado final:', result);
});
