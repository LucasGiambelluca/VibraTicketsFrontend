# 🔧 FIX URGENTE: Descuentos no se aplican en Backend

## ❌ Problema Actual

**El frontend envía correctamente el código de descuento, pero el backend NO lo está aplicando al crear la orden.**

### Evidencia:
```
Frontend envía:
POST /api/orders
{
  "holdId": 123,
  "discountCode": "CODIGO12"  ✅ Se envía correctamente
}

Backend responde:
{
  "orderId": 456,
  "totalCents": 34500,  ❌ SIN descuento aplicado
  "subtotalCents": 30000
}

Resultado:
- Frontend muestra: $303.60 (correcto)
- Mercado Pago cobra: $345.00 (incorrecto)
```

---

## ✅ Solución Requerida en Backend

### Archivo a Modificar:
**`controllers/orders.controller.js`** (o similar donde se crea la orden)

### Cambios Necesarios:

```javascript
// POST /api/orders
async createOrder(req, res) {
  try {
    const { holdId, discountCode } = req.body;  // ✅ Recibir discountCode
    const userId = req.user.id;

    // 1. Obtener el hold
    const hold = await Hold.findOne({
      where: { id: holdId, customer_id: userId }
    });

    if (!hold) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hold no encontrado' 
      });
    }

    // 2. Calcular totales base
    const subtotalCents = hold.total_cents;  // Ej: 30000 (3 tickets × 100)
    const serviceChargeCents = Math.round(subtotalCents * 0.15);  // 4500 (15%)
    let totalCents = subtotalCents + serviceChargeCents;  // 34500

    // 3. ⚠️ AQUÍ ESTÁ EL FIX - Aplicar descuento si existe
    let discountAmount = 0;
    let discountDetails = null;

    if (discountCode) {
      try {
        // Validar el código de descuento
        const discountValidation = await validateDiscountCode({
          code: discountCode,
          orderTotal: totalCents,  // Total ANTES del descuento
          eventId: hold.event_id,
          showId: hold.show_id,
          userId: userId
        });

        if (discountValidation.success && discountValidation.discount) {
          // Aplicar el descuento al total
          discountAmount = discountValidation.discount.discountAmount;
          totalCents = totalCents - discountAmount;  // ✅ Restar descuento

          discountDetails = {
            code: discountCode,
            amount: discountAmount,
            type: discountValidation.discount.type,
            value: discountValidation.discount.value
          };

          console.log('✅ Descuento aplicado:', {
            original: subtotalCents + serviceChargeCents,
            discount: discountAmount,
            final: totalCents
          });
        } else {
          console.warn('⚠️ Código de descuento inválido:', discountCode);
          // Continuar sin descuento pero no fallar
        }
      } catch (error) {
        console.error('❌ Error validando descuento:', error);
        // Continuar sin descuento
      }
    }

    // 4. Crear la orden con el total CORRECTO
    const order = await Order.create({
      hold_id: holdId,
      customer_id: userId,
      event_id: hold.event_id,
      show_id: hold.show_id,
      subtotal_cents: subtotalCents,
      service_charge_cents: serviceChargeCents,
      discount_code: discountCode || null,
      discount_amount_cents: discountAmount,
      total_cents: totalCents,  // ✅ Total CON descuento
      status: 'PENDING',
      currency: 'ARS'
    });

    // 5. Crear tickets asociados
    const holdSeats = await HoldSeat.findAll({
      where: { hold_id: holdId }
    });

    for (const holdSeat of holdSeats) {
      await Ticket.create({
        order_id: order.id,
        seat_id: holdSeat.seat_id,
        section_id: holdSeat.section_id,
        price_cents: holdSeat.price_cents,
        status: 'PENDING'
      });
    }

    // 6. Marcar hold como usado
    await hold.update({ status: 'CONVERTED' });

    // 7. Retornar respuesta con descuento aplicado
    return res.status(201).json({
      success: true,
      orderId: order.id,
      subtotalCents: subtotalCents,
      serviceChargeCents: serviceChargeCents,
      discountAmountCents: discountAmount,
      totalCents: totalCents,  // ✅ Total CON descuento
      discount: discountDetails,
      status: 'PENDING',
      message: 'Order created. Proceed to payment.'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al crear la orden' 
    });
  }
}
```

---

## 🔧 Función de Validación de Descuento

Si no existe, crear en **`services/discountCodes.service.js`**:

```javascript
async function validateDiscountCode({ code, orderTotal, eventId, showId, userId }) {
  try {
    // 1. Buscar el código en la BD
    const discountCode = await DiscountCode.findOne({
      where: { 
        code: code.toUpperCase(),
        is_active: true
      }
    });

    if (!discountCode) {
      return { 
        success: false, 
        message: 'Código de descuento no válido o expirado',
        code: 'INVALID_DISCOUNT_CODE'
      };
    }

    // 2. Verificar expiración
    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return { success: false, message: 'El código aún no es válido' };
    }
    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return { success: false, message: 'El código ha expirado' };
    }

    // 3. Verificar monto mínimo
    if (discountCode.minimum_purchase_amount && orderTotal < discountCode.minimum_purchase_amount) {
      const minAmount = (discountCode.minimum_purchase_amount / 100).toFixed(2);
      return { 
        success: false, 
        message: `Monto mínimo de compra: $${minAmount}`,
        code: 'MINIMUM_PURCHASE_NOT_MET'
      };
    }

    // 4. Verificar límite de usos total
    if (discountCode.usage_limit) {
      const totalUses = await Order.count({
        where: { 
          discount_code: code.toUpperCase(),
          status: { [Op.ne]: 'CANCELLED' }
        }
      });
      
      if (totalUses >= discountCode.usage_limit) {
        return { 
          success: false, 
          message: 'Este código ha alcanzado su límite de usos',
          code: 'CODE_USAGE_LIMIT_REACHED'
        };
      }
    }

    // 5. Verificar límite por usuario
    if (discountCode.usage_limit_per_user && userId) {
      const userUses = await Order.count({
        where: { 
          discount_code: code.toUpperCase(),
          customer_id: userId,
          status: { [Op.ne]: 'CANCELLED' }
        }
      });
      
      if (userUses >= discountCode.usage_limit_per_user) {
        return { 
          success: false, 
          message: 'Ya has utilizado este código anteriormente',
          code: 'USER_USAGE_LIMIT_REACHED'
        };
      }
    }

    // 6. Calcular el monto del descuento
    let discountAmount = 0;
    
    if (discountCode.discount_type === 'PERCENTAGE') {
      discountAmount = Math.round((orderTotal * discountCode.discount_value) / 100);
      
      // Aplicar tope máximo si existe
      if (discountCode.maximum_discount_amount && discountAmount > discountCode.maximum_discount_amount) {
        discountAmount = discountCode.maximum_discount_amount;
      }
    } else if (discountCode.discount_type === 'FIXED_AMOUNT') {
      discountAmount = discountCode.discount_value;
      
      // No puede ser mayor al total
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
      }
    }

    // 7. Incrementar contador de usos
    await discountCode.increment('usage_count');

    // 8. Retornar descuento válido
    return {
      success: true,
      discount: {
        id: discountCode.id,
        code: discountCode.code,
        description: discountCode.description,
        type: discountCode.discount_type,
        value: discountCode.discount_value,
        displayValue: discountCode.discount_type === 'PERCENTAGE' 
          ? `${discountCode.discount_value}%` 
          : `$${(discountCode.discount_value / 100).toFixed(2)}`,
        discountAmount: discountAmount,
        originalTotal: orderTotal,
        finalTotal: orderTotal - discountAmount,
        savings: discountAmount,
        savingsPercentage: ((discountAmount / orderTotal) * 100).toFixed(2)
      }
    };

  } catch (error) {
    console.error('Error validating discount code:', error);
    return { 
      success: false, 
      message: 'Error al validar el código de descuento' 
    };
  }
}

module.exports = { validateDiscountCode };
```

---

## 📊 Campos de Base de Datos

Asegurarse que la tabla `orders` tenga estos campos:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_charge_cents INTEGER DEFAULT 0;
```

---

## 🧪 Testing

### Caso de Prueba:

**Input:**
```json
POST /api/orders
{
  "holdId": 123,
  "discountCode": "VERANO12"
}
```

**Expected Output:**
```json
{
  "success": true,
  "orderId": 456,
  "subtotalCents": 30000,
  "serviceChargeCents": 4500,
  "discountAmountCents": 4140,
  "totalCents": 30360,  ✅ CON descuento (no 34500)
  "discount": {
    "code": "VERANO12",
    "amount": 4140,
    "type": "PERCENTAGE",
    "value": 12
  }
}
```

**Mercado Pago debe recibir:** `$303.60` (no $345.00)

---

## ⚠️ Importante

1. **El descuento se aplica al total (subtotal + service charge)**
2. **El código debe validarse ANTES de crear la orden**
3. **Si el código es inválido, la orden se crea SIN descuento** (no debe fallar)
4. **El `totalCents` de la orden es lo que Mercado Pago cobra**
5. **Incrementar el `usage_count` del código solo si se usa**

---

## ✅ Checklist

- [ ] Recibir `discountCode` en el endpoint POST /api/orders
- [ ] Validar el código ANTES de crear la orden
- [ ] Calcular `discountAmount` según tipo (PERCENTAGE o FIXED_AMOUNT)
- [ ] Restar descuento del `totalCents`
- [ ] Guardar `discount_code` y `discount_amount_cents` en la orden
- [ ] Retornar `totalCents` CON descuento en la respuesta
- [ ] Incrementar `usage_count` del código
- [ ] Mercado Pago recibe el monto correcto

---

## 🚀 Prioridad

**URGENTE** - El frontend está funcionando perfectamente. El backend debe aplicar el descuento al crear la orden.

**Impacto:** Los clientes están pagando más de lo que deberían cuando usan códigos de descuento.

---

**Frontend Developer:** ✅ TODO CORRECTO  
**Backend Developer:** ⚠️ REQUIERE FIX URGENTE
