// Utility para manejar URLs de imágenes de forma consistente
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Placeholder local (sin depender de hosts externos como via.placeholder.com,
 * que ya no está disponible de forma confiable). SVG inline con un ícono de
 * ticket simple sobre un degradado, embebido como data URI.
 * @param {string} label - Texto a mostrar dentro del placeholder
 * @returns {string} data URI con el SVG del placeholder
 */
export const getLocalImagePlaceholder = (label = 'Evento') => {
  const safeLabel = String(label).slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#667eea"/>
        <stop offset="100%" stop-color="#764ba2"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <g fill="#ffffff" opacity="0.85">
      <path d="M170 120h60a10 10 0 0 1 10 10v6a12 12 0 0 0 0 24v6a10 10 0 0 1-10 10h-60a10 10 0 0 1-10-10v-6a12 12 0 0 0 0-24v-6a10 10 0 0 1 10-10z" fill="none" stroke="#ffffff" stroke-width="3"/>
    </g>
    <text x="200" y="205" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" opacity="0.9">${safeLabel.replace(/[<&>]/g, '')}</text>
  </svg>`;
  // encodeURIComponent no escapa "(" ")" "'" "!" "*" — hay que hacerlo a mano
  // porque este data URI se interpola sin comillas dentro de CSS url(...) en
  // varios componentes, y un paréntesis literal ahí corta la URL a la mitad.
  const encoded = encodeURIComponent(svg)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `data:image/svg+xml;utf8,${encoded}`;
};

/**
 * Obtiene la URL completa de una imagen
 * @param {string} imageUrl - URL de la imagen (puede ser relativa o absoluta)
 * @param {string} placeholder - Texto para el placeholder si no hay imagen
 * @returns {string} URL completa de la imagen
 */
export const getImageUrl = (imageUrl, placeholder = 'Image') => {
  // Si no hay imagen, devolver placeholder local (sin hosts externos)
  if (!imageUrl) {
    return getLocalImagePlaceholder(placeholder);
  }
  
  // Si ya es URL completa (http/https), usarla tal cual
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Si es ruta relativa, agregar base URL
  // Asegurar que haya un solo slash entre base y path
  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${cleanBase}${cleanPath}`;
};

/**
 * Obtiene la URL de imagen para un evento, con fallbacks
 * @param {object} event - Objeto del evento
 * @param {string} preferredType - Tipo de imagen preferido ('square' | 'horizontal')
 * @returns {string} URL de la imagen
 */
export const getEventImageUrl = (event, preferredType = 'square') => {
  let imageUrl = null;
  
  if (preferredType === 'square') {
    // Priorizar cover_square (300x300) para cards en grilla
    imageUrl = event.cover_square_url || 
               event.cover_horizontal_url || 
               event.image_url;
  } else {
    // Priorizar cover_horizontal para banners
    imageUrl = event.cover_horizontal_url || 
               event.cover_square_url || 
               event.image_url;
  }
  
  return getImageUrl(imageUrl, event.name || 'Evento');
};

/**
 * Obtiene la URL del banner principal de un evento
 * @param {object} event - Objeto del evento
 * @returns {string} URL del banner
 */
export const getEventBannerUrl = (event) => {
  const bannerUrl = event.banner_main_url || 
                    event.banner_alt_url || 
                    event.cover_horizontal_url ||
                    event.image_url;
  
  return getImageUrl(bannerUrl, event.name || 'Evento');
};

export default {
  getImageUrl,
  getEventImageUrl,
  getEventBannerUrl,
  getLocalImagePlaceholder
};
