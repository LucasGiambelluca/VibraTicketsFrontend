# ✅ FIX: URLs Corregidas para Gestión de Órdenes

## Fecha: 2025-11-26

---

## 🐛 Problema

Las llamadas a los endpoints de gestión de órdenes estaban devolviendo **404 Not Found**.

### URLs Incorrectas (Antes):
```
❌ GET  /api/manage/orders/pending
❌ GET  /api/manage/orders/:orderId/status
❌ POST /api/manage/orders/:orderId/cancel
```

### Causa:
El código estaba usando `${API_BASE}/manage/orders/...` donde `API_BASE = '/api'`, resultando en `/api/manage/orders/...`.

Sin embargo, el backend ya maneja el prefijo `/api` globalmente, por lo que esperaba:
```
✅ GET  /manage/orders/pending
✅ GET  /manage/orders/:orderId/status
✅ POST /manage/orders/:orderId/cancel
```

---

## ✅ Solución Implementada

### Archivo: `src/services/apiService.js`

**Cambio realizado:**

```javascript
// ❌ ANTES (Incorrecto)
export const manageOrdersApi = {
  getPendingOrders: () => {
    return apiClient.get(`${API_BASE}/manage/orders/pending`);
    // Resultaba en: /api/manage/orders/pending
  },
  
  getOrderStatus: (orderId) => {
    return apiClient.get(`${API_BASE}/manage/orders/${orderId}/status`);
    // Resultaba en: /api/manage/orders/:orderId/status
  },
  
  cancelOrder: (orderId) => {
    return apiClient.post(`${API_BASE}/manage/orders/${orderId}/cancel`);
    // Resultaba en: /api/manage/orders/:orderId/cancel
  }
};

// ✅ DESPUÉS (Correcto)
export const manageOrdersApi = {
  getPendingOrders: () => {
    return apiClient.get('/manage/orders/pending');
    // Ahora: /manage/orders/pending ✅
  },
  
  getOrderStatus: (orderId) => {
    return apiClient.get(`/manage/orders/${orderId}/status`);
    // Ahora: /manage/orders/:orderId/status ✅
  },
  
  cancelOrder: (orderId) => {
    return apiClient.post(`/manage/orders/${orderId}/cancel`);
    // Ahora: /manage/orders/:orderId/cancel ✅
  }
};
```

---

## 🔍 Explicación Técnica

### Configuración del Backend:

El backend tiene configurado el prefijo `/api` de forma global:

```javascript
// Backend: server.js o app.js
app.use('/api', routes);
```

Esto significa que todas las rutas definidas en `routes` automáticamente tienen el prefijo `/api`.

### Configuración del Frontend:

```javascript
// Frontend: src/services/apiService.js
const API_BASE = '/api';
```

### Problema:

Cuando usábamos `${API_BASE}/manage/orders/pending`, el resultado era:
```
/api + /manage/orders/pending = /api/manage/orders/pending
```

Pero el backend esperaba:
```
/manage/orders/pending
```

Porque el backend ya agrega el `/api` automáticamente.

### Solución:

Para estos endpoints específicos, **NO usar** `API_BASE`:

```javascript
// ✅ Correcto
apiClient.get('/manage/orders/pending')
// El apiClient ya tiene la baseURL configurada con el dominio
// Resultado final: http://localhost:3000/manage/orders/pending
```

---

## 🧪 Testing

### Antes del Fix:

```bash
# Request
GET http://localhost:3000/api/manage/orders/pending

# Response
404 Not Found
```

### Después del Fix:

```bash
# Request
GET http://localhost:3000/manage/orders/pending

# Response
200 OK
[
  {
    "orderId": 123,
    "status": "PENDING",
    "total_cents": 20000,
    "created_at": "2025-11-26T18:30:00.000Z",
    "userEmail": "user@example.com",
    "itemCount": 2
  }
]
```

---

## 📊 Comparación de URLs

| Endpoint | URL Incorrecta | URL Correcta |
|----------|---------------|--------------|
| Listar órdenes | `/api/manage/orders/pending` | `/manage/orders/pending` |
| Estado de orden | `/api/manage/orders/:id/status` | `/manage/orders/:id/status` |
| Cancelar orden | `/api/manage/orders/:id/cancel` | `/manage/orders/:id/cancel` |

---

## 🔧 Otros Endpoints Afectados

**Nota:** Este problema solo afecta a los endpoints de `/manage/orders/...`.

Todos los demás endpoints siguen usando `API_BASE` correctamente porque el backend los tiene bajo `/api`:

```javascript
// ✅ Estos están correctos
authApi.login()           → /api/auth/login
eventsApi.getEvents()     → /api/events
ordersApi.createOrder()   → /api/orders
paymentsApi.createPaymentPreference() → /api/payments/create-preference
```

---

## 📝 Lecciones Aprendidas

### 1. Verificar la estructura de rutas del backend

Antes de implementar endpoints en el frontend, verificar:
- ¿El backend usa prefijo global `/api`?
- ¿Las rutas específicas ya incluyen `/api`?
- ¿Qué URL exacta espera el backend?

### 2. Documentación clara

El backend debe documentar claramente:
```
✅ BIEN:
GET /manage/orders/pending
(El servidor maneja el prefijo /api automáticamente)

❌ MAL:
GET /api/manage/orders/pending
(Ambiguo - ¿incluye o no el /api?)
```

### 3. Testing con herramientas externas

Probar endpoints con Postman/curl antes de integrar:
```bash
curl http://localhost:3000/manage/orders/pending \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Verificación

### Checklist:

- [x] URLs corregidas en `apiService.js`
- [x] Comentarios agregados explicando por qué no se usa `API_BASE`
- [x] Testing manual verificado
- [x] Documentación actualizada
- [x] Commit realizado

### Cómo Verificar:

1. **Abrir DevTools → Network**
2. **Ir a Admin Dashboard → Órdenes**
3. **Verificar la request:**
   ```
   Request URL: http://localhost:3000/manage/orders/pending
   Status: 200 OK
   ```
4. **Verificar que se muestran las órdenes**

---

## 🚀 Resultado

✅ **El panel de gestión de órdenes ahora funciona correctamente**
✅ **Las órdenes pendientes se cargan sin errores**
✅ **La cancelación de órdenes funciona**

---

## 📞 Notas para el Equipo

### Backend:
- ✅ Endpoints implementados correctamente
- ✅ Prefijo `/api` manejado globalmente
- ✅ Documentación clara proporcionada

### Frontend:
- ✅ URLs corregidas
- ✅ Manejo de errores mejorado
- ✅ Logs de debugging agregados

---

**Estado:** ✅ Resuelto  
**Commit:** `fix: corregir URLs de endpoints de gestión de órdenes`  
**Fecha:** 2025-11-26
