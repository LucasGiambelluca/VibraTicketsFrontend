# ⚡ GUÍA RÁPIDA: Flujo Real de MercadoPago (TEST)

## 🎯 LO QUE VAS A VER

Vas a ver el flujo COMPLETO de pago, incluyendo el formulario de tarjeta, pero usando credenciales de TEST.

---

## 🚀 PASOS RÁPIDOS

### 1. Preparación (Una sola vez)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: ngrok (para webhooks)
ngrok http 3000

# Terminal 3: Frontend
cd frontend
npm run dev
```

---

### 2. Verificar Configuración

✅ **Frontend (.env):**
```
VITE_MP_PUBLIC_KEY=TEST-cd8c0ed6-9f60-4d85-aded-f92655e8b5db
```

✅ **SDK cargado (index.html):**
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

✅ **Backend:**
- Credenciales TEST en la base de datos
- Webhook configurado en panel de MP

---

### 3. Ir al Checkout

1. Seleccionar asientos en un show
2. Redirige automáticamente a: `/checkout/:holdId`

---

### 4. ⚠️ IMPORTANTE: USA EL BOTÓN CORRECTO

En la página de Checkout verás **DOS botones**:

```
┌──────────────────────────────────────────────┐
│ Formulario de pago                           │
│ [Nombre, Email, Teléfono, DNI...]           │
│                                              │
│ [Volver]                                     │
│                                              │
│ 🔒 [Pagar $10,500]  ← ✅ USA ESTE (AZUL)   │
│                                              │
│ 🧪 [Simular Pago]   ← ❌ NO USES ESTE      │
│ 💡 Si el simulador falla...                 │
└──────────────────────────────────────────────┘
```

**✅ USA EL AZUL:** "🔒 Pagar $XXX"
**❌ NO USES EL NARANJA:** "🧪 Simular Pago (Testing)"

---

### 5. Después del Click en el Botón AZUL

Deberías ver esto:

```
┌──────────────────────────────────────────────┐
│ 🔒 [Pagar $10,500]  ← Disabled (gris)       │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │✅ Completa tu pago con Mercado Pago      ││
│ │Listo, elegí tu medio de pago...          ││
│ ├──────────────────────────────────────────┤│
│ │                                          ││
│ │    💳 MERCADO PAGO                       ││
│ │                                          ││
│ │  [Pagar con Mercado Pago]  ← CLICK AQUÍ ││
│ │                                          ││
│ └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**Si NO aparece este botón:**
- Abrir consola (F12)
- Ver errores
- Ver `TESTING_FLUJO_REAL_MERCADOPAGO.md` para debugging

---

### 6. Click en "Pagar con Mercado Pago"

Se abre un **modal** (ventana emergente) de MercadoPago:

```
┌─────────────────────────────────────┐
│ 💳 Mercado Pago           [X]       │
├─────────────────────────────────────┤
│ Total: $10,500                      │
│                                     │
│ Elegí cómo pagar:                   │
│                                     │
│ ● Tarjetas                          │
│   [Agregar nueva tarjeta] ← CLICK  │
└─────────────────────────────────────┘
```

---

### 7. Ingresar Tarjeta de Prueba

```
┌─────────────────────────────────────┐
│ 💳 Nueva tarjeta                    │
├─────────────────────────────────────┤
│ Número:                             │
│ [5031 7557 3453 0604]  ← Copiar    │
│                                     │
│ Nombre:                             │
│ [APRO]  ← Importante: APRO         │
│                                     │
│ Vencimiento:     CVV:               │
│ [11/25]         [123]               │
│                                     │
│ DNI:                                │
│ [12345678]                          │
│                                     │
│ [Pagar]  ← Click                    │
└─────────────────────────────────────┘
```

**⚠️ DATOS DE PRUEBA (copiar exacto):**
```
Número:     5031 7557 3453 0604
Nombre:     APRO
Vencimiento: 11/25
CVV:        123
DNI:        12345678
```

---

### 8. Resultado

Después de hacer click en "Pagar":

```
⏳ Procesando pago...
    ↓
✅ Pago aprobado
    ↓
Redirige a: /payment/success
    ↓
┌─────────────────────────────────────┐
│ ✅ ¡Pago exitoso!                   │
│                                     │
│ 🎫 Tickets generados: 3             │
│ 📧 Email enviado                    │
│                                     │
│ [Ver mis tickets]                   │
└─────────────────────────────────────┘
```

---

## 🐛 SI ALGO FALLA

### No aparece el botón de MercadoPago

**Verificar en consola (F12):**
```javascript
window.MercadoPago  // ¿Existe?
import.meta.env.VITE_MP_PUBLIC_KEY  // ¿Tiene valor?
```

**Solución:**
```bash
# Reiniciar frontend
Ctrl+C
npm run dev
```

---

### El backend da 404

**Error:**
```
POST /api/payments/create-preference
404 Not Found
```

**Causa:** El backend no tiene ese endpoint o no acepta `holdId`

**Solución:** Verificar que el backend acepta:
```json
{
  "holdId": 123,
  "payer": {...},
  "backUrls": {...}
}
```

---

### El pago se rechaza

**Verificar:**
- ✅ Número: 5031 7557 3453 0604
- ✅ Nombre: **APRO** (exacto, mayúsculas)
- ✅ Vencimiento: fecha futura (11/25)
- ✅ CVV: 123
- ✅ DNI: 12345678

---

### Webhook no llega

**Verificar:**
1. ngrok está corriendo: `ngrok http 3000`
2. Ver en `http://127.0.0.1:4040` si llegó
3. Esperar hasta 30 segundos (MP puede tardar)

---

## 📊 DIFERENCIAS: SIMULADOR vs FLUJO REAL

| Aspecto | 🧪 Simulador (Naranja) | 🔒 Flujo Real (Azul) |
|---------|------------------------|----------------------|
| **Botón** | "🧪 Simular Pago" | "🔒 Pagar $XXX" |
| **Formulario tarjeta** | ❌ No | ✅ Sí |
| **MercadoPago** | ❌ No usa | ✅ Sí usa |
| **Webhook** | ❌ No | ✅ Sí |
| **Modal MP** | ❌ No aparece | ✅ Aparece |
| **Tarjeta TEST** | ❌ No necesita | ✅ 5031 7557 3453 0604 |
| **Para qué sirve** | Testing rápido | Testing completo |

---

## ✅ RESUMEN

1. **USA EL BOTÓN AZUL:** "🔒 Pagar $XXX"
2. **Aparecerá botón de MP:** "Pagar con Mercado Pago"
3. **Click ahí:** Se abre modal
4. **Ingresar tarjeta TEST:** 5031 7557 3453 0604
5. **Nombre:** APRO
6. **Click "Pagar"**
7. **Ver redirección a success ✅**

---

**📖 Para más detalles ver: `TESTING_FLUJO_REAL_MERCADOPAGO.md`**

**¡Ahora sí, probalo!** 🚀💳
