# 🔧 DEBUG: Problema con Redirección a Mercado Pago

## Problema Reportado
"Se crea el hold pero no pasa a Mercado Pago"

## Cambios Realizados para Debug

### 1. Logs Detallados en Consola
He agregado logs extensivos en `MercadoPagoButton.jsx` que mostrarán:

**Paso 1: Creación de Orden**
```
====================
Paso 1: Creando orden desde hold...
holdId (raw): ...
holdId (parseInt): ...
====================
✅ Respuesta COMPLETA de createOrder:
{ ... }
====================
```

**Paso 2: Creación de Preferencia de Pago**
```
====================
Paso 2: Creando preferencia de pago...
Payload de preferencia: { ... }
====================
✅ Respuesta COMPLETA de createPaymentPreference:
{ ... }
====================
```

**Paso 3: Redirección**
```
====================
Paso 3: Preparando redirección a MercadoPago...
URL de MercadoPago: https://...
Redirigiendo en 2 segundos...
====================
```

### 2. Alert Visual de Debug
Aparece un Alert azul en la parte superior del Checkout con:
- ✅ holdId actual
- ✅ Si holdData existe
- ✅ Detalles del hold (id, totalCents, asientos, expiración)
- ✅ Si show y event existen
- ✅ Información del usuario

## Cómo Usar el Debug

### Paso 1: Abrí la Consola del Navegador
1. Presioná `F12` o `Ctrl+Shift+I`
2. Andá a la pestaña "Console"

### Paso 2: Reproducí el Problema
1. Seleccioná tickets en ShowDetail
2. Hacé clic en "Continuar" (creará el hold)
3. En la página de Checkout, verificá el Alert de debug
4. Hacé clic en "Pagar con Mercado Pago"
5. Observá la consola

### Paso 3: Identificá Dónde Falla

#### ❌ Escenario A: Error en Paso 1 (createOrder)
**Síntoma:** Ves el log "Paso 1" pero luego un error
**Posibles causas:**
- El holdId es undefined o null
- El hold ya expiró
- El endpoint POST /api/orders no existe o falla
- No hay token de autenticación

**Solución:**
- Verificá que el holdId en el Alert sea un número válido
- Verificá que el hold no haya expirado
- Revisá el backend: ¿existe el endpoint POST /api/orders?

#### ❌ Escenario B: Error en Paso 2 (createPaymentPreference)
**Síntoma:** El Paso 1 funciona pero falla en Paso 2
**Posibles causas:**
- El orderId no se extrajo correctamente
- El endpoint POST /api/payments/create-preference falla
- Falta configuración de Mercado Pago en el backend

**Solución:**
- Verificá en la consola si `orderId extraído:` tiene un valor
- Revisá el backend: ¿existe el endpoint POST /api/payments/create-preference?
- Verificá las credenciales de Mercado Pago en el backend (.env)

#### ❌ Escenario C: No se extrae init_point
**Síntoma:** Paso 1 y 2 funcionan pero no redirige
**Posibles causas:**
- El backend no devuelve el campo `init_point` en el response
- El formato del response es diferente al esperado

**Solución:**
- Mirá en la consola la "Respuesta COMPLETA de createPaymentPreference"
- Buscá campos como: `initPoint`, `init_point`, `sandbox_init_point`
- Si no existe ninguno, el backend debe agregarlos

#### ❌ Escenario D: Error 401 (No autenticado)
**Síntoma:** Error con status 401
**Solución:**
- Iniciá sesión nuevamente
- Verificá que el token esté guardado en localStorage

#### ❌ Escenario E: Error 409 (Conflicto)
**Síntoma:** Error con status 409
**Posibles causas:**
- Asientos ya vendidos
- Hold expirado
- Hold ya usado

**Solución:**
- Volvé a seleccionar asientos
- Verificá que los asientos estén disponibles

## Información para Compartir

Si seguís teniendo problemas, compartí esta información:

### De la Consola:
1. El último bloque `====================` completo que aparezca
2. Cualquier error en rojo
3. Las respuestas JSON de `createOrder` y `createPaymentPreference`

### Del Alert de Debug:
1. Screenshot del Alert azul completo
2. Valor de `holdId`
3. Valor de `totalCents`

## Logs del Backend

También revisá los logs del backend. Deberías ver:
1. `POST /api/orders` - Creación de la orden
2. `POST /api/payments/create-preference` - Creación de preferencia

Si alguno de estos endpoints no se llama, el problema está en el frontend.
Si se llaman pero fallan, el problema está en el backend.

## Endpoints Esperados del Backend

### 1. POST /api/orders
**Request:**
```json
{
  "holdId": 123
}
```

**Response esperado:**
```json
{
  "id": 456,
  "orderId": 456,
  "status": "PENDING",
  ...
}
```

### 2. POST /api/payments/create-preference
**Request:**
```json
{
  "orderId": 456,
  "payer": { ... },
  "backUrls": { ... }
}
```

**Response esperado:**
```json
{
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "totalAmount": 10000
}
```

## Checklist de Verificación

- [ ] El hold se crea correctamente (aparece el Checkout)
- [ ] El Alert de debug muestra un holdId válido
- [ ] El Alert muestra que holdData existe
- [ ] El Alert muestra totalCents > 0
- [ ] Al hacer clic en "Pagar", aparece el mensaje "Creando preferencia de pago..."
- [ ] En la consola aparece "Paso 1: Creando orden desde hold..."
- [ ] En la consola aparece "✅ Respuesta COMPLETA de createOrder"
- [ ] En la consola aparece un orderId válido
- [ ] En la consola aparece "Paso 2: Creando preferencia de pago..."
- [ ] En la consola aparece "✅ Respuesta COMPLETA de createPaymentPreference"
- [ ] En la consola aparece "init_point extraído: https://..."
- [ ] Aparece el mensaje "Redirigiendo a Mercado Pago..."
- [ ] La página redirige a Mercado Pago

## Próximos Pasos

1. **Probá el flujo nuevamente** con estos cambios
2. **Abrí la consola** antes de hacer clic en "Pagar"
3. **Mirá el Alert de debug** en el Checkout
4. **Compartí** los logs de la consola si sigue fallando

---

**Última actualización:** 27 de Noviembre, 2024  
**Archivo modificado:** `src/components/MercadoPagoButton.jsx`  
**Archivo modificado:** `src/pages/Checkout.jsx`
