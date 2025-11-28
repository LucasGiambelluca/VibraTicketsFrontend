# ✅ FRONTEND CORREGIDO - Envío de Código de Descuento

## 🔧 Cambios Realizados

### Problema Identificado por el Backend:

1. ❌ El código de descuento NO estaba llegando al crear la orden
2. ❌ Se estaba enviando `discountAmount` a la preferencia (que no se usa)
3. ❌ Se estaba enviando `totalAmount` a la preferencia (que no se usa)

### Solución Implementada:

#### 1. ✅ Código de Descuento en Orden (POST /api/orders)

**Antes:**
```javascript
const createOrderPayload = { 
  holdId: parseInt(holdId)
};

if (discountCode) {
  createOrderPayload.discountCode = discountCode;  // Solo camelCase
}
```

**Ahora:**
```javascript
const createOrderPayload = { 
  holdId: parseInt(holdId)
};

if (discountCode && discountCode.trim()) {
  const codeFormatted = discountCode.trim().toUpperCase();
  createOrderPayload.discountCode = codeFormatted;   // camelCase
  createOrderPayload.discount_code = codeFormatted;  // snake_case ✅
  console.log('✅ Código agregado:', codeFormatted);
}
```

**Cambios:**
- ✅ Trim y uppercase automático
- ✅ Envía en AMBOS formatos (camelCase y snake_case)
- ✅ Validación de string vacío
- ✅ Log detallado para debugging

#### 2. ✅ Preferencia de Pago Limpia (POST /api/payments/create-preference)

**Antes:**
```javascript
const preferencePayload = {
  orderId: parseInt(orderId),
  payer: payerPayload,
  customerEmail: payer.email,
  backUrls,
  discountAmount: Math.round(discountAmount * 100),  // ❌ NO SE USA
  totalAmount: totalAmount,                           // ❌ NO SE USA
  totalCents: Math.round(totalAmount * 100)          // ❌ NO SE USA
};
```

**Ahora:**
```javascript
const preferencePayload = {
  orderId: parseInt(orderId),
  payer: payerPayload,
  customerEmail: payer.email,
  customerName: `${payer.name} ${payer.surname}`,
  backUrls
  // ✅ Solo estos campos
  // ✅ El backend lee el descuento desde la orden
};
```

**Cambios:**
- ❌ Eliminado `discountAmount`
- ❌ Eliminado `totalAmount`
- ❌ Eliminado `totalCents`
- ✅ Solo envía lo necesario
- ✅ Backend calcula el total automáticamente desde la orden

---

## 🧪 Cómo Verificar

### Paso 1: Limpiar caché y recargar
```bash
# En el navegador:
1. Ctrl + Shift + Delete → Limpiar caché
2. F5 → Recargar página
```

### Paso 2: Aplicar descuento y ver logs

Al hacer una compra con descuento, deberías ver en la consola:

```
💰 DESCUENTO - discountCode: VERANO20
💰 DESCUENTO - discountAmount: 41.40

📦 Payload para crear orden:
{
  "holdId": 123,
  "discountCode": "VERANO20",    ✅ camelCase
  "discount_code": "VERANO20"    ✅ snake_case
}

📥 Respuesta del backend al crear orden:
- orderId: 72
- totalCents: 30360              ✅ CON descuento (no 34500)
- discount: {
    code: "VERANO20",
    amount: 4140
  }
```

### Paso 3: Verificar en Network

1. Abre DevTools (F12)
2. Ve a Network tab
3. Busca la request a `/api/orders`
4. Verifica que el Request Payload incluya:
   ```json
   {
     "holdId": 123,
     "discountCode": "VERANO20",
     "discount_code": "VERANO20"
   }
   ```

5. Busca la request a `/api/payments/create-preference`
6. Verifica que el Request Payload NO incluya:
   - ❌ `discountAmount`
   - ❌ `totalAmount`
   - ❌ `totalCents`

---

## 📊 Flujo Correcto

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuario aplica código "VERANO20"                │
│    - Frontend valida: POST /api/discount-codes/validate│
│    - Muestra: -$41.40 en UI                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Usuario hace clic en "Pagar con MP"             │
│    - Frontend envía: POST /api/orders              │
│    {                                                │
│      "holdId": 123,                                │
│      "discountCode": "VERANO20",   ✅              │
│      "discount_code": "VERANO20"   ✅              │
│    }                                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Backend crea orden CON descuento                │
│    - Valida código                                 │
│    - Calcula descuento: 4140 centavos             │
│    - Total: 34500 - 4140 = 30360 centavos        │
│    - Guarda en BD: discount_code_id, discount_amount│
│    - Responde: { orderId: 72, totalCents: 30360 } │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Frontend crea preferencia de MP                 │
│    - Frontend envía: POST /api/payments/create-preference│
│    {                                                │
│      "orderId": 72,        ✅                      │
│      "payer": {...},       ✅                      │
│      "backUrls": {...}     ✅                      │
│    }                                               │
│    - NO envía discountAmount ✅                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. Backend lee orden desde BD                      │
│    - Lee discount_code_id y discount_amount        │
│    - Lee total_cents: 30360                        │
│    - Crea preferencia MP con $303.60              │
│    - Responde: { initPoint: "https://..." }       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. Usuario redirigido a Mercado Pago               │
│    - Total a pagar: $303.60 ✅                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Resultado Esperado

### Antes del fix:
```
Frontend: $303.60 ✅
Backend:  $345.00 ❌ (sin descuento)
MP:       $345.00 ❌
```

### Después del fix:
```
Frontend: $303.60 ✅
Backend:  $303.60 ✅ (con descuento)
MP:       $303.60 ✅
```

---

## 🎯 Puntos Clave

1. ✅ El código de descuento se envía al **crear la orden**, no en la preferencia
2. ✅ Se envía en ambos formatos (camelCase y snake_case) para compatibilidad
3. ✅ El código se convierte a mayúsculas y se hace trim automáticamente
4. ✅ La preferencia NO incluye `discountAmount` ni `totalAmount`
5. ✅ El backend lee el descuento desde la orden en la BD
6. ✅ Mercado Pago recibe el monto correcto automáticamente

---

## 🚨 Si Todavía No Funciona

Si después de estos cambios el descuento aún no se aplica:

### Verificar en la consola:
```
📥 Respuesta del backend al crear orden:
- totalCents: ?????
```

- **Si es 34500** → El backend NO está aplicando el descuento
- **Si es 30360** → ✅ El descuento se aplicó correctamente

### Verificar en la BD:
```sql
SELECT 
  id, 
  hold_id,
  discount_code_id, 
  discount_amount, 
  total_cents,
  status
FROM orders 
WHERE id = 72;
```

- **discount_code_id debe ser NULL** → Backend no recibió el código
- **discount_code_id debe tener un valor** → ✅ Se aplicó

### Verificar logs del backend:
El backend debería mostrar:
```
Received discount_code: VERANO20
Validating discount code...
Discount applied: 4140 centavos
Order created with discount
```

---

## 📁 Archivos Modificados

- ✅ `src/components/MercadoPagoButton.jsx`
  - Envía código en ambos formatos al crear orden
  - Eliminado `discountAmount` de preferencia
  - Eliminado `totalAmount` de preferencia
  - Logs detallados para debugging

---

**Frontend completamente corregido** ✅  
**Esperando confirmación del backend** ⏳
