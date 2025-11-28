# 🔍 Guía de Debugging - Flujo de Pago

## Problema Reportado
El sistema redirige a `/events` al intentar pagar con MercadoPago, sin llegar a la página de pago.

## Pasos para Diagnosticar

### 1. Abrir Consola del Navegador
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña "Console"
- Limpia la consola (ícono de prohibido o `Ctrl+L`)

### 2. Reproducir el Error
1. Navega a `/events`
2. Selecciona un evento
3. Selecciona una función (show)
4. Selecciona asientos
5. Haz clic en "Continuar al Checkout"
6. Completa el formulario
7. Haz clic en "Pagar con Mercado Pago"

### 3. Capturar Logs

Busca en la consola los siguientes mensajes:

#### En Checkout.jsx:
```
=== CHECKOUT COMPONENT ===
holdIdParam: [valor]
location.state: [objeto]
holdId final: [valor]
Cargando datos del hold: [holdId]
```

#### En MercadoPagoButton.jsx:
```
=== INICIO PROCESO DE PAGO ===
holdId recibido: [valor]
payer recibido: [objeto]
totalAmount: [valor]
Paso 1: Creando orden desde hold...
Llamando a ordersApi.createOrder con holdId: [valor]
Respuesta de createOrder: [objeto]
orderId extraído: [valor]
Paso 2: Creando preferencia de pago...
Payload de preferencia: [objeto]
Respuesta de createPaymentPreference: [objeto]
init_point extraído: [URL]
Paso 3: Redirigiendo a MercadoPago en 2 segundos...
Ejecutando redirección a: [URL]
```

### 4. Verificar Errores

Si ves algún error en rojo, copia el mensaje completo incluyendo:
- El mensaje de error
- El stack trace
- La línea y archivo donde ocurrió

### 5. Verificar Network

Ve a la pestaña "Network" (Red) en las DevTools:
1. Filtra por "Fetch/XHR"
2. Busca las siguientes llamadas:
   - `POST /api/orders` (crear orden)
   - `POST /api/payments/create-preference` (crear preferencia)
3. Haz clic en cada una y verifica:
   - **Request**: ¿Qué datos se enviaron?
   - **Response**: ¿Qué respondió el backend?
   - **Status**: ¿Fue 200 OK o hubo error?

## Información Necesaria para el Debug

Por favor, proporciona:

### A. Logs de la Consola
Copia y pega TODOS los logs que aparecen desde que haces clic en "Pagar con Mercado Pago"

### B. Errores (si hay)
```
Ejemplo:
Error: No se pudo crear la orden
  at handleClick (MercadoPagoButton.jsx:68)
  ...
```

### C. Respuestas del Backend
Para cada llamada en Network, copia:

**POST /api/orders**
- Request Body: `{ holdId: 123 }`
- Response: `{ ... }`
- Status: `200` o `400`, etc.

**POST /api/payments/create-preference**
- Request Body: `{ orderId: 456, payer: {...}, ... }`
- Response: `{ ... }`
- Status: `200` o `400`, etc.

### D. Estado de la Aplicación
- ¿Estás logueado como usuario?
- ¿Qué rol tiene tu usuario? (CUSTOMER, ADMIN, etc.)
- ¿El hold se creó correctamente?
- ¿Ves el timer de expiración en el checkout?

## Posibles Causas del Problema

### 1. holdId no se está pasando correctamente
**Síntoma**: `holdId recibido: undefined`
**Solución**: Verificar que SeatSelection.jsx está navegando con el holdId correcto

### 2. Error al crear la orden
**Síntoma**: Error en `ordersApi.createOrder`
**Solución**: Verificar respuesta del backend en Network

### 3. Error al crear la preferencia de pago
**Síntoma**: Error en `paymentsApi.createPaymentPreference`
**Solución**: Verificar que el backend devuelve `init_point`

### 4. init_point no se extrae correctamente
**Síntoma**: `init_point extraído: undefined`
**Solución**: Verificar formato de respuesta del backend

### 5. Redirección se interrumpe
**Síntoma**: Se ejecuta la redirección pero vuelve a /events
**Solución**: Verificar si hay algún error en el catch que redirige

## Comandos Útiles para Verificar

### En la consola del navegador:
```javascript
// Ver localStorage
console.log('lastOrderId:', localStorage.getItem('lastOrderId'));

// Ver si hay tokens de cola
Object.keys(localStorage).filter(k => k.startsWith('queue_'));

// Ver usuario actual
console.log('user:', JSON.parse(localStorage.getItem('user') || '{}'));
```

## Próximos Pasos

Una vez que tengas esta información, podremos identificar exactamente dónde está fallando el flujo y corregirlo.

---

**Nota**: Los logs agregados son temporales para debugging. Una vez resuelto el problema, se pueden remover para limpiar la consola.
