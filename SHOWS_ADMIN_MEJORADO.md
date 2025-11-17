# 🎭 Shows Admin - Mejorado con Venue y Asignación de Secciones

**Fecha**: 2025-10-27  
**Versión**: 1.4.0  
**Estado**: ✅ Completado

---

## 📋 PROBLEMAS RESUELTOS

### Usuario reportó:
1. "Los shows no tienen venue"
2. "Deberían estar asociados al evento que pertenecen"
3. "Tendríamos que poder asignarle entradas (secciones)"

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. **Shows con Venue y Evento Asociado**

**Problema**: Los shows no mostraban el venue ni el evento asociado.

**Solución**: Enriquecimiento de datos mediante join en frontend

```javascript
const loadAllShows = async () => {
  // Cargar shows Y eventos en paralelo
  const [showsResponse, eventsResponse] = await Promise.all([
    showsApi.listShows({}),
    eventsApi.getEvents({ limit: 100 })
  ]);
  
  // Enriquecer shows con información del evento
  const enrichedShows = showsList.map(show => {
    const event = eventsList.find(e => e.id === (show.eventId || show.event_id));
    return {
      ...show,
      event_name: event?.name || `Evento #${show.eventId}`,
      venue_name: event?.venue_name || 'Sin venue',
      venue_city: event?.venue_city
    };
  });
  
  setShows(enrichedShows);
};
```

**Resultado**:
- ✅ Cada show muestra el nombre del evento
- ✅ Cada show muestra el venue heredado del evento
- ✅ Cada show muestra la ciudad del venue

### 2. **Asignación de Secciones/Entradas**

**Problema**: No había forma de asignar secciones a los shows.

**Solución**: Modal de asignación de secciones desde ShowsAdmin

**Características**:
- Botón "Secciones" en cada show
- Modal con formulario dinámico (Form.List)
- Muestra secciones existentes
- Permite agregar múltiples secciones
- Campos: Nombre, Tipo (Numerada/General), Precio, Capacidad

**Código**:
```javascript
const openAssignSections = async (show) => {
  setSelectedShow(show);
  setAssignOpen(true);
  
  // Cargar secciones existentes
  const res = await showsApi.getShowSections(show.id);
  setShowSections(res?.sections || []);
};

const submitAssignSections = async () => {
  const sections = values.sections || [];
  
  for (const section of sections) {
    await showsApi.createSection(selectedShow.id, {
      name: section.name,
      kind: section.kind || 'GA',
      capacity: Number(section.capacity),
      priceCents: Math.round(Number(section.price) * 100)
    });
  }
  
  message.success(`${sections.length} sección(es) creada(s)`);
  loadAllShows(); // Refrescar
};
```

---

## 🎨 INTERFAZ ACTUALIZADA

### Tabla de Shows

**Columnas**:
1. **ID**: Identificador del show
2. **Evento**: Nombre del evento asociado ✨ NUEVO
3. **Fecha**: Fecha formateada (dd MMM yyyy)
4. **Hora**: Hora formateada (HH:mm)
5. **Venue**: Nombre del venue ✨ MEJORADO
6. **Disponibles**: Entradas disponibles con tag de color
7. **Acciones**: Ver, Secciones ✨ NUEVO, Eliminar

**Botones de Acción**:
- 👁️ **Ver**: Abre el show en nueva pestaña
- ➕ **Secciones**: Abre modal para asignar secciones ✨ NUEVO
- 🗑️ **Eliminar**: Elimina el show

### Modal "Asignar Secciones"

**Header**:
- Título: "Asignar Secciones • [Nombre del Evento]"

**Información del Show** (caja azul):
- Show: Nombre del evento
- Fecha: Fecha y hora completa
- Venue: Nombre del venue

**Secciones Existentes**:
- Muestra tags con secciones ya creadas
- Formato: "Nombre - $Precio - Capacidad lugares"

**Formulario Dinámico**:
```
┌─────────────────────────────────────────┐
│ Nombre de la sección    │ Tipo          │
│ [Platea            ]    │ [🪑 Numerada] │
├─────────────────────────────────────────┤
│ Precio ($) │ Capacidad │ [Eliminar]    │
│ [15000]    │ [100]     │               │
└─────────────────────────────────────────┘
[+ Agregar Sección]
```

**Tipos de Sección**:
- 🪑 **Numerada** (SEATED): Con asientos específicos
- 🎫 **General** (GA): Sin asientos asignados

---

## 🔄 FLUJO COMPLETO

### Crear Show con Venue:
```
1. Admin → Eventos
2. Seleccionar evento CON venue
3. Click "Nuevo Show"
4. Seleccionar fecha/hora
5. Click "Crear Show"
   ↓
6. Show creado con venueId heredado del evento ✅
7. refetch() actualiza tabla
   ↓
8. Admin → Shows
9. Show aparece con:
   - Evento asociado ✅
   - Venue heredado ✅
   - Fecha y hora ✅
```

### Asignar Secciones:
```
1. Admin → Shows
2. Localizar show en la tabla
3. Click botón "Secciones"
   ↓
4. Modal se abre mostrando:
   - Info del show
   - Secciones existentes (si hay)
   ↓
5. Click "Agregar Sección"
6. Completar:
   - Nombre: "Platea"
   - Tipo: "🪑 Numerada"
   - Precio: 15000
   - Capacidad: 100
   ↓
7. Repetir para más secciones
8. Click "Guardar"
   ↓
9. Secciones creadas ✅
10. Tabla se actualiza
```

### Verificar Secciones:
```
1. Usuario → /shows/:showId
2. ShowDetail carga secciones
3. Muestra grilla de localidades ✅
4. Usuario puede seleccionar y comprar ✅
```

---

## 📊 COMPARACIÓN

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Evento asociado** | ❌ No mostraba | ✅ Muestra nombre |
| **Venue** | ❌ "Sin venue" | ✅ Heredado del evento |
| **Asignar secciones** | ❌ No había | ✅ Modal completo |
| **Secciones existentes** | ❌ No mostraba | ✅ Muestra tags |
| **Formulario dinámico** | ❌ No | ✅ Form.List |
| **Tipos de sección** | ❌ No | ✅ Numerada/General |

---

## 🧪 TESTING

### Test 1: Verificar Venue en Shows
```bash
1. Crear venue "Test Arena"
2. Crear evento "Test Event" con venue "Test Arena"
3. Crear show para el evento
4. Admin → Shows
5. Verificar que el show muestra:
   ✅ Evento: "Test Event"
   ✅ Venue: "Test Arena"
```

### Test 2: Asignar Secciones
```bash
1. Admin → Shows
2. Click "Secciones" en un show
3. Verificar que se muestra:
   ✅ Nombre del evento
   ✅ Fecha y hora
   ✅ Venue
4. Click "Agregar Sección"
5. Completar:
   - Nombre: "Platea"
   - Tipo: "Numerada"
   - Precio: 15000
   - Capacidad: 100
6. Click "Agregar Sección" otra vez
7. Completar segunda sección
8. Click "Guardar"
9. Verificar mensaje: "2 sección(es) creada(s)"
```

### Test 3: Ver Secciones en Frontend
```bash
1. Crear show con secciones
2. Usuario → /shows/:showId
3. Verificar que se muestran las secciones
4. Verificar precios, capacidad, disponibilidad
5. Seleccionar una sección
6. Click "Continuar"
7. Verificar navegación correcta
```

### Test 4: Secciones Existentes
```bash
1. Asignar secciones a un show
2. Cerrar modal
3. Volver a abrir "Secciones" del mismo show
4. Verificar que muestra:
   ✅ Tags con secciones existentes
   ✅ Nombre - Precio - Capacidad
```

---

## 📝 ARCHIVOS MODIFICADOS

1. ✅ `src/pages/admin/AdminDashboard.jsx` - ShowsAdmin
   - Carga eventos en paralelo con shows
   - Enriquece shows con datos del evento
   - Muestra evento y venue en tabla
   - Modal de asignación de secciones
   - Formulario dinámico con Form.List
   - Muestra secciones existentes
   - Botón "Secciones" en acciones

---

## 🔗 ENDPOINTS UTILIZADOS

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/shows` | GET | Listar todos los shows |
| `/api/events` | GET | Obtener eventos para join |
| `/api/shows/:showId/sections` | GET | Obtener secciones del show |
| `/api/shows/:showId/sections` | POST | Crear sección |
| `/api/shows/:showId` | DELETE | Eliminar show |

---

## ⚠️ NOTAS IMPORTANTES

### 1. Venue Heredado

El show **NO tiene venueId propio**. Hereda el venue del evento:

```
Evento → venueId: 1
  ↓
Show → eventId: 1 (hereda venueId del evento)
```

Por eso hacemos el join en frontend:
```javascript
const event = eventsList.find(e => e.id === show.eventId);
show.venue_name = event?.venue_name;
```

### 2. Precios en Centavos

Los precios se envían en centavos al backend:
```javascript
priceCents: Math.round(Number(section.price) * 100)
// $15000 → 1500000 centavos
```

### 3. Tipos de Sección

- **SEATED**: Requiere selección de asiento específico
- **GA**: Solo requiere cantidad de entradas

### 4. Form.List

Permite agregar/eliminar secciones dinámicamente:
```javascript
<Form.List name="sections">
  {(fields, { add, remove }) => (
    <>
      {fields.map(({ key, name }) => (
        <Card key={key}>
          {/* Campos de la sección */}
          <Button onClick={() => remove(name)}>Eliminar</Button>
        </Card>
      ))}
      <Button onClick={() => add()}>Agregar Sección</Button>
    </>
  )}
</Form.List>
```

---

## 🚀 PRÓXIMAS MEJORAS SUGERIDAS

### 1. Editar Secciones
- Permitir modificar secciones existentes
- Botón "Editar" en cada tag de sección

### 2. Eliminar Secciones
- Botón para eliminar secciones individuales
- Confirmación antes de eliminar

### 3. Validaciones Avanzadas
- Capacidad total no debe exceder capacidad del venue
- Precios mínimos/máximos
- Nombres únicos de sección por show

### 4. Vista Previa
- Mostrar cómo se verá la sección en el frontend
- Preview del mapa de asientos (para SEATED)

### 5. Plantillas
- Guardar configuraciones de secciones como plantillas
- Aplicar plantilla a múltiples shows

### 6. Estadísticas
- Mostrar % de ocupación por sección
- Ingresos proyectados vs reales
- Secciones más vendidas

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Shows muestran evento asociado
- [x] Shows muestran venue heredado
- [x] Shows muestran ciudad del venue
- [x] Botón "Secciones" en cada show
- [x] Modal de asignación de secciones
- [x] Formulario dinámico (agregar/eliminar)
- [x] Muestra secciones existentes
- [x] Tipos de sección (Numerada/General)
- [x] Validaciones de campos
- [x] Creación de múltiples secciones
- [x] Refetch después de crear
- [x] Logs de debugging
- [x] Mensajes de éxito/error
- [x] Documentación completa

---

## 🎯 RESULTADO FINAL

✅ **Problemas resueltos**:
- Shows ahora muestran el evento asociado
- Shows ahora muestran el venue (heredado del evento)
- Se pueden asignar secciones/entradas a los shows
- Interfaz completa y funcional

✅ **Funcionalidades agregadas**:
- Join de shows con eventos en frontend
- Modal de asignación de secciones
- Formulario dinámico para múltiples secciones
- Visualización de secciones existentes
- Botón dedicado en tabla de shows

✅ **UX mejorada**:
- Información clara del show
- Proceso intuitivo de asignación
- Feedback visual inmediato
- Validaciones en tiempo real

---

**🎉 SHOWS ADMIN COMPLETAMENTE FUNCIONAL**

Última actualización: 2025-10-27  
Estado: ✅ Completado y Listo para Producción
