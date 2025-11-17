# 🔍 DIAGNÓSTICO: Error en Creación de Preferencia MercadoPago

## 📊 **Estado Actual Según Logs:**

### ✅ **Lo que SÍ funciona:**
1. **Hold creado exitosamente:**
   ```
   ✅ Hold creado - ID: 38
   📤 RESPUESTA (201): { holdId: 38, expiresAt: "2025-11-11T19:22:02.363Z", ... }
   ```

2. **Orden creada exitosamente:**
   ```
   POST /api/orders HTTP/1.1" 201 388
   ```

3. **Usuario autenticado correctamente:**
   ```
   👤 USER: ID: 12, Email: test@test.com
   authorization: 'Bearer ***'
   ```

### ❌ **Donde falla:**
El error ocurre en el **PASO 3: Crear preferencia de MercadoPago**

## 🎯 **Posibles Causas del Error:**

### **1. Endpoint no implementado en backend**
```
POST /api/payments/create-preference
```
**Verificación:** ¿Existe este endpoint en tu backend?

### **2. Configuración de MercadoPago faltante**
El backend puede no tener configuradas las credenciales de MercadoPago.

### **3. Estructura de datos incorrecta**
El backend puede esperar un formato diferente de `payer` o `backUrls`.

### **4. Error de CORS específico**
Solo en el endpoint de payments.

## 🔧 **Pasos de Diagnóstico:**

### **Paso 1: Verificar endpoint en backend**
```bash
# Verificar si existe la ruta
curl -X POST http://localhost:3000/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"test": true}'
```

### **Paso 2: Revisar logs del backend**
Cuando hagas click en "Pagar", verifica si aparecen logs del endpoint `/api/payments/create-preference` en el backend.

### **Paso 3: Verificar configuración MP**
¿Tiene el backend las variables de entorno de MercadoPago configuradas?

### **Paso 4: Probar con datos mínimos**
```javascript
// En consola del navegador, después de crear la orden:
const minimalData = {
  orderId: 123, // Usar ID de orden real
  payer: {
    name: "Test",
    surname: "User", 
    email: "test@test.com"
  },
  backUrls: {
    success: "http://localhost:5173/payment/success",
    failure: "http://localhost:5173/payment/failure", 
    pending: "http://localhost:5173/payment/pending"
  }
};

fetch('http://localhost:3000/api/payments/create-preference', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(minimalData)
}).then(r => r.json()).then(console.log).catch(console.error);
```

## 🚨 **Errores Comunes:**

### **Error 404 - Endpoint no existe**
```
Solución: Implementar POST /api/payments/create-preference en el backend
```

### **Error 401 - No autorizado**
```
Solución: Verificar que el token JWT sea válido
```

### **Error 500 - Error interno**
```
Solución: Verificar configuración de MercadoPago en backend
Variables: MP_ACCESS_TOKEN, MP_PUBLIC_KEY
```

### **Error de CORS**
```
Solución: Agregar /api/payments/* a la configuración de CORS del backend
```

## 🎯 **Logging Mejorado Agregado:**

He agregado logging detallado en el Checkout para diagnosticar mejor:

```javascript
console.log('📤 Enviando datos de preferencia:', preferenceData);
console.log('✅ Preferencia creada:', preference);
console.error('❌ Error response:', error.response);
console.error('❌ Error status:', error.response?.status);
console.error('❌ Error data:', error.response?.data);
```

## 🔄 **Próximos Pasos:**

1. **Hacer click en "Pagar"** y verificar qué logs aparecen en la consola
2. **Compartir el error específico** que aparece
3. **Verificar si el endpoint existe** en el backend
4. **Revisar configuración de MercadoPago** en el backend

## 💡 **Workaround Temporal:**

Si el endpoint de preferencias no está implementado, puedes usar el **simulador de pagos** mientras tanto:

```
Click en "🧪 Simular Pago (Testing)"
```

Esto debería funcionar y marcar la orden como PAID para testing.

---

**¿Podrías hacer click en "Pagar" de nuevo y compartir los logs específicos que aparecen en la consola?**
