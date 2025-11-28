# 🔧 Solución al Problema de CORS

## Problema Identificado

Los logs muestran errores de CORS:
```
Access to XMLHttpRequest at 'https://vibra-tickets-backend.onrender.com/api/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Causa

El backend en Render (`https://vibra-tickets-backend.onrender.com`) no está configurado para aceptar peticiones desde tu frontend local (`http://localhost:5173`).

## Soluciones

### Opción 1: Configurar CORS en el Backend (RECOMENDADO)

El backend necesita agregar `http://localhost:5173` a la lista de orígenes permitidos.

En el archivo del backend (probablemente `server.js` o `app.js`), asegúrate de tener:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',           // Frontend local
  'http://localhost:5174',           // Backup
  'https://vibratickets.online',     // Producción
  'https://www.vibratickets.online'  // Producción con www
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir peticiones sin origin (como Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
```

### Opción 2: Usar un Proxy en Vite (TEMPORAL)

Si no puedes modificar el backend inmediatamente, puedes configurar un proxy en Vite.

**Archivo: `vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://vibra-tickets-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
```

Luego, modifica `src/api/client.js`:

```javascript
// Cambiar línea 2:
const API_BASE_URL = import.meta.env.VITE_API_URL || '';  // Vacío para usar proxy
```

### Opción 3: Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_API_URL=https://vibra-tickets-backend.onrender.com
```

**IMPORTANTE**: Esto solo funcionará si el backend tiene CORS configurado correctamente.

## Pasos Inmediatos

### 1. Verificar la URL del Backend

¿Cuál es la URL correcta de tu backend?
- ✅ `https://vibra-tickets-backend.onrender.com`
- ❓ `https://vibratickets.online`

### 2. Crear archivo .env

Crea manualmente el archivo `.env` en la raíz del proyecto:

```bash
# En la raíz de ticketera-frontend
New-Item -Path .env -ItemType File -Force
```

Luego edita el archivo y agrega:

```env
VITE_API_URL=https://vibra-tickets-backend.onrender.com
```

### 3. Reiniciar el servidor de desarrollo

```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar:
pnpm run dev
```

### 4. Contactar al Backend

**CRÍTICO**: El backend DEBE configurar CORS para permitir `http://localhost:5173`.

Envía este mensaje al equipo de backend:

```
Hola, necesito que agreguen http://localhost:5173 a la lista de 
orígenes permitidos en CORS del backend. 

Actualmente estoy recibiendo este error:
"Access to XMLHttpRequest has been blocked by CORS policy"

Por favor, actualicen la configuración de CORS para incluir:
- http://localhost:5173
- http://localhost:5174

Gracias!
```

## Verificación

Después de aplicar la solución, verifica:

1. **Consola del navegador**: No debe haber errores de CORS
2. **Network tab**: Las peticiones deben tener status 200
3. **Response headers**: Debe incluir `Access-Control-Allow-Origin`

## Notas Adicionales

- Los errores de CORS son **del lado del servidor**, no del cliente
- No se pueden "arreglar" solo desde el frontend
- El proxy de Vite es solo una solución temporal para desarrollo
- En producción, el backend DEBE tener CORS configurado correctamente

## ¿Tienes acceso al backend?

Si tienes acceso al código del backend, puedo ayudarte a configurar CORS correctamente.
Si no, necesitas contactar al equipo de backend para que lo configuren.
