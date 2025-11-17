# 🔄 Actualización: Cola Virtual con JWT Automático

## 📅 Fecha: 2025-11-13

## ✅ CAMBIOS REALIZADOS

El backend fue actualizado para extraer el **`userId` automáticamente del token JWT**, eliminando la necesidad de enviarlo manualmente en cada request.

---

## 🎯 CAMBIOS EN EL FRONTEND

### 1. **apiService.js** - queueApi actualizado

**ANTES:**
```javascript
export const queueApi = {
  joinQueue: (showId, userId) => {
    return apiClient.post(`${API_BASE}/queue/${showId}/join`, { userId });
  },
  
  getQueuePosition: (showId, userId) => {
    return apiClient.get(`${API_BASE}/queue/${showId}/position`, { userId });
  }
};
```

**AHORA:**
```javascript
export const queueApi = {
  // userInfo es opcional
  joinQueue: (showId, userInfo = null) => {
    const body = userInfo ? { userInfo } : {};
    return apiClient.post(`${API_BASE}/queue/${showId}/join`, body);
  },
  
  // userId se toma del JWT automáticamente
  getQueuePosition: (showId) => {
    return apiClient.get(`${API_BASE}/queue/${showId}/position`);
  },
  
  // Nuevo método agregado
  leaveQueue: (showId) => {
    return apiClient.delete(`${API_BASE}/queue/${showId}/leave`);
  }
};
```

### 2. **Queue.jsx** - Actualizado

**ANTES:**
```javascript
// ❌ Enviaba userId manualmente
const response = await queueApi.joinQueue(showId, user.id);
const positionResponse = await queueApi.getQueuePosition(showId, user.id);
```

**AHORA:**
```javascript
// ✅ userInfo opcional, userId del JWT
const userInfo = {
  name: user.name || user.email?.split('@')[0],
  email: user.email
};
const response = await queueApi.joinQueue(showId, userInfo);

// ✅ userId se extrae del JWT automáticamente
const positionResponse = await queueApi.getQueuePosition(showId);
```

---

## 📡 ENDPOINTS ACTUALIZADOS

### POST /api/queue/:showId/join
```http
POST /api/queue/38/join
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "userInfo": {  // ⭐ Opcional
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "position": 42,
  "sessionId": "uuid-...",
  "estimatedWaitTime": 1260,
  "queueSize": 150
}
```

### GET /api/queue/:showId/position
```http
GET /api/queue/38/position
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "showId": 38,
  "position": 15,
  "estimatedWaitTime": 450,
  "queueSize": 98,
  "accessToken": "xyz789..." // Solo cuando position === 0
}
```

### DELETE /api/queue/:showId/leave
```http
DELETE /api/queue/38/leave
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Left queue successfully"
}
```

---

## 🔐 VENTAJAS DEL CAMBIO

1. **Seguridad Mejorada:** No se puede falsificar el userId
2. **Código Más Simple:** Menos parámetros que pasar
3. **Consistencia:** Todas las APIs protegidas usan JWT de la misma manera
4. **DRY (Don't Repeat Yourself):** El userId se extrae una sola vez del token
5. **Prevención de Errores:** No hay riesgo de enviar userId incorrecto

---

## 🧪 TESTING

### 1. Verificar JWT en Request
```javascript
// El apiClient ya incluye el JWT automáticamente
// Ver apiService.js línea ~60:
if (token) {
  config.headers['Authorization'] = `Bearer ${token}`;
}
```

### 2. Probar Flujo Completo
```bash
1. Login → Obtener JWT
2. Ir a /queue/38 → Join automático
3. Verificar en Network tab:
   ✅ Header: Authorization: Bearer eyJhbGc...
   ✅ Body: { userInfo: { name, email } }
   ✅ NO debe haber: { userId: 123 }
4. Polling cada 10s → GET sin userId
5. Recibir accessToken cuando es tu turno
6. Comprar entradas
```

### 3. Verificar Logs
```javascript
// Console debe mostrar:
🚦 Uniéndose a la cola (JWT automático): 38
📊 Consultando posición (JWT automático): 38
// NO debe mostrar: 👤 Usuario: 123
```

---

## 📝 CHECKLIST DE MIGRACIÓN

- [x] Actualizar `queueApi.joinQueue()` para no enviar userId
- [x] Actualizar `queueApi.getQueuePosition()` para no enviar userId
- [x] Agregar `queueApi.leaveQueue()` nuevo método
- [x] Actualizar `Queue.jsx` para enviar userInfo opcional
- [x] Actualizar `Queue.jsx` para no enviar userId en polling
- [x] Actualizar documentación `COLA_VIRTUAL_ACTIVADA.md`
- [x] Agregar logs informativos en apiService
- [x] Verificar que JWT se envía en headers correctamente
- [x] Testing manual del flujo completo

---

## ⚠️ BREAKING CHANGES

Si hay otras partes del código que usan `queueApi`, deben ser actualizadas:

**Buscar y reemplazar:**
```javascript
// ❌ Viejo
queueApi.joinQueue(showId, userId)
queueApi.getQueuePosition(showId, userId)

// ✅ Nuevo
queueApi.joinQueue(showId, userInfo)
queueApi.getQueuePosition(showId)
```

---

## 🎉 RESULTADO

✅ **Frontend compatible con nueva API del backend**  
✅ **Seguridad mejorada con JWT**  
✅ **Código más limpio y mantenible**  
✅ **Testing documentado**  
✅ **Logs actualizados**

**¡Listo para probar!** 🚀
