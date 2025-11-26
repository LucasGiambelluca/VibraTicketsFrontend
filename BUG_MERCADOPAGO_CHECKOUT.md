# 🐛 BUG: Error al procesar pago con Mercado Pago

## Descripción del Problema

Cuando el usuario intenta pagar con Mercado Pago en el checkout, se produce un error en el **backend** que impide completar la transacción.

## Error Observado

```
Uncaught TypeError: Cannot read properties of undefined (reading 'customerEmail')
```

El error sugiere que el backend está intentando acceder a `customerEmail.customerEmail`, lo cual indica que:
1. El backend espera que `customerEmail` sea un string
2. Pero está recibiendo un objeto (probablemente el objeto `payer` completo)
3. Luego intenta acceder a `.customerEmail` sobre ese objeto

## Flujo Actual

### Frontend (✅ Correcto)

1. **Checkout.jsx** - Recolecta información del usuario:
   ```javascript
   const getPayerInfo = () => {
     const formValues = form.getFieldsValue();
     return {
       name: formValues.name,
       surname: formValues.surname,
       email: formValues.email,
       phone: formValues.phone,
       areaCode: formValues.areaCode,
       idType: formValues.idType,
       idNumber: formValues.idNumber
     };
   };
   ```

2. **MercadoPagoButton.jsx** - Procesa el pago:
   ```javascript
   // Paso 1: Crear ORDER desde HOLD
   const orderResp = await ordersApi.createOrder({ holdId: parseInt(holdId) }, true);
   
   // Paso 2: Crear preferencia de pago
   const response = await paymentsApi.createPaymentPreference({
     orderId: parseInt(orderId),
     payer: payerPayload,  // ✅ Objeto con estructura correcta
     backUrls
   }, true);
   ```

3. **Estructura del `payerPayload`** (✅ Correcta):
   ```javascript
   {
     "email": "user@example.com",
     "name": "Juan",
     "surname": "Pérez",
     "first_name": "Juan",
     "last_name": "Pérez",
     "phone": {
       "area_code": "11",
       "number": "12345678"
     },
     "identification": {
       "type": "DNI",
       "number": "12345678"
     },
     "areaCode": "11",
     "idType": "DNI",
     "idNumber": "12345678"
   }
   ```

### Backend (❌ Error)

El backend está intentando hacer algo como:

```javascript
// ❌ INCORRECTO - El backend probablemente está haciendo esto:
const customerEmail = req.body.payer.customerEmail;  // undefined
const email = customerEmail.customerEmail;  // ❌ Error: Cannot read properties of undefined
```

Cuando debería ser:

```javascript
// ✅ CORRECTO - Debería hacer esto:
const customerEmail = req.body.payer.email;  // "user@example.com"
```

## Ubicación del Error

El error está en el **backend**, específicamente en:
- Endpoint: `POST /api/payments/create-preference`
- O en: `POST /api/orders` (al crear la orden)

## Solución Requerida

### En el Backend

Buscar en el código del backend donde se procesa la creación de preferencias de pago o órdenes y corregir:

**Buscar:**
```javascript
customerEmail.customerEmail
// o
payer.customerEmail.customerEmail
```

**Reemplazar por:**
```javascript
payer.email
// o si se necesita customerEmail como variable separada:
const customerEmail = payer.email;
```

### Archivos del Backend a Revisar

1. `routes/payments.js` o `controllers/paymentsController.js`
2. `routes/orders.js` o `controllers/ordersController.js`
3. Cualquier middleware que procese datos de pago

## Workaround Temporal (Frontend)

Si no se puede corregir el backend inmediatamente, se podría intentar enviar un campo adicional `customerEmail` en el payload:

```javascript
// En MercadoPagoButton.jsx
const response = await paymentsApi.createPaymentPreference({
  orderId: parseInt(orderId),
  payer: payerPayload,
  customerEmail: payer.email,  // 🔧 Workaround temporal
  backUrls
}, true);
```

## Estado Actual

- ✅ Frontend: Enviando datos correctamente
- ❌ Backend: Error al procesar `customerEmail`
- 🔍 Se agregó log en `MercadoPagoButton.jsx` línea 89 para debug

## Próximos Pasos

1. Revisar logs del backend para identificar el archivo exacto donde ocurre el error
2. Corregir el acceso a `customerEmail` en el backend
3. Probar el flujo completo de pago
4. Eliminar el log de debug del frontend una vez resuelto

## Archivos Modificados (Frontend)

- ✅ `src/components/MercadoPagoButton.jsx` - Agregado log de debug
- ✅ `src/pages/ShowDetail.jsx` - Corregidos bugs de cola virtual
- ✅ `src/pages/Checkout.jsx` - Sin cambios necesarios (funciona correctamente)

---

**Fecha:** 2025-11-26  
**Prioridad:** 🔴 Alta - Bloquea el flujo de compra  
**Responsable:** Backend Team
