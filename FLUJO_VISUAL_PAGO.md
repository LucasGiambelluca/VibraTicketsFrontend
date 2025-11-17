# 🎯 FLUJO VISUAL DE PAGO - Explicación Completa

## 🖼️ PANTALLA INICIAL DE CHECKOUT

```
┌───────────────────────────────────────────────────────────┐
│ 🎫 Checkout - Completa tu compra                          │
├───────────────────────────────────────────────────────────┤
│                                                            │
│ 📋 Resumen de compra                                       │
│ ┌────────────────────────────┐                            │
│ │ • 2 x General Admission    │                            │
│ │ • 1 x VIP                  │                            │
│ │ ───────────────────────    │                            │
│ │ Subtotal:      $10,000     │                            │
│ │ Cargos:        $1,500      │                            │
│ │ TOTAL:         $11,500     │                            │
│ └────────────────────────────┘                            │
│                                                            │
│ 💳 Información de pago                                     │
│ ┌────────────────────────────┐                            │
│ │ Nombre:     [Juan        ] │                            │
│ │ Apellido:   [Pérez       ] │                            │
│ │ Email:      [juan@test.com]│                            │
│ │ Teléfono:   (11) [12345678]│                            │
│ │ DNI:        [12345678     ]│                            │
│ └────────────────────────────┘                            │
│                                                            │
│ [Volver]                                                   │
│                                                            │
│ 🔒 [Pagar $11,500]  ← BOTÓN AZUL (FLUJO REAL)            │
│                                                            │
│ 🧪 [Simular Pago (Testing)]  ← BOTÓN NARANJA (SIMULACIÓN)│
│ 💡 Si el simulador falla, usa el pago real con tarjeta... │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

---

## 🔵 FLUJO 1: PAGO REAL (Botón azul "Pagar $11,500")

### PASO 1: Haces click en el botón azul

```
Usuario hace click → 🔒 [Pagar $11,500]
```

### PASO 2: Se crea la preferencia (loading...)

```
┌───────────────────────────────────────┐
│ ⏳ Creando preferencia de pago...     │
└───────────────────────────────────────┘
```

### PASO 3: Aparece el botón de MercadoPago

```
┌───────────────────────────────────────────────────────────┐
│ 🔒 [Pagar $11,500] ← DISABLED (ya no podés hacer click)  │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ✅ Completa tu pago con Mercado Pago               │   │
│ │ Listo, elegí tu medio de pago y finalizá la compra │   │
│ ├────────────────────────────────────────────────────┤   │
│ │                                                     │   │
│ │        💳 MERCADO PAGO                             │   │
│ │                                                     │   │
│ │     [Pagar con Mercado Pago]  ← NUEVO BOTÓN       │   │
│ │                                                     │   │
│ └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### PASO 4: Haces click en el botón de MercadoPago

```
Usuario hace click → [Pagar con Mercado Pago]
```

### PASO 5a: Se abre un MODAL (Wallet Brick)

```
┌─────────────────────────────────────────────────────┐
│ 💳 Mercado Pago                              [X]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Total a pagar: $11,500                              │
│                                                      │
│ 🎨 Elegí tu medio de pago:                          │
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ ● Tarjeta de crédito                     │       │
│ │   ○ Visa                                 │       │
│ │   ○ Mastercard                           │       │
│ │   ○ American Express                     │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ Número de tarjeta:                                  │
│ [5031 7557 3453 0604]  ← AQUÍ ingresas la tarjeta  │
│                                                      │
│ Vencimiento:       CVV:                             │
│ [11/25]           [123]                             │
│                                                      │
│ Nombre en la tarjeta:                               │
│ [APRO]                                              │
│                                                      │
│                                  [Pagar $11,500]    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### PASO 5b: O se redirige a MercadoPago (Redirección completa)

```
Tu sitio (localhost:5173)
    ↓
Redirige a
    ↓
www.mercadopago.com.ar/checkout/...
    ↓
┌─────────────────────────────────────────────────────┐
│ 💳 Mercado Pago                                     │
├─────────────────────────────────────────────────────┤
│ Estás pagando $11,500 a VibraTicket                │
│                                                      │
│ Número de tarjeta:                                  │
│ [____-____-____-____]  ← AQUÍ ingresas la tarjeta  │
│                                                      │
│ Vencimiento: [__/__]    CVV: [___]                 │
│                                                      │
│ Nombre: [________________]                          │
│                                                      │
│ [Pagar]                                             │
└─────────────────────────────────────────────────────┘
```

### PASO 6: MercadoPago procesa el pago

```
⏳ Procesando pago...
```

### PASO 7: Redirige a tu sitio con el resultado

```
www.mercadopago.com.ar
    ↓
Redirige de vuelta a
    ↓
localhost:5173/payment/success?holdId=123
    ↓
┌─────────────────────────────────────────────────────┐
│ ✅ ¡Pago exitoso!                                   │
│                                                      │
│ Tu compra fue procesada correctamente.              │
│ Recibirás tus tickets por email.                   │
│                                                      │
│ 🎫 Tickets generados: 3                             │
│                                                      │
│ [Ver mis tickets]                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🟠 FLUJO 2: SIMULACIÓN (Botón naranja "🧪 Simular Pago")

### PASO 1: Haces click en el botón naranja

```
Usuario hace click → 🧪 [Simular Pago (Testing)]
```

### PASO 2: Backend simula automáticamente

```
┌───────────────────────────────────────┐
│ ⏳ Simulando pago...                   │
└───────────────────────────────────────┘
```

**⚠️ NO HAY PASO 3, 4, 5... Va directo al resultado.**

### PASO 3: Redirige al éxito

```
┌─────────────────────────────────────────────────────┐
│ ✅ ¡Pago simulado exitoso!                          │
│                                                      │
│ (Esta fue una simulación, no se procesó tarjeta)   │
│                                                      │
│ 🎫 Tickets generados: 3                             │
│                                                      │
│ [Ver mis tickets]                                   │
└─────────────────────────────────────────────────────┘
```

---

## ❓ ¿POR QUÉ NO VES EL FORMULARIO DE TARJETA?

### Causa 1: Estás usando el SIMULADOR (botón naranja)

**Síntoma:**
- Hiciste click en "🧪 Simular Pago (Testing)"
- NO apareció ningún formulario de tarjeta
- Fue directo a success o dio error

**Explicación:**
- ✅ **ES CORRECTO** que no pida tarjeta
- El simulador NO usa MercadoPago
- Es solo para testing rápido

**Solución:**
- Usa el botón azul "Pagar $XXX" para el flujo real

---

### Causa 2: El SDK de MercadoPago no se cargó

**Síntoma:**
- Hiciste click en "Pagar $11,500" (botón azul)
- NO apareció el botón de MercadoPago
- Nada pasó, o dio error

**Verificación:**
1. Abrir consola (F12)
2. Escribir: `window.MercadoPago`
3. Si dice `undefined` → El SDK no se cargó

**Causas:**
- ❌ Falta el script en `index.html`
- ❌ Public Key incorrecta
- ❌ Error de red

**Solución:**
Verificar que en `index.html` está:
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

---

### Causa 3: La preferencia no se creó

**Síntoma:**
- Hiciste click en "Pagar $11,500"
- Viste mensaje "Creando preferencia..."
- Luego error o no pasó nada

**Verificación:**
1. Abrir Network tab (F12)
2. Buscar: `POST /api/payments/create-preference`
3. Ver el status code

**Posibles resultados:**
- ✅ **200 OK** → La preferencia se creó, pero el botón no aparece
- ❌ **404** → Endpoint no existe
- ❌ **400/500** → Error en el backend
- ❌ **No aparece** → El request no se envió

**Solución según el error:**
- 404: Verificar ruta en el backend
- 400: Verificar que el backend acepta `holdId`
- 500: Ver logs del backend
- No aparece: Verificar que el botón está llamando la función

---

### Causa 4: Se redirige pero no lo notas

**Síntoma:**
- Hiciste click en "Pagar $11,500"
- La página "saltó" pero volvió rápido
- O se quedó en blanco

**Verificación:**
1. Network tab (F12)
2. Ver si hay una redirección a `mercadopago.com.ar`

**Causa:**
- El backend está usando **init_point** en vez de **preferenceId**
- Esto causa redirección completa en vez de modal

**Solución:**
- Es normal, es la Opción B (redirección)
- Deberías ver la página de MercadoPago
- Si vuelve rápido, puede haber un error en la URL

---

## 🧪 CÓMO PROBAR CADA FLUJO

### Para probar el SIMULADOR:

1. Ir a `/checkout/:holdId`
2. **NO llenar el formulario** (opcional)
3. Scroll hasta abajo
4. Click en **🧪 [Simular Pago (Testing)]** (botón naranja)
5. Debería redirigir a success inmediatamente

### Para probar el FLUJO REAL:

1. Ir a `/checkout/:holdId`
2. **SÍ llenar el formulario:**
   - Nombre: Juan
   - Apellido: Pérez
   - Email: test@example.com
   - Teléfono: 12345678
   - DNI: 12345678
3. Click en **🔒 [Pagar $XXX]** (botón azul)
4. Esperar que aparezca el botón de MercadoPago
5. Click en el botón de MercadoPago
6. Ingresar tarjeta de prueba:
   - **Número:** 5031 7557 3453 0604
   - **Vencimiento:** 11/25
   - **CVV:** 123
   - **Nombre:** APRO
7. Click en "Pagar"
8. Debería redirigir a success

---

## 📞 DEBUGGING

**Cuéntame:**

1. ¿Cuál botón estás usando?
   - [ ] 🧪 Simular Pago (Testing) - naranja
   - [ ] 🔒 Pagar $XXX - azul

2. ¿Qué pasa cuando haces click?
   - [ ] No pasa nada
   - [ ] Aparece mensaje "Creando preferencia..."
   - [ ] Aparece botón de MercadoPago
   - [ ] Se redirige a otra página
   - [ ] Da error

3. ¿Ves algún error en consola (F12)?

4. ¿Qué aparece en Network tab cuando haces click?

Con esa info puedo ayudarte mejor. 🚀
