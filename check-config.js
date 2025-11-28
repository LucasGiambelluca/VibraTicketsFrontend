// Script para verificar la configuración de la API
console.log('\n=== VERIFICACIÓN DE CONFIGURACIÓN ===\n');

console.log('Variables de entorno:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || '(vacío - usará proxy)');
console.log('VITE_APP_NAME:', import.meta.env.VITE_APP_NAME);

console.log('\nConfiguración esperada:');
console.log('- VITE_API_URL debe estar vacío para usar el proxy de Vite');
console.log('- El proxy en vite.config.js redirige /api/* a https://vibra-tickets-backend.onrender.com');

console.log('\nPrueba de URL:');
const testUrl = (import.meta.env.VITE_API_URL || '') + '/api/events';
console.log('URL de prueba:', testUrl);

if (import.meta.env.VITE_API_URL === 'http://localhost:3000') {
  console.error('\n❌ ERROR: VITE_API_URL apunta a localhost:3000');
  console.error('   Tu backend NO está en localhost, está en Render');
  console.error('   Solución: Edita .env y deja VITE_API_URL vacío o coméntalo');
}

console.log('\n=====================================\n');
