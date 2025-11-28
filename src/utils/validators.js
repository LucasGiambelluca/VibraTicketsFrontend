/**
 * Validaciones para el sistema de ticketera
 */

/**
 * Valida formato de DNI argentino
 * @param {string} dni - DNI a validar
 * @returns {object} - { valid: boolean, error: string }
 */
export function validateDNI(dni) {
  if (!dni || dni.trim() === '') {
    return {
      valid: false,
      error: 'El DNI es obligatorio'
    };
  }

  // Eliminar espacios
  const cleanDNI = dni.trim();

  // Solo números
  if (!/^\d+$/.test(cleanDNI)) {
    return {
      valid: false,
      error: 'El DNI debe contener solo números'
    };
  }

  // Longitud 7-8
  if (cleanDNI.length < 7 || cleanDNI.length > 8) {
    return {
      valid: false,
      error: 'El DNI debe tener 7 u 8 dígitos'
    };
  }

  return {
    valid: true,
    error: null
  };
}

/**
 * Formatea DNI para mostrar (con puntos)
 * @param {string} dni - DNI sin formato
 * @returns {string} - DNI formateado
 */
export function formatDNI(dni) {
  if (!dni) return '';
  
  // Ejemplo: 12345678 -> 12.345.678
  const clean = dni.replace(/\D/g, '');
  
  if (clean.length === 7) {
    return clean.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3');
  } else if (clean.length === 8) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
  }
  
  return clean;
}

/**
 * Valida cantidad de tickets a comprar
 * @param {number} quantity - Cantidad solicitada
 * @param {object} availability - Datos de disponibilidad
 * @returns {object} - { valid: boolean, error: string }
 */
export function validateTicketQuantity(quantity, availability) {
  if (!quantity || quantity < 1) {
    return {
      valid: false,
      error: 'Debes seleccionar al menos 1 boleto'
    };
  }

  if (!availability) {
    return {
      valid: true,
      error: null
    };
  }

  // No puede comprar (sin DNI, etc)
  if (!availability.canPurchase) {
    return {
      valid: false,
      error: availability.message || 'No puedes comprar boletos en este momento'
    };
  }

  // Excede disponibilidad
  if (quantity > availability.available) {
    return {
      valid: false,
      error: `Solo puedes comprar ${availability.available} boleto(s) más para este evento`
    };
  }

  return {
    valid: true,
    error: null
  };
}
