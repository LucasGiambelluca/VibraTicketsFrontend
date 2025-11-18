# 🔧 FIX: Error CORS con Header Idempotency-Key

## 🐛 Problema:
```
Access to fetch at 'http://localhost:3000/api/holds' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Request header field idempotency-key is not allowed 
by Access-Control-Allow-Headers in preflight response.
```

### ¿Qué está pasando?
1. **Frontend** envía el header `Idempotency-Key` al crear HOLDs para evitar duplicados
2. **Backend** NO tiene ese header configurado en CORS
3. El navegador bloquea la petición antes de que llegue al servidor

---

## ✅ Solución TEMPORAL (Ya Aplicada):

**Frontend - apiService.js:**
```javascript
// ANTES (❌ Causa error CORS):
return apiClient.post(`${API_BASE}/holds`, holdData, {
  headers: {
    'Idempotency-Key': idempotencyKey
  }
});

// AHORA (✅ Comentado temporalmente):
return apiClient.post(`${API_BASE}/holds`, holdData /*, {
  headers: {
    'Idempotency-Key': idempotencyKey
  }
}*/);
```

**Estado:** Esto permite que funcione ahora, pero perdemos la protección contra duplicados.

---

## 🎯 Solución PERMANENTE (Backend):

### Opción 1: Agregar Header a CORS (Recomendado)

Encuentra el archivo de configuración del servidor (ej: `server.js`, `app.js`, `index.js`) y actualiza CORS:

```javascript
// Backend - server.js o app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',  // Dev frontend
    'http://localhost:3000',  // Dev backend
    'https://vibratickets.online',  // Producción
    // Agregar otros orígenes si es necesario
  ],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Idempotency-Key',  // ← AGREGAR ESTE HEADER
    'ngrok-skip-browser-warning'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

### Opción 2: CORS Wildcard (Solo para desarrollo)

```javascript
// ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
app.use(cors({
  origin: '*',
  allowedHeaders: '*'
}));
```

---

## 📋 Otros Headers que el Backend Debería Permitir:

```javascript
allowedHeaders: [
  'Content-Type',          // JSON requests
  'Authorization',         // JWT tokens
  'Idempotency-Key',       // Evitar duplicados ← IMPORTANTE
  'ngrok-skip-browser-warning',  // Para ngrok
  'X-Requested-With',      // AJAX requests
  'Accept'                 // Content negotiation
]
```

---

## 🔄 Pasos para Activar la Solución Permanente:

### 1. En el Backend:
```bash
# 1. Abrir el archivo de configuración del servidor
# Buscar: server.js, app.js, index.js, o main.js

# 2. Encontrar la configuración de CORS
# Buscar líneas que contengan: cors(), app.use(cors

# 3. Agregar 'Idempotency-Key' a allowedHeaders

# 4. Reiniciar el servidor
npm start
# o
pnpm start
```

### 2. En el Frontend:
```javascript
// Descomentar el header en apiService.js (líneas 382-387)
return apiClient.post(`${API_BASE}/holds`, holdData, {
  headers: {
    'Idempotency-Key': idempotencyKey
  }
});
```

### 3. Testing:
```bash
# Frontend
pnpm run dev

# Probar crear HOLD
# 1. Ir a un evento
# 2. Seleccionar sección
# 3. Click "Continuar"
# 4. Verificar en Network tab (F12) que NO hay error CORS
```

---

## 🎯 ¿Por qué es Importante el Idempotency-Key?

### Sin Idempotency-Key:
```
Usuario → Click "Continuar" (1 vez)
  → Red lenta, no responde...
  → Usuario click "Continuar" otra vez
  → 💥 Se crean 2 HOLDs duplicados
  → Usuario pierde dinero o se confunde
```

### Con Idempotency-Key:
```
Usuario → Click "Continuar" (1 vez)
  → Envía: Idempotency-Key: "hold-abc-123"
  → Red lenta, no responde...
  → Usuario click "Continuar" otra vez
  → Envía: Idempotency-Key: "hold-abc-123" (mismo)
  → Backend detecta mismo key → Devuelve HOLD existente
  → ✅ Solo 1 HOLD creado
```

---

## 📊 Verificación de Headers CORS:

### Cómo Verificar en el Navegador:

1. **Abrir DevTools:** F12
2. **Ir a Network tab**
3. **Hacer una petición a /api/holds**
4. **Click en la petición OPTIONS (preflight)**
5. **Ver Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Headers que Debés Ver:
```
✅ Access-Control-Allow-Headers: ... Idempotency-Key ...
✅ Access-Control-Allow-Origin: http://localhost:5173
✅ Access-Control-Allow-Credentials: true
```

---

## 🚨 Otros Errores Relacionados:

### 1. Error 404 en `/api/shows/:id/tickets`
```javascript
// ShowDetail.jsx - línea 55
// Esto ya está manejado con try-catch, no es crítico
try {
  const ticketsResponse = await showsApi.getShowTickets(showId);
  // ...
} catch (ticketsError) {
  // Continuar sin el filtro de tickets ← OK
}
```

**Estado:** No es crítico, solo un workaround para filtrar asientos vendidos.  
**Solución Backend:** Crear endpoint `GET /api/shows/:showId/tickets` (opcional)

---

## 📁 Archivos Modificados:

### Frontend:
- `src/services/apiService.js` - Header Idempotency-Key comentado temporalmente

### Backend (Pendiente):
- `server.js` o `app.js` - Agregar header a CORS allowedHeaders

---

## 🧪 Testing Completo:

### Después de Configurar CORS en Backend:

```bash
# 1. Backend configurado con Idempotency-Key permitido
# 2. Frontend con header descomentado
# 3. Testing:

✓ Crear HOLD una vez → Éxito
✓ Crear HOLD con mismo key → Devuelve HOLD existente (no duplica)
✓ No hay error CORS en consola
✓ Network tab muestra header enviado correctamente
```

---

## 📖 Documentación Relacionada:

- **MDN CORS:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Express CORS:** https://expressjs.com/en/resources/middleware/cors.html
- **Idempotency Pattern:** https://stripe.com/docs/api/idempotent_requests

---

## ✅ Checklist:

### Backend:
- [ ] Agregar `Idempotency-Key` a `allowedHeaders` en CORS
- [ ] Reiniciar servidor
- [ ] Verificar OPTIONS request en Network tab

### Frontend:
- [x] Header comentado temporalmente (commit: 4f3ce8a)
- [ ] Descomentar header cuando backend esté listo
- [ ] Testing completo de creación de HOLDS

---

**Fecha:** 2025-11-18  
**Commit:** 4f3ce8a  
**Estado:** ⏳ Fix temporal aplicado, esperando configuración backend  
**Prioridad:** 🔴 ALTA - Afecta funcionalidad de compra de tickets

---

## 🎯 Próximos Pasos:

1. **URGENTE:** Configurar CORS en backend con `Idempotency-Key`
2. Descomentar header en frontend
3. Testing completo
4. Opcional: Crear endpoint `/api/shows/:id/tickets` si se necesita

