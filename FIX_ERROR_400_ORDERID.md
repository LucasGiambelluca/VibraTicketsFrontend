# 🔧 FIX: Error 400 "Faltan campos: orderId"

## ❌ Error

```
Failed to load resource: the server responded with a status of 400 (Bad Request)
❌ Error response: {
  "error": "BadRequest",
  "message": "Faltan campos: orderId"
}
```

---

## 🔍 Causa

El backend espera `orderId` en el request de `POST /api/payments/create-preference`, pero el frontend estaba enviando solo `holdId`.

### Request Incorrecto (❌)

```javascript
const response = await paymentsApi.createPaymentPreference({
  holdId: 123,  // ❌ Backend no acepta holdId directamente
  payer: {...},
  backUrls: {...}
});
```

### Request Correcto (✅)

```javascript
// 1. Crear ORDER desde HOLD primero
const orderResponse = await ordersApi.createOrder({ holdId: 123 });
const orderId = orderResponse.orderId;

// 2. Crear preferencia con orderId
const response = await paymentsApi.createPaymentPreference({
  orderId: orderId,  // ✅ Backend requiere orderId
  payer: {...},
  backUrls: {...}
});
```

---

## ✅ Solución Implementada

### Archivo: `src/components/MercadoPagoButton.jsx`

**ANTES (Causaba error 400):**

```javascript
// Crear preferencia de pago directamente con holdId
const response = await paymentsApi.createPaymentPreference({
  holdId: parseInt(holdId),
  payer: preferenceData.payer,
  backUrls: preferenceData.backUrls
});
```

**DESPUÉS (Funciona correctamente):**

```javascript
// 1) Crear ORDER desde HOLD (requerido por backend)
console.log('📦 Creando ORDER desde HOLD antes de pago...');
const orderResponse = await ordersApi.createOrder({ 
  holdId: parseInt(holdId) 
}, true);

const orderId = orderResponse?.orderId 
  || orderResponse?.id 
  || orderResponse?.data?.orderId 
  || orderResponse?.data?.id;

if (!orderId) {
  throw new Error('No se pudo crear la orden de compra.');
}

// 2) Crear preferencia de pago usando orderId
const response = await paymentsApi.createPaymentPreference({
  orderId: parseInt(orderId),
  payer: preferenceData.payer,
  backUrls: preferenceData.backUrls
});
```

---

## 🏗️ Arquitectura del Backend

El backend tiene esta estructura:

```
HOLD (reserva temporal)
  ↓
ORDER (orden de compra confirmada)
  ↓
PAYMENT (pago procesado)
  ↓
TICKETS (entradas generadas)
```

### Por qué se necesita ORDER antes de PAYMENT:

1. **Trazabilidad**: La ORDER es el registro permanente de la compra
2. **Idempotencia**: Si el pago falla, la ORDER queda para reintentar
3. **Webhook**: MercadoPago notifica usando `orderId` como referencia
4. **Auditoría**: Todas las transacciones se vinculan a una ORDER

---

## 🔄 Flujo Completo

```
1. Usuario selecciona asientos
   ↓
2. Frontend crea HOLD (POST /api/holds)
   → Reserva temporal por 15 minutos
   ↓
3. Usuario va a Checkout
   ↓
4. Click "Pagar con Mercado Pago"
   ↓
5. Frontend crea ORDER (POST /api/orders)
   → Convierte HOLD en ORDER
   → ORDER.status = PENDING
   ↓
6. Frontend crea preferencia MP (POST /api/payments/create-preference)
   → Envía orderId (no holdId)
   → Backend crea preferencia en MercadoPago
   ↓
7. Backend retorna init_point
   ↓
8. Frontend redirige a MercadoPago
   ↓
9. Usuario paga en mercadopago.com
   ↓
10. MercadoPago notifica backend (POST /api/payments/webhook)
    → Backend actualiza ORDER.status = PAID
    → Backend genera TICKETS
    ↓
11. MercadoPago redirige a frontend
    → /payment/success?orderId=123
```

---

## 📋 Endpoints Involucrados

### 1. Crear ORDER desde HOLD

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "holdId": 123
}
```

**Response:**
```json
{
  "orderId": 456,
  "status": "PENDING",
  "totalCents": 50000,
  "createdAt": "2025-11-14T14:00:00Z"
}
```

### 2. Crear Preferencia de Pago

```http
POST /api/payments/create-preference
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": 456,
  "payer": {
    "email": "user@example.com",
    "name": "Juan",
    "surname": "Pérez",
    "phone": {
      "area_code": "11",
      "number": "12345678"
    },
    "identification": {
      "type": "DNI",
      "number": "12345678"
    }
  },
  "backUrls": {
    "success": "http://localhost:5173/payment/success?orderId=456",
    "failure": "http://localhost:5173/payment/failure?orderId=456",
    "pending": "http://localhost:5173/payment/pending?orderId=456"
  }
}
```

**Response:**
```json
{
  "preferenceId": "123456789-abc-def",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "orderId": 456
}
```

---

## 🧪 Testing

### Verificar que funciona:

1. Seleccionar asientos en un show
2. Ir a Checkout
3. Completar formulario
4. Click "Pagar con Mercado Pago"
5. Verificar en Console (F12):
   ```
   📦 Creando ORDER desde HOLD antes de pago...
   ✅ ORDER creada/resuelta (idempotente): { orderId: 456, ... }
   📤 Enviando datos de preferencia: { orderId: 456, ... }
   ✅ Respuesta del backend: { initPoint: "https://...", ... }
   🚀 URL de Mercado Pago: https://...
   ```
6. Debe redirigir a MercadoPago (no error 400)

---

## ✅ Estado Final

- ✅ Error 400 corregido
- ✅ MercadoPagoButton crea ORDER antes de preferencia
- ✅ Backend recibe orderId correctamente
- ✅ Redirección a MercadoPago funciona
- ✅ Documentación actualizada

---

## 📚 Archivos Relacionados

- `src/components/MercadoPagoButton.jsx` - Componente corregido
- `INTEGRACION_MERCADOPAGO_ACTUALIZADA.md` - Documentación completa
- `CHECKOUT_PRO_REDIRECCION.md` - Guía del flujo de redirección

---

**FIX APLICADO Y VERIFICADO** ✅
