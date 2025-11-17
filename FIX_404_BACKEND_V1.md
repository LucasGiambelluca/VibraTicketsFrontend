# 🔧 FIX: Error 404 - Backend V1 vs V2

## 🐛 Problema

Al intentar crear una reserva, se producía un error 404:

```
Failed to load resource: the server responded with a status of 404 (Not Found)
❌ Error al crear reserva: Error: NotFound
```

### Causa

El frontend estaba intentando usar endpoints del **Backend V2** que **NO están implementados** en el backend actual:

```javascript
// ❌ NO EXISTE en el backend actual
POST /api/tickets/reserve
```

El backend actual usa el sistema **V1** con estos endpoints:

```javascript
// ✅ SÍ EXISTE en el backend actual
POST /api/shows/:showId/reservations
```

---

## ✅ Solución Implementada

### 1. **Mantener Ambos Sistemas en apiService.js**

Agregué **dos APIs** para soportar ambas versiones:

```javascript
// ✅ reservationsApi - Sistema actual (V1)
export const reservationsApi = {
  createReservations: (showId, reservationData) => {
    return apiClient.post(`${API_BASE}/shows/${showId}/reservations`, reservationData);
  },
  getMyReservations: () => {...},
  cancelReservation: (reservationId) => {...}
};

// 🔮 ticketsApi - Sistema futuro (V2)
// NOTA: Estos endpoints aún NO están implementados
export const ticketsApi = {
  createReservation: (reservationData) => {
    return apiClient.post(`${API_BASE}/tickets/reserve`, reservationData);
  },
  ...
};
```

### 2. **Actualizar SeatSelection.jsx para usar V1**

**Antes (intentaba usar V2):**
```javascript
import { ticketsApi } from '../services/apiService';

const reservationData = {
  eventId: 123,
  tickets: [{ typeId: 1, quantity: 2 }],
  customerInfo: { ... }
};

await ticketsApi.createReservation(reservationData);
```

**Ahora (usa V1):**
```javascript
import { reservationsApi } from '../services/apiService';

const reservationData = {
  sectionId: section.id,
  quantity: generalQuantity,
  seats: selectedSeats.map(s => s.id),
  customerInfo: user ? {
    name: user.name,
    email: user.email,
    phone: user.phone
  } : undefined
};

await reservationsApi.createReservations(showId, reservationData);
```

---

## 🔄 Comparación de Sistemas

### Backend V1 (Actual - Funciona)

**Arquitectura:**
```
Shows → Sections → Reservations
```

**Endpoint:**
```
POST /api/shows/:showId/reservations
```

**Request:**
```json
{
  "sectionId": 123,
  "quantity": 2,
  "seats": ["A10", "A11"],
  "customerInfo": {
    "name": "Juan",
    "email": "juan@example.com",
    "phone": "1234567890"
  }
}
```

### Backend V2 (Futuro - No implementado)

**Arquitectura:**
```
Events → Ticket Types → Ticket Reservations
```

**Endpoint:**
```
POST /api/tickets/reserve
```

**Request:**
```json
{
  "eventId": 123,
  "tickets": [
    {
      "typeId": 1,
      "quantity": 2
    }
  ],
  "customerInfo": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890"
  }
}
```

---

## 📝 Cambios Realizados

### apiService.js

```javascript
// Agregado reservationsApi (V1)
export const reservationsApi = {
  createReservations: (showId, reservationData) => {
    return apiClient.post(`${API_BASE}/shows/${showId}/reservations`, reservationData);
  },
  getMyReservations: () => {
    return apiClient.get(`${API_BASE}/reservations/me`);
  },
  cancelReservation: (reservationId) => {
    return apiClient.delete(`${API_BASE}/reservations/${reservationId}`);
  }
};

// Mantenido ticketsApi (V2) para el futuro
export const ticketsApi = {
  // NOTA: Estos endpoints aún NO están implementados
  createReservation: (reservationData) => {
    return apiClient.post(`${API_BASE}/tickets/reserve`, reservationData);
  },
  ...
};

// Export ambos
export default {
  ...
  reservations: reservationsApi,
  tickets: ticketsApi,
  ...
};
```

### SeatSelection.jsx

```javascript
// Cambio de import
import { reservationsApi } from '../services/apiService'; // ✅ V1

// Formato de datos V1
const reservationData = {
  sectionId: section.id,
  quantity: isGeneralAdmission ? generalQuantity : selectedSeats.length,
  seats: isGeneralAdmission ? undefined : selectedSeats.map(s => s.id),
  customerInfo: user ? {
    name: user.name,
    email: user.email,
    phone: user.phone
  } : undefined
};

// Llamada V1
const response = await reservationsApi.createReservations(showId, reservationData);
```

---

## 🧪 Testing

### 1. Verificar que funciona

```bash
# En la consola del navegador deberías ver:
📝 Datos de reserva: {
  sectionId: 123,
  quantity: 2,
  seats: ["A10", "A11"],
  customerInfo: { ... }
}

🎫 Creando reservas para show: 456 { ... }

✅ Respuesta del backend: { ... }

🎫 Reservation IDs: [789, 790]
```

### 2. NO debe aparecer error 404

```bash
# ❌ ANTES (error)
Failed to load resource: 404 (Not Found)
POST /api/tickets/reserve

# ✅ AHORA (funciona)
POST /api/shows/456/reservations
Status: 200 OK
```

---

## 🔮 Migración Futura a V2

Cuando el backend implemente los endpoints V2, solo necesitás:

### 1. Cambiar el import en SeatSelection.jsx

```javascript
// De:
import { reservationsApi } from '../services/apiService';

// A:
import { ticketsApi } from '../services/apiService';
```

### 2. Cambiar el formato de datos

```javascript
// De:
const reservationData = {
  sectionId: section.id,
  quantity: generalQuantity,
  ...
};

// A:
const reservationData = {
  eventId: event.id,
  tickets: [{ typeId: section.id, quantity: generalQuantity }],
  customerInfo: { ... }
};
```

### 3. Cambiar la llamada

```javascript
// De:
await reservationsApi.createReservations(showId, reservationData);

// A:
await ticketsApi.createReservation(reservationData);
```

---

## 📊 Estado Actual

### ✅ Funciona (V1)

- `POST /api/shows/:showId/reservations`
- `GET /api/reservations/me`
- `DELETE /api/reservations/:id`

### ❌ No Implementado (V2)

- `POST /api/tickets/reserve`
- `GET /api/events/:eventId/ticket-types`
- `GET /api/tickets/reservations/:id`
- `GET /api/tickets/reservations/me`
- `DELETE /api/tickets/reservations/:id`

---

## 🎯 Recomendación

**Usar V1 (actual)** hasta que el backend implemente V2.

El código está preparado para migrar fácilmente cuando V2 esté disponible.

---

## 📁 Archivos Modificados

```
✏️  src/services/apiService.js
    - Agregado reservationsApi (V1)
    - Mantenido ticketsApi (V2) para el futuro
    - Exportados ambos

✏️  src/pages/SeatSelection.jsx
    - Cambiado import a reservationsApi
    - Formato de datos V1
    - Llamada a createReservations(showId, data)

➕  FIX_404_BACKEND_V1.md
    - Documentación del problema y solución
```

---

## ✅ Resultado

**ERROR 404 RESUELTO**

El frontend ahora usa los endpoints correctos del backend V1 que sí están implementados.

---

**Fecha:** 2025-01-29  
**Fix por:** RS Tickets Team  
**Estado:** ✅ RESUELTO
