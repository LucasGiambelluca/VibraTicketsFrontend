# 🐛 DEBUG: Checkout No Redirige a MercadoPago

## 🔍 PASOS PARA IDENTIFICAR EL PROBLEMA

### PASO 1: Abrir la Consola del Navegador

1. En tu navegador, presiona **F12**
2. Ve a la pestaña **Console**
3. Limpia la consola (botón 🚫 o Ctrl+L)

---

### PASO 2: Ir al Checkout

1. Selecciona asientos en un show
2. Debería redirigir a `/checkout/:holdId`

**En consola deberías ver:**
```
✅ Hold cargado desde state: {...}
```

**Si NO ves ese mensaje:**
- El hold NO se cargó correctamente
- Vuelve a seleccionar asientos

---

### PASO 3: Verificar que el Botón Existe

**En la página de Checkout deberías ver:**

```
┌────────────────────────────────────────┐
│ 💳 Información de pago                 │
├────────────────────────────────────────┤
│ Método de pago: [MercadoPago ▼]       │
│                                        │
│ ℹ️ Pago Seguro con Mercado Pago       │
│    Serás redirigido a Mercado Pago... │
│                                        │
│ Nombre:    [_________]                 │
│ Apellido:  [_________]                 │
│ Email:     [_________]                 │
│ Teléfono:  [_________]                 │
│ DNI:       [_________]                 │
│                                        │
│ [Volver]                               │
│                                        │
│ 🔒 [Pagar $10,500]  ← ESTE BOTÓN      │
│                                        │
└────────────────────────────────────────┘
```

**Si NO ves el botón "Pagar":**
- Puede haber un error de carga del componente
- Verificar consola (F12) por errores rojos

---

### PASO 4: Completar el Formulario

**Llenar TODOS los campos:**
```
Nombre:    Juan
Apellido:  Pérez
Email:     test@example.com
Teléfono:  12345678
Área:      11
Tipo Doc:  DNI
Nro Doc:   12345678
```

**⚠️ IMPORTANTE:** Si dejas campos vacíos, el form NO se envía.

---

### PASO 5: Click en "Pagar" y Ver Logs

**Hacer click en el botón "🔒 Pagar $XXX"**

**INMEDIATAMENTE ir a la consola (F12) y buscar:**

```javascript
// Deberías ver esta SECUENCIA de logs:

🔴 =================================================
🔴 handlePayment EJECUTADO (submit del form)
🔴 values: { name: "Juan", email: "...", ... }
🔴 paymentMethod: "mercadopago"
🔴 =================================================
✅ Llamando a handleMercadoPagoPayment...

🔵 =================================================
🔵 handleMercadoPagoPayment EJECUTADO
🔵 values: { ... }
🔵 holdId: 123
🔵 holdData: { ... }
🔵 =================================================

🔐 Token disponible: SÍ
👤 Usuario: { id: 1, name: "...", ... }
💳 Creando preferencia de pago para hold: 123
📤 Enviando datos de preferencia: { ... }
✅ Preferencia creada: { ... }
🔗 Init Point obtenido: https://www.mercadopago.com.ar/...
🚀 Redirigiendo a: https://www.mercadopago.com.ar/...
```

---

## 🐛 CASOS DE ERROR

### CASO 1: No aparece NADA en consola

**Significa:** El click NO está funcionando

**Posibles causas:**
1. El botón está deshabilitado
2. Hay un error de JavaScript que impide la ejecución
3. El form tiene errores de validación

**Solución:**
1. Verificar que el botón NO tenga `disabled`
2. Buscar errores rojos en consola
3. Verificar que TODOS los campos estén completos

---

### CASO 2: Aparece 🔴 pero NO aparece 🔵

**Significa:** `handlePayment` se ejecuta pero NO llama a `handleMercadoPagoPayment`

**Posibles causas:**
1. `paymentMethod` NO es "mercadopago"
2. Hay un error antes de la llamada

**Solución:**
1. Verificar en el log: `paymentMethod: "mercadopago"`
2. Si es diferente, cambiar el select a MercadoPago

---

### CASO 3: Aparece 🔵 pero da ERROR

**Buscar el error específico:**

**Error: "Usuario no autenticado"**
```javascript
❌ Error: Usuario no autenticado
```
**Solución:** Hacer login primero

**Error: "Hold no encontrado"**
```javascript
❌ holdId: undefined
❌ holdData: null
```
**Solución:** Volver a seleccionar asientos

**Error: "Failed to fetch" o "NetworkError"**
```javascript
❌ Error: Failed to fetch
```
**Solución:** Verificar que el backend esté corriendo (http://localhost:3000)

**Error: "404 Not Found" en /api/payments/create-preference**
```javascript
❌ Error creating preference: 404
```
**Solución:** El backend NO tiene implementado el endpoint. Ver `BACKEND_REQUIREMENTS.md`

**Error: "No se pudo obtener la URL de pago"**
```javascript
❌ Respuesta de preferencia sin init_point: { ... }
```
**Solución:** El backend NO devuelve `init_point`. Verificar implementación del backend.

---

### CASO 4: Todo funciona pero NO redirige

**Significa:** El `init_point` se obtiene pero la redirección falla

**Verificar en consola:**
```javascript
🔗 Init Point obtenido: https://...
🚀 Redirigiendo a: https://...
```

**Si ves esos logs pero NO redirige:**
1. Puede haber un bloqueador de pop-ups
2. El navegador bloquea la redirección

**Solución:**
- Permitir redirecciones en el navegador
- Verificar que `window.location.href` funcione

**Prueba manual en consola:**
```javascript
window.location.href = "https://www.google.com"
```

Si esto NO funciona, hay un problema del navegador.

---

## 📸 CAPTURAS ESPERADAS

### ✅ FUNCIONANDO CORRECTAMENTE

**Consola (secuencia completa):**
```
🔴 handlePayment EJECUTADO
✅ Llamando a handleMercadoPagoPayment...
🔵 handleMercadoPagoPayment EJECUTADO
🔐 Token disponible: SÍ
💳 Creando preferencia de pago para hold: 123
✅ Preferencia creada
🔗 Init Point obtenido: https://...
🚀 Redirigiendo a: https://...
```

**Y luego la página cambia a:**
```
https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...
```

---

## 🚨 CHECKLIST RÁPIDO

Antes de hacer click en "Pagar":

- [ ] Backend corriendo (http://localhost:3000)
- [ ] Usuario autenticado (haz login)
- [ ] Hold creado (selecciona asientos)
- [ ] Todos los campos del form completos
- [ ] Consola (F12) abierta y limpia
- [ ] Método de pago = "MercadoPago"

---

## 📞 INFORMACIÓN PARA REPORTAR

**Si sigue sin funcionar, envíame:**

1. **Captura de la consola (F12) después del click**
2. **Captura de la pestaña Network (F12) después del click**
3. **Respuesta del navegador:**
   - ¿Qué mensaje aparece?
   - ¿Algún error?
   - ¿Qué logs ves en consola?

Con esa información podré identificar exactamente qué está fallando.

---

## 🎯 PRÓXIMO PASO

1. **Reinicia el frontend:**
   ```bash
   Ctrl+C en la terminal
   pnpm run dev
   ```

2. **Abre el navegador en modo incógnito** (para evitar cache)

3. **Sigue los pasos de debugging** desde PASO 1

4. **Envíame capturas** de lo que ves en consola

¡Vamos a resolver esto juntos! 🚀
