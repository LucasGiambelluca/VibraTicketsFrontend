# 🧪 Test Rápido - Códigos de Descuento

## Pasos para probar:

1. **Iniciá sesión como ADMIN**
   - Email: (tu email de admin)
   - Password: (tu password)

2. **Abrí la consola del navegador**
   - Presioná F12
   - Andá a la pestaña "Console"
   - Dejala abierta

3. **Andá a Códigos de Descuento**
   - Menú Admin → Códigos de Descuento
   - O navega a: http://localhost:5174/admin/discount-codes

4. **Hacé clic en "Nuevo Código"** (o botón similar)

5. **Completá el formulario con estos datos de prueba:**
   ```
   Código: TEST2024
   Descripción: Código de prueba para debug
   Tipo: Porcentaje (%)
   Valor: 20
   Aplicable a: Todos los eventos
   Compra Mínima: 0 (o dejalo en blanco)
   ```

6. **Hacé clic en "Crear Código"**

7. **Mirá la consola inmediatamente**
   - ¿Aparece `📦 DiscountCodeForm - handleSubmit`?
   - ¿Aparece `📤 FORMULARIO ENVIADO`?
   - ¿Aparece `🏷️ CREANDO CÓDIGO DE DESCUENTO`?
   - ¿Aparece algún error en rojo?

## Qué buscar:

### ✅ Si TODO funciona correctamente verás:
```
====================
📦 DiscountCodeForm - handleSubmit
Valores RAW del formulario: {...}
====================
📤 FORMULARIO ENVIADO - handleFormSubmit
Valores del formulario: {...}
====================
🏷️ CREANDO CÓDIGO DE DESCUENTO
Datos recibidos del formulario: {...}
====================
✅ CÓDIGO CREADO EXITOSAMENTE
Respuesta del backend: {...}
====================
```

### ❌ Si FALLA verás uno de estos escenarios:

#### Escenario 1: NO aparece NINGÚN log
**Problema:** El formulario no se envía
**Posibles causas:**
- Hay un error de validación (mirá si hay mensajes en rojo en los campos)
- El botón no está conectado

#### Escenario 2: Solo aparece 📦
**Problema:** El onSubmit no se llama
**Posibles causas:**
- Error de props en el componente

#### Escenario 3: Aparece 📦 y 📤 pero NO 🏷️
**Problema:** El servicio no se llama
**Posibles causas:**
- Error antes de llamar a discountService.createCode

#### Escenario 4: Aparece 🏷️ pero con ❌ ERROR
**Problema:** El backend falla
**Mirá el Status Code:**
- 401: No autenticado → Volvé a iniciar sesión
- 403: Sin permisos → Verificá que seas ADMIN
- 404: Endpoint no existe → Backend no tiene el endpoint
- 409: Código duplicado → Usá otro código
- 500: Error del servidor → Revisá logs del backend

## Copiá y compartí:

Una vez que hagas las pruebas, compartí:
1. **Todos los logs** que aparecen en la consola (copialos completos)
2. **El mensaje de error** que ves en pantalla (si hay alguno)
3. **En qué escenario** (1, 2, 3 o 4) estás
