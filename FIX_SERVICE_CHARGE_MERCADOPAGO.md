# 🐛 FIX: Service Charge no aparece en MercadoPago

## Fecha: 2025-11-26

---

## Problema

Cuando un usuario va a pagar con MercadoPago:
- **Frontend muestra:** Subtotal $100 + Service Charge $15 (15%) = **Total $115**
- **MercadoPago muestra:** Solo **$100** (sin el service charge)

**Resultado:** El usuario paga menos de lo que debería.

---

## Causa Raíz

### Flujo Actual (Incorrecto):

1. **Frontend (Checkout.jsx):**
   - Calcula: `subtotal = holdData.totalCents / 100`
   - Calcula: `serviceCharge = subtotal * 0.15`
   - Calcula: `total = subtotal + serviceCharge`
   - **Muestra el total correcto en la UI**

2. **Frontend (MercadoPagoButton.jsx):**
   - Crea orden con `holdId`
   - Crea preferencia de pago con `orderId`
   - **NO envía el monto total calculado**

3. **Backend:**
   - Recibe `orderId`
   - Busca la orden en la BD
   - La orden tiene `totalCents` del hold (sin service charge)
   - **Crea preferencia en MercadoPago con el monto incorrecto**

4. **MercadoPago:**
   - Muestra el monto que recibió del backend
   - **Falta el service charge**

---

## Solución Implementada

### Cambios en el Frontend:

#### 1. `MercadoPagoButton.jsx`

**Agregado parámetro `totalAmount`:**
```javascript
export default function MercadoPagoButton({ 
  holdId, 
  payer,
  totalAmount,  // ⭐ NUEVO: Monto total incluyendo service charge
  onError,
  size = 'large',
  block = true 
})
```

**Enviar `totalAmount` al backend:**
```javascript
const preferencePayload = {
  orderId: parseInt(orderId),
  payer: payerPayload,
  customerEmail: payer.email,
  customerName: `${payer.name || 'Usuario'} ${payer.surname || 'VibraTicket'}`,
  backUrls
};

// ⭐ NUEVO: Incluir totalAmount si está disponible
if (totalAmount && totalAmount > 0) {
  preferencePayload.totalAmount = totalAmount;
  console.log('✅ Enviando monto total al backend:', totalAmount);
}

const response = await paymentsApi.createPaymentPreference(preferencePayload, true);
```

#### 2. `Checkout.jsx`

**Pasar `total` al componente:**
```javascript
<MercadoPagoButton
  holdId={holdId}
  payer={getPayerInfo()}
  totalAmount={total}  // ⭐ NUEVO: Pasar el total calculado (con service charge)
  onError={handlePaymentError}
/>
```

---

## Cambios Requeridos en el Backend

El backend debe modificar el endpoint `POST /api/payments/create-preference` para:

### 1. Aceptar el campo `totalAmount`

```javascript
// routes/payments.js
router.post('/payments/create-preference', async (req, res) => {
  try {
    const { orderId, payer, backUrls, totalAmount } = req.body;
    
    // Obtener orden de la BD
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // ⭐ USAR totalAmount si está disponible, sino usar order.totalCents
    const amountToCharge = totalAmount 
      ? Math.round(totalAmount * 100) // Convertir a centavos
      : order.totalCents;
    
    console.log('💰 Monto a cobrar:', {
      totalAmount,
      orderTotalCents: order.totalCents,
      finalAmount: amountToCharge / 100
    });
    
    // Crear preferencia en MercadoPago
    const preference = {
      items: [{
        title: `Orden #${orderId}`,
        quantity: 1,
        unit_price: amountToCharge / 100, // ⭐ Usar el monto correcto
        currency_id: 'ARS'
      }],
      payer: {
        name: payer.name || payer.first_name,
        surname: payer.surname || payer.last_name,
        email: payer.email,
        // ... resto de campos
      },
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: String(orderId),
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
    };
    
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });
    
    const response = await mercadopago.preferences.create(preference);
    
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
    
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ error: 'Error al crear preferencia de pago' });
  }
});
```

### 2. Actualizar la orden con el monto correcto

Opcionalmente, el backend puede actualizar el `totalCents` de la orden para reflejar el service charge:

```javascript
// Actualizar orden con el monto correcto
if (totalAmount && totalAmount > 0) {
  await order.update({
    totalCents: Math.round(totalAmount * 100)
  });
}
```

---

## Flujo Corregido

### 1. Frontend (Checkout.jsx):
```
Subtotal: $100 (del hold)
Service Charge: $15 (15%)
Total: $115 ✅
```

### 2. Frontend (MercadoPagoButton.jsx):
```javascript
// Envía al backend:
{
  orderId: 123,
  totalAmount: 115,  // ⭐ Incluye service charge
  payer: { ... },
  backUrls: { ... }
}
```

### 3. Backend:
```javascript
// Recibe totalAmount = 115
// Crea preferencia con unit_price = 115
```

### 4. MercadoPago:
```
Muestra: $115 ✅ (correcto)
```

---

## Testing

### Test 1: Verificar que se envía el totalAmount

1. Abrir DevTools → Network
2. Ir al checkout
3. Hacer clic en "Pagar con Mercado Pago"
4. Buscar la request a `/api/payments/create-preference`
5. Verificar en el payload:
   ```json
   {
     "orderId": 123,
     "totalAmount": 115,  // ⭐ Debe estar presente
     "payer": { ... }
   }
   ```

### Test 2: Verificar monto en MercadoPago

1. Completar el flujo hasta MercadoPago
2. Verificar que el monto mostrado sea: **$115** (no $100)
3. Completar el pago
4. Verificar que el webhook reciba el monto correcto

### Test 3: Verificar logs del backend

```bash
# En el backend, agregar logs:
console.log('💰 Monto recibido del frontend:', totalAmount);
console.log('💰 Monto de la orden:', order.totalCents / 100);
console.log('💰 Monto final a cobrar:', amountToCharge / 100);
```

---

## Cálculo del Service Charge

### Frontend (Checkout.jsx):

```javascript
const calculateTotals = () => {
  if (!holdData) {
    return { subtotal: 0, serviceCharge: 0, total: 0 };
  }
  
  const totalCents = holdData.totalCents || holdData.total_cents || 0;
  
  if (!totalCents) {
    return { subtotal: 0, serviceCharge: 0, total: 0 };
  }
  
  const subtotal = totalCents / 100;
  const serviceCharge = Math.round(subtotal * 0.15);  // 15%
  const total = subtotal + serviceCharge;
  
  return { subtotal, serviceCharge, total };
};
```

**Ejemplo:**
- Hold totalCents: 10000 (centavos)
- Subtotal: 10000 / 100 = $100
- Service Charge: Math.round(100 * 0.15) = $15
- Total: 100 + 15 = **$115**

---

## Alternativa: Calcular Service Charge en el Backend

Si prefieres que el backend calcule el service charge:

```javascript
// Backend: routes/payments.js
const calculateServiceCharge = (subtotal) => {
  return Math.round(subtotal * 0.15); // 15%
};

router.post('/payments/create-preference', async (req, res) => {
  const order = await Order.findByPk(orderId);
  
  const subtotal = order.totalCents / 100;
  const serviceCharge = calculateServiceCharge(subtotal);
  const total = subtotal + serviceCharge;
  
  // Usar 'total' al crear la preferencia
  const preference = {
    items: [{
      title: `Orden #${orderId}`,
      quantity: 1,
      unit_price: total,  // ⭐ Total con service charge
      currency_id: 'ARS'
    }],
    // ...
  };
});
```

**Ventaja:** Centraliza la lógica en el backend  
**Desventaja:** El frontend y backend deben estar sincronizados

---

## Estado Actual

### ✅ Frontend:
- `MercadoPagoButton` acepta `totalAmount`
- `Checkout` pasa el `total` calculado (con service charge)
- Logs agregados para debugging

### ⏳ Backend:
- Necesita aceptar el campo `totalAmount`
- Necesita usar `totalAmount` al crear la preferencia
- Opcional: Actualizar la orden con el monto correcto

---

## Próximos Pasos

1. **Backend Team:** Implementar los cambios en el endpoint
2. **Testing:** Verificar que MercadoPago muestre el monto correcto
3. **Validar:** Que el webhook procese el monto correcto
4. **Documentar:** El cálculo del service charge en la documentación

---

**Prioridad:** 🔴 Alta - Afecta el monto cobrado a los usuarios  
**Responsable:** Backend Team + Frontend (ya implementado)  
**Estado:** Frontend ✅ | Backend ⏳
