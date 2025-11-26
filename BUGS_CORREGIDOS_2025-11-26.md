# 🐛 Bugs Corregidos - 2025-11-26

## Resumen
Se corrigieron múltiples bugs críticos que impedían el flujo de compra de tickets.

---

## 1. ❌ Bug: Variable no definida en ShowDetail.jsx

### Problema
```javascript
// Línea 238 - ANTES
if (showId && hasValidAccess) loadShowData();
```
**Error**: `hasValidAccess` no estaba definido, causaba que el componente fallara.

### Solución
```javascript
// Línea 238 - DESPUÉS
if (showId && hasQueueAccess) loadShowData();
```
**Archivo**: `src/pages/ShowDetail.jsx`

---

## 2. ❌ Bug: Error al acceder a accessToken null

### Problema
```javascript
// Línea 416 - ANTES
accessToken: '***' + accessToken.slice(-8)
```
**Error**: Cuando `accessToken` es `null`, `.slice()` causaba error.

### Solución
```javascript
// Línea 416 - DESPUÉS
accessToken: accessToken ? '***' + accessToken.slice(-8) : 'N/A (cola no habilitada)'
```
**Archivo**: `src/pages/ShowDetail.jsx`

---

## 3. ❌ Bug: useMemo sin validar sections

### Problema
```javascript
// Línea 280 - ANTES
sections.map(s => `${s.id} (${typeof s.id})`)
```
**Error**: Si `sections` es `undefined` o `null`, `.map()` causaba error.

### Solución
```javascript
// Línea 270-272 - DESPUÉS
if (!sections || sections.length === 0) {
  return { totalTickets: 0, totalPrice: 0 };
}
```
**Archivo**: `src/pages/ShowDetail.jsx`

---

## 4. ❌ Bug: handleContinue sin validar sections

### Problema
No validaba si `sections` estaba cargado antes de procesar.

### Solución
```javascript
// Línea 302-305 - DESPUÉS
if (!sections || sections.length === 0) {
  message.error('No se pudieron cargar las secciones del show. Por favor, recargá la página.');
  return;
}
```
**Archivo**: `src/pages/ShowDetail.jsx`

---

## 5. ❌ Bug: Callback undefined en LoginModalContext

### Problema
```javascript
// Línea 36 - ANTES
if (onSuccessCallback) {
  onSuccessCallback(user);
}
```
**Error**: No validaba si `onSuccessCallback` era una función, causaba errores al ejecutar.

### Solución
```javascript
// Línea 37-42 - DESPUÉS
if (onSuccessCallback && typeof onSuccessCallback === 'function') {
  try {
    onSuccessCallback(user);
  } catch (error) {
    console.error('❌ Error ejecutando callback de login:', error);
  }
}
```
**Archivo**: `src/contexts/LoginModalContext.jsx`

---

## 6. ❌ Bug: Callback undefined en RegisterModalContext

### Problema
Mismo problema que LoginModalContext.

### Solución
```javascript
// Línea 28-33 - DESPUÉS
if (onSuccessCallback && typeof onSuccessCallback === 'function') {
  try {
    onSuccessCallback(user);
  } catch (error) {
    console.error('❌ Error ejecutando callback de registro:', error);
  }
}
```
**Archivo**: `src/contexts/RegisterModalContext.jsx`

---

## 7. ❌ Bug: Backend espera customerEmail como campo separado

### Problema
El backend intentaba acceder a `customerEmail.customerEmail`, causando error al procesar pagos.

### Solución (Workaround Temporal)
```javascript
// Línea 95-96 - MercadoPagoButton.jsx
customerEmail: payer.email,
customerName: `${payer.name || 'Usuario'} ${payer.surname || 'VibraTicket'}`,
```
**Archivo**: `src/components/MercadoPagoButton.jsx`
**Nota**: Esto es un workaround. El backend debe corregirse para leer `payer.email` directamente.

---

## 8. ❌ Bug: hasQueueAccess inicializado en false

### Problema
```javascript
// Línea 48 - ANTES
const [hasQueueAccess, setHasQueueAccess] = useState(false);
```
**Error**: Causaba una condición de carrera donde los datos del show nunca se cargaban si el endpoint de cola fallaba (404).

### Solución
```javascript
// Línea 48 - DESPUÉS
const [hasQueueAccess, setHasQueueAccess] = useState(true); // default: true para fail-open
```
**Archivo**: `src/pages/ShowDetail.jsx`
**Razón**: Fail-open significa que si la cola no existe o falla, permitimos acceso directo.

---

## Archivos Modificados

1. ✅ `src/pages/ShowDetail.jsx` - Múltiples correcciones
2. ✅ `src/contexts/LoginModalContext.jsx` - Validación de callbacks
3. ✅ `src/contexts/RegisterModalContext.jsx` - Validación de callbacks
4. ✅ `src/components/MercadoPagoButton.jsx` - Workaround para backend

---

## Archivos de Documentación Creados

1. 📄 `BUG_MERCADOPAGO_CHECKOUT.md` - Documentación del bug de pago
2. 📄 `BUGS_CORREGIDOS_2025-11-26.md` - Este archivo

---

## Estado Actual

### ✅ Funcionando:
- Login/Register con modales
- Selección de tickets en ShowDetail
- Navegación entre páginas
- Fail-open para cola virtual (si no existe, permite acceso)

### ⚠️ Requiere Atención (Backend):
- Endpoint `/api/queue/:showId/status` retorna 404
- Backend espera `customerEmail` como campo separado en lugar de `payer.email`

### 🔧 Pendiente:
- Google Maps API key (warning en consola)
- Normalizar snake_case vs camelCase en respuestas del backend

---

## Próximos Pasos

1. **Probar flujo completo de compra**:
   - Seleccionar tickets ✅
   - Crear hold ⏳
   - Procesar pago con Mercado Pago ⏳
   - Recibir tickets ⏳

2. **Corregir en Backend**:
   - Implementar endpoint `/api/queue/:showId/status` o remover referencias
   - Corregir acceso a `customerEmail` en creación de preferencias de pago

3. **Optimizaciones**:
   - Agregar Google Maps API key en `.env`
   - Normalizar respuestas del backend (camelCase)

---

**Fecha**: 2025-11-26  
**Bugs Corregidos**: 8  
**Archivos Modificados**: 4  
**Prioridad**: 🔴 Alta - Bugs críticos que bloqueaban flujo de compra
