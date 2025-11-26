# ✅ Configuración Final: Gestión de Órdenes

## Fecha: 2025-11-26
## Estado: ✅ CONFIGURADO CORRECTAMENTE

---

## 📋 Resumen

El frontend está **correctamente configurado** para consumir los endpoints de gestión de órdenes del backend.

---

## 🔧 URLs Configuradas

### Frontend (`src/services/apiService.js`):

```javascript
export const manageOrdersApi = {
  // GET /api/manage/orders/pending
  getPendingOrders: () => {
    return apiClient.get(`${API_BASE}/manage/orders/pending`);
    // Resultado: /api/manage/orders/pending ✅
  },

  // GET /api/manage/orders/:orderId/status
  getOrderStatus: (orderId) => {
    return apiClient.get(`${API_BASE}/manage/orders/${orderId}/status`);
    // Resultado: /api/manage/orders/123/status ✅
  },

  // POST /api/manage/orders/:orderId/cancel
  cancelOrder: (orderId) => {
    return apiClient.post(`${API_BASE}/manage/orders/${orderId}/cancel`);
    // Resultado: /api/manage/orders/123/cancel ✅
  }
};
```

Donde:
```javascript
const API_BASE = '/api';
```

---

## 🌐 Endpoints del Backend

### 1. Obtener Órdenes Pendientes
```
GET /api/manage/orders/pending
```

**Request:**
```bash
curl http://localhost:3000/api/manage/orders/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
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

### 2. Obtener Estado de Orden
```
GET /api/manage/orders/:orderId/status
```

**Request:**
```bash
curl http://localhost:3000/api/manage/orders/123/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "id": 123,
  "status": "PENDING",
  "total_cents": 20000,
  "created_at": "2025-11-26T18:30:00.000Z",
  "paid_at": null
}
```

### 3. Cancelar Orden
```
POST /api/manage/orders/:orderId/cancel
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/manage/orders/123/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "La orden 123 ha sido cancelada y se liberaron 2 asientos."
}
```

---

## 🔐 Autenticación

### Token JWT Requerido:

```javascript
// El apiClient automáticamente agrega el header:
Authorization: Bearer <TOKEN_FROM_LOCALSTORAGE>
```

### Rol Requerido:
- ✅ ADMIN

### Verificar Token:
```javascript
// En la consola del navegador:
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

---

## 🧪 Testing

### 1. Verificar que el backend está corriendo:

```bash
curl http://localhost:3000/api/health
# Debería devolver 200 OK
```

### 2. Verificar autenticación:

```bash
# Login como admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Copiar el token de la respuesta
```

### 3. Probar endpoint de órdenes:

```bash
curl http://localhost:3000/api/manage/orders/pending \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

## 🐛 Troubleshooting

### Error: 404 Not Found

**Causa:** Backend no tiene el endpoint implementado

**Solución:**
1. Verificar que el backend está corriendo
2. Verificar que el endpoint existe en el código del backend
3. Verificar logs del backend

### Error: 401 Unauthorized

**Causa:** Token inválido o expirado

**Solución:**
1. Hacer logout y login nuevamente
2. Verificar que el token está en localStorage
3. Verificar que el token no ha expirado

### Error: 403 Forbidden

**Causa:** Usuario no tiene rol ADMIN

**Solución:**
1. Verificar rol del usuario en localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('user')).role
   // Debe ser: "ADMIN"
   ```
2. Usar cuenta de administrador

### Error: CORS

**Causa:** Backend no permite requests desde el frontend

**Solución:**
1. Verificar configuración CORS en el backend
2. Verificar que el backend permite `http://localhost:5173` (Vite)

### Error: Network Error

**Causa:** Backend no está corriendo o URL incorrecta

**Solución:**
1. Verificar que el backend está corriendo en `http://localhost:3000`
2. Verificar `.env` del frontend:
   ```
   VITE_API_URL=http://localhost:3000
   ```

---

## 📊 Logs Esperados

### Frontend (Consola del Navegador):

```
🔍 Cargando órdenes pendientes...
🔍 URL Base: http://localhost:3000
🔍 Token presente: true
📦 Respuesta del backend (tipo): object
📦 Es array?: true
✅ Respuesta es array directo
✅ Órdenes procesadas: 5
✅ Se cargaron 5 órdenes pendientes
```

### Backend (Terminal):

```
📥 Obteniendo órdenes pendientes...
👤 Usuario: { id: 1, email: 'admin@example.com', role: 'ADMIN' }
✅ Encontradas 5 órdenes
```

---

## ✅ Checklist de Verificación

### Frontend:
- [x] URLs configuradas correctamente en `apiService.js`
- [x] Componente `ManageOrders.jsx` implementado
- [x] Integrado en `AdminDashboard.jsx`
- [x] Manejo de errores implementado
- [x] Logs de debugging agregados

### Backend:
- [ ] Endpoints implementados
- [ ] Middlewares de autenticación funcionando
- [ ] Respuestas en formato correcto
- [ ] CORS configurado
- [ ] Logs de debugging agregados

### Testing:
- [ ] Endpoint probado con curl/Postman
- [ ] Login como admin funciona
- [ ] Panel de órdenes carga correctamente
- [ ] Cancelación de órdenes funciona

---

## 🚀 Cómo Usar

### Para Administradores:

1. **Login como Admin:**
   - Ir a `/adminlogin`
   - Ingresar credenciales de administrador

2. **Acceder al Panel:**
   - Ir a Admin Dashboard
   - Click en "Órdenes" en el menú lateral

3. **Ver Órdenes Pendientes:**
   - La tabla se carga automáticamente
   - Ver estadísticas en la parte superior

4. **Cancelar una Orden:**
   - Click en botón "Cancelar" en la fila de la orden
   - Confirmar la acción
   - La orden se cancela y los asientos se liberan

---

## 📝 Estructura de Datos

### Orden Pendiente:

```typescript
interface PendingOrder {
  orderId: number;           // ID de la orden
  status: string;            // "PENDING", "PAID", "CANCELLED", "EXPIRED"
  total_cents: number;       // Monto en centavos
  created_at: string;        // ISO 8601 timestamp
  userEmail: string;         // Email del comprador
  itemCount: number;         // Cantidad de items/tickets
}
```

---

## 🎯 Próximos Pasos

1. **Recargar la página** del panel de administración
2. **Ir a la sección "Órdenes"**
3. **Verificar que se cargan las órdenes**
4. **Si hay error, revisar:**
   - Logs en consola del navegador
   - Logs en terminal del backend
   - Token de autenticación
   - Rol del usuario

---

**Estado:** ✅ Frontend configurado correctamente  
**Esperando:** Backend funcionando  
**Última actualización:** 2025-11-26
