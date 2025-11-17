# ✅ VERIFICACIÓN: Frontend vs Backend - Cola Virtual

## 📋 CHECKLIST COMPLETO

### 1. ✅ showId
**Frontend usa:** `showId` desde `useParams()` (dinámico de la URL)
- Ruta: `/queue/:showId`
- Ejemplo: `/queue/9` → showId = 9
- ✅ **Correcto:** El frontend usa el showId que viene de la URL

**Acción:** Asegurate de navegar a `/queue/9` si estás simulando el show 9

---

### 2. ✅ URLs del Frontend

**Base URL:** `http://localhost:3000` (definido en `.env`)

**Endpoints que el frontend está llamando:**
```javascript
POST http://localhost:3000/api/queue/:showId/join
GET  http://localhost:3000/api/queue/:showId/position
DELETE http://localhost:3000/api/queue/:showId/leave
POST http://localhost:3000/api/queue/:showId/process-next (admin)
GET  http://localhost:3000/api/queue/:showId/stats (admin)
```

**✅ Correcto:** Las URLs coinciden con las que mencionaste

---

### 3. ❓ Endpoints Faltantes en el Frontend

Según tu checklist, el backend tiene estos endpoints que **NO** están en el frontend:

```javascript
// ❌ FALTA en frontend:
GET /api/queue/:showId/my-status
GET /api/queue/:showId/status (público)
```

**Solución:** Voy a agregarlos ahora mismo

---

### 4. ✅ Authorization Header

**El frontend SÍ envía el token JWT:**
```javascript
// En src/api/client.js
const token = localStorage.getItem('token');

if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

✅ **Correcto:** Todas las requests incluyen `Authorization: Bearer <token>`

---

### 5. ✅ Base URL

**Frontend usa:** `http://localhost:3000/api/queue/...`
- Prefijo: `/api/` ✅
- NO usa `/api/v1/` ✅

✅ **Correcto:** La base URL es la correcta

---

### 6. ⚠️ CORS

**Frontend corre en:** `http://localhost:5173` (Vite default)

**Verificar en el backend:**
```bash
# En el .env del backend:
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Si no está, agregar `http://localhost:5173`

---

## 🔧 ENDPOINTS FALTANTES A AGREGAR

### 1. `my-status` - Verificar si el usuario está en cola

```javascript
// En apiService.js
queueApi: {
  // ... métodos existentes ...
  
  // 🆕 Verificar estado del usuario en la cola
  getMyStatus: (showId) => {
    console.log('📊 Consultando mi estado en la cola:', showId);
    return apiClient.get(`${API_BASE}/queue/${showId}/my-status`);
  },
  
  // 🆕 Obtener estado público de la cola (sin auth)
  getQueueStatus: (showId) => {
    console.log('📊 Consultando estado público de la cola:', showId);
    return apiClient.get(`${API_BASE}/queue/${showId}/status`);
  }
}
```

---

## 🧪 FLUJO RECOMENDADO

### Paso 1: Verificar Estado Antes de Unirse

```javascript
// En Queue.jsx, antes de joinQueue()
try {
  const status = await queueApi.getMyStatus(showId);
  
  if (status.inQueue) {
    // Ya estás en la cola
    console.log('✅ Ya estás en la cola, posición:', status.position);
    setPosition(status.position);
    setQueueSize(status.queueSize);
    startPolling();
    return;
  }
  
  // No estás en la cola, unirse
  await joinQueue();
} catch (err) {
  // Si 404, no estás en la cola, unirse
  await joinQueue();
}
```

### Paso 2: Polling Cada 10s

```javascript
// Ya implementado ✅
const response = await queueApi.getQueuePosition(showId);

if (response.hasAccess && response.accessToken) {
  // Redirigir ✅
}
```

---

## 🎯 RESPUESTAS ESPERADAS DEL BACKEND

### Posición Lejana (position > 3):
```json
{
  "position": 121,
  "queueSize": 130,
  "hasAccess": false,
  "accessToken": null,
  "message": "Posición 121 - Espera estimada: 60 minutos"
}
```

### Top 3 (Auto-acceso, position ≤ 3):
```json
{
  "position": 2,
  "queueSize": 130,
  "hasAccess": true,
  "accessToken": "uuid-token-abc-xyz-789",
  "expiresAt": "2025-11-13T17:00:00Z",
  "message": "¡Es tu turno! Tienes 15 minutos para completar tu compra"
}
```

---

## 🔍 DEBUGGING EN NETWORK TAB

### Qué Verificar:

1. **Request URL:**
   ```
   ✅ http://localhost:3000/api/queue/9/position
   ❌ http://localhost:3000/queue/9/position (falta /api/)
   ❌ http://localhost:3000/api/v1/queue/9/position (prefijo extra)
   ```

2. **Request Headers:**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Content-Type: application/json
   ```

3. **Response Status:**
   ```
   200 OK - ✅ Funcionando
   404 Not Found - ❌ Ruta incorrecta o showId no existe
   401 Unauthorized - ❌ Token faltante o inválido
   403 Forbidden - ❌ Usuario sin permisos
   ```

4. **Response Body:**
   ```json
   {
     "position": 2,
     "hasAccess": true,    // ⭐ Debe estar en TRUE cuando position ≤ 3
     "accessToken": "..." // ⭐ Debe estar presente
   }
   ```

---

## ✅ CONFIGURACIÓN ACTUAL DEL FRONTEND

| Item | Valor | Estado |
|------|-------|--------|
| Base URL | `http://localhost:3000` | ✅ |
| Prefijo | `/api/` | ✅ |
| showId | Dinámico desde URL params | ✅ |
| Auth | JWT en `Authorization` header | ✅ |
| Endpoint join | `/api/queue/:showId/join` | ✅ |
| Endpoint position | `/api/queue/:showId/position` | ✅ |
| Endpoint leave | `/api/queue/:showId/leave` | ✅ |
| Endpoint my-status | ❌ FALTA | ⚠️ |
| Endpoint status | ❌ FALTA | ⚠️ |

---

## 🚀 PRÓXIMOS PASOS

### 1. Agregar Endpoints Faltantes
Voy a agregar `my-status` y `status` al frontend ahora mismo.

### 2. Verificar showId
Asegurate de estar navegando a `/queue/9` si el backend está procesando el show 9.

### 3. Verificar CORS
En el backend `.env`, agregar:
```
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Ver Network Tab
Abre F12 → Network → Filtra por "queue" y verifica:
- Request URL completa
- Status code
- Response body

### 5. Ver Logs del Backend
Cuando el usuario llega a position ≤ 3, el backend debería logear:
```
🎫 [Queue] Auto-access granted - User 123 at position 2
✅ AccessToken generado: uuid-abc-xyz-789
```

---

## 📞 INFORMACIÓN PARA TI

**¿Qué showId estás usando?**
- El frontend usa el showId de la URL
- Si vas a `/queue/9` → usa show 9 ✅
- Si vas a `/queue/38` → usa show 38

**¿Querés que simule el show 9?**
Sí, por favor deja corriendo la simulación del show 9 para que vea el avance real.

**¿Copio la Request URL del Network tab?**
Sí, por favor copia exactamente la URL que aparece en la request 404 para ver qué está mal.

---

## 🎯 RESUMEN

**Frontend:** ✅ Configurado correctamente
- URLs correctas
- Auth incluido
- showId dinámico

**Falta implementar:**
- ⚠️ Endpoint `my-status` (para verificar estado antes de unirse)
- ⚠️ Endpoint `status` (estado público)

**Backend debe devolver:**
- `hasAccess: true` cuando position ≤ 3
- `accessToken` incluido en la respuesta
- `expiresAt` con TTL de 15 minutos

**¡Voy a agregar los endpoints faltantes ahora!** 🚀
