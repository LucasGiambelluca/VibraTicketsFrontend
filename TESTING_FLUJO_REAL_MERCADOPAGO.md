# 💳 TESTING: Flujo Real de MercadoPago (Modo TEST)

## 🎯 OBJETIVO
Probar el flujo COMPLETO de MercadoPago (con formulario de tarjeta incluido) usando credenciales de TEST.

---

## ✅ CONFIGURACIÓN ACTUAL

### Frontend (.env)
```
VITE_MP_PUBLIC_KEY=TEST-cd8c0ed6-9f60-4d85-aded-f92655e8b5db
```
✅ Configurado correctamente en modo TEST

### SDK MercadoPago (index.html)
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```
✅ Ya está cargado

### Wallet Brick (Checkout.jsx)
```javascript
// Líneas 100-169: Inicialización del Wallet Brick
✅ Ya está implementado
```

---

## 🚀 CÓMO PROBAR EL FLUJO REAL

### PASO 1: Asegurar que el Backend acepta `holdId`

El backend debe tener este endpoint:
```javascript
POST /api/payments/create-preference
Body: {
  holdId: 123,
  payer: {...},
  backUrls: {...}
}
```

**Verificar:**
1. El backend está corriendo
2. Las credenciales de MP están configuradas en la BD
3. El backend está en modo TEST/Sandbox

---

### PASO 2: Ir al Checkout con un Hold válido

1. Seleccionar asientos en un show
2. Crear un HOLD (reserva temporal)
3. Redirige automáticamente a `/checkout/:holdId`

**O navegar manualmente:**
```
http://localhost:5173/checkout/123
```
(Donde 123 es un holdId válido)

---

### PASO 3: Llenar el Formulario

En la página de Checkout, completar:

```
Nombre:     Juan
Apellido:   Pérez
Email:      test_user_123@testuser.com
Teléfono:   12345678
Cód. Área:  11
DNI:        12345678
```

⚠️ **IMPORTANTE:** El email debe ser de un **usuario de prueba de MercadoPago**, no tu email real.

---

### PASO 4: Click en el Botón AZUL "Pagar $XXX"

```
🔒 [Pagar $10,500]  ← Este botón (azul con candado)
```

**NO uses el botón naranja "🧪 Simular Pago"**

---

### PASO 5: Ver Carga de la Preferencia

Deberías ver:
```
⏳ Creando preferencia de pago...
```

**Abrir Network tab (F12):**
```
POST http://localhost:3000/api/payments/create-preference
Request: { holdId: 123, payer: {...}, backUrls: {...} }
Status: 200 OK
Response: {
  "id": "123456-abc-xyz",
  "init_point": "https://www.mercadopago.com.ar/checkout/...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/..."
}
```

**Si da 404 o 400:** El backend no acepta `holdId` correctamente.

---

### PASO 6: Aparece el Botón de MercadoPago

Después de crear la preferencia, deberías ver:

```
┌──────────────────────────────────────────────┐
│ ✅ Completa tu pago con Mercado Pago         │
│ Listo, elegí tu medio de pago y finalizá     │
│ la compra con Checkout Pro.                  │
├──────────────────────────────────────────────┤
│                                              │
│       💳 MERCADO PAGO                        │
│                                              │
│    [Pagar con Mercado Pago]  ← ESTE BOTÓN   │
│                                              │
└──────────────────────────────────────────────┘
```

**Si NO aparece:**
- Abrir consola (F12)
- Buscar errores rojos
- Verificar: `console.log(window.MercadoPago)` → debe existir
- Verificar: `console.log(import.meta.env.VITE_MP_PUBLIC_KEY)` → debe mostrar la key

---

### PASO 7: Click en el Botón de MercadoPago

```
Usuario hace click → [Pagar con Mercado Pago]
```

**Se abre un MODAL (Wallet Brick) en la misma página:**

```
┌─────────────────────────────────────────────────────┐
│ 💳 Mercado Pago                              [X]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Total a pagar: $10,500                              │
│                                                      │
│ Elegí cómo pagar:                                   │
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ ● Tarjetas                               │       │
│ │                                          │       │
│ │   [Agregar nueva tarjeta]  ← CLICK AQUÍ │       │
│ │                                          │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### PASO 8: Ingresar Tarjeta de Prueba

Después de hacer click en "Agregar nueva tarjeta":

```
┌─────────────────────────────────────────────────────┐
│ 💳 Nueva tarjeta                                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Número de tarjeta:                                  │
│ [5031 7557 3453 0604]  ← Visa APRO                 │
│                                                      │
│ Nombre y apellido:                                  │
│ [APRO]  ← Debe ser APRO para que apruebe           │
│                                                      │
│ Vencimiento:       CVV:                             │
│ [11/25]           [123]  ← Cualquier futuro + 123   │
│                                                      │
│ Documento:                                          │
│ DNI  [12345678]  ← Mismo DNI del formulario        │
│                                                      │
│                                  [Pagar]            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**⚠️ DATOS DE PRUEBA:**

| Campo | Valor | Notas |
|-------|-------|-------|
| Número | 5031 7557 3453 0604 | Visa APRO (aprobada) |
| Nombre | APRO | Debe ser APRO |
| Vencimiento | 11/25 | Cualquier fecha futura |
| CVV | 123 | Cualquier 3 dígitos |
| DNI | 12345678 | El mismo del formulario |

**Otras tarjetas de prueba:**

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| Mastercard APRO | 5031 4332 1540 6351 | ✅ Aprobada |
| Visa OTOR | 4509 9535 6623 3704 | ⏳ Pendiente |
| Mastercard CONT | 5031 7557 3453 0604 | 📞 Llamar para autorizar |

---

### PASO 9: Click en "Pagar"

MercadoPago procesa el pago:
```
⏳ Procesando pago...
```

**Si la tarjeta es APRO (aprobada):**
```
✅ Pago aprobado
```

**MercadoPago envía webhook al backend:**
```
POST https://xxxx.ngrok-free.app/api/payments/webhook
Body: {
  type: "payment",
  data: { id: "123456789" }
}
```

**Backend procesa:**
1. Busca el hold asociado
2. Crea ORDER (si no existe)
3. Marca orden como CONFIRMED
4. Genera tickets
5. Envía email

---

### PASO 10: Redirección al Éxito

MercadoPago redirige a:
```
http://localhost:5173/payment/success?holdId=123&payment_id=123456789
```

Deberías ver:
```
┌─────────────────────────────────────────────────────┐
│ ✅ ¡Pago exitoso!                                   │
│                                                      │
│ Tu compra fue procesada correctamente.              │
│ Recibirás tus tickets por email.                   │
│                                                      │
│ 🎫 Tickets generados: 3                             │
│ 📧 Enviado a: test_user_123@testuser.com           │
│                                                      │
│ [Ver mis tickets]                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 DEBUGGING

### Problema 1: No aparece el botón de MercadoPago

**Verificar en consola (F12):**
```javascript
console.log(window.MercadoPago); // ¿undefined?
console.log(import.meta.env.VITE_MP_PUBLIC_KEY); // ¿undefined?
```

**Causas:**
- ❌ SDK no se cargó → Verificar `index.html`
- ❌ Public Key vacía → Verificar `.env`
- ❌ Error al crear preferencia → Ver Network tab

**Solución:**
```bash
# Reiniciar el servidor de desarrollo
npm run dev
```

---

### Problema 2: Modal de MP no se abre

**Verificar en consola:**
```
Wallet Brick error: ...
```

**Causas:**
- ❌ Preference ID inválido
- ❌ Public Key incorrecta
- ❌ Problema de red con MP

**Solución:**
- Verificar que el backend devuelve un `preferenceId` válido
- Verificar que la Public Key es de TEST

---

### Problema 3: El pago se rechaza

**Si usaste APRO y se rechazó:**
- Verificar que el nombre sea exactamente "APRO"
- Verificar que el DNI sea 12345678
- Verificar que la fecha no esté vencida

**Para probar rechazo:**
- Usar tarjeta 5031 7557 3453 0604 con nombre "CONT"
- O usar tarjeta con nombre diferente a APRO/OTOR

---

### Problema 4: Webhook no llega

**Verificar:**
1. ngrok está corriendo: `ngrok http 3000`
2. URL configurada en panel de MP
3. Ver en `http://127.0.0.1:4040` si llegó el POST

**Si no llega:**
- Hacer el pago nuevamente
- MP puede tardar hasta 30 segundos
- Verificar configuración de webhooks en panel de MP

---

## 📊 FLUJO COMPLETO - RESUMEN

```
1. Usuario → Checkout → Llenar formulario
   ↓
2. Click "Pagar $XXX" (botón azul)
   ↓
3. Frontend → POST /api/payments/create-preference
   ↓
4. Backend → Crea preferencia en MP → Devuelve preferenceId
   ↓
5. Frontend → Inicializa Wallet Brick → Aparece botón de MP
   ↓
6. Usuario → Click botón de MP → Modal se abre
   ↓
7. Usuario → Ingresa tarjeta TEST (5031 7557 3453 0604)
   ↓
8. Usuario → Click "Pagar"
   ↓
9. MP → Procesa pago → Aprueba (APRO)
   ↓
10. MP → Envía webhook → Backend procesa
   ↓
11. Backend → Crea orden → Genera tickets → Envía email
   ↓
12. MP → Redirige a /payment/success
   ↓
13. Usuario → Ve tickets ✅
```

---

## ✅ CHECKLIST

**Antes de probar:**
- [ ] Backend corriendo
- [ ] Credenciales TEST en BD del backend
- [ ] ngrok corriendo (para webhook)
- [ ] Frontend corriendo
- [ ] Hold válido creado

**Durante la prueba:**
- [ ] Formulario completado
- [ ] Click en botón AZUL "Pagar $XXX"
- [ ] Aparece botón de MercadoPago
- [ ] Modal de MP se abre
- [ ] Ingreso tarjeta TEST: 5031 7557 3453 0604
- [ ] Nombre: APRO
- [ ] Click "Pagar"
- [ ] Webhook llega (ver ngrok)
- [ ] Redirige a /payment/success
- [ ] Tickets generados

**Después:**
- [ ] Verificar orden en BD (status: CONFIRMED)
- [ ] Verificar tickets en BD
- [ ] Verificar email recibido

---

## 🎯 PRÓXIMO PASO

**¡Probá ahora!**

1. Asegurate que el backend esté corriendo
2. Asegurate que ngrok esté corriendo
3. Ve a un show y selecciona asientos
4. En Checkout, usa el botón **AZUL** "Pagar $XXX"
5. Cuando aparezca el botón de MercadoPago, hace click
6. Ingresá la tarjeta de prueba: **5031 7557 3453 0604**

**¡Y vas a ver el flujo COMPLETO en acción!** 🚀💳
