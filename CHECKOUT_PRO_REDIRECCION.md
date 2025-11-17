# ✅ CHECKOUT PRO - Redirección Directa a MercadoPago

## 🎯 CAMBIO IMPLEMENTADO

Ahora el checkout **siempre redirige directamente a la página completa de MercadoPago** (Checkout Pro), en lugar de usar el modal/Wallet Brick.

---

## 🔄 FLUJO ACTUAL

```
1. Usuario completa formulario en Checkout
   ↓
2. Click en "Pagar $XXX"
   ↓
3. Frontend crea preferencia de pago
   POST /api/payments/create-preference
   ↓
4. Backend devuelve init_point (URL de MercadoPago)
   {
     "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
   }
   ↓
5. ✅ REDIRIGE DIRECTAMENTE a esa URL
   window.location.href = init_point
   ↓
6. Usuario ingresa tarjeta EN LA PÁGINA DE MERCADOPAGO
   ↓
7. MercadoPago procesa el pago
   ↓
8. MercadoPago redirige de vuelta a tu sitio:
   - Éxito: /payment/success?holdId=123
   - Falla: /payment/failure?holdId=123
   - Pendiente: /payment/pending?holdId=123
```

---

## 🎨 EXPERIENCIA DE USUARIO

### ANTES (Wallet Brick - Modal):
```
Tu sitio → Click "Pagar" → Aparece botón MP → Click botón → Modal MP
→ Usuario queda en tu sitio
```

### AHORA (Checkout Pro - Redirección):
```
Tu sitio → Click "Pagar" → Redirecciona a mercadopago.com
→ Usuario va a la página completa de MP
```

---

## 💳 PÁGINA DE MERCADOPAGO

Cuando redirige, el usuario verá:

```
URL: https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...

┌─────────────────────────────────────────────────────┐
│ 💳 Mercado Pago                                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Estás pagando $10,500 a VibraTicket                │
│                                                      │
│ 🎨 Elegí cómo pagar:                                │
│                                                      │
│ ● Tarjetas de crédito o débito                     │
│ ○ Dinero en Mercado Pago                           │
│ ○ Efectivo                                          │
│ ○ Transferencia bancaria                           │
│                                                      │
│ ─────────────────────────────────────────           │
│                                                      │
│ Número de tarjeta:                                  │
│ [____-____-____-____]                               │
│                                                      │
│ Nombre y apellido:                                  │
│ [_______________]                                   │
│                                                      │
│ Vencimiento:  [__/__]    CVV: [___]                │
│                                                      │
│ Documento: DNI  [________]                          │
│                                                      │
│                                  [Pagar $10,500]    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 TESTING

### Tarjeta de Prueba:
```
Número:     5031 7557 3453 0604
Nombre:     APRO
Vencimiento: 11/25
CVV:        123
DNI:        12345678
```

### Flujo Completo:

1. **En tu sitio:**
   - Ir a `/checkout/:holdId`
   - Completar formulario (nombre, email, DNI, etc.)
   - Click en "🔒 Pagar $XXX"

2. **Aparece mensaje:**
   ```
   ⏳ Creando preferencia de pago...
   ↓
   ✅ Redirigiendo a Mercado Pago...
   ```

3. **Redirige a MercadoPago:**
   - La URL cambia a `mercadopago.com.ar/checkout/...`
   - Aparece la página completa de MercadoPago

4. **Ingresar tarjeta de prueba:**
   - Número: 5031 7557 3453 0604
   - Nombre: APRO
   - Vencimiento: 11/25
   - CVV: 123
   - DNI: 12345678

5. **Click "Pagar":**
   - MercadoPago procesa
   - Aprueba el pago (tarjeta APRO)
   - Envía webhook a tu backend

6. **Redirige de vuelta:**
   - URL: `http://localhost:5173/payment/success?holdId=123&payment_id=...`
   - Tu sitio muestra página de éxito
   - Backend ya generó los tickets (via webhook)

---

## 🔧 CÓDIGO MODIFICADO

### Checkout.jsx - handleMercadoPagoPayment()

**ANTES:**
```javascript
// Intentaba usar Wallet Brick (modal)
if (prefId && publicKey && window.MercadoPago) {
  setPreferenceId(prefId);
  // Cargaba el modal...
}
```

**AHORA:**
```javascript
// Siempre redirige directamente
const initPoint = preference?.init_point || preference?.initPoint;

if (initPoint) {
  message.success('Redirigiendo a Mercado Pago...', 1);
  setTimeout(() => {
    window.location.href = initPoint;
  }, 1000);
}
```

### Estados eliminados:
```javascript
// ❌ Ya no se usan:
const [preferenceId, setPreferenceId] = useState(null);
const [walletReady, setWalletReady] = useState(false);
const [walletError, setWalletError] = useState(null);
const walletControllerRef = useRef(null);
```

### useEffect de Wallet Brick:
```javascript
// ❌ Eliminado completamente
useEffect(() => {
  // Código del Wallet Brick...
}, [preferenceId]);
```

---

## 📦 BACKEND - LO QUE DEBE DEVOLVER

### POST /api/payments/create-preference

**Request:**
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

**Response NECESARIA:**
```json
{
  "id": "123456-abc-xyz",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

**⚠️ IMPORTANTE:** El backend DEBE devolver `init_point` o `sandbox_init_point` (en modo TEST).

---

## 🐛 DEBUGGING

### Problema: No redirige

**Verificar en consola (F12):**
```javascript
// Al hacer click en "Pagar", ver la response:
POST /api/payments/create-preference
Response: {
  "init_point": "..."  // ¿Existe este campo?
}
```

**Si NO existe `init_point`:**
- El backend no está creando la preferencia correctamente
- Verificar credenciales de MercadoPago en el backend
- Verificar que el backend está en modo TEST

### Problema: Redirige pero da error en MP

**Causas comunes:**
- Credenciales incorrectas (Access Token inválido)
- Hold expiró
- El backend no tiene las credenciales configuradas
- URL de webhook incorrecta

**Solución:**
1. Verificar credenciales en backend BD
2. Crear un hold nuevo
3. Verificar endpoint: `POST /api/payment-config/mercadopago/test`

### Problema: Pago se aprueba pero no genera tickets

**Causa:** Webhook no está llegando al backend

**Verificar:**
1. ngrok está corriendo: `ngrok http 3000`
2. URL del webhook configurada en panel de MP
3. Ver en `http://127.0.0.1:4040` si llegó el POST

---

## ✅ VENTAJAS DE CHECKOUT PRO (Redirección)

1. **Más simple:** No necesita SDK de MercadoPago en el frontend
2. **Más confiable:** Menos posibilidades de error de configuración
3. **Más seguro:** Todo el flujo de pago está en servidores de MP
4. **Más medios de pago:** Efectivo, transferencia, etc.
5. **Mejor UX en mobile:** La página de MP está optimizada

---

## ⚠️ DESVENTAJAS

1. **Usuario sale de tu sitio:** Puede generar desconfianza
2. **Menos control de UX:** No podés customizar la página de MP
3. **Requiere redirecciones:** Más pasos en el flujo

---

## 🎯 CHECKLIST PARA PROBAR

- [ ] Backend corriendo
- [ ] ngrok corriendo (`ngrok http 3000`)
- [ ] Credenciales TEST configuradas en BD
- [ ] Webhook configurado en panel de MP
- [ ] Crear hold válido
- [ ] Ir a `/checkout/:holdId`
- [ ] Completar formulario
- [ ] Click "🔒 Pagar $XXX"
- [ ] Ver mensaje "Redirigiendo a Mercado Pago..."
- [ ] **Verificar que la URL cambia a mercadopago.com.ar**
- [ ] Ingresar tarjeta TEST en la página de MP
- [ ] Click "Pagar" en MP
- [ ] **Verificar que redirige de vuelta a tu sitio**
- [ ] Ver `/payment/success` con tickets generados

---

## 📝 ARCHIVOS MODIFICADOS

- ✅ `src/pages/Checkout.jsx`
  - Eliminado Wallet Brick (modal)
  - Ahora siempre redirige a `init_point`
  - Eliminados estados innecesarios

---

## 🚀 PRÓXIMO PASO

**¡Probá ahora!**

1. Asegurate que el backend esté corriendo
2. Ve a `/checkout/:holdId`
3. Click en "Pagar $XXX"
4. **Deberías ver que la URL cambia a `mercadopago.com.ar`**
5. Ingresar tarjeta: **5031 7557 3453 0604**
6. ¡Ver el flujo completo! 🚀

---

**Si NO redirige:** Enviame la response del endpoint `/api/payments/create-preference` desde el Network tab.
