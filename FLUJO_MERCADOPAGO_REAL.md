# 💳 FLUJO REAL DE MERCADOPAGO - Guía Completa

## 🎯 OBJETIVO
Probar el flujo completo de pago con MercadoPago en modo real (no testing), desde la selección de tickets hasta la confirmación del pago.

---

## 📋 ARQUITECTURA DE PAGOS

### Backend
- **Servicio:** `src/services/mercadoPagoService.js`
- **Credenciales:** Se cargan desde BD (NO desde `.env`)
- **Webhook URL:** `https://26fe0c500f8a.ngrok-free.app/api/payments/webhook`

### Endpoints Clave:

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/payment-config/mercadopago` | Obtener configuración actual |
| POST | `/api/payment-config/mercadopago/test` | Probar conexión |
| POST | `/api/payments/create-preference` | Crear preferencia de pago |
| POST | `/api/payments/webhook` | Recibir notificaciones de MP |
| POST | `/api/test-payments/simulate-payment` | Simular pago (solo dev) |

---

## 🔧 CONFIGURACIÓN PREVIA

### 1. Verificar Credenciales de MercadoPago

#### Desde Admin Panel:
1. Ir a **Admin Dashboard** → **Configuración** → **MercadoPago**
2. Verificar que estén configuradas:
   - ✅ **Access Token** (TEST o PRODUCTION)
   - ✅ **Public Key** (TEST o PRODUCTION)
   - ✅ **Modo Sandbox** activado (para testing)
   - ✅ **Estado** activo (`active: true`)

#### Desde API:
```bash
# Verificar configuración
GET http://localhost:3000/api/payment-config/mercadopago
Authorization: Bearer <ADMIN_TOKEN>

# Respuesta esperada:
{
  "provider": "mercadopago",
  "active": true,
  "accessToken": "TEST-***-***",  # Enmascarado
  "publicKey": "TEST-***"          # Enmascarado
}
```

### 2. Probar Conexión con MercadoPago

#### Desde Admin Panel:
1. En **MercadoPago Config** → Click en **"Probar Conexión"**
2. Debe devolver: `{ "ok": true, "message": "Conexión exitosa" }`

#### Desde API:
```bash
POST http://localhost:3000/api/payment-config/mercadopago/test
Authorization: Bearer <ADMIN_TOKEN>

# Respuesta esperada:
{
  "ok": true,
  "message": "Conexión exitosa con MercadoPago"
}
```

**⚠️ Si falla:** Verificar credenciales, permisos de la cuenta de MP, o si el token está expirado.

### 3. Verificar ngrok (Para Webhooks)

```bash
# Iniciar ngrok
ngrok http 3000

# Copiar la URL generada (ej: https://26fe0c500f8a.ngrok-free.app)
```

#### Configurar Webhook en MercadoPago:
1. Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Ir a **Tu integración** → **Webhooks**
3. Agregar:
   ```
   URL: https://26fe0c500f8a.ngrok-free.app/api/payments/webhook
   Eventos: payments, merchant_orders
   ```

#### Verificar webhooks en tiempo real:
```bash
# Abrir en navegador:
http://127.0.0.1:4040

# Aquí verás todas las requests que lleguen al webhook
```

---

## 🧪 TESTING - PASO A PASO

### PASO 1: Preparar Datos de Usuario

#### Usuario debe tener:
- ✅ Cuenta activa y autenticado
- ✅ **accessToken de cola virtual** (`hasAccess: true`)
  - Si no lo tiene: Ir a `/queue/:showId` y esperar turno
  - Verificar con: `GET /api/queue/:showId/position`
  ```json
  {
    "position": 1,
    "hasAccess": true,        // ⭐ DEBE SER TRUE
    "accessToken": "uuid-xyz"  // ⭐ DEBE EXISTIR
  }
  ```

### PASO 2: Crear HOLD (Reserva de Asientos)

1. Ir a `/shows/:showId`
2. Seleccionar asientos
3. Click en **"Reservar"**
4. Debe crear un HOLD:
   ```json
   {
     "holdId": 123,
     "items": [...],
     "totalCents": 10000,
     "expiresAt": "2025-11-13T18:00:00Z"
   }
   ```

### PASO 3: Ir al Checkout

1. Automáticamente redirige a `/checkout/:holdId`
2. Verificar que el hold se cargue correctamente
3. Ver **Resumen de Compra** con:
   - 🎫 Items seleccionados
   - 💰 Total a pagar
   - ⏱️ Tiempo restante (15 minutos)

### PASO 4: Opción A - Simular Pago (Testing)

**Solo en modo desarrollo:**

1. Click en **"🧪 Simular Pago (Testing)"**
2. Frontend llamará:
   ```bash
   POST /api/test-payments/simulate-payment
   {
     "orderId": 123,
     "customerEmail": "user@example.com",
     "customerName": "Test User"
   }
   ```
3. Backend debe:
   - ✅ Crear orden PENDING si no existe
   - ✅ Marcar orden como CONFIRMED
   - ✅ Generar tickets
   - ✅ Enviar email
   - ✅ Responder con `{ "success": true, "data": { "tickets": [...] } }`

#### ⚠️ Si el simulador falla:

**Error: "Orden no encontrada"**
- Causa: No existe una orden PENDING para ese usuario
- Solución: El checkout debe crear la orden primero (Step 3)

**Error: "Usuario no tiene acceso"**
- Causa: `hasAccess: false` en la cola
- Solución: Pasar por la cola virtual y esperar turno

**Error: "Conflicto de seats"**
- Causa: Asientos ya ocupados o hold expirado
- Solución: Volver a seleccionar asientos

**Error: "CORS" o "Failed to fetch"**
- Causa: Backend no responde
- Solución: Verificar que el backend esté corriendo

### PASO 5: Opción B - Pago Real con MercadoPago

**Flujo completo:**

1. Llenar formulario en Checkout:
   ```
   ✅ Nombre: Juan
   ✅ Apellido: Pérez
   ✅ Email: test_user_123@testuser.com
   ✅ Teléfono: (11) 12345678
   ✅ DNI: 12345678
   ```

2. Click en **"Pagar $10,000"**

3. Frontend hace:
   ```bash
   # PASO 1: Crear ORDER desde HOLD
   POST /api/orders
   {
     "holdId": 123
   }
   # Respuesta: { "id": 456, "status": "PENDING" }
   
   # PASO 2: Crear PREFERENCIA de MercadoPago
   POST /api/payments/create-preference
   {
     "orderId": 456,
     "payer": {
       "name": "Juan",
       "surname": "Pérez",
       "email": "test_user_123@testuser.com",
       "phone": "12345678",
       "areaCode": "11",
       "idType": "DNI",
       "idNumber": "12345678"
     },
     "backUrls": {
       "success": "http://localhost:5173/payment/success?orderId=456",
       "failure": "http://localhost:5173/payment/failure?orderId=456",
       "pending": "http://localhost:5173/payment/pending?orderId=456"
     }
   }
   ```

4. Backend responde con:
   ```json
   {
     "id": "123456-abc-xyz",
     "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456-abc-xyz"
   }
   ```

5. **Opción A:** Checkout Pro (Wallet Brick)
   - Si `window.MercadoPago` está disponible
   - Aparece el botón de MercadoPago en la página
   - Click en el botón → Modal de MP se abre
   - Seleccionar medio de pago
   - Completar pago

6. **Opción B:** Redirección
   - Si Wallet Brick no está disponible
   - Redirige a `init_point` de MercadoPago
   - Completar pago allí
   - MercadoPago redirige a `backUrls.success`

### PASO 6: Usar Tarjetas de Prueba

**Tarjetas de prueba de MercadoPago:**

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| **Visa APRO** | 5031 7557 3453 0604 | ✅ Aprobado |
| **Mastercard APRO** | 5031 4332 1540 6351 | ✅ Aprobado |
| **Visa OTOR** | 4509 9535 6623 3704 | ⏳ Pendiente |
| **Mastercard REJECT** | 5031 7557 3453 0604 | ❌ Rechazado |

**Datos adicionales:**
- **Vencimiento:** Cualquier fecha futura (ej: 11/25)
- **CVV:** 123
- **Nombre:** APRO (o OTOR, REJECT según el caso)
- **DNI:** 12345678

### PASO 7: Webhook Recibe Notificación

Cuando completas el pago en MercadoPago:

1. MP envía webhook a:
   ```
   POST https://26fe0c500f8a.ngrok-free.app/api/payments/webhook
   {
     "type": "payment",
     "data": {
       "id": "123456789"
     }
   }
   ```

2. Backend procesa:
   ```javascript
   // Verificar firma de MP
   // Obtener detalles del payment
   // Buscar la orden asociada
   // Marcar orden como CONFIRMED
   // Generar tickets
   // Enviar email
   // Responder 200 OK
   ```

3. Verificar en ngrok:
   ```
   http://127.0.0.1:4040
   
   # Debe aparecer:
   POST /api/payments/webhook → 200 OK
   ```

**⚠️ Si webhook falla:**

**401/403 Unauthorized:**
- Causa: Firma de MP inválida
- Solución: Verificar `verifyMercadoPagoWebhook` middleware

**404 Not Found:**
- Causa: URL del webhook incorrecta
- Solución: Verificar configuración en panel de MP

**500 Internal Error:**
- Causa: Error en el backend al procesar
- Solución: Ver logs del backend para detalles

### PASO 8: Redirección a Success/Failure

Después del pago, MercadoPago redirige a:

```
✅ Éxito:
http://localhost:5173/payment/success?orderId=456&payment_id=123456789

⏳ Pendiente:
http://localhost:5173/payment/pending?orderId=456&payment_id=123456789

❌ Fallido:
http://localhost:5173/payment/failure?orderId=456&payment_id=123456789
```

El frontend debe:
1. Extraer `orderId` de la URL
2. Consultar estado: `GET /api/payments/status/:orderId`
3. Mostrar mensaje apropiado
4. Si éxito: Mostrar tickets generados

---

## 🐛 DEBUGGING - Checklist

### Si el botón "Simular Pago (Testing)" falla:

1. ✅ Verificar que el usuario esté autenticado
2. ✅ Verificar que exista un HOLD válido
3. ✅ Verificar que el usuario tenga `hasAccess: true`
4. ✅ Abrir Network tab (F12) y ver la request:
   ```
   Request URL: http://localhost:3000/api/test-payments/simulate-payment
   Status: ???
   Response: ???
   ```
5. ✅ Ver logs del backend

### Si el pago real falla:

1. ✅ Verificar credenciales de MP: `POST /api/payment-config/mercadopago/test`
2. ✅ Verificar que `active: true`
3. ✅ Verificar que ngrok esté corriendo
4. ✅ Verificar configuración de webhook en panel de MP
5. ✅ Usar tarjeta de prueba correcta (5031 7557 3453 0604)
6. ✅ Ver logs en `http://127.0.0.1:4040` (ngrok)
7. ✅ Ver logs del backend

### Si el webhook no funciona:

1. ✅ Verificar que ngrok esté corriendo: `ngrok http 3000`
2. ✅ Copiar la URL de ngrok y actualizar en panel de MP
3. ✅ Verificar que la URL sea: `https://xxx.ngrok-free.app/api/payments/webhook`
4. ✅ Hacer un pago de prueba real (no curl manual)
5. ✅ Ver en `http://127.0.0.1:4040`:
   - ¿Llegó el POST?
   - ¿Qué status code devolvió?
   - ¿Qué headers tenía?
6. ✅ Ver logs del backend para el handler `handleWebhook`

---

## 📊 RESPUESTAS ESPERADAS

### GET /api/payment-config/mercadopago
```json
{
  "provider": "mercadopago",
  "active": true,
  "accessToken": "TEST-***",
  "publicKey": "TEST-***",
  "isSandbox": true
}
```

### POST /api/payment-config/mercadopago/test
```json
{
  "ok": true,
  "message": "Conexión exitosa"
}
```

### POST /api/test-payments/simulate-payment
```json
{
  "success": true,
  "message": "Pago simulado exitosamente",
  "data": {
    "orderId": 456,
    "status": "CONFIRMED",
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

### POST /api/payments/create-preference
```json
{
  "id": "123456-abc-xyz",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456-abc-xyz",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456-abc-xyz"
}
```

---

## ✅ CHECKLIST FINAL

### Antes de probar:
- [ ] Backend corriendo
- [ ] Frontend corriendo
- [ ] ngrok corriendo (`ngrok http 3000`)
- [ ] Credenciales de MP configuradas en BD
- [ ] `active: true` en configuración de MP
- [ ] Webhook configurado en panel de MP
- [ ] Usuario autenticado
- [ ] Usuario tiene `hasAccess: true` de la cola

### Durante la prueba:
- [ ] Seleccionar asientos
- [ ] Crear HOLD exitosamente
- [ ] Ir a Checkout
- [ ] Ver tiempo restante del HOLD
- [ ] **Opción A:** Probar simulador (dev only)
- [ ] **Opción B:** Probar pago real con tarjeta de prueba
- [ ] Verificar webhook en ngrok (`http://127.0.0.1:4040`)
- [ ] Ver redirección a página de éxito
- [ ] Verificar tickets generados

### Después de la prueba:
- [ ] Verificar orden en estado CONFIRMED
- [ ] Verificar tickets generados en BD
- [ ] Verificar email recibido
- [ ] Verificar que el HOLD se haya eliminado
- [ ] Verificar que los asientos estén ocupados

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar checklist de configuración**
2. **Probar simulador primero** (más rápido)
3. **Si simulador falla:** Ver Network tab y logs
4. **Si simulador funciona:** Probar pago real
5. **Usar tarjeta de prueba:** 5031 7557 3453 0604
6. **Verificar webhook en ngrok**
7. **Reportar resultados**

---

## 📞 INFORMACIÓN NECESARIA

Para ayudarte a debuggear, necesito:

1. **Respuesta de "Probar Conexión":**
   ```
   POST /api/payment-config/mercadopago/test
   Respuesta: ???
   ```

2. **Response de "Simular Pago (Testing)":**
   ```
   Network tab → POST /api/test-payments/simulate-payment
   Status: ???
   Response Body: ???
   ```

3. **Status del webhook en ngrok:**
   ```
   http://127.0.0.1:4040
   ¿Aparece el POST /api/payments/webhook?
   ¿Qué status devuelve?
   ```

4. **Logs del backend** cuando haces el pago

Con esta información podemos identificar exactamente dónde está el problema.

---

**¡Ahora estás listo para probar el flujo completo de MercadoPago!** 🚀💳
