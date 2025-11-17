# 🎫 Integración Backend V2 - Sistema de Tickets y Reservas

## 📋 Resumen

Se actualizó el frontend para usar el **nuevo sistema de tickets del Backend V2**, que reemplaza el sistema anterior de `shows/sections` por `events/ticket_types`.

---

## 🔄 Cambios Principales

### Sistema Anterior (V1)
```
Shows → Sections → Reservations
```

### Sistema Nuevo (V2)
```
Events → Ticket Types → Ticket Reservations
```

---

## 🆕 API Actualizada

### ticketsApi (Nuevo)

Reemplaza a `reservationsApi` con endpoints del Backend V2:

```javascript
export const ticketsApi = {
  // Crear reserva de tickets
  createReservation: (reservationData) => {
    // POST /api/tickets/reserve
  },

  // Obtener tipos de tickets de un evento
  getEventTicketTypes: (eventId) => {
    // GET /api/events/:eventId/ticket-types
  },

  // Obtener reserva específica
  getReservation: (reservationId) => {
    // GET /api/tickets/reservations/:reservationId
  },

  // Obtener mis reservas
  getMyReservations: () => {
    // GET /api/tickets/reservations/me
  },

  // Cancelar reserva
  cancelReservation: (reservationId) => {
    // DELETE /api/tickets/reservations/:reservationId
  }
};
```

---

## 📝 Formato de Datos

### Crear Reserva

**Endpoint:** `POST /api/tickets/reserve`

**Request:**
```json
{
  "eventId": 123,
  "tickets": [
    {
      "typeId": 1,      // ID del tipo de ticket (VIP, General, etc.)
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

**Response:**
```json
{
  "reservationIds": [45, 46],
  "reservations": [
    {
      "id": 45,
      "ticket_type_id": 1,
      "quantity": 1,
      "customer_email": "juan@example.com",
      "status": "ACTIVE",
      "expires_at": "2025-10-29T12:45:00Z"
    },
    {
      "id": 46,
      "ticket_type_id": 1,
      "quantity": 1,
      "customer_email": "juan@example.com",
      "status": "ACTIVE",
      "expires_at": "2025-10-29T12:45:00Z"
    }
  ],
  "totalAmount": 15000,  // en centavos
  "expiresAt": "2025-10-29T12:45:00Z",
  "message": "Reserva creada. Tienes 15 minutos para completar el pago."
}
```

---

## 🔄 Flujo Actualizado

### 1. Usuario Selecciona Tickets (SeatSelection.jsx)

```javascript
const reservationData = {
  eventId: event.id,
  tickets: [
    {
      typeId: section.id,  // section.id es el ticket_type_id
      quantity: generalQuantity
    }
  ],
  customerInfo: {
    name: user?.name || 'Usuario',
    email: user?.email || 'usuario@example.com',
    phone: user?.phone || '1234567890'
  }
};

const response = await ticketsApi.createReservation(reservationData);
```

### 2. Navegar a Checkout con Datos

```javascript
navigate(`/checkout/temp`, {
  state: { 
    reservationIds: response.reservationIds,  // [45, 46]
    totalAmount: response.totalAmount,        // 15000 centavos
    expiresAt: response.expiresAt,            // "2025-10-29T12:45:00Z"
    section,
    show,
    event,
    quantity
  }
});
```

### 3. Crear Preferencia de Pago (Checkout.jsx)

```javascript
const preference = await createPaymentPreference(
  orderData.reservationIds,  // [45, 46]
  payerInfo,
  backUrls
);

// Redirigir a Mercado Pago
redirectToMercadoPago(preference.initPoint);
```

### 4. Webhook Procesa Pago (Automático)

Cuando el pago es aprobado:

1. ✅ Actualiza reservas: `status = 'PURCHASED'`
2. ✅ Genera tickets individuales con QR
3. ✅ Asigna tickets al usuario (`customer_email`)
4. ✅ Envía email de confirmación

---

## 📊 Estructura de Datos

### Tabla: ticket_reservations

```sql
- id (PK)
- ticket_type_id (FK → ticket_types)
- quantity
- customer_name
- customer_email  ← IDENTIFICADOR DEL USUARIO
- customer_phone
- status (ACTIVE, PURCHASED, CANCELLED, EXPIRED)
- expires_at
- created_at
- updated_at
```

### Tabla: generated_tickets

```sql
- id (PK)
- reservation_id (FK → ticket_reservations)
- ticket_type_id (FK → ticket_types)
- ticket_number (ÚNICO)
- qr_code (Base64 con info encriptada)
- status (ISSUED, USED, CANCELLED)
- used_at
- created_at
```

---

## 🔧 Cambios en SeatSelection.jsx

### Antes (V1)
```javascript
const reservationData = {
  sectionId: section.id,
  quantity: generalQuantity,
  seats: selectedSeats.map(s => s.id)
};

const response = await reservationsApi.createReservations(showId, reservationData);
```

### Después (V2)
```javascript
const reservationData = {
  eventId: event.id,
  tickets: [
    {
      typeId: section.id,  // section.id es ticket_type_id
      quantity: generalQuantity
    }
  ],
  customerInfo: {
    name: user?.name || 'Usuario',
    email: user?.email || 'usuario@example.com',
    phone: user?.phone || '1234567890'
  }
};

const response = await ticketsApi.createReservation(reservationData);
```

---

## ⏰ Sistema de Expiración

### Tiempo de Reserva

- **Duración:** 15 minutos
- **Mostrado al usuario:** "Tenés 15 minutos para completar el pago"
- **Liberación automática:** Tarea cada 2 minutos libera reservas expiradas

### En el Frontend

```javascript
if (response.expiresAt) {
  const expiresIn = Math.round(
    (new Date(response.expiresAt) - new Date()) / 1000 / 60
  );
  message.success(`Reserva creada. Tenés ${expiresIn} minutos para completar el pago.`, 5);
}
```

---

## 🎯 Ventajas del Sistema V2

### 1. **Asignación Automática**
- Los tickets se asignan automáticamente al pagar
- No requiere paso adicional de asignación

### 2. **QR Único por Ticket**
- Cada ticket tiene su propio QR
- Previene duplicados y fraude

### 3. **Gestión por Email**
- Tickets vinculados al `customer_email`
- Fácil recuperación y consulta

### 4. **Expiración Automática**
- Reservas se liberan si no se paga
- Stock siempre actualizado

### 5. **Webhooks Idempotentes**
- No duplica tickets si MP envía múltiples notificaciones
- Sistema robusto y confiable

---

## 🧪 Testing

### 1. Crear Reserva

```bash
# Consola del navegador
📝 Datos de reserva (Backend V2): {
  eventId: 123,
  tickets: [{ typeId: 1, quantity: 2 }],
  customerInfo: { ... }
}

✅ Respuesta del backend: {
  reservationIds: [45, 46],
  totalAmount: 15000,
  expiresAt: "2025-10-29T12:45:00Z"
}

🎫 Reservation IDs: [45, 46]
💰 Total Amount: 15000 centavos
⏰ Expires At: 2025-10-29T12:45:00Z
```

### 2. Verificar en Checkout

- ✅ `reservationIds` debe estar en el state
- ✅ `totalAmount` debe coincidir con el precio
- ✅ Mensaje de expiración debe mostrarse

### 3. Completar Pago

- ✅ Redirige a Mercado Pago
- ✅ Paga con tarjeta de prueba
- ✅ Webhook procesa el pago
- ✅ Genera tickets con QR
- ✅ Envía email de confirmación

---

## 📁 Archivos Modificados

```
✏️  src/services/apiService.js
    - Agregado ticketsApi (reemplaza reservationsApi)
    - 5 métodos: createReservation, getEventTicketTypes, getReservation, getMyReservations, cancelReservation

✏️  src/pages/SeatSelection.jsx
    - Importado ticketsApi y useAuth
    - Actualizado formato de reservationData
    - Agregado customerInfo del usuario
    - Muestra tiempo de expiración
    - Pasa totalAmount y expiresAt a Checkout

➕  INTEGRACION_BACKEND_V2_TICKETS.md
    - Documentación completa del nuevo sistema
```

---

## 🔗 Endpoints del Backend V2

### Tickets
- `POST /api/tickets/reserve` - Crear reserva
- `GET /api/events/:eventId/ticket-types` - Tipos de tickets
- `GET /api/tickets/reservations/:id` - Obtener reserva
- `GET /api/tickets/reservations/me` - Mis reservas
- `DELETE /api/tickets/reservations/:id` - Cancelar reserva

### Pagos
- `POST /api/payments/create-preference-reservation` - Crear preferencia
- `GET /api/payments/status/:orderId` - Verificar estado
- `POST /api/payments/webhook` - Webhook de MP (automático)

---

## ✅ Checklist de Integración

- [x] Actualizar apiService.js con ticketsApi
- [x] Actualizar SeatSelection.jsx con nuevo formato
- [x] Agregar customerInfo del usuario autenticado
- [x] Mostrar tiempo de expiración
- [x] Pasar totalAmount a Checkout
- [x] Documentar cambios
- [ ] Testear flujo completo con backend V2
- [ ] Verificar generación de tickets
- [ ] Verificar envío de emails
- [ ] Verificar QR codes

---

## 🎉 Resultado

**FRONTEND ACTUALIZADO PARA BACKEND V2**

El sistema ahora:
- ✅ Usa el endpoint correcto: `/api/tickets/reserve`
- ✅ Envía el formato correcto: `{ eventId, tickets, customerInfo }`
- ✅ Recibe `reservationIds` del backend
- ✅ Muestra tiempo de expiración al usuario
- ✅ Pasa todos los datos necesarios a Checkout
- ✅ Compatible con el flujo de Mercado Pago

**¡Listo para testear con el backend V2!** 🚀

---

**Fecha:** 2025-01-29  
**Versión:** Backend V2  
**Estado:** ✅ ACTUALIZADO Y LISTO
