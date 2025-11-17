# 🔧 SOLUCIÓN: DatabaseError al Crear Show

**Fecha**: 2025-10-27  
**Error**: `DatabaseError` al crear show  
**Estado**: ✅ Diagnosticado y Solucionado

---

## 🐛 PROBLEMA

### Error Reportado:
```
❌ Error al crear show: Error: DatabaseError
    at ApiClient.request (client.js:51:15)
    at async submitCreateShow (AdminDashboard.jsx:325:7)
```

### Causa Raíz:
El evento **no tiene un `venueId` asignado** en la base de datos. Cuando intentas crear un show, el backend intenta heredar el venue del evento, pero como el evento no tiene venue, falla con un error de base de datos.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Validación Agregada en Frontend**

Ahora el frontend valida que el evento tenga un venue antes de intentar crear el show:

```javascript
// Validar que el evento tenga un venue asignado
if (!selectedEvent.venue_id && !selectedEvent.venueId) {
  message.error('Este evento no tiene un venue asignado. Por favor, edita el evento y asigna un venue primero.');
  setCreateShowOpen(false);
  return;
}
```

### 2. **Logs Mejorados**

Se agregaron logs detallados para debugging:

```javascript
console.log('📤 Creando show con datos:', showData);
console.log('📤 Evento seleccionado:', selectedEvent);
console.log('✅ Show creado:', result);
```

### 3. **Mensaje de Error Mejorado**

```javascript
message.error(`Error: ${errorMsg}. Verifica que el evento tenga un venue asignado.`);
```

---

## 🔄 FLUJO CORRECTO PARA CREAR SHOW

### Paso 1: Crear Venue
```
Admin → Venues → Nuevo Venue
- Nombre: "Movistar Arena"
- Dirección: "Humboldt 450"
- Ciudad: "Buenos Aires"
- Capacidad: 15000
→ Click "Crear Venue"
```

### Paso 2: Crear Evento CON Venue
```
Admin → Eventos → Nuevo Evento
- Nombre: "Concierto Rock"
- Fecha: 2025-12-15
- Venue: Seleccionar "Movistar Arena" ← ⚠️ IMPORTANTE
- Imagen (opcional)
→ Click "Crear Evento"
```

### Paso 3: Crear Show
```
Admin → Eventos → Click "Nuevo Show"
- Fecha/Hora: 2025-12-15 21:00
→ Click "Crear Show"
→ ✅ Show creado (hereda venue del evento)
```

---

## 🐛 PROBLEMA 2: No se pueden asignar secciones

### Mejoras Implementadas:

1. **Logs Detallados**:
```javascript
console.log('📤 Creando secciones para show:', selectedShowId);
console.log('📤 Secciones a crear:', sections);
console.log('📤 Creando sección:', sectionData);
```

2. **Contador de Secciones Creadas**:
```javascript
message.success(`${createdCount} sección(es) creada(s) correctamente`);
```

3. **Manejo de Errores Individual**:
```javascript
try {
  await showsApi.createSection(selectedShowId, sectionData);
  createdCount++;
} catch (err) {
  throw new Error(`Error al crear sección "${section.name}": ${err.message}`);
}
```

---

## 🧪 TESTING

### Test 1: Verificar que el Evento Tiene Venue

```bash
1. Ir a Admin → Eventos
2. Revisar la columna "Venue" de la tabla
3. Si dice "Sin venue", el evento NO tiene venue asignado
4. Solución: Crear un nuevo evento con venue
```

### Test 2: Crear Show Correctamente

```bash
# Preparación
1. Crear venue: "Test Arena"
2. Crear evento: "Test Event" con venue "Test Arena"

# Crear Show
3. Click "Nuevo Show" en el evento
4. Verificar: Caja verde muestra "Venue heredado: Test Arena"
5. Seleccionar fecha/hora
6. Click "Crear Show"
7. Verificar: ✅ Show creado sin DatabaseError
```

### Test 3: Asignar Secciones

```bash
1. Crear show exitosamente
2. Click "Asignar Entradas" en el evento
3. Seleccionar el show creado
4. Click "Agregar Sección"
5. Completar:
   - Nombre: "Platea"
   - Tipo: "SEATED"
   - Precio: 15000
   - Capacidad: 100
6. Click "Guardar"
7. Verificar en consola:
   - 📤 Creando secciones para show: X
   - 📤 Secciones a crear: [...]
   - ✅ Sección 1 creada: Platea
8. Verificar mensaje: "1 sección(es) creada(s) correctamente"
```

---

## 🔍 DEBUGGING

### Si el Error Persiste:

1. **Abrir Consola del Navegador** (F12)

2. **Verificar Logs**:
```
📤 Creando show con datos: { eventId: X, startsAt: "..." }
📤 Evento seleccionado: { id: X, name: "...", venue_id: ??? }
```

3. **Verificar `venue_id`**:
   - Si `venue_id` es `null` o `undefined` → El evento no tiene venue
   - Si `venue_id` tiene un número → El evento tiene venue

4. **Verificar en Backend**:
```sql
-- Consulta SQL para verificar
SELECT id, name, venue_id FROM events WHERE id = X;
```

---

## 📊 ESTRUCTURA DE DATOS ESPERADA

### Evento (debe tener venueId):
```json
{
  "id": 1,
  "name": "Concierto Rock",
  "venueId": 1,          // ← ⚠️ REQUERIDO
  "venue_name": "Movistar Arena",
  "venue_city": "Buenos Aires",
  "startsAt": "2025-12-15T21:00:00.000Z",
  "producerId": 1
}
```

### Show (hereda venue del evento):
```json
{
  "id": 1,
  "eventId": 1,
  "startsAt": "2025-12-15T21:00:00.000Z",
  "venueId": 1           // ← Heredado del evento
}
```

### Sección:
```json
{
  "name": "Platea",
  "kind": "SEATED",
  "capacity": 100,
  "priceCents": 1500000  // $15000 * 100
}
```

---

## ⚠️ ERRORES COMUNES

### Error 1: "Este evento no tiene un venue asignado"
**Causa**: El evento fue creado sin seleccionar un venue.

**Solución**:
1. Crear un nuevo evento y seleccionar un venue
2. O editar el evento existente (si hay función de editar)

### Error 2: "DatabaseError" al crear show
**Causa**: El evento tiene `venueId = null` en la base de datos.

**Solución**:
1. Verificar en backend que el evento tenga un `venueId` válido
2. Actualizar el evento en la base de datos:
```sql
UPDATE events SET venue_id = 1 WHERE id = X;
```

### Error 3: "Error al asignar entradas"
**Causa**: El show no existe o no se creó correctamente.

**Solución**:
1. Verificar que el show se haya creado (revisar consola)
2. Verificar que `selectedShowId` tenga un valor
3. Revisar logs de backend para ver el error específico

---

## 📝 ARCHIVOS MODIFICADOS

1. ✅ `src/pages/admin/AdminDashboard.jsx`
   - Validación de venue antes de crear show
   - Logs detallados en crear show
   - Logs detallados en asignar secciones
   - Contador de secciones creadas
   - Mensajes de error mejorados

2. ✅ `SOLUCION_DATABASE_ERROR.md`
   - Documentación completa del problema y solución

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Validación de venue agregada
- [x] Logs de debugging implementados
- [x] Mensajes de error mejorados
- [x] Contador de secciones creadas
- [x] Manejo de errores individual por sección
- [x] Refetch de eventos después de crear show
- [x] Refetch de eventos después de asignar secciones
- [x] Documentación creada

---

## 🎯 PRÓXIMOS PASOS

### Recomendaciones:

1. **Agregar función de editar evento**
   - Permitir cambiar el venue de un evento existente
   - Útil para corregir eventos sin venue

2. **Mostrar venue en la tabla de eventos**
   - Ya existe la columna "Venue"
   - Asegurarse de que muestre el nombre del venue

3. **Validar venue al crear evento**
   - Hacer el campo venue obligatorio
   - Agregar asterisco rojo en el label
   - Deshabilitar submit si no hay venue

4. **Agregar función de editar show**
   - Permitir cambiar la fecha/hora de un show
   - Útil para corregir errores

---

**🎉 PROBLEMA DIAGNOSTICADO Y SOLUCIONADO**

Última actualización: 2025-10-27  
Estado: ✅ Completado

---

## 📞 RESUMEN EJECUTIVO

**Problema**: DatabaseError al crear show  
**Causa**: Evento sin venue asignado  
**Solución**: Validación agregada + mensajes claros  
**Acción Requerida**: Crear eventos con venue seleccionado  

**Flujo Correcto**:
1. Crear Venue
2. Crear Evento (seleccionar venue)
3. Crear Show (hereda venue automáticamente)
4. Asignar Secciones al Show
