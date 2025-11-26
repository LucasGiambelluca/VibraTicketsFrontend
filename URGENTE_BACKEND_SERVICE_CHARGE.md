# 🚨 URGENTE: Backend debe incluir Service Charge en MercadoPago

## Fecha: 2025-11-26
## Prioridad: 🔴 CRÍTICA

---

## ❌ Problema Actual (PRODUCCIÓN)

Los usuarios están pagando **MENOS** de lo que deberían:

- **Frontend muestra:** $116 (Subtotal $100 + Service Charge $15 + $1)
- **MercadoPago cobra:** $100 (sin service charge)
- **Pérdida:** $16 por cada transacción

**Evidencia:** Ver capturas de pantalla adjuntas

---

## 🔍 Causa Raíz

### Flujo Actual (Incorrecto):

1. Frontend crea orden con `holdId`
2. Backend crea orden con `totalCents` del hold (sin service charge)
3. Frontend envía a `/api/payments/create-preference`:
   ```json
   {
     "orderId": 123,
     "totalAmount": 116,      // ✅ Frontend envía esto
     "totalCents": 11600,     // ✅ Frontend envía esto
     "amount": 116,           // ✅ Frontend envía esto
     "payer": { ... },
     "backUrls": { ... }
   }
   ```
4. **Backend IGNORA estos campos** ❌
5. Backend usa `order.totalCents` (sin service charge)
6. Backend crea preferencia en MercadoPago con monto incorrecto
7. Usuario paga menos de lo que debería

---

## ✅ Solución Requerida

### Archivo: `routes/payments.js` (o similar)

### Endpoint: `POST /api/payments/create-preference`

```javascript
router.post('/payments/create-preference', authenticateToken, async (req, res) => {
  try {
    const { 
      orderId, 
      payer, 
      backUrls,
      totalAmount,    // ⭐ NUEVO: Monto total desde frontend
      totalCents,     // ⭐ NUEVO: Monto en centavos desde frontend
      amount          // ⭐ NUEVO: Formato alternativo
    } = req.body;
    
    // Validar orderId
    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }
    
    // Obtener orden de la BD
    const order = await Order.findByPk(orderId, {
      include: [{ model: Hold, include: [{ model: Show }] }]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // ⭐ CAMBIO CRÍTICO: Usar totalCents del frontend si está disponible
    // El frontend ya calculó el service charge (15%)
    let finalAmountCents;
    
    if (totalCents && totalCents > 0) {
      // Usar el monto que envió el frontend (incluye service charge)
      finalAmountCents = totalCents;
      console.log('💰 Usando totalCents del frontend:', totalCents);
    } else if (totalAmount && totalAmount > 0) {
      // Convertir totalAmount a centavos
      finalAmountCents = Math.round(totalAmount * 100);
      console.log('💰 Usando totalAmount del frontend:', totalAmount);
    } else if (amount && amount > 0) {
      // Formato alternativo
      finalAmountCents = Math.round(amount * 100);
      console.log('💰 Usando amount del frontend:', amount);
    } else {
      // Fallback: usar el monto de la orden (sin service charge)
      finalAmountCents = order.totalCents;
      console.warn('⚠️ Usando order.totalCents (sin service charge):', order.totalCents);
    }
    
    // Convertir a pesos para MercadoPago
    const finalAmount = finalAmountCents / 100;
    
    console.log('📊 Montos:', {
      orderTotalCents: order.totalCents,
      frontendTotalCents: totalCents,
      frontendTotalAmount: totalAmount,
      finalAmountCents,
      finalAmount
    });
    
    // ⭐ OPCIONAL: Actualizar la orden con el monto correcto
    if (totalCents && totalCents !== order.totalCents) {
      await order.update({ totalCents });
      console.log('✅ Orden actualizada con monto correcto');
    }
    
    // Obtener credenciales de MercadoPago
    const mpConfig = await PaymentConfig.findOne({
      where: { provider: 'mercadopago', active: true }
    });
    
    if (!mpConfig) {
      return res.status(500).json({ 
        error: 'MercadoPago no está configurado' 
      });
    }
    
    // Configurar SDK de MercadoPago
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: mpConfig.accessToken
    });
    
    // Crear preferencia de pago
    const preference = {
      items: [{
        title: `Orden #${orderId} - ${order.Hold?.Show?.title || 'Evento'}`,
        quantity: 1,
        unit_price: finalAmount,  // ⭐ USAR EL MONTO CORRECTO
        currency_id: 'ARS'
      }],
      payer: {
        name: payer.name || payer.first_name || 'Usuario',
        surname: payer.surname || payer.last_name || 'VibraTicket',
        email: payer.email,
        phone: {
          area_code: String(payer.areaCode || payer.phone?.area_code || '11'),
          number: String(payer.phone?.number || payer.phone || '1234567890')
        },
        identification: {
          type: payer.idType || payer.identification?.type || 'DNI',
          number: String(payer.idNumber || payer.identification?.number || '12345678')
        }
      },
      back_urls: {
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending
      },
      auto_return: 'approved',
      external_reference: String(orderId),
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      statement_descriptor: 'VIBRATICKETS'
    };
    
    console.log('📦 Creando preferencia en MercadoPago:', {
      orderId,
      amount: finalAmount,
      title: preference.items[0].title
    });
    
    // Crear preferencia en MercadoPago
    const response = await mercadopago.preferences.create(preference);
    
    console.log('✅ Preferencia creada:', response.body.id);
    
    // Responder con init_point
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      // Para debugging
      amount: finalAmount,
      amountCents: finalAmountCents
    });
    
  } catch (error) {
    console.error('❌ Error creando preferencia:', error);
    res.status(500).json({ 
      error: 'Error al crear preferencia de pago',
      details: error.message 
    });
  }
});
```

---

## 🧪 Testing

### 1. Verificar que el backend recibe los campos:

Agregar log temporal al inicio del endpoint:

```javascript
console.log('📥 Payload recibido:', JSON.stringify(req.body, null, 2));
```

### 2. Probar flujo completo:

1. Frontend: Seleccionar 1 entrada de $100
2. Frontend: Calcular total = $100 + $15 (15%) = $115
3. Frontend: Enviar `totalCents: 11500` al backend
4. Backend: Usar `totalCents: 11500` para crear preferencia
5. MercadoPago: Debe mostrar **$115** ✅

### 3. Verificar en logs del backend:

```
📥 Payload recibido: {
  "orderId": 123,
  "totalAmount": 115,
  "totalCents": 11500,
  "amount": 115,
  ...
}

💰 Usando totalCents del frontend: 11500

📊 Montos: {
  "orderTotalCents": 10000,
  "frontendTotalCents": 11500,
  "finalAmountCents": 11500,
  "finalAmount": 115
}

📦 Creando preferencia en MercadoPago: {
  "orderId": 123,
  "amount": 115,
  ...
}

✅ Preferencia creada: 123456-abc-xyz
```

---

## 📊 Cálculo del Service Charge

### Frontend (Checkout.jsx):

```javascript
const calculateTotals = () => {
  const totalCents = holdData.totalCents || 0;
  const subtotal = totalCents / 100;
  const serviceCharge = Math.round(subtotal * 0.15);  // 15%
  const total = subtotal + serviceCharge;
  
  return { subtotal, serviceCharge, total };
};
```

**Ejemplo:**
- Hold: 10000 centavos = $100
- Service Charge: $100 * 0.15 = $15
- Total: $100 + $15 = **$115**
- Total en centavos: **11500**

---

## ⚠️ Importante

### 1. No cambiar el cálculo del service charge

El frontend ya está calculando el 15% correctamente. El backend solo debe **usar el monto que recibe**.

### 2. Mantener compatibilidad

El código propuesto tiene fallbacks para no romper si el frontend no envía los campos nuevos.

### 3. Actualizar la orden (opcional)

Si quieres que la orden en la BD refleje el monto correcto:

```javascript
if (totalCents && totalCents !== order.totalCents) {
  await order.update({ totalCents });
}
```

---

## 🚀 Deploy

### 1. Hacer los cambios en el backend
### 2. Probar en desarrollo
### 3. Verificar logs
### 4. Deploy a producción
### 5. Verificar que MercadoPago muestre el monto correcto

---

## 📞 Contacto

Si hay dudas sobre la implementación, revisar:
- `FIX_SERVICE_CHARGE_MERCADOPAGO.md` - Documentación completa
- `src/components/MercadoPagoButton.jsx` - Código del frontend
- `src/pages/Checkout.jsx` - Cálculo del service charge

---

## ✅ Checklist

- [ ] Backend modificado para aceptar `totalCents`
- [ ] Backend usa `totalCents` al crear preferencia
- [ ] Logs agregados para debugging
- [ ] Probado en desarrollo
- [ ] Verificado que MercadoPago muestra monto correcto
- [ ] Deploy a producción
- [ ] Verificado en producción

---

**Estado:** ⏳ Esperando implementación del backend  
**Impacto:** 🔴 CRÍTICO - Pérdida de ingresos por cada transacción  
**Tiempo estimado:** 30 minutos de desarrollo + testing
