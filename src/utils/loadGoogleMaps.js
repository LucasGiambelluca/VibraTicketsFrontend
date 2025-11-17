/**
 * Utilidad para cargar Google Maps API de forma dinámica
 * Evita múltiples cargas del script y maneja el estado de carga
 */

let isLoading = false;
let isLoaded = false;
let loadPromise = null;

/**
 * Carga el script de Google Maps API
 * @param {string} apiKey - API Key de Google Maps
 * @returns {Promise} - Promise que se resuelve cuando el script está cargado
 */
export function loadGoogleMaps(apiKey) {
  // Si ya está cargado, retornar inmediatamente
  if (isLoaded) {
    return Promise.resolve(window.google);
  }

  // Si está cargando, retornar la promesa existente
  if (isLoading) {
    return loadPromise;
  }

  // Verificar si ya existe el script
  if (window.google && window.google.maps) {
    isLoaded = true;
    return Promise.resolve(window.google);
  }

  // Iniciar carga
  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Crear script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Callback cuando se carga
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve(window.google);
    };

    // Callback de error
    script.onerror = (error) => {
      isLoading = false;
      console.error('❌ Error al cargar Google Maps API:', error);
      reject(new Error('Error al cargar Google Maps API'));
    };

    // Agregar script al DOM
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Verifica si Google Maps está disponible
 * @returns {boolean}
 */
export function isGoogleMapsLoaded() {
  return isLoaded && window.google && window.google.maps;
}

/**
 * Geocodifica una dirección a coordenadas
 * @param {string} address - Dirección a geocodificar
 * @returns {Promise<{lat: number, lng: number}>}
 */
export async function geocodeAddress(address) {
  if (!isGoogleMapsLoaded()) {
    throw new Error('Google Maps no está cargado');
  }

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        reject(new Error(`Geocoding falló: ${status}`));
      }
    });
  });
}

/**
 * Calcula la distancia entre dos puntos
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<{distance: string, duration: string}>}
 */
export async function calculateDistance(origin, destination) {
  if (!isGoogleMapsLoaded()) {
    throw new Error('Google Maps no está cargado');
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: 'DRIVING',
      unitSystem: window.google.maps.UnitSystem.METRIC
    }, (response, status) => {
      if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
        const element = response.rows[0].elements[0];
        resolve({
          distance: element.distance.text,
          duration: element.duration.text
        });
      } else {
        reject(new Error(`Distance Matrix falló: ${status}`));
      }
    });
  });
}
