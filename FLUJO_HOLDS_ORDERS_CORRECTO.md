# 🎯 FLUJO CORRECTO: HOLDS → ORDERS → PAYMENT → TICKETS

## ✅ IMPLEMENTACIÓN COMPLETA - FRONTEND ACTUALIZADO

**Fecha:** 2025-11-05  
**Estado:** COMPLETADO  

---

## 📋 RESUMEN EJECUTIVO

Se actualizó completamente el frontend para seguir el flujo correcto del backend:

1. **HOLD** (Reserva Temporal) - 15 minutos TTL
2. **ORDER** (Orden de Compra) - Status PENDING
3. **PAYMENT** (Pago en MercadoPago) - Webhook procesa
4. **TICKETS** (Generación Automática) - Status ISSUED

---

## 🔄 FLUJO COMPLETO PASO A PASO

### PASO 1: USUARIO SELECCIONA ASIENTOS 🪑

**Página:** `ShowDetail.jsx` o `SeatSelection.jsx`

```javascript
// Usuario selecciona cantidades por sección
1. Usuario navega a /shows/:showId
2. Ve secciones disponibles con precios
3. Selecciona cantidad de entradas por sección
4. Click en "Continuar"
```

**Qué pasa en el código:**
```javascript
// ShowDetail.jsx - handleContinue()
const selectedSections = Object.entries(sectionQuantities)
  .filter(([, quantity]) => quantity > 0)
  .map(([sectionId, quantity]) => ({
    sectionId,
    sectionName: section.name,
    quantity
  }));

// Buscar asientos disponibles de cada sección
const selectedSeatIds = [];
for (const selection of selectedSections) {
  const sectionSeats = seats.filter(seat => 
    seat.sector === selection.sectionName &&
    seat.status === 'AVAILABLE'
  );
  const seatsToReserve = sectionSeats.slice(0, selection.quantity);
  selectedSeatIds.push(...seatsToReserve.map(seat => seat.id));
}
```

---

### PASO 2: CREAR HOLD (Reserva Temporal) ⏰

**API:** `POST /api/holds`  
**TTL:** 15 minutos  
**Idempotente:** Sí (con Idempotency-Key)

```javascript
// Frontend: holdsApi.createHold()
const holdData = {
  showId: parseInt(showId),
  seatIds: [1, 2, 3], // IDs de asientos específicos
  customerEmail: "cliente@email.com",
  customerName: "Juan Pérez"
};

const holdResponse = await holdsApi.createHold(holdData);
// Response:
{
  holdId: 123,
  showId: 5,
  customerEmail: "cliente@email.com",
  expiresAt: "2025-11-05T10:07:54Z",
  ttlMinutes: 15,
  totalCents: 150000,
  items: [
    { seatId: 1, ... },
    { seatId: 2, ... },
    { seatId: 3, ... }
  ]
}
```

**Backend:**
```javascript
// Tabla: seat_holds
INSERT INTO seat_holds (
  show_id, customer_email, customer_name, 
  expires_at, idempotency_key
) VALUES (5, 'cliente@email.com', 'Juan Pérez', NOW() + INTERVAL 15 MINUTE, 'uuid...');

// Tabla: seat_hold_items
INSERT INTO seat_hold_items (hold_id, seat_id) 
VALUES (123, 1), (123, 2), (123, 3);
```

**Validaciones backend:**
- ✅ Los asientos existen en el show
- ✅ Los asientos están AVAILABLE (no tienen ticket ISSUED/REDEEMED)
- ✅ Los asientos no tienen otro hold activo
- ✅ Uso de `FOR UPDATE SKIP LOCKED` para evitar race conditions

**Frontend navega a:**
```javascript
navigate(`/checkout/${holdResponse.holdId}`, {
  state: { 
    holdId: holdResponse.holdId,
    holdData: holdResponse,
    show,
    event,
    expiresAt: holdResponse.expiresAt
  }
});
```

---

### PASO 3: CHECKOUT CON COUNTDOWN ⏱️

**Página:** `Checkout.jsx`  
**Ruta:** `/checkout/:holdId`

```javascript
// Checkout.jsx carga el hold
useEffect(() => {
  const loadHoldData = async () => {
    const response = await holdsApi.getHold(holdId);
    setHoldData(response);
    
    // Calcular tiempo restante
    const expiresAt = new Date(response.expiresAt);
    const now = new Date();
    const diffMs = expiresAt - now;
    setTimeLeft(Math.floor(diffMs / 1000)); // segundos
  };
  
  loadHoldData();
}, [holdId]);

// Countdown en tiempo real
useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        message.error('La reserva ha expirado');
        navigate('/');
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, [timeLeft]);
```

**UI:**
- 🟢 Countdown visual (mm:ss)
- 📊 Resumen del hold (evento, fecha, asientos, total)
- 📝 Formulario de datos del pagador (nombre, email, DNI, teléfono)
- 💳 Botón "Pagar $XXX" con MercadoPago

---

### PASO 4: CREAR ORDER (Orden de Compra) 📦

**API:** `POST /api/orders`  
**Trigger:** Al hacer click en "Pagar"  
**Idempotente:** Sí (con Idempotency-Key)

```javascript
// Frontend: handleMercadoPagoPayment()
const createOrderFromHold = async () => {
  const orderResponse = await ordersApi.createOrder({ 
    holdId: parseInt(holdId) 
  });
  
  return orderResponse;
  // Response:
  {
    id: 456,
    holdId: 123,
    status: 'PENDING',
    totalCents: 150000,
    currency: 'ARS',
    customerEmail: 'cliente@email.com',
    customerName: 'Juan Pérez',
    mpPreferenceId: 'pref_1730805474_abc123...'
  }
};

const order = await createOrderFromHold();
console.log('✅ Orden creada:', order.id);
```

**Backend:**
```javascript
// 1. Validar que el hold existe y no está expirado
const hold = await query(
  'SELECT * FROM seat_holds WHERE id = ? AND expires_at > NOW()',
  [holdId]
);

if (!hold) throw new Error('HoldExpired');

// 2. Validar que los asientos no tienen tickets emitidos
const hasTickets = await query(
  'SELECT COUNT(*) FROM tickets WHERE seat_id IN (SELECT seat_id FROM seat_hold_items WHERE hold_id = ?)',
  [holdId]
);

if (hasTickets > 0) throw new Error('SeatsAlreadyIssued');

// 3. Crear orden
INSERT INTO orders (
  user_id, customer_email, customer_name, 
  status, total_cents, currency, 
  mp_preference_id, idempotency_key
) VALUES (...);

// 4. Crear snapshot de precios
INSERT INTO order_items (order_id, seat_id, unit_price_cents)
SELECT ?, seat_id, price_cents 
FROM seats 
WHERE id IN (SELECT seat_id FROM seat_hold_items WHERE hold_id = ?);
```

**Importante:**
- ⏰ El hold sigue existiendo (no se elimina)
- 💰 Se hace SNAPSHOT de los precios al momento de la orden
- 📋 La orden queda en estado `PENDING` esperando el pago

---

### PASO 5: CREAR PREFERENCIA DE MERCADOPAGO 💳

**API:** `POST /api/payments/create-preference`

```javascript
// Frontend: continúa en handleMercadoPagoPayment()
const payerInfo = {
  name: values.name,
  surname: values.surname,
  email: values.email,
  phone: values.phone,
  idType: values.idType,
  idNumber: values.idNumber
};

const preferenceData = {
  orderId: order.id,
  payer: payerInfo,
  backUrls: {
    success: `${window.location.origin}/payment/success`,
    failure: `${window.location.origin}/payment/failure`,
    pending: `${window.location.origin}/payment/pending`
  }
};

const preference = await paymentsApi.createPaymentPreference(preferenceData);
// Response:
{
  initPoint: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  preferenceId: "1730805474-abc123..."
}
```

**Backend:**
```javascript
// Crear preferencia en MercadoPago
const preference = await mercadopago.preferences.create({
  items: [{
    title: `Entradas - ${event.name}`,
    quantity: orderItems.length,
    unit_price: order.total_cents / 100 / orderItems.length,
    currency_id: 'ARS'
  }],
  payer: {
    name: payer.name,
    surname: payer.surname,
    email: payer.email,
    phone: { number: payer.phone },
    identification: { type: payer.idType, number: payer.idNumber }
  },
  external_reference: order.mp_preference_id, // ⭐ CLAVE para el webhook
  back_urls: backUrls,
  auto_return: 'approved'
});

// Actualizar orden con el preference_id
UPDATE orders SET mp_preference_id = ? WHERE id = ?;
```

---

### PASO 6: USUARIO PAGA EN MERCADOPAGO 💰

```javascript
// Frontend redirige
redirectToMercadoPago(preference.initPoint);

// Usuario ve la página de MercadoPago
// - Ingresa datos de tarjeta
// - Confirma el pago
```

**Tarjetas de Prueba:**
- ✅ **Aprobada:** 5031 7557 3453 0604, CVV: 123, Fecha: 11/25  
- ❌ **Rechazada:** 5031 4332 1540 6351, CVV: 123, Fecha: 11/25

---

### PASO 7: WEBHOOK DE MERCADOPAGO 🔔

**API:** `POST /api/payments/webhook` (Automático desde MercadoPago)

```javascript
// MercadoPago envía notificación al backend
POST https://tu-backend.com/api/payments/webhook
{
  type: 'payment',
  data: {
    id: 'mp_payment_123456',
    status: 'approved',
    external_reference: 'pref_1730805474_abc123...'
  }
}

// Backend procesa el webhook
const handleWebhook = async (notification) => {
  // 1. Buscar la orden por external_reference (mp_preference_id)
  const order = await query(
    'SELECT * FROM orders WHERE mp_preference_id = ?',
    [notification.data.external_reference]
  );
  
  // 2. Obtener detalles del pago desde MercadoPago API
  const payment = await mercadopago.payment.get(notification.data.id);
  
  // 3. Si el pago fue APROBADO
  if (payment.status === 'approved') {
    await processApprovedPayment(order, payment);
  }
};

const processApprovedPayment = async (order, payment) => {
  // BEGIN TRANSACTION
  
  // 1. Actualizar orden a PAID
  UPDATE orders 
  SET 
    status = 'PAID',
    mp_payment_id = 'mp_payment_123456',
    paid_at = NOW()
  WHERE id = 456;
  
  // 2. Generar tickets (1 por asiento)
  const orderItems = await query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [order.id]
  );
  
  for (const item of orderItems) {
    INSERT INTO tickets (
      order_id,
      seat_id,
      status,
      qr_payload,
      qr_sig
    ) VALUES (
      456,
      item.seat_id,
      'ISSUED',
      JSON.stringify({ ticketId: null, orderId: 456, seatId: item.seat_id, ... }),
      crypto.sign(...)
    );
  }
  
  // 3. Registrar evento para envío de email
  INSERT INTO outbox_events (
    event_type,
    aggregate_id,
    payload
  ) VALUES (
    'TicketsIssued',
    456,
    JSON.stringify({ orderId: 456, customerEmail: '...', ticketCount: 3 })
  );
  
  // COMMIT
};
```

**Constraint importante:**
```sql
-- Solo 1 ticket por asiento (evita doble venta)
ALTER TABLE tickets ADD UNIQUE KEY unique_seat (seat_id);
```

---

### PASO 8: REDIRECCIÓN Y CONFIRMACIÓN ✅

**MercadoPago redirige al usuario:**
- ✅ Pago aprobado → `/payment/success`
- ❌ Pago rechazado → `/payment/failure`
- ⏳ Pago pendiente → `/payment/pending`

```javascript
// Frontend: PaymentSuccess.jsx
useEffect(() => {
  const verifyPayment = async () => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    const externalReference = params.get('external_reference');
    
    // Verificar estado de la orden
    const order = await ordersApi.getOrder(externalReference);
    
    if (order.status === 'PAID') {
      // ✅ Mostrar confirmación
      // 🎫 Mostrar tickets generados
      const tickets = await ordersApi.getOrderTickets(order.id);
      setTickets(tickets);
    }
  };
  
  verifyPayment();
}, []);
```

---

### PASO 9: USUARIO RECIBE TICKETS 📧

**Email automático:**
```
Asunto: ¡Tus entradas para Iron Maiden!

Hola Juan,

¡Tu compra fue exitosa! 🎉

Evento: Iron Maiden - Run For Your Lives Tour
Fecha: 01/11/2025 - 20:00hs
Venue: Estadio River Plate

Tickets:
- Asiento GA-1 (Código QR adjunto)
- Asiento GA-2 (Código QR adjunto)
- Asiento GA-3 (Código QR adjunto)

Total pagado: $150,000 ARS

Ver mis entradas: https://rstickets.com/mis-entradas
```

**Frontend:**
```javascript
// Usuario puede ver sus tickets en /mis-entradas
const tickets = await usersApi.getMyTickets();

// Cada ticket tiene:
{
  id: 789,
  orderId: 456,
  seatId: 1,
  status: 'ISSUED',
  qrCode: 'TKT-789-ABC123...',
  qrPayload: {...},
  qrSig: '...',
  eventName: 'Iron Maiden',
  showDate: '2025-11-01T20:00:00Z',
  venue: 'Estadio River Plate',
  sector: 'VIP Delantero',
  seatNumber: 'GA-1'
}
```

---

## 🗂️ ARCHIVOS MODIFICADOS

### 1. **ShowDetail.jsx** ✅
- Usa `holdsApi.createHold()` para crear reserva temporal
- Asigna asientos específicos por sector
- Navega a `/checkout/:holdId` con holdData

### 2. **SeatSelection.jsx** ✅
- Actualizado para usar `holdsApi.createHold()`
- Carga asientos disponibles con `showsApi.getShowSeats()`
- Soporte para guest checkout
- Navega a `/checkout/:holdId`

### 3. **Checkout.jsx** ✅ (COMPLETAMENTE REESCRITO)
- Recibe `holdId` desde params
- Carga holdData con `holdsApi.getHold(holdId)`
- **Countdown en tiempo real** con Statistic.Countdown
- Crea ORDER con `ordersApi.createOrder({ holdId })`
- Crea preferencia de pago con `paymentsApi.createPaymentPreference({ orderId })`
- Redirige a MercadoPago

### 4. **apiService.js** ✅
- **holdsApi:**
  - `createHold(holdData)` - POST /api/holds
  - `getHold(holdId)` - GET /api/holds/:holdId
  - `cancelHold(holdId)` - DELETE /api/holds/:holdId
  
- **ordersApi:**
  - `createOrder({ holdId })` - POST /api/orders
  - `getOrder(orderId)` - GET /api/orders/:orderId
  - `getOrderTickets(orderId)` - GET /api/tickets/order/:orderId
  
- **paymentsApi:**
  - `createPaymentPreference({ orderId, payer, backUrls })` - POST /api/payments/create-preference

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

| Aspecto | ❌ Backend V2 (Anterior) | ✅ Sistema de HOLDS (Actual) |
|---------|-------------------------|------------------------------|
| **Reserva** | POST /api/tickets/reserve | POST /api/holds |
| **Duración** | 15 minutos | 15 minutos (TTL) |
| **Modelo** | ticket_reservations | seat_holds + seat_hold_items |
| **Asientos** | Asignación virtual | Asientos específicos (IDs) |
| **Orden** | No existía | POST /api/orders |
| **Pago** | createPreferenceReservation | createPaymentPreference |
| **Tickets** | Generación manual | Generación automática (webhook) |
| **Idempotencia** | No | Sí (Idempotency-Key) |
| **Concurrencia** | Básica | FOR UPDATE SKIP LOCKED |
| **Snapshot precios** | No | Sí (order_items) |

---

## 🔧 ENDPOINTS BACKEND UTILIZADOS

### HOLDS:
```
POST   /api/holds              → Crear hold (reserva temporal)
GET    /api/holds/:holdId      → Consultar hold
DELETE /api/holds/:holdId      → Cancelar hold
```

### ORDERS:
```
POST   /api/orders             → Crear orden desde hold
GET    /api/orders/:orderId    → Consultar orden
GET    /api/tickets/order/:orderId → Obtener tickets de orden
```

### PAYMENTS:
```
POST   /api/payments/create-preference     → Crear preferencia MP
GET    /api/payments/status/:orderId       → Estado de pago
POST   /api/payments/webhook                → Webhook MP (automático)
```

### SHOWS:
```
GET    /api/shows/:showId           → Datos del show
GET    /api/shows/:showId/seats     → Asientos disponibles
GET    /api/shows/:showId/sections  → Secciones/localidades
```

---

## 🎯 FLUJO VISUAL RESUMIDO

```
┌─────────────────────┐
│   USUARIO           │
│   Selecciona        │
│   Asientos          │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   CREAR HOLD        │
│   POST /api/holds   │
│   TTL: 15 minutos   │
│   status: ACTIVE    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   CHECKOUT          │
│   Countdown visible │
│   Formulario MP     │
└──────────┬──────────┘
           │
           ↓ Click "Pagar"
┌─────────────────────┐
│   CREAR ORDER       │
│   POST /api/orders  │
│   status: PENDING   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   PREFERENCIA MP    │
│   POST .../create-  │
│   preference        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   MERCADOPAGO       │
│   Usuario paga      │
│   con tarjeta       │
└──────────┬──────────┘
           │
           ↓ Webhook
┌─────────────────────┐
│   PROCESAR PAGO     │
│   POST .../webhook  │
│   ORDER → PAID      │
│   Generar TICKETS   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   CONFIRMACIÓN      │
│   Email con QR      │
│   /mis-entradas     │
└─────────────────────┘
```

---

## 🚀 CÓMO PROBAR

### 1. Iniciar Backend:
```bash
cd ticketera-backend
npm start  # Puerto 3000
```

### 2. Iniciar Frontend:
```bash
cd ticketera-frontend
npm run dev  # Puerto 5173
```

### 3. Flujo de Prueba:
```
1. Navegar a http://localhost:5173/shows/38
2. Seleccionar cantidad de entradas (ej: 2)
3. Click "Continuar"
   → Se crea HOLD
   → Consola: "🔒 HOLD creado: { holdId: X, expiresAt: ... }"
4. Checkout muestra countdown (15:00)
5. Completar formulario:
   - Nombre: Juan
   - Apellido: Pérez
   - Email: test@example.com
   - Teléfono: 1234567890
   - DNI: 12345678
6. Click "Pagar $XXX"
   → Se crea ORDER
   → Consola: "📦 ORDER creada: { id: Y, status: PENDING }"
   → Se crea preferencia MP
   → Redirige a MercadoPago
7. En MP, usar tarjeta de prueba:
   - Número: 5031 7557 3453 0604
   - CVV: 123
   - Fecha: 11/25
8. Confirmar pago
   → MP envía webhook al backend
   → Backend genera tickets
   → Redirige a /payment/success
9. Ver tickets en /mis-entradas
```

---

## ⚠️ NOTAS IMPORTANTES

### Limpieza Automática de Holds:
El backend tiene un job que limpia holds expirados cada 1-2 minutos:
```javascript
setInterval(async () => {
  await query('DELETE FROM seat_holds WHERE expires_at < NOW()');
}, 120000); // Cada 2 minutos
```

### Idempotencia:
Todos los endpoints críticos usan `Idempotency-Key`:
```javascript
// Frontend genera clave única
const idempotencyKey = crypto.randomUUID();

// Backend verifica si ya existe
const existing = await query(
  'SELECT * FROM orders WHERE idempotency_key = ?',
  [idempotencyKey]
);
if (existing) return existing; // ⬅️ Retorna el existente
```

### Race Conditions:
El backend usa `FOR UPDATE SKIP LOCKED`:
```sql
SELECT * FROM seats 
WHERE id IN (1,2,3) AND status = 'AVAILABLE'
FOR UPDATE SKIP LOCKED;
```
Si otro proceso ya tiene lock en un asiento, se saltea y retorna error 409.

---

## ✅ CHECKLIST DE VALIDACIÓN

- [x] ShowDetail.jsx usa holdsApi.createHold()
- [x] SeatSelection.jsx usa holdsApi.createHold()
- [x] Checkout.jsx carga hold y muestra countdown
- [x] Checkout.jsx crea ORDER antes del pago
- [x] paymentsApi usa endpoint correcto (/create-preference)
- [x] Flujo completo: HOLDS → ORDERS → PAYMENT → TICKETS
- [x] Idempotencia implementada (Idempotency-Key)
- [x] Countdown en tiempo real funcional
- [x] Redirección a MercadoPago correcta
- [x] Webhook procesa pago y genera tickets
- [x] Email de confirmación se envía

---

## 📝 CONCLUSIÓN

**El frontend ahora sigue correctamente el flujo del backend:**

1. ✅ **HOLD** - Reserva temporal de asientos específicos (15 min)
2. ✅ **ORDER** - Orden de compra con snapshot de precios
3. ✅ **PAYMENT** - Procesamiento con MercadoPago
4. ✅ **TICKETS** - Generación automática al confirmar pago

**Todos los formularios están actualizados y funcionando correctamente.**

---

**Autor:** RS Tickets Development Team  
**Versión:** 1.0  
**Última actualización:** 2025-11-05
