# 🚀 CÓMO PROBAR EL PAGO CON MERCADOPAGO - GUÍA RÁPIDA

## ✅ EL BOTÓN YA ESTÁ LISTO

El botón "Pagar" ya está configurado para redirigir a MercadoPago. Aquí está cómo probarlo:

---

## 🎯 PASO A PASO PARA PROBAR

### PASO 1: Iniciar Backend
```bash
cd backend
npm run dev
```

**Verificar que esté corriendo:**
- Debe aparecer: `Server running on port 3000`

---

### PASO 2: Iniciar ngrok (Para webhooks)
```bash
# En otra terminal:
ngrok http 3000
```

**Copiar la URL que aparece:**
```
https://xxxx-xxx-xxx-xxx.ngrok-free.app
```

---

### PASO 3: Iniciar Frontend
```bash
cd frontend
pnpm run dev
```

**Abrir navegador:**
```
http://localhost:5173
```

---

### PASO 4: Ir al Checkout

1. **Seleccionar un evento**
2. **Seleccionar asientos** (esto crea un HOLD)
3. **Redirige automáticamente a:** `/checkout/:holdId`

---

### PASO 5: Ver el Formulario de Checkout

Verás algo así:

```
┌────────────────────────────────────────┐
│ 🎫 Checkout - Completa tu compra      │
├────────────────────────────────────────┤
│                                        │
│ 📋 Resumen de compra                   │
│ ┌────────────────────────┐            │
│ │ • 2 x General          │            │
│ │ Total: $10,500         │            │
│ └────────────────────────┘            │
│                                        │
│ 💳 Información de pago                 │
│ ┌────────────────────────┐            │
│ │ Nombre:    [Juan     ] │            │
│ │ Apellido:  [Pérez    ] │            │
│ │ Email:     [juan@... ] │            │
│ │ Teléfono:  [12345678 ] │            │
│ │ DNI:       [12345678 ] │            │
│ └────────────────────────┘            │
│                                        │
│ [Volver]                               │
│                                        │
│ 🔒 [Pagar $10,500] ← ESTE BOTÓN      │
│                                        │
└────────────────────────────────────────┘
```

---

### PASO 6: Completar el Formulario

**Llenar con datos de prueba:**
```
Nombre:     Juan
Apellido:   Pérez
Email:      test@example.com
Teléfono:   12345678
Cód. Área:  11
Tipo Doc:   DNI
Nro Doc:    12345678
```

---

### PASO 7: HACER CLICK EN "PAGAR"

**Al hacer click en el botón azul "🔒 Pagar $XXX":**

1. Verás el mensaje: `⏳ Creando preferencia de pago...`

2. Luego: `✅ Redirigiendo a Mercado Pago...`

3. **LA URL CAMBIA A:**
   ```
   https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...
   ```

4. **Verás la página completa de MercadoPago:**
   ```
   ┌─────────────────────────────────────────┐
   │ 💳 Mercado Pago                         │
   ├─────────────────────────────────────────┤
   │ Estás pagando $10,500 a RS Tickets     │
   │                                         │
   │ Elegí cómo pagar:                       │
   │ ● Tarjetas                              │
   │ ○ Efectivo                              │
   │ ○ Transferencia                         │
   │                                         │
   │ Número de tarjeta:                      │
   │ [____-____-____-____]  ← INGRESAR AQUÍ │
   │                                         │
   │ Nombre:                                 │
   │ [APRO]  ← Nombre de prueba             │
   │                                         │
   │ Vencimiento: [11/25]  CVV: [123]       │
   │ DNI: [12345678]                         │
   │                                         │
   │ [Pagar]                                 │
   └─────────────────────────────────────────┘
   ```

---

### PASO 8: Ingresar Tarjeta de Prueba

**Usar tarjeta de prueba:**
```
Número:     5031 7557 3453 0604
Nombre:     APRO
Vencimiento: 11/25
CVV:        123
DNI:        12345678
```

---

### PASO 9: Hacer Click en "Pagar"

**MercadoPago procesará:**
```
⏳ Procesando pago...
   ↓
✅ Pago aprobado
   ↓
Redirige de vuelta a tu sitio
```

---

### PASO 10: Ver Resultado

**Te redirige a:**
```
http://localhost:5173/payment/success?holdId=123&payment_id=...
```

**Verás:**
```
┌─────────────────────────────────────────┐
│ ✅ ¡Pago exitoso!                       │
│                                         │
│ Tu compra fue procesada correctamente. │
│                                         │
│ 🎫 Tickets generados                    │
│                                         │
│ [Ver mis tickets]                       │
└─────────────────────────────────────────┘
```

---

## 🐛 SI NO FUNCIONA

### Problema 1: No redirige a MercadoPago

**Abrir consola (F12) y ver:**
```javascript
// Buscar estos mensajes:
"💳 Creando preferencia de pago para hold: 123"
"✅ Preferencia creada: {...}"
"🔗 Init Point obtenido: https://..."
"🚀 Redirigiendo a: https://..."
```

**Si NO aparece "Init Point obtenido":**
- El backend NO está devolviendo `init_point`
- Verificar que el backend esté corriendo
- Verificar credenciales de MercadoPago en el backend

---

### Problema 2: Backend da error

**En Network tab (F12) buscar:**
```
POST /api/payments/create-preference
Status: ???
Response: ???
```

**Posibles errores:**

**404 Not Found:**
```
❌ El endpoint no existe en el backend
✅ Solución: Implementar el endpoint (ver BACKEND_REQUIREMENTS.md)
```

**500 Internal Server Error:**
```
❌ Error en el backend (falta SDK o credenciales)
✅ Solución: Verificar logs del backend
```

**403 Forbidden:**
```
❌ Usuario no autenticado o sin permisos
✅ Solución: Hacer login primero
```

---

### Problema 3: Webhook no procesa el pago

**Verificar en ngrok:**
```
http://127.0.0.1:4040
```

**Deberías ver:**
```
POST /api/payments/webhook
Status: 200 OK
```

**Si NO aparece:**
- ngrok no está corriendo
- URL no está configurada en panel de MercadoPago
- Backend no tiene implementado el webhook

---

## 📋 CHECKLIST RÁPIDO

Antes de probar, verificar:

- [ ] Backend corriendo (puerto 3000)
- [ ] Frontend corriendo (puerto 5173)
- [ ] ngrok corriendo
- [ ] Usuario autenticado (haz login)
- [ ] Hold creado (selecciona asientos)
- [ ] Formulario completo
- [ ] Network tab abierto (F12)

---

## 🎯 EL BOTÓN EXACTO QUE DEBES USAR

En la página de checkout verás **DOS botones**:

```
🔒 [Pagar $10,500]     ← ✅ USA ESTE (Azul, con candado)

🧪 [Simular Pago]      ← ❌ NO USES ESTE (Naranja, para testing)
```

**El botón AZUL** es el que redirige a MercadoPago.
**El botón NARANJA** es solo para testing rápido sin MercadoPago.

---

## 📸 CAPTURAS DE CONSOLA ESPERADAS

**Cuando funciona correctamente:**

```javascript
// Console log secuencia:
💳 Creando preferencia de pago para hold: 123
📤 Enviando datos de preferencia: { holdId: 123, payer: {...}, backUrls: {...} }
✅ Preferencia creada: { id: "123456", init_point: "https://...", ... }
🔗 Init Point obtenido: https://www.mercadopago.com.ar/checkout/...
🚀 Redirigiendo a: https://www.mercadopago.com.ar/checkout/...
```

**Y luego la página CAMBIA a MercadoPago.**

---

## 🎉 ¡ESO ES TODO!

El botón ya está funcionando. Solo necesitas:

1. **Backend corriendo** con credenciales configuradas
2. **Ir al checkout**
3. **Click en el botón azul "Pagar"**
4. **Ver la redirección a MercadoPago**

**¿Listo para probarlo?** 🚀
