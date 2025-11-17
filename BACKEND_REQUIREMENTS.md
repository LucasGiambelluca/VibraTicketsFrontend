# 🎯 REQUISITOS DEL BACKEND - MercadoPago Checkout Pro

## 📋 LO QUE EL BACKEND NECESITA PARA QUE FUNCIONE

### 1. SDK de MercadoPago Instalado

```bash
cd backend
npm install mercadopago
```

Verificar en `package.json`:
```json
{
  "dependencies": {
    "mercadopago": "^1.5.15"
  }
}
```

---

### 2. Access Token (Credenciales) Configurado

**Obtener desde MercadoPago:**
1. Ir a https://www.mercadopago.com.ar/developers/panel
2. Ir a "Tus aplicaciones" → Seleccionar tu app
3. Copiar **Access Token de TEST**

**Formato:**
```
TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
```

**Guardar en BD:**
```sql
INSERT INTO payment_config (provider, access_token, public_key, is_sandbox, is_active)
VALUES ('mercadopago', 'TEST-1234...', 'TEST-cd8c...', true, true);
```

**O en .env del backend:**
```env
MP_ACCESS_TOKEN=TEST-1234567890-123456-...
MP_PUBLIC_KEY=TEST-cd8c0ed6-9f60-4d85-aded-f92655e8b5db
MP_SANDBOX=true
```

---

### 3. Endpoint: POST /api/payments/create-preference

**Lo que recibe del frontend:**
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

**Lo que debe hacer:**

```javascript
const mercadopago = require('mercadopago');

async function createPaymentPreference(req, res) {
  try {
    const { holdId, payer, backUrls } = req.body;
    
    // 1. Obtener hold con items
    const hold = await Hold.findByPk(holdId, {
      include: [{ model: HoldItem }]
    });
    
    if (!hold) {
      return res.status(404).json({ error: 'Hold no encontrado' });
    }
    
    // Verificar que pertenece al usuario autenticado
    if (hold.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // 2. Preparar items para MercadoPago
    const items = hold.items.map(item => ({
      title: item.sectionName || 'Ticket General',
      description: `Show ID ${hold.showId}`,
      quantity: item.quantity,
      currency_id: 'ARS',
      unit_price: item.priceCents / 100 // ⚠️ MP usa decimales, NO centavos
    }));
    
    // 3. Obtener Access Token desde BD
    const config = await PaymentConfig.findOne({
      where: { provider: 'mercadopago', is_active: true }
    });
    
    if (!config) {
      return res.status(500).json({ error: 'MercadoPago no configurado' });
    }
    
    // 4. Configurar SDK
    mercadopago.configure({
      access_token: config.access_token
    });
    
    // 5. Crear preferencia
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
      external_reference: `hold-${holdId}`, // ⚠️ Importante para webhook
      notification_url: `${process.env.WEBHOOK_BASE_URL}/api/payments/webhook`,
      statement_descriptor: 'RS TICKETS',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
    };
    
    const response = await mercadopago.preferences.create(preference);
    
    // 6. Devolver init_point ⚠️ CRÍTICO
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
    
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ 
      error: 'Error al crear preferencia de pago',
      details: error.message 
    });
  }
}
```

**⚠️ LO MÁS IMPORTANTE:**
- `unit_price` en decimales (5000 centavos = 50.00)
- `external_reference` con el holdId para identificar en webhook
- Devolver `init_point` o `sandbox_init_point`

---

### 4. Endpoint: POST /api/payments/webhook

**Lo que recibe de MercadoPago:**
```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "123456789"
  },
  "date_created": "2025-11-13T20:00:00Z",
  "id": 987654321,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456789"
}
```

**Lo que debe hacer:**

```javascript
async function handleWebhook(req, res) {
  try {
    const { type, data } = req.body;
    
    console.log('📨 Webhook recibido:', { type, data });
    
    // Solo procesar pagos
    if (type !== 'payment') {
      return res.sendStatus(200);
    }
    
    const paymentId = data.id;
    
    // 1. Obtener Access Token
    const config = await PaymentConfig.findOne({
      where: { provider: 'mercadopago', is_active: true }
    });
    
    mercadopago.configure({
      access_token: config.access_token
    });
    
    // 2. Obtener detalles del pago
    const payment = await mercadopago.payment.get(paymentId);
    
    console.log('💳 Detalles del pago:', {
      id: payment.body.id,
      status: payment.body.status,
      status_detail: payment.body.status_detail,
      external_reference: payment.body.external_reference,
      transaction_amount: payment.body.transaction_amount
    });
    
    // 3. Solo procesar si está aprobado
    if (payment.body.status !== 'approved') {
      console.log('⏳ Pago no aprobado aún:', payment.body.status);
      return res.sendStatus(200);
    }
    
    // 4. Extraer holdId del external_reference
    const externalRef = payment.body.external_reference; // "hold-123"
    const holdId = parseInt(externalRef.split('-')[1]);
    
    console.log('🔍 Procesando hold:', holdId);
    
    // 5. Buscar hold
    const hold = await Hold.findByPk(holdId, {
      include: [
        { model: HoldItem },
        { model: User }
      ]
    });
    
    if (!hold) {
      console.error('❌ Hold no encontrado:', holdId);
      return res.sendStatus(200);
    }
    
    // 6. Verificar si ya se procesó
    const existingOrder = await Order.findOne({
      where: { payment_id: paymentId }
    });
    
    if (existingOrder) {
      console.log('⚠️ Pago ya procesado previamente');
      return res.sendStatus(200);
    }
    
    // 7. Crear ORDER
    const order = await Order.create({
      user_id: hold.user_id,
      show_id: hold.show_id,
      total_cents: hold.total_cents,
      status: 'CONFIRMED',
      payment_id: paymentId,
      payment_status: 'approved',
      payment_method: payment.body.payment_type_id,
      payment_date: new Date()
    });
    
    console.log('✅ Orden creada:', order.id);
    
    // 8. Transferir items del hold a order_items
    for (const holdItem of hold.items) {
      await OrderItem.create({
        order_id: order.id,
        section_id: holdItem.section_id,
        quantity: holdItem.quantity,
        price_cents: holdItem.price_cents
      });
    }
    
    // 9. Generar tickets
    const tickets = await generateTicketsForOrder(order, hold);
    
    console.log('🎫 Tickets generados:', tickets.length);
    
    // 10. Enviar email
    await sendConfirmationEmail({
      to: hold.user.email,
      name: hold.user.name,
      orderId: order.id,
      tickets: tickets,
      totalAmount: order.total_cents / 100
    });
    
    console.log('📧 Email enviado a:', hold.user.email);
    
    // 11. Eliminar hold
    await HoldItem.destroy({ where: { hold_id: holdId } });
    await hold.destroy();
    
    console.log('🗑️ Hold eliminado');
    
    // ⚠️ SIEMPRE responder 200 OK
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    // ⚠️ Responder 200 igual para que MP no reintente
    res.sendStatus(200);
  }
}
```

**⚠️ IMPORTANTE:**
- Siempre responder `200 OK`, incluso si hay error
- Verificar que el pago esté `approved`
- No procesar dos veces el mismo pago
- Usar `external_reference` para identificar el hold

---

### 5. Función: generateTicketsForOrder

```javascript
async function generateTicketsForOrder(order, hold) {
  const tickets = [];
  
  for (const orderItem of await order.getOrderItems()) {
    for (let i = 0; i < orderItem.quantity; i++) {
      // Generar QR único
      const qrCode = `TKT-${order.id}-${orderItem.section_id}-${i + 1}-${uuidv4()}`;
      
      const ticket = await Ticket.create({
        order_id: order.id,
        user_id: order.user_id,
        show_id: order.show_id,
        section_id: orderItem.section_id,
        seat_number: `GA-${i + 1}`, // O asignar asiento específico
        qr_code: qrCode,
        status: 'ISSUED',
        price_cents: orderItem.price_cents,
        issued_at: new Date()
      });
      
      tickets.push(ticket);
    }
  }
  
  return tickets;
}
```

---

### 6. Configurar ngrok (Para desarrollo)

**Terminal separada:**
```bash
ngrok http 3000
```

**Copiar URL:**
```
https://xxxx-xxx-xxx-xxx.ngrok-free.app
```

**Configurar en panel de MercadoPago:**
1. https://www.mercadopago.com.ar/developers/panel
2. Tu aplicación → Webhooks
3. URL de notificación: `https://xxxx.ngrok-free.app/api/payments/webhook`
4. Eventos: `payment`, `merchant_orders`

**En el backend (.env):**
```env
WEBHOOK_BASE_URL=https://xxxx.ngrok-free.app
```

---

## 📋 CHECKLIST BACKEND

- [ ] SDK instalado: `npm install mercadopago`
- [ ] Access Token configurado en BD o .env
- [ ] Endpoint `POST /api/payments/create-preference` implementado
- [ ] Devuelve `init_point` correctamente
- [ ] `unit_price` en decimales (NO centavos)
- [ ] `external_reference` incluye el holdId
- [ ] Endpoint `POST /api/payments/webhook` implementado
- [ ] Procesa pagos aprobados
- [ ] Crea ORDER
- [ ] Genera tickets con QR único
- [ ] Envía email de confirmación
- [ ] Elimina hold después de procesar
- [ ] ngrok corriendo en desarrollo
- [ ] Webhook configurado en panel de MP
- [ ] Responde siempre 200 OK al webhook

---

## 🧪 TESTING

### 1. Probar creación de preferencia:

```bash
POST http://localhost:3000/api/payments/create-preference
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

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

**Debe devolver:**
```json
{
  "id": "123456-abc-xyz",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

### 2. Probar webhook localmente:

```bash
# Ver en:
http://127.0.0.1:4040

# Después de hacer un pago de prueba
```

---

## ⚠️ ERRORES COMUNES

### Error: "access_token inválido"
**Solución:** Verificar que el Access Token esté correcto en BD

### Error: "unit_price debe ser numérico"
**Solución:** Convertir centavos a decimales: `priceCents / 100`

### Error: Webhook no llega
**Solución:** Verificar ngrok está corriendo y URL configurada en MP

### Error: "Hold no encontrado"
**Solución:** Verificar que `external_reference` tenga formato `hold-{id}`

---

**Con estos requisitos, el backend estará 100% listo para MercadoPago.** 🚀
