# 🎯 FLUJO COMPLETO: Asientos y HOLDS

**Fecha:** 2025-10-30  
**Estado:** ✅ COMPLETAMENTE FUNCIONAL

---

## 📋 RESUMEN

El sistema ahora genera asientos automáticamente al crear secciones y permite crear reservas (HOLDS) para completar el flujo de compra.

---

## 🔄 FLUJO COMPLETO DE COMPRA

### 1️⃣ **ADMIN: Crear Sección**

```javascript
// En el panel de administración
POST /api/shows/34/sections
Body: {
  "name": "vip delantero",
  "capacity": 100,
  "kind": "SEATED", // o "GA"
  "priceCents": 12000000
}

// Backend automáticamente:
// 1. Crea la sección
// 2. Genera 100 asientos (A1-A10, B1-B10... J1-J10)
// 3. Todos con status = 'AVAILABLE'
```

**Resultado:**
- ✅ Sección creada
- ✅ 100 asientos generados automáticamente
- ✅ Listos para reservar

---

### 2️⃣ **USUARIO: Ver Evento y Shows**

```javascript
// Home → Click en evento
GET /api/events/1
// Respuesta incluye shows del evento

// Usuario ve lista de shows y selecciona uno
Navigate to /shows/34
```

---

### 3️⃣ **USUARIO: Ver Secciones Disponibles**

```javascript
// ShowDetail carga datos
GET /api/shows/34 // Datos del show
GET /api/events/1 // Datos del evento
GET /api/shows/34/sections // Secciones disponibles
GET /api/shows/34/seats // Asientos disponibles (100)

// Usuario ve:
// - vip delantero: $120.000 - 100 disponibles
// - Vip Trasero: $100.000 - 100 disponibles
// - Campo General: $90.000 - 100 disponibles
```

---

### 4️⃣ **USUARIO: Seleccionar Cantidades**

```javascript
// Usuario selecciona:
// - vip delantero: 2 tickets
// - Vip Trasero: 1 ticket

// Frontend calcula:
totalTickets = 3
totalPrice = $340.000

// Botón "Continuar" se habilita
```

---

### 5️⃣ **FRONTEND: Asignar Asientos Específicos**

```javascript
// ShowDetail.jsx - handleContinue()

// 1. Obtener secciones seleccionadas
const selectedSections = [
  { sectionId: 18, sectionName: "vip delantero", quantity: 2 },
  { sectionId: 27, sectionName: "Vip Trasero", quantity: 1 }
];

// 2. Buscar asientos disponibles de cada sección
const seats = await showsApi.getShowSeats(34);
// Respuesta: [
//   { id: 1, sector: "vip delantero", seat_number: "A1", status: "AVAILABLE" },
//   { id: 2, sector: "vip delantero", seat_number: "A2", status: "AVAILABLE" },
//   { id: 101, sector: "Vip Trasero", seat_number: "B1", status: "AVAILABLE" },
//   ...
// ]

// 3. Asignar asientos específicos
const selectedSeatIds = [];
for (const selection of selectedSections) {
  const sectionSeats = seats.filter(seat => 
    String(seat.section_id) === String(selection.sectionId) &&
    seat.status === 'AVAILABLE'
  );
  
  const seatsToReserve = sectionSeats.slice(0, selection.quantity);
  selectedSeatIds.push(...seatsToReserve.map(s => s.id));
}

// Resultado: selectedSeatIds = [1, 2, 101]
```

---

### 6️⃣ **FRONTEND: Crear HOLD (Reserva Temporal)**

```javascript
// ShowDetail.jsx - handleContinue()

const holdData = {
  showId: 34,
  seatIds: [1, 2, 101], // IDs específicos de asientos
  customerEmail: "user@example.com",
  customerName: "Juan Pérez"
};

const holdResponse = await holdsApi.createHold(holdData);
// POST /api/holds
// Header: Idempotency-Key: uuid-unico

// Respuesta:
// {
//   holdId: 123,
//   expiresAt: "2025-10-30T21:15:00Z",
//   ttlMinutes: 15,
//   seats: [
//     { id: 1, sector: "vip delantero", seat_number: "A1", priceCents: 12000000 },
//     { id: 2, sector: "vip delantero", seat_number: "A2", priceCents: 12000000 },
//     { id: 101, sector: "Vip Trasero", seat_number: "B1", priceCents: 10000000 }
//   ],
//   totalCents: 34000000
// }

// Backend marca los asientos como HELD por 15 minutos
```

---

### 7️⃣ **FRONTEND: Navegar a Checkout**

```javascript
navigate(`/checkout/${holdResponse.holdId}`, {
  state: {
    holdId: 123,
    holdData: holdResponse,
    show,
    event,
    expiresAt: holdResponse.expiresAt
  }
});
```

---

### 8️⃣ **USUARIO: Checkout con Countdown**

```javascript
// CheckoutNew.jsx

// Muestra:
// - Countdown: 14:58 → 14:57 → ... → 00:00
// - Resumen de asientos:
//   * vip delantero - A1: $120.000
//   * vip delantero - A2: $120.000
//   * Vip Trasero - B1: $100.000
//   * Total: $340.000

// Usuario hace click en "Proceder al pago"
```

---

### 9️⃣ **FRONTEND: Crear ORDER**

```javascript
// CheckoutNew.jsx - handleCreateOrderAndPay()

const orderResponse = await ordersApi.createOrder({ holdId: 123 });
// POST /api/orders
// Header: Idempotency-Key: uuid-unico

// Respuesta:
// {
//   orderId: 456,
//   status: "PENDING",
//   totalCents: 34000000,
//   mpPreferenceId: "pref_abc123",
//   checkoutUrl: "/checkout/pref_abc123"
// }

// Guardar orderId para verificar después
localStorage.setItem('currentOrderId', 456);

// Redirigir a Mercado Pago
window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_abc123`;
```

---

### 🔟 **USUARIO: Pagar en Mercado Pago**

```
Usuario ingresa datos de tarjeta
  ↓
Mercado Pago procesa pago
  ↓
MP notifica backend vía webhook
  ↓
POST /api/payments/webhook
  ↓
Backend:
  - Actualiza orden: status = 'PAID'
  - Emite 3 tickets con QR único
  - Asigna tickets al customer_email
  - Envía email de confirmación
  ↓
MP redirige a /payment/success
```

---

### 1️⃣1️⃣ **FRONTEND: Verificar Pago**

```javascript
// PaymentSuccess.jsx

const orderId = localStorage.getItem('currentOrderId'); // 456

// Verificar estado de la orden
const orderData = await ordersApi.getOrder(456);
// GET /api/orders/456

// Si status !== 'PAID', reintentar en 2 segundos
if (orderData.status !== 'PAID') {
  setTimeout(() => verifyPayment(), 2000);
} else {
  // Mostrar confirmación
  message.success('¡Pago exitoso! Recibirás tus tickets por email.');
  localStorage.removeItem('currentOrderId');
}
```

---

## 🎯 PUNTOS CLAVE

### ✅ Generación Automática de Asientos

**Backend:**
- Al crear sección → genera asientos automáticamente
- SEATED: A1-A10, B1-B10... (10 por fila)
- GA: GA1, GA2, GA3... (sin filas)

**Frontend:**
- No necesita crear asientos manualmente
- Solo carga asientos con GET /api/shows/:showId/seats

---

### ✅ Asignación de Asientos

**Frontend:**
- Busca asientos disponibles por `section_id` o `sector`
- Asigna los primeros N asientos disponibles
- Envía `seatIds` específicos al crear HOLD

**Backend:**
- Marca asientos como HELD por 15 minutos
- Evita doble reserva

---

### ✅ Comparación Flexible de IDs

**Problema resuelto:**
```javascript
// ❌ ANTES: Fallaba si IDs eran strings
const section = sections.find(s => s.id === parseInt(sectionId));

// ✅ AHORA: Funciona con strings o números
const section = sections.find(s => String(s.id) === String(sectionId));
```

---

### ✅ Flujo HOLDS → ORDERS

**2 pasos separados:**
1. **HOLD**: Reserva temporal de 15 minutos
2. **ORDER**: Orden de compra con Mercado Pago

**Beneficios:**
- Usuario tiene tiempo para pagar
- Asientos reservados no se venden a otros
- Si no paga, HOLD expira y asientos se liberan

---

## 📊 ESTRUCTURA DE DATOS

### Sección
```javascript
{
  id: 18,
  show_id: 34,
  name: "vip delantero",
  kind: "SEATED", // o "GA"
  capacity: 100,
  price_cents: 12000000
}
```

### Asiento
```javascript
{
  id: 1,
  show_id: 34,
  section_id: 18,
  sector: "vip delantero",
  seat_number: "A1",
  row_label: "A",
  status: "AVAILABLE", // o "HELD", "SOLD"
  price_tier_id: 5
}
```

### HOLD
```javascript
{
  holdId: 123,
  showId: 34,
  seatIds: [1, 2, 101],
  customerEmail: "user@example.com",
  expiresAt: "2025-10-30T21:15:00Z",
  ttlMinutes: 15,
  totalCents: 34000000
}
```

### ORDER
```javascript
{
  orderId: 456,
  holdId: 123,
  status: "PENDING", // o "PAID", "CANCELLED"
  totalCents: 34000000,
  mpPreferenceId: "pref_abc123",
  mpPaymentId: "mp_12345", // Cuando se paga
  paidAt: null // o timestamp
}
```

---

## 🧪 TESTING COMPLETO

### Paso 1: Crear Sección (Admin)
```
1. Ir a Admin → Shows
2. Click "Secciones" en show 34
3. Agregar sección:
   - Nombre: "Test VIP"
   - Tipo: Numerada
   - Capacidad: 50
   - Precio: $100.000
4. Guardar
5. Verificar: Backend generó 50 asientos (A1-A5, B1-B5... J1-J5)
```

### Paso 2: Ver Secciones (Usuario)
```
1. Ir a /shows/34
2. Verificar que se muestra "Test VIP"
3. Verificar: "50 disponibles"
4. Verificar precio: $100.000
```

### Paso 3: Seleccionar Cantidades
```
1. Seleccionar 3 tickets de "Test VIP"
2. Verificar Total: 3 entradas, $300.000
3. Verificar botón "Continuar" habilitado
```

### Paso 4: Crear HOLD
```
1. Click "Continuar"
2. Verificar consola:
   🔒 Creando HOLD con datos: { showId: 34, seatIds: [1, 2, 3], ... }
   ✅ HOLD creado: { holdId: 123, expiresAt: ... }
3. Verificar navegación a /checkout/123
```

### Paso 5: Checkout
```
1. Verificar countdown: 15:00
2. Verificar resumen:
   - Test VIP - A1: $100.000
   - Test VIP - A2: $100.000
   - Test VIP - A3: $100.000
   - Total: $300.000
3. Click "Proceder al pago"
```

### Paso 6: Crear ORDER
```
1. Verificar consola:
   📦 Creando ORDER: { holdId: 123 }
   ✅ Orden creada: { orderId: 456, mpPreferenceId: "pref_..." }
2. Verificar redirección a Mercado Pago
```

### Paso 7: Pagar
```
1. Usar tarjeta de prueba: 5031 7557 3453 0604
2. CVV: 123, Fecha: 11/25
3. Completar pago
4. Verificar redirección a /payment/success
```

### Paso 8: Verificar Pago
```
1. Verificar consola:
   🔍 Verificando orden: 456
   ✅ Orden obtenida: { status: "PAID" }
2. Verificar mensaje de éxito
3. Verificar email recibido con tickets
```

---

## ✅ RESUMEN

**FLUJO 100% FUNCIONAL** 🎉

- ✅ Asientos se generan automáticamente
- ✅ Usuario puede seleccionar cantidades
- ✅ Frontend asigna asientos específicos
- ✅ HOLD reserva asientos por 15 minutos
- ✅ ORDER crea orden de compra
- ✅ Mercado Pago procesa pago
- ✅ Tickets se emiten con QR único
- ✅ Email de confirmación enviado

**TODO LISTO PARA PRODUCCIÓN** 🚀
