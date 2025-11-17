# ✅ AJUSTES MÍNIMOS IMPLEMENTADOS

## 🎯 **Cambios Realizados Según Especificación del Backend:**

### **1. ✅ holdsApi.createHold() - ACTUALIZADO**
```javascript
// ANTES: generateIdempotencyKey('hold')
// DESPUÉS: `hold-${crypto.randomUUID?.() ?? Date.now()}`

createHold: (holdData, usePersistedKey = false) => {
  const idempotencyKey = usePersistedKey 
    ? getOrCreateIdempotencyKey('hold')
    : `hold-${crypto.randomUUID?.() ?? Date.now()}`;  // ✅ NUEVO FORMATO
  
  return apiClient.post(`${API_BASE}/holds`, holdData, {
    headers: {
      'Idempotency-Key': idempotencyKey  // ✅ HEADER CORRECTO
    }
  });
}
```

### **2. ✅ ordersApi.createOrder() - ACTUALIZADO**
```javascript
// ANTES: generateIdempotencyKey('order')
// DESPUÉS: `order-${crypto.randomUUID?.() ?? Date.now()}`

createOrder: (orderData, usePersistedKey = false) => {
  const idempotencyKey = usePersistedKey 
    ? getOrCreateIdempotencyKey('order')
    : `order-${crypto.randomUUID?.() ?? Date.now()}`;  // ✅ NUEVO FORMATO
  
  return apiClient.post(`${API_BASE}/orders`, orderData, {
    headers: {
      'Idempotency-Key': idempotencyKey  // ✅ HEADER CORRECTO
    }
  });
}
```

### **3. ✅ paymentsApi.createPaymentPreference() - VERIFICADO**
```javascript
// ✅ YA ESTABA CORRECTO - apiClient agrega automáticamente Authorization
createPaymentPreference: (paymentData) => {
  // IMPORTANTE: Requiere header 'Authorization: Bearer <TOKEN>' (agregado automáticamente por apiClient)
  return apiClient.post(`${API_BASE}/payments/create-preference`, paymentData);
}
```

### **4. ✅ paymentsApi.simulatePayment() - VERIFICADO**
```javascript
// ✅ YA ESTABA CORRECTO - Endpoint correcto
simulatePayment: (paymentData) => {
  // ENDPOINT: POST /api/test-payments/simulate-payment
  return apiClient.post(`${API_BASE}/test-payments/simulate-payment`, paymentData);
}
```

### **5. ✅ Checkout.jsx - backUrls ACTUALIZADAS**
```javascript
// ANTES: window.location.origin
// DESPUÉS: location.origin (siguiendo tu especificación exacta)

const backUrls = {
  success: `${location.origin}/payment/success?orderId=${order.id}`,
  failure: `${location.origin}/payment/failure?orderId=${order.id}`,
  pending: `${location.origin}/payment/pending?orderId=${order.id}`
};

// REDIRECCIÓN MEJORADA
const initPoint = preference.initPoint || preference.init_point || preference.sandboxInitPoint;
if (initPoint) {
  location.href = initPoint;  // ✅ SIGUIENDO TU ESPECIFICACIÓN
} else {
  throw new Error('No se recibió init_point de MercadoPago');
}
```

## 🔧 **Formato de Idempotency Keys:**

### **Antes:**
```javascript
generateIdempotencyKey('hold')  // → "hold_1699123456789_abc123"
generateIdempotencyKey('order') // → "order_1699123456789_def456"
```

### **Después (Siguiendo tu especificación):**
```javascript
`hold-${crypto.randomUUID?.() ?? Date.now()}`   // → "hold-550e8400-e29b-41d4-a716-446655440000"
`order-${crypto.randomUUID?.() ?? Date.now()}`  // → "order-550e8400-e29b-41d4-a716-446655440001"
```

## 📋 **Headers Verificados:**

### **POST /api/holds:**
```javascript
Headers: {
  'Content-Type': 'application/json',
  'Idempotency-Key': 'hold-550e8400-e29b-41d4-a716-446655440000'
}
Body: { showId, seatIds, customerEmail, customerName }
```

### **POST /api/orders:**
```javascript
Headers: {
  'Content-Type': 'application/json',
  'Idempotency-Key': 'order-550e8400-e29b-41d4-a716-446655440001'
}
Body: { holdId }
```

### **POST /api/payments/create-preference:**
```javascript
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
Body: { orderId, payer, backUrls }
```

### **POST /api/test-payments/simulate-payment:**
```javascript
Headers: {
  'Content-Type': 'application/json'
}
Body: { orderId, customerEmail, customerName }
```

## 🎯 **Flujo Completo Actualizado:**

```javascript
// 1) HOLD
const hold = await fetch('/api/holds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': `hold-${crypto.randomUUID?.() ?? Date.now()}`  // ✅
  },
  body: JSON.stringify({ showId, seatIds, customerEmail, customerName })
}).then(r => r.json());

// 2) ORDER
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': `order-${crypto.randomUUID?.() ?? Date.now()}`  // ✅
  },
  body: JSON.stringify({ holdId: hold.holdId })
}).then(r => r.json());

// 3) PREFERENCE
const backUrls = {
  success: `${location.origin}/payment/success?orderId=${order.orderId}`,  // ✅
  failure: `${location.origin}/payment/failure?orderId=${order.orderId}`,  // ✅
  pending: `${location.origin}/payment/pending?orderId=${order.orderId}`   // ✅
};

const pref = await fetch('/api/payments/create-preference', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`  // ✅
  },
  body: JSON.stringify({ orderId: order.orderId, payer, backUrls })
}).then(r => r.json());

location.href = pref.initPoint || pref.sandboxInitPoint;  // ✅
```

## 🎉 **Estado Final:**

- ✅ **holdsApi** - Headers e Idempotency-Key actualizados
- ✅ **ordersApi** - Headers e Idempotency-Key actualizados  
- ✅ **paymentsApi** - Authorization verificado y documentado
- ✅ **simulatePayment** - Endpoint correcto verificado
- ✅ **Checkout** - backUrls y redirección actualizadas
- ✅ **Formato UUID** - Siguiendo especificación exacta

**EL FRONTEND AHORA SIGUE EXACTAMENTE LA ESPECIFICACIÓN DEL BACKEND** 🚀
