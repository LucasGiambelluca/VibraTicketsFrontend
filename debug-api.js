// Script de diagnóstico para probar la API
const API_URL = 'http://localhost:3000/api/events';

async function testAPI() {
  console.log('🔍 Probando API:', API_URL);
  
  try {
    const response = await fetch(API_URL);
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Respuesta completa:', data);
    console.log('📊 Tipo de respuesta:', typeof data);
    console.log('📊 Es array?', Array.isArray(data));
    
    if (data) {
      console.log('📊 Claves de la respuesta:', Object.keys(data));
      
      if (Array.isArray(data)) {
        console.log('✅ Es un array directo con', data.length, 'elementos');
        console.log('📋 Primer elemento:', data[0]);
      } else if (data.events) {
        console.log('✅ Tiene propiedad events con', data.events.length, 'elementos');
        console.log('📋 Primer evento:', data.events[0]);
      } else {
        console.log('❌ Estructura desconocida');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar el test
testAPI();
