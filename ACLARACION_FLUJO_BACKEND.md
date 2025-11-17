# 🔍 ACLARACIÓN: FLUJO REAL DEL BACKEND

**Fecha:** 2025-10-30  
**Problema:** Confusión entre dos sistemas diferentes de reservas

---

## ⚠️ SITUACIÓN ACTUAL

Existen **DOS SISTEMAS DIFERENTES** en el backend:

### 1️⃣ Sistema de SECCIONES (Show Sections)
```
EVENTO → SHOW → SECCIÓN → ASIENTOS (seats)
```

**Endpoints:**
- `GET /api/shows/:showId/sections` - Obtener secciones del show
- `GET /api/shows/:showId/seats` - Obtener asientos del show
- `POST /api/shows/:showId/sections` - Crear sección (admin)

**Estructura:**
```javascript
// Sección
{
  id: 1,
  show_id: 200,
  name: "Platea",
  kind: "SEATED",  // o "GA" (General Admission)
  capacity: 200,
  price_tier_id: 10,
  priceCents: 25000  // $250.00
}

// Asientos (generados automáticamente al crear sección)
{
  id: 1001,
  show_id: 200,
  sector: "Platea",
  row_label: null,
  seat_number: "1",
  status: "AVAILABLE",  // o "SOLD"
  price_tier_id: 10
}
```

### 2️⃣ Sistema de TICKET TYPES (Backend V2)
```
EVENTO → TICKET TYPES → RESERVATIONS
```

**Endpoints:**
- `GET /api/events/:eventId/ticket-types` - Obtener tipos de tickets
- `POST /api/tickets/reserve` - Crear reserva
- `POST /api/payments/create-preference-reservation` - Pagar

**Estructura:**
```javascript
// Ticket Type
{
  id: 1,
  event_id: 100,
  name: "General",
  price_cents: 15000,
  available_seats: 200,
  kind: "SEATED"
}

// Reserva
{
  eventId: 100,
  tickets: [
    { typeId: 1, quantity: 2 }
  ],
  customerInfo: { name, email, phone }
}
```

---

## 🎯 ¿CUÁL SISTEMA USAR?

### Pregunta Clave:
**¿El backend tiene implementado `/api/tickets/reserve` o trabaja con secciones de shows?**

### Escenario A: Backend usa TICKET TYPES (V2)
Si el backend tiene `/api/tickets/reserve` implementado:
- ✅ Usar `eventsApi.getEventTicketTypes(eventId)`
- ✅ Crear reservas con `ticketsApi.createReservation()`
- ✅ El flujo actual del frontend es correcto

### Escenario B: Backend usa SECCIONES (Show Sections)
Si el backend NO tiene `/api/tickets/reserve` y solo trabaja con secciones:
- ✅ Usar `showsApi.getShowSections(showId)`
- ❌ NO existe endpoint para reservar secciones directamente
- 🔧 Necesitamos crear un endpoint nuevo o adaptar el flujo

---

## 🔄 FLUJO ACTUAL DEL FRONTEND

### ShowDetail.jsx (CORREGIDO):
```javascript
// Carga secciones del show
const sectionsResponse = await showsApi.getShowSections(showId);

// Usuario selecciona cantidad por sección
selectedSections = [
  { sectionId: 1, quantity: 2, name: "Platea", priceCents: 25000 }
]

// Navega a Checkout
navigate('/checkout/temp', { 
  state: { selectedSections, show, event } 
});
```

### Checkout.jsx (NECESITA ADAPTACIÓN):
```javascript
// PROBLEMA: Intenta crear reserva con ticketsApi.createReservation()
// pero recibe selectedSections en lugar de selectedTickets

// OPCIÓN 1: Mapear secciones a ticket types (si existen)
const reservationData = {
  eventId: event.id,
  tickets: selectedSections.map(section => ({
    typeId: section.sectionId,  // ⚠️ Asume que section.id = ticketType.id
    quantity: section.quantity
  })),
  customerInfo: { ... }
};

// OPCIÓN 2: Crear endpoint nuevo para reservar por secciones
POST /api/shows/:showId/reserve-seats
{
  sections: [
    { sectionId: 1, quantity: 2 }
  ],
  customerInfo: { ... }
}
```

---

## 🛠️ SOLUCIONES POSIBLES

### Solución 1: Verificar si Ticket Types = Secciones
Si cada sección tiene un `ticket_type_id` asociado:

```javascript
// En ShowDetail, al cargar secciones:
const sectionsResponse = await showsApi.getShowSections(showId);

// Verificar si tienen ticket_type_id
sections.forEach(section => {
  console.log('Section:', section);
  console.log('Ticket Type ID:', section.ticket_type_id);
});

// Si existe, mapear en Checkout:
tickets: selectedSections.map(section => ({
  typeId: section.ticket_type_id,  // ✅ Usar el ID correcto
  quantity: section.quantity
}))
```

### Solución 2: Crear Endpoint de Reserva por Secciones (Backend)
Agregar en el backend:

```javascript
// controllers/shows.controller.js
exports.reserveSeats = async (req, res) => {
  const { showId } = req.params;
  const { sections, customerInfo } = req.body;
  
  // sections: [{ sectionId: 1, quantity: 2 }]
  
  // 1. Verificar disponibilidad
  // 2. Marcar asientos como reservados
  // 3. Crear reserva temporal (15 min)
  // 4. Retornar reservationIds
  
  res.json({
    reservationIds: [45, 46],
    totalAmount: 50000,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });
};
```

### Solución 3: Usar Sistema de Ticket Types Exclusivamente
Si el backend tiene ambos sistemas, usar solo Ticket Types:

```javascript
// ShowDetail.jsx - Cambiar a usar ticket types
const ticketTypes = await eventsApi.getEventTicketTypes(eventId);

// Checkout.jsx - Mantener como está
const reservationData = {
  eventId: event.id,
  tickets: selectedTickets.map(ticket => ({
    typeId: ticket.typeId,
    quantity: ticket.quantity
  })),
  customerInfo: { ... }
};
```

---

## 📊 RECOMENDACIÓN

### Paso 1: Verificar el Backend
Hacer una llamada de prueba para ver qué endpoints existen:

```bash
# Verificar si existe el endpoint de ticket types
GET http://localhost:3000/api/events/1/ticket-types

# Verificar si existe el endpoint de secciones
GET http://localhost:3000/api/shows/1/sections

# Verificar si existe el endpoint de reservas
POST http://localhost:3000/api/tickets/reserve
```

### Paso 2: Decidir el Flujo
Basado en los resultados:

**Si `/api/tickets/reserve` existe:**
- Usar sistema de Ticket Types
- Mapear secciones a ticket types en ShowDetail
- Mantener Checkout como está

**Si `/api/tickets/reserve` NO existe:**
- Crear endpoint `/api/shows/:showId/reserve-seats` en backend
- Actualizar Checkout para usar el nuevo endpoint
- Mantener ShowDetail con secciones

---

## 🎯 ACCIÓN INMEDIATA REQUERIDA

1. **Verificar qué endpoints existen en el backend**
2. **Confirmar si `section.id` = `ticket_type.id`**
3. **Decidir si usar Secciones o Ticket Types**
4. **Actualizar Checkout.jsx según la decisión**

---

## 📝 PREGUNTAS PARA EL USUARIO

1. ¿El backend tiene implementado `/api/tickets/reserve`?
2. ¿Las secciones tienen un `ticket_type_id` asociado?
3. ¿Prefieres trabajar con Secciones o con Ticket Types?
4. ¿Necesitas que cree el endpoint de reserva por secciones en el backend?

---

**ESTADO ACTUAL:** ⚠️ PENDIENTE DE ACLARACIÓN
