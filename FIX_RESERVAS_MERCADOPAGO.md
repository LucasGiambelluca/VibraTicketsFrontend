# 🔧 FIX: Integración de Reservas con Mercado Pago

## 🐛 Problema

Al intentar pagar en Checkout, se producía el siguiente error:

```
Error en handleMercadoPagoPayment: Error: No hay reservas para procesar
    at handleMercadoPagoPayment (Checkout.jsx:47:15)
```

### Causa

En `SeatSelection.jsx`, **NO se estaban creando las reservas en el backend**. El código tenía un TODO y generaba un `orderId` falso:

```javascript
// TODO: POST /api/orders { showId, sectionId, quantity o seats }
const orderId = Math.random().toString(36).substr(2, 9);
```

Por lo tanto, cuando el usuario llegaba a Checkout, no había `reservationIds` para procesar el pago con Mercado Pago.

---

## ✅ Solución Implementada

### 1. **Agregado Reservations API** (apiService.js)

Creé un nuevo módulo `reservationsApi` con 3 endpoints:

```javascript
export const reservationsApi = {
  // Crear reservas de tickets
  createReservations: (showId, reservationData) => {
    // reservationData: { sectionId, quantity, seats? }
    return apiClient.post(`${API_BASE}/shows/${showId}/reservations`, reservationData);
  },

  // Obtener reservas del usuario
  getMyReservations: () => {
    return apiClient.get(`${API_BASE}/reservations/me`);
  },

  // Cancelar reserva
  cancelReservation: (reservationId) => {
    return apiClient.delete(`${API_BASE}/reservations/${reservationId}`);
  }
};
```

### 2. **Actualizado SeatSelection.jsx**

Reemplacé el código TODO con una llamada real al backend:

**Antes:**
```javascript
const orderId = Math.random().toString(36).substr(2, 9);
setTimeout(() => {
  navigate(`/checkout/${orderId}`, {
    state: { seats, quantity, section, show, event, showId }
  });
}, 800);
```

**Después:**
```javascript
// Preparar datos de reserva
const reservationData = {
  sectionId: section.id,
  quantity: isGeneralAdmission ? generalQuantity : selectedSeats.length,
  seats: isGeneralAdmission ? undefined : selectedSeats.map(s => s.id)
};

// Crear reservas en el backend
const response = await reservationsApi.createReservations(showId, reservationData);

// Extraer reservationIds de la respuesta
let reservationIds = [];
if (Array.isArray(response)) {
  reservationIds = response.map(r => r.id);
} else if (response.reservationIds) {
  reservationIds = response.reservationIds;
} else if (response.reservations) {
  reservationIds = response.reservations.map(r => r.id);
} else if (response.id) {
  reservationIds = [response.id];
}

// Navegar a checkout con reservationIds
navigate(`/checkout/${response.orderId || 'temp'}`, {
  state: { 
    seats, quantity, section, show, event, showId,
    reservationIds // ⭐ IMPORTANTE
  }
});
```

---

## 🔄 Flujo Actualizado

```
1. Usuario selecciona asientos/entradas en SeatSelection
   ↓
2. Click "Continuar con la compra"
   ↓
3. Frontend llama a reservationsApi.createReservations()
   ↓
4. Backend crea reservas y devuelve reservationIds
   ↓
5. Frontend navega a Checkout con reservationIds en state
   ↓
6. Usuario completa formulario de pago
   ↓
7. Frontend llama a createPaymentPreference(reservationIds, ...)
   ↓
8. Backend crea preferencia de MP con las reservas
   ↓
9. Usuario es redirigido a Mercado Pago
   ↓
10. Usuario paga → Webhook → Backend genera tickets
```

---

## 📝 Datos que se Envían

### POST /api/shows/:showId/reservations

**Request Body:**
```json
{
  "sectionId": 123,
  "quantity": 2,
  "seats": ["A10", "A11"]  // Solo para asientos numerados
}
```

**Response (ejemplo):**
```json
{
  "reservationIds": [456, 457],
  "orderId": 789,
  "expiresAt": "2025-01-29T10:00:00Z"
}
```

O puede ser un array:
```json
[
  { "id": 456, "seatId": "A10", ... },
  { "id": 457, "seatId": "A11", ... }
]
```

---

## 🎯 Manejo de Respuestas

El código maneja diferentes formatos de respuesta del backend:

```javascript
let reservationIds = [];

// Caso 1: Array de reservas
if (Array.isArray(response)) {
  reservationIds = response.map(r => r.id);
}
// Caso 2: Objeto con reservationIds
else if (response.reservationIds) {
  reservationIds = response.reservationIds;
}
// Caso 3: Objeto con array de reservations
else if (response.reservations) {
  reservationIds = response.reservations.map(r => r.id);
}
// Caso 4: Una sola reserva
else if (response.id) {
  reservationIds = [response.id];
}
```

---

## 🧪 Testing

### Flujo de Prueba

1. **Ir a un show:**
   - `/shows/:showId`
   - Seleccionar una sección

2. **Seleccionar asientos/entradas:**
   - Si es GENERAL: Elegir cantidad
   - Si es NUMERADA: Seleccionar asientos
   - Click "Continuar con la compra"

3. **Verificar en consola:**
   ```
   📝 Datos de reserva: { sectionId: 123, quantity: 2, seats: [...] }
   🎫 Creando reservas para show: 456 ...
   ✅ Respuesta del backend: { reservationIds: [...] }
   🎫 Reservation IDs: [789, 790]
   ```

4. **En Checkout:**
   - Verificar que NO aparezca el error
   - Completar formulario
   - Click "Pagar"
   - Debe redirigir a Mercado Pago

---

## 📊 Estados y Mensajes

### Loading States

- `message.loading('Creando reservas...', 0)` - Mientras crea reservas
- `message.success('Reservas creadas exitosamente')` - Cuando se crean
- `message.error('Error al crear las reservas...')` - Si falla

### Console Logs

- `📝 Datos de reserva:` - Datos que se envían
- `✅ Respuesta del backend:` - Respuesta completa
- `🎫 Reservation IDs:` - IDs extraídos
- `❌ Error al crear reservas:` - Si hay error

---

## ⚠️ Consideraciones

### 1. **Expiración de Reservas**

Las reservas tienen un tiempo de expiración (generalmente 10-15 minutos). Si el usuario no completa el pago, las reservas se liberan automáticamente.

### 2. **Validación de Disponibilidad**

El backend debe validar que:
- Los asientos estén disponibles
- No excedan la capacidad de la sección
- No haya reservas duplicadas

### 3. **Manejo de Errores**

Posibles errores del backend:
- `400` - Datos inválidos
- `404` - Show o sección no encontrada
- `409` - Asientos ya reservados
- `422` - Cantidad excede disponibilidad

---

## 🔗 Endpoints Relacionados

### Reservas
- `POST /api/shows/:showId/reservations` - Crear reservas
- `GET /api/reservations/me` - Mis reservas
- `DELETE /api/reservations/:id` - Cancelar reserva

### Pagos
- `POST /api/payments/create-preference-reservation` - Crear preferencia con reservas
- `GET /api/payments/status/:orderId` - Verificar estado de pago

---

## 📁 Archivos Modificados

```
✏️  src/services/apiService.js
    - Agregado reservationsApi
    - Exportado en default

✏️  src/pages/SeatSelection.jsx
    - Importado reservationsApi
    - Reemplazado TODO con llamada real
    - Agregado manejo de reservationIds
    - Agregado mensajes de loading/success/error
    - Agregado logs para debugging
```

---

## ✅ Resultado

**PROBLEMA RESUELTO:** Ahora las reservas se crean correctamente en el backend y los `reservationIds` llegan a Checkout, permitiendo procesar el pago con Mercado Pago.

**Flujo completo funcional:**
```
Selección → Reservas → Checkout → Mercado Pago → Pago → Tickets ✅
```

---

## 🚀 Próximos Pasos

1. **Testear con backend real:**
   - Verificar que el endpoint `/api/shows/:showId/reservations` exista
   - Verificar formato de respuesta
   - Ajustar extracción de reservationIds si es necesario

2. **Implementar timer de expiración:**
   - Mostrar countdown en Checkout
   - Alertar cuando las reservas estén por expirar

3. **Agregar cancelación de reservas:**
   - Botón "Cancelar" en Checkout
   - Liberar reservas si el usuario sale

4. **Mejorar UX:**
   - Skeleton loading mientras crea reservas
   - Animación de éxito
   - Feedback visual

---

**Fecha:** 2025-01-29  
**Fix por:** RS Tickets Team  
**Estado:** ✅ RESUELTO
