# ✅ VERIFICACIÓN COMPLETA - Implementación MercadoPago Checkout Pro

## 🎯 CHECKLIST SEGÚN GUÍA OFICIAL

### 1️⃣ Cuenta y Credenciales de MercadoPago

#### ✅ Frontend (.env):
```env
VITE_MP_PUBLIC_KEY=TEST-cd8c0ed6-9f60-4d85-aded-f92655e8b5db
```
**Estado:** ✅ Configurado (pero NO se usa porque eliminamos Wallet Brick)

#### ⚠️ Backend:
**Necesita en BD o .env:**
```
MP_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
```

**¿Cómo verificar?**
```bash
# Desde Postman/Thunder Client:
GET http://localhost:3000/api/payment-config/mercadopago
Authorization: Bearer <ADMIN_TOKEN>

# Debe devolver:
{
  "provider": "mercadopago",
  "active": true,
  "accessToken": "TEST-***" // Enmascarado
}
```

**Si NO está configurado:**
1. Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Ir a "Tus aplicaciones" → Seleccionar tu app
3. Copiar el **Access Token de TEST**
4. Configurarlo en el backend:
   ```bash
   POST http://localhost:3000/api/payment-config/mercadopago
   Authorization: Bearer <ADMIN_TOKEN>
   Body: {
     "accessToken": "TEST-1234...",
     "publicKey": "TEST-cd8c...",
     "isSandbox": true,
     "isActive": true
   }
   ```

---

### 2️⃣ SDK de MercadoPago

#### ❌ Frontend:
**NO necesita SDK** (eliminamos Wallet Brick)

#### ⚠️ Backend:

**Debe tener instalado:**
```bash
cd backend
npm install mercadopago
```

**Debe estar configurado en el código:**
```javascript
// backend/services/mercadoPagoService.js (o similar)
const mercadopago = require('mercadopago');

// Configurar con Access Token desde BD
mercadopago.configure({
  access_token: accessToken // Obtenido desde BD
});
```

**¿Cómo verificar?**
```bash
# Ver package.json del backend:
cat backend/package.json | grep mercadopago

# Debe aparecer:
"mercadopago": "^1.5.15" (o versión similar)
```

**Si NO está instalado:**
```bash
cd backend
npm install mercadopago
npm install mercadopago@latest
```

---

### 3️⃣ Crear Preferencia de Pago

#### ✅ Frontend:
Ya implementado en `Checkout.jsx`:
```javascript
const preferenceData = {
  holdId: parseInt(holdId),
  payer: {
    name: "Juan",
    surname: "Pérez",
    email: "test@example.com",
    phone: "12345678",
    areaCode: "11",
    idType: "DNI",
    idNumber: "12345678"
  },
  backUrls: {
    success: "http://localhost:5173/payment/success?holdId=123",
    failure: "http://localhost:5173/payment/failure?holdId=123",
    pending: "http://localhost:5173/payment/pending?holdId=123"
  }
};

const preference = await paymentsApi.createPaymentPreference(preferenceData);
```

#### ⚠️ Backend:

**Endpoint:** `POST /api/payments/create-preference`

**Debe implementar:**
```javascript
// backend/controllers/paymentsController.js (o similar)
async function createPaymentPreference(req, res) {
  try {
    const { holdId, payer, backUrls } = req.body;
    
    // 1. Obtener hold y sus items
    const hold = await Hold.findByPk(holdId, {
      include: [{ model: HoldItem }]
    });
    
    if (!hold) {
      return res.status(404).json({ error: 'Hold no encontrado' });
    }
    
    // 2. Preparar items para MercadoPago
    const items = hold.items.map(item => ({
      title: `Ticket ${item.sectionName || 'General'}`,
      quantity: item.quantity,
      currency_id: 'ARS',
      unit_price: item.priceCents / 100 // MP usa decimales, no centavos
    }));
    
    // 3. Crear preferencia con SDK de MercadoPago
    const preference = {
      items: items,
      payer: {
        name: payer.name,
        surname: payer.surname,
        email: payer.email,
        phone: {
          area_code: payer.areaCode,
          number: payer.phone
        },
        identification: {
          type: payer.idType,
          number: payer.idNumber
        }
      },
      back_urls: {
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending
      },
      auto_return: 'approved',
      external_reference: `hold-${holdId}`, // Para identificar en webhook
      notification_url: `${process.env.WEBHOOK_BASE_URL}/api/payments/webhook`
    };
    
    // 4. Configurar SDK con Access Token
    const accessToken = await getAccessTokenFromDB(); // Tu función
    mercadopago.configure({ access_token: accessToken });
    
    // 5. Crear preferencia
    const response = await mercadopago.preferences.create(preference);
    
    // 6. Devolver init_point
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
    
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ error: 'Error al crear preferencia de pago' });
  }
}
```

**¿Cómo verificar?**
```bash
# Probar el endpoint:
POST http://localhost:3000/api/payments/create-preference
Authorization: Bearer <USER_TOKEN>
Body: {
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

# Debe devolver:
{
  "id": "123456-abc-xyz",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

**Si da error:**
- Verificar que el Access Token esté configurado
- Verificar que el SDK esté instalado
- Verificar que los items tengan `unit_price` en decimales (no centavos)

---

### 4️⃣ Botón de Checkout Pro

#### ✅ Frontend:
Ya implementado en `Checkout.jsx`:
```javascript
// Línea ~314
if (initPoint) {
  message.success('Redirigiendo a Mercado Pago...', 1);
  setTimeout(() => {
    window.location.href = initPoint; // ✅ Redirige a MP
  }, 1000);
}
```

**Estado:** ✅ Completo

---

### 5️⃣ Webhooks/Notificaciones

#### ⚠️ Backend:

**Endpoint:** `POST /api/payments/webhook`

**Debe implementar:**
```javascript
// backend/controllers/paymentsController.js
async function handleWebhook(req, res) {
  try {
    const { type, data } = req.body;
    
    console.log('📨 Webhook recibido:', type, data);
    
    // Solo procesar notificaciones de pago
    if (type === 'payment') {
      const paymentId = data.id;
      
      // 1. Obtener detalles del pago desde MercadoPago
      const accessToken = await getAccessTokenFromDB();
      mercadopago.configure({ access_token: accessToken });
      
      const payment = await mercadopago.payment.get(paymentId);
      
      console.log('💳 Pago obtenido:', payment.body);
      
      // 2. Extraer external_reference (holdId)
      const externalRef = payment.body.external_reference; // "hold-123"
      const holdId = externalRef.split('-')[1]; // "123"
      
      // 3. Verificar estado del pago
      if (payment.body.status === 'approved') {
        console.log('✅ Pago aprobado');
        
        // 4. Buscar el hold
        const hold = await Hold.findByPk(holdId, {
          include: [{ model: HoldItem }]
        });
        
        if (!hold) {
          console.error('❌ Hold no encontrado:', holdId);
          return res.sendStatus(200); // Responder OK igual
        }
        
        // 5. Crear ORDER
        const order = await Order.create({
          userId: hold.userId,
          showId: hold.showId,
          totalCents: hold.totalCents,
          status: 'CONFIRMED',
          paymentId: paymentId,
          paymentStatus: 'approved'
        });
        
        // 6. Transferir items del hold a la orden
        for (const item of hold.items) {
          await OrderItem.create({
            orderId: order.id,
            sectionId: item.sectionId,
            quantity: item.quantity,
            priceCents: item.priceCents
          });
        }
        
        // 7. Generar tickets
        const tickets = await generateTicketsForOrder(order);
        
        // 8. Enviar email
        await sendConfirmationEmail(hold.userId, tickets);
        
        // 9. Eliminar hold
        await hold.destroy();
        
        console.log('🎫 Tickets generados:', tickets.length);
      }
    }
    
    // Siempre responder 200 OK
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.sendStatus(200); // Responder OK igual para que MP no reintente
  }
}
```

#### ⚠️ Configuración en MercadoPago:

**Necesitas ngrok:**
```bash
# Terminal separada:
ngrok http 3000

# Copiar la URL: https://xxxx.ngrok-free.app
```

**Configurar en MercadoPago:**
1. Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Ir a "Tus aplicaciones" → Tu app → "Webhooks"
3. Agregar URL: `https://xxxx.ngrok-free.app/api/payments/webhook`
4. Seleccionar eventos: `payment`, `merchant_orders`

**Verificar que llega:**
```bash
# Abrir en navegador:
http://127.0.0.1:4040

# Aquí verás todas las requests que lleguen al webhook
```

---

## 🎯 RESUMEN DE LO QUE NECESITAS VERIFICAR/ARREGLAR

### Frontend:
- ✅ Checkout.jsx redirige a init_point
- ✅ Envía preferenceData al backend
- ✅ Páginas de success/failure/pending

### Backend:

#### 1. Credenciales:
```bash
# Verificar:
GET /api/payment-config/mercadopago

# Si no está, configurar:
POST /api/payment-config/mercadopago
Body: { accessToken: "TEST-...", publicKey: "TEST-...", isSandbox: true }
```

#### 2. SDK:
```bash
cd backend
npm install mercadopago
```

#### 3. Endpoint de preferencia:
```javascript
POST /api/payments/create-preference
// Debe devolver init_point
```

#### 4. Webhook:
```javascript
POST /api/payments/webhook
// Debe procesar payment, crear ORDER, generar tickets
```

#### 5. ngrok:
```bash
ngrok http 3000
# Configurar URL en panel de MP
```

---

## 🧪 PRUEBA COMPLETA

### Paso 1: Verificar credenciales
```bash
GET /api/payment-config/mercadopago
# Debe devolver active: true
```

### Paso 2: Probar creación de preferencia
```bash
POST /api/payments/create-preference
# Debe devolver init_point
```

### Paso 3: Probar flujo completo
1. Ir a checkout
2. Click "Pagar"
3. Redirige a mercadopago.com.ar
4. Ingresar tarjeta TEST
5. Pagar
6. Webhook llega al backend
7. Tickets se generan
8. Redirige a /payment/success

---

## 📋 CHECKLIST FINAL

- [ ] Backend tiene SDK de MP instalado
- [ ] Credenciales TEST configuradas en BD
- [ ] Endpoint POST /api/payments/create-preference funciona
- [ ] Devuelve init_point correctamente
- [ ] Endpoint POST /api/payments/webhook implementado
- [ ] ngrok corriendo
- [ ] Webhook configurado en panel de MP
- [ ] Flujo completo probado con tarjeta TEST

---

## 🚨 SI ALGO FALLA

### Error: "No se pudo obtener la URL de pago"
**Causa:** Backend no devuelve init_point
**Solución:** Verificar implementación del endpoint de preferencia

### Error: "Credenciales inválidas"
**Causa:** Access Token incorrecto o expirado
**Solución:** Obtener nuevo token desde panel de MP

### Error: "Webhook no llega"
**Causa:** URL incorrecta o ngrok no está corriendo
**Solución:** Verificar URL en panel de MP y que ngrok esté activo

---

**Con esta verificación completa podés asegurar que MercadoPago está 100% integrado.** 🚀
