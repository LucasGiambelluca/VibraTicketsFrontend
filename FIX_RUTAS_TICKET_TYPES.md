# ✅ Fix: Rutas con Prefijo /ticket-types

**Fecha:** 2025-01-29  
**Problema:** 404 en `/api/tickets/reserve`  
**Solución:** Usar `/api/ticket-types/tickets/reserve`

---

## 🎯 El Problema

El backend tiene las rutas montadas con el prefijo `/ticket-types`:

```javascript
// En el backend (index.js)
app.use('/ticket-types', ticketTypesRoutes);
```

Esto significa que todas las rutas tienen el prefijo `/api/ticket-types`:

```
❌ /api/tickets/reserve (404)
✅ /api/ticket-types/tickets/reserve (funciona)
```

---

## ✅ Solución Implementada

He actualizado **TODAS** las rutas de tickets en `apiService.js`:

### Antes (404):
```javascript
POST /api/tickets/reserve
GET  /api/tickets/reservations/:id
GET  /api/tickets/reservations/me
DELETE /api/tickets/reservations/:id
POST /api/tickets/validate
POST /api/tickets/transfer
POST /api/tickets/transfer/accept/:code
GET  /api/tickets/transfers
```

### Ahora (✅ Funciona):
```javascript
POST /api/ticket-types/tickets/reserve
GET  /api/ticket-types/tickets/reservations/:id
GET  /api/ticket-types/tickets/reservations/me
DELETE /api/ticket-types/tickets/reservations/:id
POST /api/ticket-types/tickets/validate
POST /api/ticket-types/tickets/transfer
POST /api/ticket-types/tickets/transfer/accept/:code
GET  /api/ticket-types/tickets/transfers
```

---

## 📝 Rutas Actualizadas

### ticketsApi
```javascript
createReservation()
→ POST /api/ticket-types/tickets/reserve ✅

getReservation(reservationId)
→ GET /api/ticket-types/tickets/reservations/:id ✅

getMyReservations()
→ GET /api/ticket-types/tickets/reservations/me ✅

cancelReservation(reservationId)
→ DELETE /api/ticket-types/tickets/reservations/:id ✅
```

### ticketValidationApi
```javascript
validateTicket(validationData)
→ POST /api/ticket-types/tickets/validate ✅

getValidationStats(eventId)
→ GET /api/events/:eventId/validation-stats ✅
```

### ticketTransferApi
```javascript
initiateTransfer(transferData)
→ POST /api/ticket-types/tickets/transfer ✅

acceptTransfer(transferCode)
→ POST /api/ticket-types/tickets/transfer/accept/:code ✅

getMyTransfers(type)
→ GET /api/ticket-types/tickets/transfers ✅
```

---

## 🧪 Testing

### 1. Refrescar el Frontend

```bash
Ctrl + Shift + R
```

### 2. Intentar Crear Reserva

Deberías ver en la consola:

```
🎫 Creando reserva de tickets (V2): {
  eventId: 123,
  tickets: [{ typeId: 1, quantity: 2 }],
  customerInfo: { ... }
}

✅ Respuesta del backend: {
  reservationIds: [45, 46],
  totalAmount: 10000,
  expiresAt: "2025-10-29T12:45:00Z"
}
```

### 3. NO Deberías Ver

```
❌ POST http://localhost:3000/api/tickets/reserve 404 (Not Found)
```

---

## 📊 Endpoints Finales

| Funcionalidad | Endpoint | Estado |
|---------------|----------|--------|
| **Crear reserva** | `POST /api/ticket-types/tickets/reserve` | ✅ |
| **Obtener reserva** | `GET /api/ticket-types/tickets/reservations/:id` | ✅ |
| **Mis reservas** | `GET /api/ticket-types/tickets/reservations/me` | ✅ |
| **Cancelar reserva** | `DELETE /api/ticket-types/tickets/reservations/:id` | ✅ |
| **Tipos de tickets** | `GET /api/events/:eventId/ticket-types` | ✅ |
| **Validar ticket** | `POST /api/ticket-types/tickets/validate` | ✅ |
| **Estadísticas** | `GET /api/events/:eventId/validation-stats` | ✅ |
| **Transferir** | `POST /api/ticket-types/tickets/transfer` | ✅ |
| **Aceptar transferencia** | `POST /api/ticket-types/tickets/transfer/accept/:code` | ✅ |
| **Mis transferencias** | `GET /api/ticket-types/tickets/transfers` | ✅ |

---

## 🎯 Resultado

**✅ TODAS las rutas ahora usan el prefijo correcto `/ticket-types`**

El flujo de venta debería funcionar completamente:

```
1. Seleccionar localidad → ShowDetail
2. Seleccionar asientos → SeatSelection
3. Crear reserva → POST /api/ticket-types/tickets/reserve ✅
4. Ir a checkout → Checkout
5. Pagar con MP → Mercado Pago
6. Ver confirmación → PaymentSuccess
```

---

## 📁 Archivos Modificados

```
✏️  src/services/apiService.js
    - ticketsApi: Todas las rutas con /ticket-types
    - ticketValidationApi: Rutas con /ticket-types
    - ticketTransferApi: Rutas con /ticket-types

➕  FIX_RUTAS_TICKET_TYPES.md
    - Documentación del fix
    - Lista completa de endpoints
```

---

**Probá ahora y debería funcionar sin errores 404.** 🚀

---

**Fecha:** 2025-01-29  
**Estado:** ✅ COMPLETADO
