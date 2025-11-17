# 🗺️ INTEGRACIÓN DE GOOGLE MAPS

**Fecha**: 2025-10-28  
**Estado**: ✅ COMPLETADO

---

## 📋 RESUMEN

Se ha integrado Google Maps API para mostrar la ubicación de los venues en la aplicación. Los usuarios ahora pueden ver un mapa interactivo con la ubicación exacta del evento y obtener direcciones.

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ **Componente VenueMap**
- Mapa interactivo de Google Maps
- Marcador personalizado con colores de la marca
- InfoWindow con información del venue
- Botones de acción:
  - "Cómo llegar" - Abre Google Maps con direcciones
  - "Abrir en Google Maps" - Abre la ubicación en Google Maps
- Estados de carga y error
- Responsive y adaptable

### ✅ **Utilidades de Google Maps**
- Carga dinámica del script de Google Maps
- Prevención de múltiples cargas
- Geocodificación de direcciones
- Cálculo de distancias
- Manejo de errores robusto

### ✅ **Hook Personalizado**
- `useGoogleMaps` - Hook para cargar y usar Google Maps
- Manejo automático del estado de carga
- Integración con variables de entorno

---

## 📁 ARCHIVOS CREADOS

### 1. **Componente VenueMap** (`src/components/VenueMap.jsx`)

**Props**:
```javascript
{
  venue: {
    name: string,        // Nombre del venue
    address: string,     // Dirección completa
    latitude: number,    // Latitud (opcional)
    longitude: number    // Longitud (opcional)
  },
  height: number,        // Altura del mapa en px (default: 400)
  showDirections: bool   // Mostrar botones (default: true)
}
```

**Características**:
- ✅ Mapa interactivo con controles
- ✅ Marcador personalizado (color morado de la marca)
- ✅ InfoWindow con nombre y dirección
- ✅ Botones de navegación
- ✅ Loading state con Spin de Ant Design
- ✅ Error handling con Alert

**Ejemplo de uso**:
```jsx
<VenueMap 
  venue={{
    name: "Teatro Colón",
    address: "Cerrito 628, Buenos Aires",
    latitude: -34.6010,
    longitude: -58.3831
  }}
  height={350}
/>
```

---

### 2. **Utilidades** (`src/utils/loadGoogleMaps.js`)

**Funciones exportadas**:

#### `loadGoogleMaps(apiKey)`
Carga el script de Google Maps API de forma dinámica.
```javascript
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

await loadGoogleMaps('YOUR_API_KEY');
```

#### `isGoogleMapsLoaded()`
Verifica si Google Maps está disponible.
```javascript
if (isGoogleMapsLoaded()) {
  // Usar Google Maps
}
```

#### `geocodeAddress(address)`
Convierte una dirección en coordenadas.
```javascript
const coords = await geocodeAddress('Av. Corrientes 1234, CABA');
// { lat: -34.6037, lng: -58.3816 }
```

#### `calculateDistance(origin, destination)`
Calcula distancia y tiempo entre dos puntos.
```javascript
const result = await calculateDistance(
  { lat: -34.6037, lng: -58.3816 },
  { lat: -34.6010, lng: -58.3831 }
);
// { distance: "2.5 km", duration: "8 mins" }
```

---

### 3. **Hook Personalizado** (`src/hooks/useGoogleMaps.js`)

**Uso**:
```jsx
import { useGoogleMaps } from '../hooks/useGoogleMaps';

function MyComponent() {
  const { isLoaded, error, google } = useGoogleMaps();

  if (!isLoaded) return <Spin />;
  if (error) return <Alert message={error} />;

  return <div>Google Maps está listo!</div>;
}
```

**Retorna**:
- `isLoaded`: boolean - Si Google Maps está cargado
- `error`: string | null - Mensaje de error si hay
- `google`: object | null - Objeto global de Google Maps

---

## 🔧 CONFIGURACIÓN

### **1. Obtener API Key de Google Maps**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs & Services" > "Credentials"
4. Click en "Create Credentials" > "API Key"
5. Copia tu API Key

### **2. Habilitar APIs Necesarias**

En Google Cloud Console, habilita las siguientes APIs:
- ✅ **Maps JavaScript API** (requerida)
- ✅ **Places API** (opcional, para búsquedas)
- ✅ **Geocoding API** (opcional, para direcciones)
- ✅ **Distance Matrix API** (opcional, para distancias)

### **3. Configurar Restricciones (Recomendado)**

Para seguridad, restringe tu API Key:

**Restricciones de aplicación**:
- Tipo: Referentes HTTP (sitios web)
- Referentes del sitio web: 
  - `http://localhost:5173/*` (desarrollo)
  - `https://tudominio.com/*` (producción)

**Restricciones de API**:
- Selecciona solo las APIs que necesitas

### **4. Agregar API Key al Proyecto**

Edita tu archivo `.env`:
```bash
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
```

**⚠️ IMPORTANTE**: 
- NO subas tu API Key a GitHub
- Asegúrate de que `.env` esté en `.gitignore`
- Usa variables de entorno en producción

---

## 📍 INTEGRACIÓN EN PÁGINAS

### **EventDetail.jsx**

El mapa se muestra automáticamente si:
1. Google Maps está cargado (`mapsLoaded === true`)
2. El evento tiene un venue (`event.venue_name`)

```jsx
import VenueMap from '../components/VenueMap';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

export default function EventDetail() {
  const { isLoaded: mapsLoaded } = useGoogleMaps();
  const [event, setEvent] = useState(null);

  return (
    <div>
      {/* ... otro contenido ... */}
      
      {mapsLoaded && event.venue_name && (
        <VenueMap 
          venue={{
            name: event.venue_name,
            address: event.venue_address || `${event.venue_name}, ${event.venue_city}`,
            latitude: event.venue_latitude,
            longitude: event.venue_longitude
          }}
          height={350}
        />
      )}
    </div>
  );
}
```

---

## 🎨 PERSONALIZACIÓN

### **Cambiar Estilo del Marcador**

En `VenueMap.jsx`, modifica el objeto `icon`:
```javascript
icon: {
  path: window.google.maps.SymbolPath.CIRCLE,
  scale: 10,
  fillColor: '#667eea',  // Color de relleno
  fillOpacity: 1,
  strokeColor: '#ffffff', // Color del borde
  strokeWeight: 2
}
```

### **Cambiar Estilo del Mapa**

Agrega estilos personalizados en el objeto `styles`:
```javascript
styles: [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#667eea' }]
  },
  // ... más estilos
]
```

Generador de estilos: [Snazzy Maps](https://snazzymaps.com/)

### **Cambiar Zoom Inicial**

En `VenueMap.jsx`:
```javascript
zoom: 15,  // Cambia este valor (1-20)
```

---

## 🚀 FUNCIONALIDADES ADICIONALES

### **Geocodificación Automática**

Si el venue no tiene coordenadas, puedes geocodificar la dirección:

```jsx
import { geocodeAddress } from '../utils/loadGoogleMaps';

const coords = await geocodeAddress(venue.address);
setVenue({ ...venue, latitude: coords.lat, longitude: coords.lng });
```

### **Mostrar Múltiples Venues**

Para mostrar varios venues en un mapa:

```jsx
const markers = venues.map(venue => 
  new window.google.maps.Marker({
    position: { lat: venue.latitude, lng: venue.longitude },
    map: mapInstance,
    title: venue.name
  })
);
```

### **Calcular Distancia desde Usuario**

```jsx
// Obtener ubicación del usuario
navigator.geolocation.getCurrentPosition(async (position) => {
  const userLocation = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
  
  const venueLocation = {
    lat: venue.latitude,
    lng: venue.longitude
  };
  
  const result = await calculateDistance(userLocation, venueLocation);
  console.log(`Distancia: ${result.distance}, Tiempo: ${result.duration}`);
});
```

---

## 🐛 TROUBLESHOOTING

### **Error: "Google Maps no está disponible"**

**Causa**: API Key no configurada o inválida

**Solución**:
1. Verifica que `VITE_GOOGLE_MAPS_API_KEY` esté en `.env`
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Verifica que la API Key sea válida en Google Cloud Console

---

### **Error: "RefererNotAllowedMapError"**

**Causa**: Tu dominio no está autorizado

**Solución**:
1. Ve a Google Cloud Console > Credentials
2. Edita tu API Key
3. Agrega tu dominio a "Website restrictions"
4. Para desarrollo: `http://localhost:5173/*`

---

### **El mapa no se muestra**

**Causa**: Coordenadas inválidas o faltantes

**Solución**:
1. Verifica que `latitude` y `longitude` sean números válidos
2. Verifica que estén en el rango correcto:
   - Latitud: -90 a 90
   - Longitud: -180 a 180
3. Si no tienes coordenadas, usa geocodificación

---

### **El mapa se ve gris**

**Causa**: API Key sin permisos o APIs no habilitadas

**Solución**:
1. Habilita "Maps JavaScript API" en Google Cloud Console
2. Espera unos minutos para que se propague
3. Limpia caché del navegador

---

## 💰 COSTOS

Google Maps ofrece **$200 USD de crédito mensual gratis**.

**Precios aproximados** (después del crédito):
- Maps JavaScript API: $7 por 1,000 cargas
- Geocoding API: $5 por 1,000 requests
- Distance Matrix API: $5 por 1,000 requests

**Optimizaciones para reducir costos**:
1. ✅ Cachear coordenadas geocodificadas en la base de datos
2. ✅ Cargar el mapa solo cuando sea necesario
3. ✅ Usar lazy loading para el componente
4. ✅ Limitar el número de marcadores

---

## 📊 DATOS DEL VENUE EN EL BACKEND

Para que el mapa funcione correctamente, el backend debe incluir:

```json
{
  "venue_name": "Teatro Colón",
  "venue_address": "Cerrito 628, Buenos Aires",
  "venue_city": "Buenos Aires",
  "venue_latitude": -34.6010,
  "venue_longitude": -58.3831
}
```

**Campos opcionales pero recomendados**:
- `venue_latitude`: Coordenada de latitud (número)
- `venue_longitude`: Coordenada de longitud (número)

Si no están disponibles, el componente usará geocodificación automática basada en la dirección.

---

## 🎯 PRÓXIMOS PASOS (OPCIONALES)

### **1. Agregar Rutas de Transporte Público**
Integrar con APIs de transporte local para mostrar líneas de colectivo/subte cercanas.

### **2. Street View**
Agregar vista de calle para que los usuarios vean el frente del venue.

```javascript
const panorama = new window.google.maps.StreetViewPanorama(
  document.getElementById('street-view'),
  {
    position: { lat: venue.latitude, lng: venue.longitude },
    pov: { heading: 165, pitch: 0 },
    zoom: 1
  }
);
```

### **3. Lugares Cercanos**
Mostrar restaurantes, estacionamientos, hoteles cerca del venue.

```javascript
const service = new window.google.maps.places.PlacesService(map);
service.nearbySearch({
  location: { lat: venue.latitude, lng: venue.longitude },
  radius: 500,
  type: ['restaurant']
}, callback);
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Componente VenueMap creado
- [x] Utilidades de Google Maps implementadas
- [x] Hook useGoogleMaps creado
- [x] Integración en EventDetail
- [x] Variables de entorno configuradas
- [x] Documentación completa
- [ ] Obtener API Key de Google Maps (PENDIENTE - Usuario)
- [ ] Configurar restricciones de seguridad (PENDIENTE - Usuario)
- [ ] Agregar coordenadas a venues en backend (PENDIENTE - Backend)

---

## 📚 RECURSOS

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Snazzy Maps - Estilos](https://snazzymaps.com/)
- [Maps API Pricing](https://mapsplatform.google.com/pricing/)

---

**Última actualización**: 2025-10-28  
**Desarrollado por**: Cascade AI Assistant 🚀
