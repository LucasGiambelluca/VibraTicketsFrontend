# 🐛 DEBUG: Descuentos no se aplican en Mercado Pago

## 📋 Problema Reportado

**Escenario:**
- 3 tickets × $100 = $300
- Service Charge (15%) = $45
- **Subtotal con cargo = $345**
- Descuento 12% = $41.40
- **Total esperado = $303.60**

**Resultado:**
- ✅ Frontend muestra: $303.60
- ❌ Mercado Pago cobra: $345

---

## 🔍 Diagnóstico

### Flujo Actual (Frontend)

1. **Usuario aplica código de descuento**
   ```
   POST /api/discount-codes/validate
   {
     "code": "CODIGO12",
     "orderTotal": 34500  // en centavos
   }
   ```

2. **Frontend muestra el descuento**
   ```
   Subtotal:           $300.00
   Service Charge:      $45.00
   Descuento:          -$41.40  ✅ Se muestra
   ─────────────────────────────
   Total:              $303.60
   ```

3. **Usuario hace clic en "Pagar con Mercado Pago"**
   ```javascript
   POST /api/orders
   {
     "holdId": 123,
     "discountCode": "CODIGO12"  ✅ Se envía
   }
   ```

4. **Backend debería:**
   - Crear la orden
   - Aplicar el descuento del código
   - Retornar `totalCents` con descuento aplicado
   - Crear preferencia de Mercado Pago con monto correcto

5. **Mercado Pago recibe:**
   ```
   ❌ $345.00 (sin descuento)
   ✅ $303.60 (con descuento) <- ESPERADO
   ```

---

## 🔧 Verificación en Consola

Agregué logs detallados. Al hacer clic en "Pagar con Mercado Pago", verás:

```
=== INICIO PROCESO DE PAGO ===
holdId recibido: 123
💰 DESCUENTO - discountCode: CODIGO12      <- Debe aparecer
💰 DESCUENTO - discountAmount: 41.40       <- Debe aparecer

📦 Payload para crear orden:
{
  "holdId": 123,
  "discountCode": "CODIGO12"  <- Debe estar presente
}

📥 Respuesta del backend al crear orden:
- orderId: 456
- totalCents: ?????  <- VERIFICAR ESTE VALOR
- subtotalCents: 30000
- discountApplied: { ... }  <- DEBE EXISTIR
- Respuesta completa: { ... }
```

### ✅ Si el backend funciona correctamente:

```json
{
  "orderId": 456,
  "totalCents": 30360,        // ✅ Con descuento aplicado
  "subtotalCents": 30000,
  "discount": {
    "code": "CODIGO12",
    "amount": 4140,            // Descuento en centavos
    "percentage": "12.00%"
  }
}
```

### ❌ Si el backend NO aplica el descuento:

```json
{
  "orderId": 456,
  "totalCents": 34500,        // ❌ Sin descuento
  "subtotalCents": 30000,
  "discount": null            // ❌ No hay descuento
}
```

---

## 🎯 Solución

### Opción 1: Verificar Backend (RECOMENDADO)

**El backend debe:**

1. **Recibir el `discountCode` en POST /api/orders**
   ```javascript
   // En el controlador de órdenes
   const { holdId, discountCode } = req.body;
   ```

2. **Validar el código de descuento**
   ```javascript
   if (discountCode) {
     const discount = await validateDiscountCode(discountCode, orderTotal);
     if (discount.success) {
       // Aplicar descuento
       totalCents = totalCents - discount.discountAmount;
     }
   }
   ```

3. **Crear la orden con el total correcto**
   ```javascript
   const order = await Order.create({
     holdId,
     totalCents,           // Ya con descuento
     discountCode,
     discountAmount
   });
   ```

4. **Crear preferencia de Mercado Pago con monto correcto**
   ```javascript
   const preference = {
     items: [{
       title: 'Entradas',
       unit_price: totalCents / 100,  // Con descuento
       quantity: 1
     }]
   };
   ```

### Opción 2: Calcular en Frontend (NO RECOMENDADO)

Si por alguna razón el backend no puede aplicar el descuento, podríamos calcular el total en el frontend:

```javascript
// En MercadoPagoButton.jsx
const finalTotalCents = Math.round((totalAmount - discountAmount) * 100);

// Enviar al crear preferencia
const preferencePayload = {
  orderId,
  totalCents: finalTotalCents,  // Total ya con descuento
  payer: payerPayload
};
```

**⚠️ PROBLEMA:** Esto no es seguro porque:
- El usuario puede manipular el frontend
- El descuento no queda registrado en la orden
- Puede haber inconsistencias entre frontend y backend

---

## 🧪 Cómo Probar

### Paso 1: Aplicar descuento
1. Abrí la consola del navegador (F12)
2. Ve al checkout
3. Aplica un código de descuento

### Paso 2: Ver logs
1. Hace clic en "Pagar con Mercado Pago"
2. En la consola busca:
   ```
   💰 DESCUENTO - discountCode: ???
   📦 Payload para crear orden: { ... }
   📥 Respuesta del backend: { ... }
   ```

### Paso 3: Verificar valores
**Valores esperados para tu ejemplo:**
- discountCode: `"CODIGO12"` (o el que uses)
- Payload incluye: `"discountCode": "CODIGO12"`
- Respuesta incluye: `"totalCents": 30360` (no 34500)

### Paso 4: Si totalCents está mal
**El problema está en el BACKEND:**
- El endpoint `POST /api/orders` no está aplicando el descuento
- Debe validar el código y restar el descuento antes de crear la orden

---

## 📊 Fórmula Correcta

```javascript
// BACKEND (en POST /api/orders)

// 1. Obtener hold
const hold = await Hold.findById(holdId);
const subtotalCents = hold.totalCents;  // 30000 (3 tickets × 100)

// 2. Calcular service charge
const serviceChargeCents = Math.round(subtotalCents * 0.15);  // 4500

// 3. Total antes de descuento
let totalCents = subtotalCents + serviceChargeCents;  // 34500

// 4. Aplicar descuento si existe
if (discountCode) {
  const discount = await validateDiscount(discountCode, totalCents);
  if (discount.valid) {
    totalCents = totalCents - discount.discountAmount;  // 34500 - 4140 = 30360
  }
}

// 5. Crear orden con total correcto
const order = await Order.create({
  holdId,
  totalCents: 30360,  // ✅ Con descuento
  discountCode,
  discountAmount: 4140
});

// 6. Mercado Pago recibe 30360 centavos = $303.60 ✅
```

---

## ✅ Checklist de Verificación

### Frontend (Ya está listo ✅)
- [x] Valida código con POST /api/discount-codes/validate
- [x] Muestra descuento en UI
- [x] Envía `discountCode` en POST /api/orders
- [x] Logs detallados en consola

### Backend (Verificar ⚠️)
- [ ] Recibe `discountCode` en POST /api/orders
- [ ] Valida el código antes de crear la orden
- [ ] Aplica descuento al `totalCents`
- [ ] Guarda `discountCode` y `discountAmount` en la orden
- [ ] Crea preferencia de MP con monto correcto
- [ ] Retorna orden con descuento aplicado

---

## 🚨 Acción Inmediata

1. **Abrí la consola del navegador**
2. **Intentá hacer una compra con descuento**
3. **Buscá estos logs:**
   ```
   💰 DESCUENTO - discountCode: ???
   📥 Respuesta del backend al crear orden:
   - totalCents: ?????
   ```
4. **Si `totalCents` NO incluye el descuento → Problema en el BACKEND**
5. **Compartí los logs conmigo para ayudarte a solucionarlo**

---

**El frontend está correcto. El problema está en el backend que no aplica el descuento al crear la orden.**
