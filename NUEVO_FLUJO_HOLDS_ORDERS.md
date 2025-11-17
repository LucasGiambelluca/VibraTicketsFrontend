# 🎯 NUEVO FLUJO: HOLDS → ORDERS (IMPLEMENTADO)

**Fecha:** 2025-10-30  
**Estado:** ✅ COMPLETADO Y FUNCIONAL

---

## 📋 CAMBIOS PRINCIPALES DEL BACKEND

El backend ahora usa un flujo de **2 PASOS**:

1. **HOLD** (Reserva temporal de 15 minutos)
2. **ORDER** (Orden de compra con Mercado Pago)

### ❌ FLUJO ANTERIOR (DEPRECADO)
```
ShowDetail → Checkout → Crear Orden → Mercado Pago
```

### ✅ FLUJO NUEVO (ACTUAL)
```
ShowDetail → Crear HOLD → Checkout → Crear ORDER → Mercado Pago
```

---

## 🔄 FLUJO COMPLETO IMPLEMENTADO

### 1️⃣ Usuario en ShowDetail
```javascript
// ShowDetail.jsx

// Usuario selecciona cantidades por sección
const selectedSections = [
  { sectionId: 1, sectionName: "Platea", quantity: 2 },
  { sectionId: 2, sectionName: "Pullman", quantity: 1 }
];

// Click en "Continuar"
handleContinue() {
  // 1. Obtener asientos disponibles de cada sección
  const selectedSeatIds = [];
  for (const selection of selectedSections) {
    const sectionSeats = seats.filter(seat => 
      seat.sector === selection.sectionName && 
      seat.status === 'AVAILABLE'
    );
    const seatsToReserve = sectionSeats.slice(0, selection.quantity);
    selectedSeatIds.push(...seatsToReserve.map(seat => seat.id));
  }
  
  // 2. Crear HOLD (reserva temporal de 15 minutos)
  const holdData = {
    showId: 1,
    seatIds: [1, 2, 3], // IDs de asientos específicos
    customerEmail: user.email,
    customerName: user.name
  };
  
  const holdResponse = await holdsApi.createHold(holdData);
  // POST /api/holds
  // Header: Idempotency-Key: uuid-unico
  
  // Respuesta:
  // {
  //   holdId: 123,
  //   expiresAt: "2025-10-30T18:30:00Z",
  //   ttlMinutes: 15,
  //   seats: [...],
  //   totalCents: 45000
  // }
  
  // 3. Navegar a Checkout con holdId
  navigate(`/checkout/${holdResponse.holdId}`, {
    state: {
      holdId: holdResponse.holdId,
      holdData: holdResponse,
      show,
      event,
      expiresAt: holdResponse.expiresAt
    }
  });
}
```

### 2️⃣ Checkout (CheckoutNew.jsx)
```javascript
// CheckoutNew.jsx

// Mostrar countdown de 15 minutos
<Countdown 
  value={new Date(expiresAt).getTime()} 
  format="mm:ss"
  onFinish={handleCountdownFinish}
/>

// Mostrar resumen de asientos reservados
{holdData.seats.map(seat => (
  <div>
    {seat.sector} - Asiento {seat.seatNumber}
    ${(seat.priceCents / 100).toLocaleString('es-AR')}
  </div>
))}

// Click en "Proceder al pago"
handleCreateOrderAndPay() {
  // 1. Crear ORDER desde el HOLD
  const orderResponse = await ordersApi.createOrder({ 
    holdId: 123 
  });
  // POST /api/orders
  // Header: Idempotency-Key: uuid-unico
  
  // Respuesta:
  // {
  //   orderId: 456,
  //   status: "PENDING",
  //   totalCents: 45000,
  //   mpPreferenceId: "pref_abc123",
  //   checkoutUrl: "/checkout/pref_abc123"
  // }
  
  // 2. Guardar orderId en localStorage
  localStorage.setItem('currentOrderId', orderResponse.orderId);
  
  // 3. Redirigir a Mercado Pago
  const mpUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${orderResponse.mpPreferenceId}`;
  window.location.href = mpUrl;
}
```

### 3️⃣ Mercado Pago
```
Usuario paga en Mercado Pago
  ↓
MP notifica al backend vía webhook
  ↓
POST /api/payments/webhook
  ↓
Backend procesa:
  - Actualiza orden: status = 'PAID'
  - Emite tickets con QR único
  - Envía email de confirmación
  ↓
MP redirige a /payment/success
```

### 4️⃣ PaymentSuccess.jsx
```javascript
// PaymentSuccess.jsx

useEffect(() => {
  const verifyPayment = async () => {
    // 1. Obtener orderId de localStorage
    const orderId = localStorage.getItem('currentOrderId');
    
    // 2. Verificar estado de la orden
    const orderData = await ordersApi.getOrder(orderId);
    // GET /api/orders/:orderId
    
    // Respuesta:
    // {
    //   id: 456,
    //   status: "PAID",
    //   total_cents: 45000,
    //   mp_payment_id: "mp_12345",
    //   paid_at: "2025-10-30T18:25:00Z"
    // }
    
    // 3. Si aún está pendiente, reintentar en 2 segundos
    if (orderData.status !== 'PAID') {
      setTimeout(() => verifyPayment(), 2000);
    } else {
      // 4. Limpiar localStorage
      localStorage.removeItem('currentOrderId');
      
      // 5. Mostrar confirmación
      setPaymentInfo({
        status: 'approved',
        orderId: orderData.id,
        amount: orderData.total_cents
      });
    }
  };
  
  verifyPayment();
}, []);
```

---

## 🆕 NUEVOS ENDPOINTS IMPLEMENTADOS

### 1. HOLDS API

#### Crear HOLD
```javascript
POST /api/holds
Headers: {
  "Idempotency-Key": "uuid-unico",
  "Authorization": "Bearer token"
}
Body: {
  "showId": 1,
  "seatIds": [1, 2, 3],
  "customerEmail": "user@example.com",
  "customerName": "Juan Pérez"
}

Response (201):
{
  "holdId": 123,
  "expiresAt": "2025-10-30T18:30:00Z",
  "ttlMinutes": 15,
  "seats": [
    {
      "seatId": 1,
      "sector": "Platea",
      "seatNumber": "A1",
      "priceCents": 15000,
      "currency": "ARS"
    }
  ],
  "totalCents": 45000,
  "message": "Hold created successfully"
}
```

#### Consultar HOLD
```javascript
GET /api/holds/:holdId

Response (200):
{
  "id": 123,
  "show_id": 1,
  "customer_email": "user@example.com",
  "expires_at": "2025-10-30T18:30:00Z",
  "status": "ACTIVE", // o "EXPIRED"
  "seats": [...],
  "totalCents": 45000,
  "isExpired": false
}
```

#### Cancelar HOLD
```javascript
DELETE /api/holds/:holdId

Response (200):
{
  "message": "Hold cancelled successfully",
  "holdId": 123
}
```

### 2. ORDERS API

#### Crear ORDER
```javascript
POST /api/orders
Headers: {
  "Idempotency-Key": "uuid-unico",
  "Authorization": "Bearer token"
}
Body: {
  "holdId": 123
}

Response (201):
{
  "orderId": 456,
  "status": "PENDING",
  "totalCents": 45000,
  "currency": "ARS",
  "mpPreferenceId": "pref_abc123",
  "seats": [...],
  "customer": {
    "email": "user@example.com",
    "name": "Juan Pérez"
  },
  "message": "Order created. Proceed to payment.",
  "checkoutUrl": "/checkout/pref_abc123"
}
```

#### Consultar ORDER
```javascript
GET /api/orders/:orderId

Response (200):
{
  "id": 456,
  "customer_email": "user@example.com",
  "status": "PENDING", // o "PAID", "CANCELLED"
  "total_cents": 45000,
  "mp_preference_id": "pref_abc123",
  "mp_payment_id": "mp_12345", // Cuando se paga
  "created_at": "2025-10-30T18:20:00Z",
  "paid_at": null, // o timestamp cuando se paga
  "items": [...]
}
```

#### Obtener Tickets de una ORDER
```javascript
GET /api/tickets/order/:orderId

Response (200):
{
  "tickets": [
    {
      "id": 789,
      "order_id": 456,
      "seat_id": 1,
      "status": "ISSUED",
      "qr_payload": {...},
      "issued_at": "2025-10-30T18:25:00Z"
    }
  ]
}
```

---

## 📁 ARCHIVOS MODIFICADOS/CREADOS

### 1. `src/api/client.js`
**Cambio:** Permitir headers personalizados en `post()`
```javascript
async post(endpoint, data = {}, options = {}) {
  return this.request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers // ✅ Permitir headers personalizados
    },
    body: JSON.stringify(data)
  });
}
```

### 2. `src/services/apiService.js`
**Agregado:** Nuevos APIs de HOLDS y ORDERS
```javascript
// HOLDS API
export const holdsApi = {
  createHold: (holdData) => {
    const idempotencyKey = crypto.randomUUID();
    return apiClient.post(`${API_BASE}/holds`, holdData, {
      headers: { 'Idempotency-Key': idempotencyKey }
    });
  },
  getHold: (holdId) => apiClient.get(`${API_BASE}/holds/${holdId}`),
  cancelHold: (holdId) => apiClient.delete(`${API_BASE}/holds/${holdId}`)
};

// ORDERS API
export const ordersApi = {
  createOrder: (orderData) => {
    const idempotencyKey = crypto.randomUUID();
    return apiClient.post(`${API_BASE}/orders`, orderData, {
      headers: { 'Idempotency-Key': idempotencyKey }
    });
  },
  getOrder: (orderId) => apiClient.get(`${API_BASE}/orders/${orderId}`),
  getOrderTickets: (orderId) => apiClient.get(`${API_BASE}/tickets/order/${orderId}`)
};
```

### 3. `src/pages/ShowDetail.jsx`
**Cambios principales:**
- ✅ Importa `holdsApi` y `useAuth`
- ✅ Carga asientos disponibles con `showsApi.getShowSeats()`
- ✅ Asigna asientos específicos de cada sección
- ✅ Crea HOLD con `holdsApi.createHold()`
- ✅ Navega a `/checkout/:holdId` con datos del hold
- ✅ Muestra loading state mientras crea el hold

### 4. `src/pages/CheckoutNew.jsx` (NUEVO)
**Características:**
- ✅ Recibe `holdId` de los params
- ✅ Carga datos del hold si no vienen en el state
- ✅ Muestra countdown de 15 minutos con `<Countdown />`
- ✅ Maneja expiración del hold
- ✅ Crea ORDER con `ordersApi.createOrder()`
- ✅ Redirige a Mercado Pago
- ✅ Permite cancelar el hold
- ✅ Muestra resumen detallado de asientos

### 5. `src/pages/PaymentSuccess.jsx`
**Cambios:**
- ✅ Importa `ordersApi`
- ✅ Obtiene `orderId` de localStorage
- ✅ Verifica estado con `ordersApi.getOrder()`
- ✅ Reintentos automáticos si está pendiente
- ✅ Limpia localStorage cuando se confirma

### 6. `src/App.jsx`
**Cambios:**
- ✅ Importa `CheckoutNew`
- ✅ Agrega ruta `/checkout/:holdId` → `CheckoutNew`

---

## ⚠️ MANEJO DE ERRORES

### Errores en HOLD
```javascript
try {
  const holdResponse = await holdsApi.createHold(holdData);
} catch (error) {
  if (error.message?.includes('SeatsNotAvailable')) {
    message.error('Algunos asientos ya no están disponibles');
  } else if (error.message?.includes('BadRequest')) {
    message.error('Datos inválidos');
  } else {
    message.error('Error al reservar asientos');
  }
}
```

### Errores en ORDER
```javascript
try {
  const orderResponse = await ordersApi.createOrder({ holdId });
} catch (error) {
  if (error.message?.includes('HoldExpired')) {
    setHoldExpired(true);
    message.error('Tu reserva expiró');
    navigate(-1);
  } else if (error.message?.includes('HoldNotFound')) {
    message.error('Reserva no encontrada');
  } else if (error.message?.includes('SeatsAlreadySold')) {
    message.error('Algunos asientos ya fueron vendidos');
  }
}
```

---

## 🧪 TESTING COMPLETO

### Paso 1: Seleccionar Asientos
```
1. Navegar a /shows/1
2. Seleccionar cantidades por sección
3. Click "Continuar"
4. Verificar consola:
   🔒 Creando HOLD con datos: {...}
   ✅ HOLD creado exitosamente: { holdId: 123, ... }
5. Verificar mensaje: "¡Asientos reservados! Tenés 15 minutos..."
6. Verificar navegación a /checkout/123
```

### Paso 2: Checkout
```
1. Verificar countdown visible: 15:00
2. Verificar resumen de asientos
3. Verificar total correcto
4. Click "Proceder al pago"
5. Verificar consola:
   📦 Creando orden desde hold: 123
   ✅ Orden creada: { orderId: 456, mpPreferenceId: "pref_abc123" }
6. Verificar redirección a Mercado Pago
```

### Paso 3: Pago
```
1. Pagar con tarjeta de prueba: 5031 7557 3453 0604
2. Verificar redirección a /payment/success
3. Verificar consola:
   🔍 Verificando orden: 456
   ✅ Orden obtenida: { status: "PAID", ... }
4. Verificar mensaje de éxito
5. Verificar limpieza de localStorage
```

### Paso 4: Expiración de HOLD
```
1. Crear hold
2. Esperar 15 minutos (o modificar ttl en backend)
3. Verificar que countdown llega a 00:00
4. Verificar mensaje: "¡Tu reserva ha expirado!"
5. Verificar que botón "Pagar" está disabled
```

---

## 🎯 PUNTOS CLAVE

### ✅ OBLIGATORIO
- Siempre enviar `Idempotency-Key` en POST requests
- Generar UUID único por cada intento
- Mostrar countdown de 15 minutos
- Manejar hold expirado (volver a seleccionar)
- Guardar `orderId` para verificar pago

### ⚠️ IMPORTANTE
- Los holds expiran en 15 minutos
- Si el usuario tarda mucho, debe crear un nuevo hold
- El webhook puede tardar unos segundos en procesar
- Verificar estado de orden después del pago
- Los asientos se reservan específicamente (no solo por sección)

### 🔑 IDEMPOTENCIA
```javascript
// Generar UUID único
const idempotencyKey = crypto.randomUUID();

// Enviar en header
headers: {
  'Idempotency-Key': idempotencyKey
}

// Si repites el mismo key, devuelve el mismo hold/order (no duplica)
```

---

## 📊 DIAGRAMA DE FLUJO

```
┌─────────────────────────────────────────────────────────┐
│ 1. SHOWDETAIL - Selección de Asientos                  │
│    - Usuario selecciona cantidades por sección         │
│    - Sistema asigna asientos específicos               │
│    - Click "Continuar"                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CREAR HOLD (Reserva Temporal)                       │
│    POST /api/holds                                      │
│    Header: Idempotency-Key                             │
│    Body: { showId, seatIds, customerEmail }            │
│    → Respuesta: { holdId, expiresAt, seats }           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CHECKOUT - Resumen y Countdown                      │
│    - Muestra asientos reservados                       │
│    - Countdown 15:00 → 00:00                           │
│    - Click "Proceder al pago"                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CREAR ORDER                                          │
│    POST /api/orders                                     │
│    Body: { holdId }                                     │
│    → Respuesta: { orderId, mpPreferenceId }            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. REDIRIGIR A MERCADOPAGO                             │
│    window.location.href = mpUrl                         │
│    Usuario paga con tarjeta/efectivo                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. WEBHOOK PROCESA PAGO (Backend automático)           │
│    - Actualiza orden a PAID                            │
│    - Emite tickets con QR                              │
│    - Envía email                                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. PAYMENT SUCCESS                                      │
│    GET /api/orders/:orderId                            │
│    - Verifica estado (PAID)                            │
│    - Muestra confirmación                              │
│    - Limpia localStorage                               │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ RESUMEN DE CAMBIOS

| Componente | Cambio | Estado |
|------------|--------|--------|
| `apiService.js` | Agregado `holdsApi` y `ordersApi` | ✅ |
| `client.js` | Soporte para headers personalizados | ✅ |
| `ShowDetail.jsx` | Crea HOLD en lugar de navegar directo | ✅ |
| `CheckoutNew.jsx` | Nuevo componente con countdown | ✅ |
| `PaymentSuccess.jsx` | Verifica orden con `ordersApi` | ✅ |
| `App.jsx` | Ruta `/checkout/:holdId` | ✅ |

---

**MIGRACIÓN COMPLETADA AL NUEVO FLUJO HOLDS → ORDERS** 🚀

**Fecha de implementación:** 2025-10-30  
**Archivos modificados:** 6  
**Nuevos endpoints:** 6  
**Estado:** ✅ FUNCIONAL Y LISTO PARA TESTING
