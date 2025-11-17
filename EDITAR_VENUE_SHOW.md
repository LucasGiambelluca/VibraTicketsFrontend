# 🏟️ Editar Venue de un Show

**Fecha**: 2025-10-27  
**Versión**: 1.5.0  
**Estado**: ✅ Completado

---

## 🎯 FUNCIONALIDAD IMPLEMENTADA

### Nueva Característica:
Ahora se puede **cambiar el venue de un show** desde el Admin Dashboard.

**Cómo funciona**:
- El show hereda el venue del evento
- Al cambiar el venue, se actualiza el evento
- Todos los shows del evento heredan el nuevo venue

---

## 🎨 INTERFAZ

### Botón "Venue" en Acciones

En la tabla de Shows, cada fila tiene un nuevo botón:

```
┌──────────────────────────────────────────────────┐
│ Acciones                                         │
├──────────────────────────────────────────────────┤
│ [👁️ Ver] [📍 Venue] [➕ Secciones] [🗑️ Eliminar] │
└──────────────────────────────────────────────────┘
```

**Botón "Venue"**:
- Icono: 📍 (EnvironmentOutlined)
- Texto: "Venue"
- Tooltip: "Cambiar venue"

### Modal "Cambiar Venue"

Al hacer click en "Venue", se abre un modal:

```
┌─────────────────────────────────────────────────┐
│ Cambiar Venue • [Nombre del Evento]            │
├─────────────────────────────────────────────────┤
│ ⚠️ Información del Show                         │
│ Show: Concierto Rock                            │
│ Fecha: 15 de diciembre de 2025 21:00           │
│ Venue actual: Movistar Arena                    │
├─────────────────────────────────────────────────┤
│ Seleccionar nuevo venue                         │
│ [▼ Seleccionar venue                          ] │
│   - el teatrito - buenos aires (25,000 pers)    │
│   - Estadio Central - Sin ciudad (5,000 pers)   │
│   - Luna Park Test - Buenos Aires (8,500 pers)  │
├─────────────────────────────────────────────────┤
│ ℹ️ Nota: Al cambiar el venue del evento,        │
│ todos los shows asociados heredarán el nuevo    │
│ venue.                                          │
├─────────────────────────────────────────────────┤
│                          [Cancelar] [Guardar]   │
└─────────────────────────────────────────────────┘
```

**Características del selector**:
- ✅ Búsqueda por nombre
- ✅ Muestra nombre, ciudad y capacidad
- ✅ Ordenado alfabéticamente
- ✅ Validación requerida

---

## 🔄 FLUJO COMPLETO

### Cambiar Venue de un Show:

```
1. Admin → Shows
   ↓
2. Localizar el show en la tabla
   ↓
3. Click botón "Venue" (📍)
   ↓
4. Modal se abre mostrando:
   - Información del show
   - Venue actual
   - Selector de venues
   ↓
5. Seleccionar nuevo venue del dropdown
   ↓
6. Click "Guardar"
   ↓
7. Backend actualiza el evento con nuevo venue_id
   ↓
8. ✅ Mensaje: "Venue actualizado correctamente"
   ↓
9. Tabla se refresca automáticamente
   ↓
10. Show ahora muestra el nuevo venue
```

---

## 💻 IMPLEMENTACIÓN TÉCNICA

### 1. Estados Agregados

```javascript
// Estados para editar venue
const [editVenueOpen, setEditVenueOpen] = useState(false);
const [editVenueLoading, setEditVenueLoading] = useState(false);
const [editVenueForm] = Form.useForm();

// Cargar venues para el selector
const { venues } = useVenues({ limit: 100, sortBy: 'name', sortOrder: 'ASC' });
```

### 2. Función openEditVenue

```javascript
const openEditVenue = (show) => {
  setSelectedShow(show);
  setEditVenueOpen(true);
  
  // Buscar el evento para obtener el venue_id actual
  const event = events.find(e => e.id === (show.eventId || show.event_id));
  
  editVenueForm.setFieldsValue({
    venue_id: event?.venue_id || event?.venueId || null
  });
};
```

### 3. Función submitEditVenue

```javascript
const submitEditVenue = async () => {
  try {
    const values = await editVenueForm.validateFields();
    
    if (!values.venue_id) {
      message.warning('Seleccioná un venue');
      return;
    }

    setEditVenueLoading(true);
    
    // Buscar el evento asociado al show
    const event = events.find(e => e.id === (selectedShow.eventId || selectedShow.event_id));
    
    if (!event) {
      message.error('No se encontró el evento asociado al show');
      return;
    }

    console.log('📤 Actualizando venue del evento:', event.id);
    console.log('📤 Nuevo venue_id:', values.venue_id);
    
    // Actualizar el evento con el nuevo venue_id
    await eventsApi.updateEvent(event.id, {
      venue_id: Number(values.venue_id)
    });

    message.success('Venue actualizado correctamente');
    setEditVenueOpen(false);
    editVenueForm.resetFields();
    
    // Refrescar lista de shows
    loadAllShows();
  } catch (e) {
    console.error('❌ Error al actualizar venue:', e);
    const errorMsg = e.response?.data?.message || e.message || 'Error al actualizar venue';
    message.error(errorMsg);
  } finally {
    setEditVenueLoading(false);
  }
};
```

### 4. Botón en Acciones

```javascript
<Button 
  icon={<EnvironmentOutlined />} 
  size="small"
  onClick={() => openEditVenue(record)}
  title="Cambiar venue"
>
  Venue
</Button>
```

### 5. Modal

```javascript
<Modal
  title={selectedShow ? `Cambiar Venue • ${selectedShow.event_name}` : 'Cambiar Venue'}
  open={editVenueOpen}
  onCancel={() => setEditVenueOpen(false)}
  onOk={submitEditVenue}
  okText="Guardar"
  confirmLoading={editVenueLoading}
  width={600}
>
  {/* Información del show */}
  {/* Selector de venue */}
  {/* Nota informativa */}
</Modal>
```

---

## 🧪 TESTING

### Test 1: Cambiar Venue de un Show

```bash
1. Admin → Shows
2. Localizar un show en la tabla
3. Verificar venue actual en la columna "Venue"
4. Click botón "Venue" (📍)
5. Modal se abre
6. Verificar que muestra:
   ✅ Nombre del show
   ✅ Fecha del show
   ✅ Venue actual
7. Abrir dropdown "Seleccionar nuevo venue"
8. Verificar que muestra los 3 venues:
   ✅ el teatrito - buenos aires (25,000 personas)
   ✅ Estadio Central - Sin ciudad (5,000 personas)
   ✅ Luna Park Test - Buenos Aires (8,500 personas)
9. Seleccionar un venue diferente
10. Click "Guardar"
11. Verificar mensaje: "Venue actualizado correctamente"
12. Verificar que la tabla se refresca
13. Verificar que el show ahora muestra el nuevo venue
```

### Test 2: Búsqueda en Selector

```bash
1. Admin → Shows
2. Click "Venue" en cualquier show
3. Click en el dropdown
4. Escribir "luna"
5. ✅ Debería filtrar y mostrar solo "Luna Park Test"
6. Escribir "buenos"
7. ✅ Debería mostrar venues con "buenos" en nombre o ciudad
```

### Test 3: Validación

```bash
1. Admin → Shows
2. Click "Venue" en cualquier show
3. Click "Guardar" sin seleccionar venue
4. ✅ Debería mostrar error: "Seleccioná un venue"
```

### Test 4: Múltiples Shows del Mismo Evento

```bash
1. Crear 2 shows para el mismo evento
2. Verificar que ambos muestran el mismo venue
3. Cambiar venue desde uno de los shows
4. Refrescar tabla
5. ✅ Ambos shows deberían mostrar el nuevo venue
```

---

## 📊 COMPARACIÓN

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Cambiar venue** | ❌ No se podía | ✅ Botón "Venue" |
| **Selector de venues** | ❌ No | ✅ Dropdown con búsqueda |
| **Venue actual** | ❌ No mostraba | ✅ Muestra en modal |
| **Validación** | ❌ No | ✅ Campo requerido |
| **Búsqueda** | ❌ No | ✅ Filtro por nombre |
| **Feedback** | ❌ No | ✅ Mensajes de éxito/error |
| **Refetch** | ❌ No | ✅ Automático |

---

## ⚠️ NOTAS IMPORTANTES

### 1. Venue Heredado del Evento

El show **NO tiene venue propio**. Hereda del evento:

```
Evento
├── id: 1
├── name: "Concierto Rock"
└── venue_id: 1 (Movistar Arena)
     ↓ HEREDA
Show
├── id: 1
├── event_id: 1
└── venue (heredado del evento)
```

**Por eso**:
- Al cambiar el venue, se actualiza el **evento**
- Todos los shows del evento heredan el cambio

### 2. Actualización del Evento

```javascript
// Se actualiza el evento, NO el show
await eventsApi.updateEvent(event.id, {
  venue_id: Number(values.venue_id)
});
```

### 3. Refetch Automático

Después de actualizar, se refresca la lista:

```javascript
loadAllShows(); // Recarga shows y eventos
```

Esto hace un nuevo join y muestra el venue actualizado.

---

## 🎯 CASOS DE USO

### Caso 1: Cambio de Sede

**Escenario**: Un evento se muda a otro venue

**Solución**:
1. Admin → Shows
2. Click "Venue" en cualquier show del evento
3. Seleccionar nuevo venue
4. Guardar
5. ✅ Todos los shows del evento se actualizan

### Caso 2: Corrección de Error

**Escenario**: Se asignó el venue incorrecto al crear el evento

**Solución**:
1. Admin → Shows
2. Click "Venue" en el show
3. Seleccionar venue correcto
4. Guardar
5. ✅ Show muestra venue correcto

### Caso 3: Evento Sin Venue

**Escenario**: Se creó un evento sin asignar venue

**Solución**:
1. Admin → Shows
2. Show muestra "Sin venue" (tag rojo)
3. Click "Venue"
4. Seleccionar venue
5. Guardar
6. ✅ Show ahora tiene venue

---

## 🚀 MEJORAS FUTURAS

### 1. Editar Venue desde Eventos

Agregar botón similar en la tabla de Eventos:

```javascript
<Button onClick={() => openEditVenueForEvent(event)}>
  Cambiar Venue
</Button>
```

### 2. Historial de Cambios

Registrar cambios de venue:

```javascript
{
  event_id: 1,
  old_venue_id: 1,
  new_venue_id: 2,
  changed_by: user.id,
  changed_at: timestamp
}
```

### 3. Confirmación para Múltiples Shows

Si el evento tiene muchos shows, mostrar advertencia:

```javascript
if (event.show_count > 1) {
  Modal.confirm({
    title: 'Cambiar venue',
    content: `Este evento tiene ${event.show_count} shows. ¿Cambiar venue para todos?`,
    onOk: () => submitEditVenue()
  });
}
```

### 4. Preview del Cambio

Mostrar qué shows se verán afectados:

```
Cambio afectará a:
- Show 1: 15 Dic 2025 21:00
- Show 2: 16 Dic 2025 21:00
- Show 3: 17 Dic 2025 21:00
```

---

## 📝 ARCHIVOS MODIFICADOS

1. ✅ `src/pages/admin/AdminDashboard.jsx` - ShowsAdmin
   - Estados para editar venue
   - Hook useVenues para cargar venues
   - Función openEditVenue
   - Función submitEditVenue
   - Botón "Venue" en acciones
   - Modal de editar venue

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Botón "Venue" agregado en acciones
- [x] Modal de editar venue creado
- [x] Selector de venues con búsqueda
- [x] Muestra venue actual
- [x] Validación de campo requerido
- [x] Actualiza evento con nuevo venue_id
- [x] Refetch automático después de guardar
- [x] Mensajes de éxito/error
- [x] Logs de debugging
- [x] Documentación completa

---

## 🎉 RESULTADO FINAL

**Nueva funcionalidad**:
- ✅ Botón "Venue" en cada show
- ✅ Modal para cambiar venue
- ✅ Selector con búsqueda
- ✅ Actualización del evento
- ✅ Refetch automático
- ✅ Feedback claro

**Flujo completo**:
```
Click "Venue" 
  → Seleccionar nuevo venue 
    → Guardar 
      → Evento actualizado 
        → Shows heredan nuevo venue ✅
```

---

**🏟️ EDITAR VENUE DE SHOWS COMPLETAMENTE FUNCIONAL**

Última actualización: 2025-10-27  
Estado: ✅ Completado y Listo para Uso
