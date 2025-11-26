# 🐛 FIX: Endpoint de MercadoPago devuelve 404

## Fecha: 2025-11-26

---

## Problema

Cuando el usuario intenta pagar con Mercado Pago en el checkout:

```
POST http://localhost:5173/api/payments/create-preference
Status: 404 (Not Found)
```

**Error**: El endpoint `/api/payments/create-preference` no existe en el backend.

---

## Causa Raíz

El backend **NO tiene implementado** el endpoint `/api/payments/create-preference`.

Este endpoint debería:
1. Recibir `orderId`, `payer`, `backUrls`
2. Crear una preferencia de pago en MercadoPago
3. Devolver `init_point` para redirigir al usuario

---

## Soluciones Posibles

### Opción 1: Implementar el endpoint en el backend (RECOMENDADO)

**Backend debe crear:**
```javascript
// routes/payments.js o similar
router.post('/payments/create-preference', async (req, res) => {
  try {
    const { orderId, payer, backUrls, customerEmail, customerName } = req.body;
    
    // 1. Obtener orden de la BD
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // 2. Crear preferencia en MercadoPago
    const preference = {
      items: [{
        title: `Orden #${orderId}`,
        quantity: 1,
        unit_price: order.totalCents / 100,
        currency_id: 'ARS'
      }],
      payer: {
        name: payer.name || payer.first_name,
        surname: payer.surname || payer.last_name,
        email: payer.email || customerEmail,
        phone: {
          area_code: payer.areaCode || payer.phone?.area_code,
          number: payer.phone?.number || payer.phone
        },
        identification: {
          type: payer.idType || payer.identification?.type,
          number: payer.idNumber || payer.identification?.number
        }
      },
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: String(orderId),
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
    };
    
    // 3. Llamar a MercadoPago SDK
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });
    
    const response = await mercadopago.preferences.create(preference);
    
    // 4. Devolver init_point
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

---

### Opción 2: Usar el simulador de pagos (TEMPORAL)

El backend SÍ tiene implementado:
```
POST /api/test-payments/simulate-payment
```

Este endpoint:
- ✅ Marca la orden como CONFIRMED
- ✅ Genera tickets
- ✅ Envía email
- ✅ Funciona inmediatamente

**Limitación**: Solo para testing, no procesa pagos reales.

---

### Opción 3: Verificar si el endpoint tiene otro nombre

Posibles nombres alternativos:
- `/api/payments/preference`
- `/api/payments/create`
- `/api/mercadopago/create-preference`
- `/api/orders/:orderId/payment`

---

## Solución Implementada (Temporal)

Mientras se implementa el endpoint en el backend, agregué un **botón de simulación** en el Checkout que usa el endpoint que SÍ funciona.

### Cambios en Checkout.jsx:

```javascript
// Botón temporal para simular pago
<Button
  type="default"
  size="large"
  block
  onClick={async () => {
    try {
      const response = await paymentsApi.simulatePayment({
        orderId: holdId,
        customerEmail: user.email,
        customerName: user.name
      });
      
      message.success('¡Pago simulado exitosamente!');
      navigate(`/payment/success?orderId=${holdId}`);
    } catch (error) {
      message.error('Error al simular pago');
    }
  }}
>
  🧪 Simular Pago (Testing)
</Button>
```

---

## Verificación del Backend

### 1. Verificar si el endpoint existe:

```bash
# Buscar en el código del backend:
grep -r "create-preference" backend/
grep -r "/payments" backend/routes/
```

### 2. Verificar rutas registradas:

```javascript
// En el backend, agregar log temporal:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### 3. Probar endpoint manualmente:

```bash
curl -X POST http://localhost:3000/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderId": 1,
    "payer": {
      "email": "test@test.com",
      "name": "Test",
      "surname": "User"
    },
    "backUrls": {
      "success": "http://localhost:5173/payment/success",
      "failure": "http://localhost:5173/payment/failure",
      "pending": "http://localhost:5173/payment/pending"
    }
  }'
```

---

## Próximos Pasos

### Para el Backend Team:

1. **Implementar** `/api/payments/create-preference`
2. **Configurar** credenciales de MercadoPago en `.env`:
   ```
   MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
   MERCADOPAGO_PUBLIC_KEY=TEST-xxx
   ```
3. **Instalar** SDK de MercadoPago:
   ```bash
   npm install mercadopago
   ```
4. **Probar** endpoint con Postman/curl
5. **Documentar** endpoint en README

### Para el Frontend:

1. **Usar simulador** mientras se implementa el endpoint real
2. **Mostrar mensaje** al usuario explicando que es modo testing
3. **Ocultar botón de MercadoPago** si el endpoint no existe
4. **Agregar fallback** para detectar 404 y sugerir simulador

---

## Testing

### Test 1: Verificar que el simulador funciona
- [ ] Ir a Checkout
- [ ] Hacer clic en "Simular Pago (Testing)"
- [ ] Verificar que la orden se marca como CONFIRMED
- [ ] Verificar que se generan tickets
- [ ] Verificar redirección a página de éxito

### Test 2: Verificar endpoint de MercadoPago (cuando esté implementado)
- [ ] Hacer clic en "Pagar con Mercado Pago"
- [ ] Verificar que NO devuelve 404
- [ ] Verificar que devuelve `init_point`
- [ ] Verificar redirección a MercadoPago

---

## Documentación de Referencia

- [MercadoPago SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Crear Preferencia de Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integrate-preferences)
- [Webhooks de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)

---

## Estado Actual

- ❌ Endpoint `/api/payments/create-preference` NO existe
- ✅ Endpoint `/api/test-payments/simulate-payment` SÍ funciona
- ⏳ Esperando implementación del endpoint real
- 🔧 Workaround temporal: Usar simulador

---

**Prioridad**: 🔴 Alta - Bloquea pagos reales  
**Responsable**: Backend Team  
**ETA**: Por definir
