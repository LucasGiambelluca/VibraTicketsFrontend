# ✅ CHECKLIST RÁPIDO - Testing MercadoPago

## 🎯 OBJETIVO
Probar el flujo de pago real (no simulación) y debuggear problemas comunes.

---

## 📋 VERIFICACIÓN INICIAL (5 minutos)

### 1. Backend y ngrok ✅
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: ngrok
ngrok http 3000
# Copiar URL: https://xxxx.ngrok-free.app
```

### 2. Verificar Credenciales de MP ✅
```bash
# Desde Postman/Thunder Client:
GET http://localhost:3000/api/payment-config/mercadopago
Authorization: Bearer <ADMIN_TOKEN>

# Debe devolver:
{
  "provider": "mercadopago",
  "active": true,          # ⭐ DEBE SER TRUE
  "accessToken": "TEST-***",
  "publicKey": "TEST-***"
}
```

### 3. Probar Conexión con MP ✅
```bash
POST http://localhost:3000/api/payment-config/mercadopago/test
Authorization: Bearer <ADMIN_TOKEN>

# Debe devolver:
{
  "ok": true,
  "message": "Conexión exitosa"
}
```

**Si falla:** Credenciales incorrectas o token expirado.

---

## 🧪 FLUJO DE TESTING

### PASO 1: Preparar Usuario
- ✅ Usuario autenticado
- ✅ Pasar por la cola virtual → `hasAccess: true`

```bash
# Verificar acceso a la cola:
GET http://localhost:3000/api/queue/9/position
Authorization: Bearer <USER_TOKEN>

# Debe devolver:
{
  "position": 1,
  "hasAccess": true,       # ⭐ DEBE SER TRUE
  "accessToken": "uuid-xyz"
}
```

### PASO 2: Seleccionar Asientos
1. Ir a `/shows/9`
2. Seleccionar asientos
3. Click en "Reservar"
4. Se crea un HOLD (reserva temporal)

### PASO 3: Ir al Checkout
1. Redirige a `/checkout/:holdId`
2. Ver resumen de compra
3. Tiempo restante: 15 minutos

### PASO 4: Opción A - Simulador (Solo Dev)

Click en **"🧪 Simular Pago (Testing)"**

**Si FUNCIONA:**
- ✅ Orden marcada como CONFIRMED
- ✅ Tickets generados
- ✅ Email enviado
- ✅ Redirige a `/payment/success`

**Si FALLA:**

Abrir **Network tab** (F12):
```
Request: POST /api/test-payments/simulate-payment
Status: ???
Response: ???
```

**Errores comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| 404 | Orden no encontrada | Crear orden primero |
| 403 | Sin acceso de cola | Pasar por cola virtual |
| 409 | Hold expirado | Volver a seleccionar asientos |
| 500 | Error del backend | Ver logs del backend |

### PASO 5: Opción B - Pago Real

1. Llenar formulario:
   ```
   Nombre: Juan
   Apellido: Pérez
   Email: test_user@testuser.com
   Teléfono: 12345678
   DNI: 12345678
   ```

2. Click en **"Pagar $XXX"**

3. **Caso A:** Aparece botón de MercadoPago en la página
   - Click en el botón
   - Seleccionar medio de pago
   - Usar tarjeta de prueba: **5031 7557 3453 0604**
   - Vencimiento: 11/25
   - CVV: 123
   - Nombre: APRO
   - Completar pago

4. **Caso B:** Redirige a MercadoPago
   - Completar pago allí
   - MP redirige a `/payment/success`

---

## 🔍 DEBUGGING

### Ver webhook en ngrok:
```
http://127.0.0.1:4040

# Debe aparecer:
POST /api/payments/webhook → 200 OK
```

**Si webhook falla:**

| Status | Causa | Solución |
|--------|-------|----------|
| 401/403 | Firma inválida | Usar pago real (no curl) |
| 404 | URL incorrecta | Verificar config en panel MP |
| 500 | Error backend | Ver logs del backend |

---

## 📞 INFORMACIÓN PARA DEBUGGEAR

**Por favor, envía:**

1. **Respuesta de "Probar Conexión":**
   ```bash
   POST /api/payment-config/mercadopago/test
   Respuesta: ???
   ```

2. **Response del Simulador:**
   ```bash
   Network tab (F12)
   POST /api/test-payments/simulate-payment
   Status: ???
   Body: ???
   ```

3. **Estado del webhook:**
   ```
   http://127.0.0.1:4040
   ¿Aparece POST /webhook?
   ¿Qué status?
   ```

4. **Logs del backend** cuando haces el pago

---

## 🎯 TARJETAS DE PRUEBA

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| Visa APRO | 5031 7557 3453 0604 | ✅ Aprobado |
| Mastercard APRO | 5031 4332 1540 6351 | ✅ Aprobado |
| Visa OTOR | 4509 9535 6623 3704 | ⏳ Pendiente |

**Datos adicionales:**
- Vencimiento: 11/25
- CVV: 123
- Nombre: APRO
- DNI: 12345678

---

## ✅ CHECKLIST FINAL

**Antes de probar:**
- [ ] Backend corriendo
- [ ] ngrok corriendo
- [ ] `active: true` en MP
- [ ] Webhook configurado
- [ ] Usuario con `hasAccess: true`

**Durante:**
- [ ] Seleccionar asientos → HOLD
- [ ] Ir a Checkout
- [ ] Probar simulador O pago real
- [ ] Verificar webhook en ngrok
- [ ] Ver redirección a success

**Después:**
- [ ] Orden CONFIRMED
- [ ] Tickets generados
- [ ] Email recibido

---

**¡Listo para probar!** 🚀

**Lee `FLUJO_MERCADOPAGO_REAL.md` para guía completa y detallada.**
