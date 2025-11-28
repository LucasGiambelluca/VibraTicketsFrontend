# 🔧 DEBUG: Problema al Crear Códigos de Descuento

## Problema Reportado
"No crea el código de descuento"

## Cambios Realizados para Debug

### 1. Logs en el Formulario (`DiscountCodeForm.jsx`)
Cuando hagas clic en "Crear Código", verás:
```
====================
📦 DiscountCodeForm - handleSubmit
Valores RAW del formulario: { ... }
====================
Valores PROCESADOS a enviar: { ... }
Llamando a onSubmit...
====================
```

### 2. Logs en el Controlador (`DiscountCodes.jsx`)
Cuando el formulario llama a `handleFormSubmit`:
```
====================
📤 FORMULARIO ENVIADO - handleFormSubmit
Valores del formulario: { ... }
Editando código existente? false
====================
Creando nuevo código...
✅ Operación exitosa, cerrando modal y recargando...
====================
```

### 3. Logs en el Servicio (`discountService.js`)
Cuando se llama a `createCode`:
```
====================
🏷️ CREANDO CÓDIGO DE DESCUENTO
Datos recibidos del formulario: { ... }
====================
Payload formateado para el backend:
{
  "code": "CODIGO2024",
  "description": "...",
  "discount_type": "PERCENTAGE",
  "discount_value": 20,
  ...
}
Endpoint: POST /api/admin/discount-codes
====================
✅ CÓDIGO CREADO EXITOSAMENTE
Respuesta del backend: { ... }
====================
```

## Cómo Debuggear

### Paso 1: Abrí la Consola
1. Presioná `F12`
2. Andá a la pestaña "Console"

### Paso 2: Intentá Crear un Código
1. Andá al panel de Códigos de Descuento en Admin
2. Hacé clic en "Nuevo Código" o similar
3. Completá el formulario:
   - **Código:** `TEST2024` (obligatorio)
   - **Descripción:** `Código de prueba` (obligatorio)
   - **Tipo:** Porcentaje
   - **Valor:** `20`
4. Hacé clic en "Crear Código"
5. **Mirá la consola**

### Paso 3: Identificá Dónde Falla

#### ❌ Escenario A: No aparece NINGÚN log
**Síntoma:** La consola está vacía, no aparece ningún log
**Problema:** El formulario no se está enviando
**Posibles causas:**
- Error de validación en el formulario
- El botón no está conectado al formulario
- JavaScript bloqueado

**Solución:**
1. Verificá que el formulario esté completo (todos los campos obligatorios)
2. Mirá si hay errores en rojo debajo de los campos
3. Hacé clic derecho en el botón "Crear Código" → Inspeccionar elemento

---

#### ❌ Escenario B: Solo aparece log del formulario (📦)
**Síntoma:** Ves `📦 DiscountCodeForm - handleSubmit` pero no el siguiente
**Problema:** El `onSubmit` no se está llamando correctamente
**Posibles causas:**
- El prop `onSubmit` no está conectado
- Hay un error en la función

**Solución:**
1. Verificá que `DiscountCodeForm` tenga el prop `onSubmit={handleFormSubmit}`

---

#### ❌ Escenario C: Aparece log del formulario Y del controlador (📤)
**Síntoma:** Ves los logs 📦 y 📤, pero no el del servicio (🏷️)
**Problema:** El servicio no se está llamando
**Posibles causas:**
- Error antes de llamar a `discountService.createCode`
- El servicio no está importado

**Solución:**
1. Mirá si hay errores en rojo en la consola
2. Verificá que `discountService` esté importado correctamente

---

#### ❌ Escenario D: Aparece log del servicio pero con ERROR
**Síntoma:** Ves 🏷️ pero luego `❌ ERROR AL CREAR CÓDIGO DE DESCUENTO`
**Problema:** El backend está fallando
**Posibles causas:**
- Endpoint no existe (404)
- No hay permisos (401/403)
- El código ya existe (409)
- Error del backend (500)

**Solución según el error:**

##### Error 404 - Endpoint no encontrado
```
Status: 404
```
**Problema:** El backend no tiene el endpoint `POST /api/admin/discount-codes`
**Solución:** 
- Verificá que el backend esté corriendo
- Verificá que el endpoint exista en el backend
- Revisá la URL base de la API

##### Error 401 - No autenticado
```
Status: 401
```
**Problema:** No hay token de autenticación o expiró
**Solución:**
- Cerrá sesión e iniciá sesión nuevamente
- Verificá que el token esté en localStorage:
  1. En la consola escribí: `localStorage.getItem('token')`
  2. Debería mostrar un token largo

##### Error 403 - No autorizado
```
Status: 403
```
**Problema:** El usuario no tiene permisos de ADMIN
**Solución:**
- Verificá el rol del usuario en localStorage:
  1. En la consola: `JSON.parse(localStorage.getItem('user')).role`
  2. Debería mostrar: `ADMIN` u `ORGANIZER`

##### Error 409 - Código duplicado
```
Status: 409
Error data: { error: "Code already exists" }
```
**Problema:** Ya existe un código con ese nombre
**Solución:**
- Usá un código diferente
- O editá el código existente en lugar de crear uno nuevo

##### Error 500 - Error del servidor
```
Status: 500
```
**Problema:** El backend tiene un error interno
**Solución:**
- Revisá los logs del backend
- Verificá la conexión a la base de datos
- Verificá que todos los campos requeridos estén presentes

---

#### ✅ Escenario E: Todo funciona
**Síntoma:** Ves todos los logs y termina con `✅ CÓDIGO CREADO EXITOSAMENTE`
**Resultado:** ¡El código se creó correctamente!
**Siguientes pasos:**
1. El modal debería cerrarse
2. La tabla debería recargarse
3. Deberías ver el nuevo código en la lista

---

## Información para Compartir

Si el problema persiste, compartí:

### De la Consola:
1. **Todos los bloques** `====================` que aparezcan
2. **Cualquier error en rojo**
3. El **status code** si hay error HTTP
4. El **response data** si hay error

### Del Formulario:
1. Screenshot del formulario completo antes de enviar
2. Los valores que pusiste en cada campo

### Del Backend:
1. ¿Está corriendo el backend?
2. ¿En qué puerto? (ej: 3000, 4000, 5000)
3. Logs del backend cuando intentás crear el código

## Endpoint Esperado del Backend

### POST /api/admin/discount-codes

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "code": "CODIGO2024",
  "description": "Descripción del código",
  "discount_type": "PERCENTAGE",
  "discount_value": 20,
  "applicable_to": "ALL",
  "minimum_purchase": 0,
  "maximum_discount": null,
  "usage_limit": null,
  "usage_limit_per_user": 1,
  "valid_from": "2024-11-27T20:00:00.000Z",
  "valid_until": null,
  "is_active": true
}
```

**Response esperado (201 Created):**
```json
{
  "id": 1,
  "code": "CODIGO2024",
  "description": "Descripción del código",
  "discount_type": "PERCENTAGE",
  "discount_value": 20,
  ...
}
```

**Errores posibles:**
- **401:** No autenticado
- **403:** No autorizado (no es ADMIN)
- **404:** Endpoint no existe
- **409:** Código duplicado
- **500:** Error del servidor

## Checklist de Verificación

Antes de crear un código, verificá:
- [ ] Backend está corriendo
- [ ] Estás logueado como ADMIN o ORGANIZER
- [ ] El formulario está completo (código y descripción obligatorios)
- [ ] El código tiene entre 3 y 20 caracteres
- [ ] El código solo tiene letras mayúsculas y números
- [ ] El valor del descuento es válido (1-100% o mínimo $100)
- [ ] La consola del navegador está abierta (F12)

## Próximos Pasos

1. **Abrí la consola** antes de intentar crear el código
2. **Completá el formulario** con datos válidos de prueba
3. **Hacé clic en Crear Código**
4. **Leé los logs** en la consola para identificar dónde falla
5. **Compartí** los logs si no podés resolver el problema

---

**Última actualización:** 27 de Noviembre, 2024  
**Archivos modificados:**
- `src/components/admin/DiscountCodeForm.jsx`
- `src/pages/admin/DiscountCodes.jsx`
- `src/services/discountService.js`
