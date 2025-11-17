// Suprimir warnings específicos de compatibilidad
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const message = args[0];
  
  // Suprimir el warning de compatibilidad de Antd con React 19
  if (message && typeof message === 'string' && message.includes('antd: compatible')) {
    return;
  }
  
  // Permitir otros warnings
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args[0];
  
  // Suprimir errores específicos que ya manejamos
  if (message && typeof message === 'string') {
    if (message.includes('Error loading events: {}') || 
        message.includes('Error loading venues: {}') ||
        message.includes('Error en prueba: {}') ||
        message.includes('Error creating event: {}')) {
      return;
    }
  }
  
  // Permitir otros errores importantes
  originalError.apply(console, args);
};

export default {};
