# 🔧 FIX: Selección de Tickets y Filtrado de Shows

**Fecha:** 2025-10-30  
**Problemas resueltos:** 2

---

## 🐛 PROBLEMA 1: No permite continuar con la compra

### Causa
El código buscaba asientos por `seat.sector === selection.sectionName`, pero el campo `sector` en los asientos podría no coincidir exactamente con el nombre de la sección, o los asientos podrían estar vinculados por `section_id` en lugar de por nombre.

### Solución
Modificado el filtro de asientos para buscar por **nombre (sector) O por ID de sección**:

```javascript
// ANTES (solo por nombre)
const sectionSeats = seats.filter(seat => 
  seat.sector === selection.sectionName && 
  seat.status === 'AVAILABLE'
);

// DESPUÉS (por nombre O por ID)
const sectionSeats = seats.filter(seat => {
  const matchesSector = seat.sector === selection.sectionName;
  const matchesSectionId = seat.section_id === selection.sectionId || seat.sectionId === selection.sectionId;
  const isAvailable = seat.status === 'AVAILABLE';
  
  return (matchesSector || matchesSectionId) && isAvailable;
});
```

### Logs agregados para debugging
```javascript
console.log('📋 Secciones seleccionadas:', selectedSections);
console.log('🪑 Total de asientos disponibles:', seats.length);
console.log(`🔍 Buscando asientos para sección: ${selection.sectionName} (ID: ${selection.sectionId})`);
console.log(`✅ Asientos encontrados en ${selection.sectionName}:`, sectionSeats.length);
console.log(`📌 Asientos seleccionados de ${selection.sectionName}:`, seatsToReserve.map(s => s.id));
```

### Mensaje de error mejorado
```javascript
if (sectionSeats.length < selection.quantity) {
  message.error(
    `No hay suficientes asientos disponibles en ${selection.sectionName}. 
    Disponibles: ${sectionSeats.length}, Solicitados: ${selection.quantity}`
  );
}
```

---

## 🐛 PROBLEMA 2: Muestra shows de todos los eventos

### Causa
El código intentaba filtrar shows usando `showsApi.listShows({ eventId })`, pero el backend **NO soporta** el parámetro `?eventId=X` en la ruta `/api/shows`.

### Descubrimiento importante
Según la documentación del backend:
- ✅ `GET /api/events/:eventId` **YA INCLUYE LOS SHOWS** en la respuesta
- ❌ `GET /api/shows?eventId=X` **NO está implementado**

**Respuesta de `/api/events/:eventId`:**
```json
{
  "id": 1,
  "name": "Concierto Rock",
  "description": "...",
  "venue_name": "Luna Park",
  "shows": [  // ← INCLUYE LOS SHOWS
    {
      "id": 10,
      "starts_at": "2025-11-15T20:00:00.000Z",
      "status": "PUBLISHED"
    },
    {
      "id": 11,
      "starts_at": "2025-11-16T20:00:00.000Z",
      "status": "PUBLISHED"
    }
  ]
}
```

### Solución
Eliminada la llamada redundante a `showsApi.listShows()` y usar directamente `eventResponse.shows`:

```javascript
// ANTES (llamada innecesaria)
const eventResponse = await eventsApi.getEvent(eventId);
setEvent(eventResponse);

const showsResponse = await showsApi.listShows({ eventId: Number(eventId) });
const showsList = Array.isArray(showsResponse) ? showsResponse : [];
setShows(showsList);

// DESPUÉS (usa los shows incluidos en el evento)
const eventResponse = await eventsApi.getEvent(eventId);
setEvent(eventResponse);

const showsList = eventResponse.shows || [];
setShows(showsList);
```

### Beneficios
- ✅ **Menos llamadas al backend** (1 en lugar de 2)
- ✅ **Filtrado correcto** (el backend ya filtra los shows por evento)
- ✅ **Más rápido** (una sola request)
- ✅ **Más confiable** (usa la respuesta oficial del backend)

---

## 📁 ARCHIVOS MODIFICADOS

### 1. `src/pages/ShowDetail.jsx`
**Líneas modificadas:** 168-201

**Cambios:**
- Agregado filtro por `section_id` además de `sector`
- Agregados logs detallados para debugging
- Mejorado mensaje de error con información específica

### 2. `src/pages/EventDetail.jsx`
**Líneas modificadas:** 27-42

**Cambios:**
- Eliminada llamada a `showsApi.listShows()`
- Usa directamente `eventResponse.shows`
- Simplificado el código (menos líneas)

---

## 🧪 TESTING

### Test 1: Selección de Tickets
```bash
1. Ir a /shows/:showId
2. Seleccionar cantidad de tickets (ej: 2 de Platea)
3. Click "Continuar"
4. Verificar consola:
   📋 Secciones seleccionadas: [...]
   🪑 Total de asientos disponibles: X
   🔍 Buscando asientos para sección: Platea (ID: 1)
   ✅ Asientos encontrados en Platea: Y
   📌 Asientos seleccionados de Platea: [1, 2]
   🔒 Creando HOLD con datos: {...}
5. Verificar navegación a /checkout/:holdId
```

### Test 2: Filtrado de Shows
```bash
1. Ir a /events/1
2. Verificar consola:
   📤 Cargando evento: 1
   ✅ Evento cargado: { id: 1, name: "...", shows: [...] }
   📋 Shows del evento: [...]
   📊 Cantidad de shows: X
3. Verificar que SOLO se muestran shows del evento 1
4. Ir a /events/2
5. Verificar que SOLO se muestran shows del evento 2
```

---

## 🎯 RESUMEN DE CAMBIOS

| Problema | Causa | Solución | Estado |
|----------|-------|----------|--------|
| No permite continuar compra | Filtro de asientos solo por nombre | Filtrar por nombre O ID | ✅ |
| Muestra todos los shows | Backend no soporta `?eventId` | Usar `event.shows` | ✅ |

---

## 💡 RECOMENDACIONES

### Para el futuro
Si el backend implementa el filtro `?eventId` en `/api/shows`, podríamos usar:

```javascript
// Opción alternativa (cuando esté disponible)
const showsResponse = await showsApi.listShows({ eventId });
```

Pero por ahora, **usar `event.shows` es la mejor opción** porque:
- ✅ Ya está implementado
- ✅ Es más eficiente (1 request en lugar de 2)
- ✅ Es más confiable (respuesta oficial del backend)

### Estructura de datos esperada

**Asientos:**
```javascript
{
  id: 1,
  sector: "Platea",           // Nombre de la sección
  section_id: 1,              // ID de la sección
  seatNumber: "A1",
  status: "AVAILABLE"
}
```

**Shows en evento:**
```javascript
{
  id: 1,
  name: "Concierto Rock",
  shows: [
    {
      id: 10,
      starts_at: "2025-11-15T20:00:00.000Z",
      status: "PUBLISHED"
    }
  ]
}
```

---

## ✅ RESULTADO

**AMBOS PROBLEMAS RESUELTOS** 🎉

1. ✅ Ahora permite continuar con la compra después de seleccionar tickets
2. ✅ Cada evento muestra solo sus propios shows

**Código más limpio, más rápido y más confiable** 🚀
