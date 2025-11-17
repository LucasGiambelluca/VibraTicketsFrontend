# ✅ FIX: Checkout Sin Endpoint /api/orders

## 🔴 PROBLEMA IDENTIFICADO

Al presionar "Pagar", el checkout intentaba:
```
POST http://localhost:3000/api/orders
Body: { holdId: 123 }
```

Pero el backend devolvía **404 Not Found** porque ese endpoint no existe.

---

## ✅ SOLUCIÓN IMPLEMENTADA

He modificado el `Checkout.jsx` para que **NO cree una ORDER separada**. Ahora pasa el `holdId` directamente a MercadoPago o al simulador.

---

## 🔧 CAMBIOS REALIZADOS

### 1. **handleMercadoPagoPayment** (Pago Real)

**ANTES:**
```javascript
// ❌ Intentaba crear ORDER separada
const order = await createOrderFromHold();
const preferenceData = {
  orderId: order.id,  // ❌
  payer: {...},
  backUrls: {...}
};
```

**AHORA:**
```javascript
// ✅ Usa holdId directamente
const preferenceData = {
  holdId: parseInt(holdId),  // ✅
  payer: {...},
  backUrls: {...}
};
```

### 2. **handleSimulatePayment** (Simulador Dev)

**ANTES:**
```javascript
// ❌ Intentaba crear ORDER separada
const order = await createOrderFromHold();
await paymentsApi.simulatePayment({
  orderId: order.id,  // ❌
  customerEmail: '...',
  customerName: '...'
});
```

**AHORA:**
```javascript
// ✅ Usa holdId directamente
await paymentsApi.simulatePayment({
  holdId: parseInt(holdId),  // ✅
  customerEmail: '...',
  customerName: '...'
});
```

---

## 📦 LO QUE EL BACKEND DEBE ESPERAR AHORA

### Endpoint: POST /api/payments/create-preference

**Request Body:**
```json
{
  "holdId": 123,
  "payer": {
    "name": "Juan",
    "surname": "Pérez",
    "email": "test@example.com",
    "phone": "12345678",
    "areaCode": "11",
    "idType": "DNI",
    "idNumber": "12345678"
  },
  "backUrls": {
    "success": "http://localhost:5173/payment/success?holdId=123",
    "failure": "http://localhost:5173/payment/failure?holdId=123",
    "pending": "http://localhost:5173/payment/pending?holdId=123"
  }
}
```

**El backend debe:**
1. Recibir el `holdId`
2. Validar que el hold existe y pertenece al usuario
3. Obtener los items del hold para calcular el total
4. Crear la preferencia de MercadoPago con esos datos
5. **Opcionalmente:** Crear la ORDER internamente (pero no la devuelve al frontend)
6. Devolver la preferencia:
   ```json
   {
     "id": "123456-abc-xyz",
     "init_point": "https://www.mercadopago.com.ar/checkout/...",
     "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/..."
   }
   ```

### Endpoint: POST /api/test-payments/simulate-payment

**Request Body:**
```json
{
  "holdId": 123,
  "customerEmail": "test@example.com",
  "customerName": "Test User"
}
```

**El backend debe:**
1. Recibir el `holdId`
2. Validar que el hold existe y pertenece al usuario
3. Crear ORDER desde el HOLD
4. Marcar la orden como CONFIRMED
5. Generar tickets
6. Enviar email
7. Devolver:
   ```json
   {
     "success": true,
     "message": "Pago simulado exitosamente",
     "data": {
       "orderId": 456,
       "tickets": [
         {
           "id": 789,
           "qrCode": "...",
           "seatNumber": "A1"
         }
       ]
     }
   }
   ```

---

## 🎯 FLUJO ACTUALIZADO

### Flujo Completo:

```
1. Usuario selecciona asientos
   ↓
2. Se crea HOLD (reserva temporal, 15 min)
   POST /api/holds
   Response: { holdId: 123, items: [...], totalCents: 10000 }
   ↓
3. Usuario va a Checkout
   /checkout/:holdId
   ↓
4. Usuario llena formulario y presiona "Pagar"
   ↓
5. Frontend crea preferencia de MP con holdId
   POST /api/payments/create-preference
   Body: { holdId: 123, payer: {...}, backUrls: {...} }
   ↓
6. Backend:
   - Valida hold
   - Crea preferencia en MP
   - (Opcionalmente crea ORDER internamente)
   - Devuelve init_point
   ↓
7. Usuario completa pago en MercadoPago
   ↓
8. MercadoPago envía webhook
   POST /api/payments/webhook
   ↓
9. Backend procesa webhook:
   - Busca el hold asociado
   - Crea ORDER (si no la creó antes)
   - Marca orden como CONFIRMED
   - Genera tickets
   - Envía email
   ↓
10. Usuario es redirigido a /payment/success
    Puede consultar sus tickets
```

---

## 🧪 TESTING ACTUALIZADO

### Opción A: Simulador (Dev Only)

1. Ir a `/checkout/:holdId`
2. Click en **"🧪 Simular Pago (Testing)"**
3. Frontend llama:
   ```bash
   POST /api/test-payments/simulate-payment
   {
     "holdId": 123,
     "customerEmail": "test@example.com",
     "customerName": "Test User"
   }
   ```
4. Backend debe procesar y devolver tickets

**Si falla:**
- Abrir Network tab (F12)
- Ver Request URL y Response
- Verificar que el backend espera `holdId` (no `orderId`)

### Opción B: Pago Real

1. Ir a `/checkout/:holdId`
2. Llenar formulario
3. Click en **"Pagar $XXX"**
4. Frontend llama:
   ```bash
   POST /api/payments/create-preference
   {
     "holdId": 123,
     "payer": {...},
     "backUrls": {...}
   }
   ```
5. Backend devuelve preferencia de MP
6. Usuario completa pago
7. Webhook confirma y genera tickets

---

## 📝 CHECKLIST PARA EL BACKEND

### Verificar que el backend:

- [ ] **POST /api/payments/create-preference** acepta `holdId` (no `orderId`)
- [ ] **POST /api/test-payments/simulate-payment** acepta `holdId` (no `orderId`)
- [ ] Valida que el hold existe y pertenece al usuario
- [ ] Puede obtener los items y total del hold
- [ ] Crea la ORDER internamente cuando es necesario
- [ ] El webhook puede asociar el pago con el hold/orden correcto

---

## ⚠️ MIGRACIÓN NECESARIA

Si el backend **requiere** el endpoint `/api/orders`, hay dos opciones:

### Opción 1: Backend Acepta holdId (RECOMENDADO - YA IMPLEMENTADO)

El backend modifica sus endpoints para aceptar `holdId` en lugar de `orderId`. Esta es la solución que implementé en el frontend.

### Opción 2: Agregar Endpoint /api/orders al Backend

Si prefieres mantener la separación orden/hold, el backend debe implementar:

```javascript
// Backend - routes/orders.routes.js
router.post('/orders', authMiddleware, createOrderFromHold);

// Backend - controllers/orders.controller.js
async function createOrderFromHold(req, res) {
  const { holdId } = req.body;
  const userId = req.user.id;
  
  // 1. Verificar hold
  const hold = await Hold.findOne({
    where: { id: holdId, userId },
    include: [{ model: HoldItem }]
  });
  
  if (!hold) {
    return res.status(404).json({ error: 'Hold no encontrado' });
  }
  
  // 2. Crear orden
  const order = await Order.create({
    userId,
    showId: hold.showId,
    totalCents: hold.totalCents,
    status: 'PENDING'
  });
  
  // 3. Transferir items
  for (const item of hold.items) {
    await OrderItem.create({
      orderId: order.id,
      sectionId: item.sectionId,
      quantity: item.quantity,
      priceCents: item.priceCents
    });
  }
  
  // 4. Devolver orden
  res.json(order);
}
```

Pero **NO es necesario** si el backend puede manejar `holdId` directamente en los endpoints de pago.

---

## ✅ ESTADO ACTUAL

**Frontend:** ✅ Actualizado para usar `holdId`
- `handleMercadoPagoPayment` usa `holdId`
- `handleSimulatePayment` usa `holdId`
- `backUrls` incluyen `holdId`

**Backend:** ⚠️ Debe verificar que acepta `holdId`
- `POST /api/payments/create-preference`
- `POST /api/test-payments/simulate-payment`

---

## 🎯 PRÓXIMO PASO

**Probar de nuevo:**

1. Ir a `/checkout/:holdId`
2. Click en **"🧪 Simular Pago (Testing)"**
3. Ver Network tab (F12):
   ```
   POST /api/test-payments/simulate-payment
   Body: { "holdId": 123, ... }
   Status: ???
   Response: ???
   ```

4. **Si funciona:** ✅ Todo listo
5. **Si falla:** Verificar que el backend acepta `holdId`

---

**¡El frontend está actualizado! Ahora verifica que el backend acepte `holdId` en lugar de `orderId`.** 🚀
