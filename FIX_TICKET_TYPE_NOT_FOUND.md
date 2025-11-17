# 🐛 Fix: TicketTypeNotFound Error

**Fecha:** 2025-01-29  
**Error:** `TicketTypeNotFound`  
**Causa:** Mismatch entre sistema V1 (sections) y V2 (ticket_types)

---

## 🎯 El Problema

### Error Actual:
```
❌ Error al crear reserva: Error: TicketTypeNotFound
```

### Causa:
Hay un **mismatch entre dos sistemas**:

1. **ShowDetail** usa `showsApi.getShowSections(showId)` → Devuelve **sections** (V1)
2. **SeatSelection** usa `ticketsApi.createReservation()` → Espera **ticket_type_id** (V2)

El backend V2 busca un `ticket_type_id` que no existe porque estamos enviando un `section_id`.

---

## 🔍 Flujo Actual (Problemático)

```
ShowDetail
  ↓
  showsApi.getShowSections(showId)
  ↓
  Devuelve: [{ id: 1, name: "Platea", ... }]  ← section_id
  ↓
  navigate('/seats/:showId', { state: { section } })
  ↓
SeatSelection
  ↓
  typeId: section.id  ← Usa section_id
  ↓
  ticketsApi.createReservation({ eventId, tickets: [{ typeId: 1 }] })
  ↓
Backend V2
  ↓
  Busca ticket_type con id=1
  ↓
  ❌ TicketTypeNotFound (porque 1 es un section_id, no un ticket_type_id)
```

---

## ✅ Solución

### Opción 1: Usar Endpoint V2 en ShowDetail (Recomendado)

Cambiar `ShowDetail` para que use el endpoint correcto del backend V2:

```javascript
// En ShowDetail.jsx

// ANTES (V1):
const sectionsResponse = await showsApi.getShowSections(showId);

// DESPUÉS (V2):
const ticketTypesResponse = await eventsApi.getEventTicketTypes(eventId);
```

**Ventajas:**
- Usa el sistema oficial V2
- Devuelve `ticket_type_id` correcto
- Consistente con el resto del flujo

**Desventajas:**
- Necesita `eventId` en lugar de `showId`
- Puede requerir ajustes en la UI

---

### Opción 2: Mapear section_id a ticket_type_id

Si las secciones tienen un campo `ticket_type_id`, usarlo:

```javascript
// En SeatSelection.jsx

const ticketTypeId = section.ticket_type_id || section.ticketTypeId || section.id;
```

**Ventajas:**
- Cambio mínimo
- Compatible con ambos sistemas

**Desventajas:**
- Asume que section tiene ticket_type_id
- Puede no funcionar si no existe la relación

---

### Opción 3: Crear Ticket Types desde Admin

Asegurarse de que existan ticket types en la base de datos:

1. Ir a Admin Dashboard
2. Crear tipos de tickets para el evento
3. Asociar secciones con ticket types

**Ventajas:**
- Solución definitiva
- Datos correctos en BD

**Desventajas:**
- Requiere acción manual
- Puede necesitar migración de datos

---

## 🔧 Implementación Recomendada

### Paso 1: Actualizar ShowDetail.jsx

```javascript
// Cambiar de getShowSections a getEventTicketTypes

useEffect(() => {
  const loadShowData = async () => {
    try {
      // 1. Cargar show
      const showResponse = await showsApi.getShow(showId);
      setShow(showResponse);

      // 2. Cargar evento
      const eventId = showResponse.eventId || showResponse.event_id;
      const eventResponse = await eventsApi.getEvent(eventId);
      setEvent(eventResponse);

      // 3. Cargar tipos de tickets (V2) ✅
      const ticketTypesResponse = await eventsApi.getEventTicketTypes(eventId);
      console.log('✅ Tipos de tickets cargados:', ticketTypesResponse);
      
      const ticketTypesList = Array.isArray(ticketTypesResponse)
        ? ticketTypesResponse
        : (ticketTypesResponse?.ticketTypes || ticketTypesResponse?.data || []);
      
      setSections(ticketTypesList); // Renombrar a setTicketTypes si quieres
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  loadShowData();
}, [showId]);
```

### Paso 2: Actualizar SeatSelection.jsx

```javascript
// Ya está actualizado con el fallback:
const ticketTypeId = section.ticket_type_id || section.ticketTypeId || section.id;
```

### Paso 3: Verificar en Consola

Cuando cargues ShowDetail, deberías ver:

```javascript
✅ Tipos de tickets cargados: [
  {
    id: 1,  // ← Este es el ticket_type_id correcto
    name: "Platea",
    price_cents: 5000,
    capacity: 100,
    available: 85
  }
]
```

---

## 🧪 Testing

### 1. Verificar que el backend tenga ticket types

Pregúntale al backend:
```
¿Existen ticket types en la base de datos para el evento que estoy probando?
```

Si no existen, necesitas crearlos primero.

### 2. Verificar el endpoint

Prueba manualmente:
```bash
GET http://localhost:3000/api/events/:eventId/ticket-types
```

Debería devolver:
```json
[
  {
    "id": 1,
    "event_id": 123,
    "name": "Platea",
    "price_cents": 5000,
    "capacity": 100,
    "available": 85
  }
]
```

### 3. Verificar los logs

En la consola del navegador:
```
🔍 Datos de section: { id: 1, name: "Platea", ... }
🎟️ Usando ticket_type_id: 1
📝 Datos de reserva (Backend V2): {
  eventId: 123,
  tickets: [{ typeId: 1, quantity: 2 }]
}
```

---

## 📊 Comparación V1 vs V2

| Aspecto | V1 (Sections) | V2 (Ticket Types) |
|---------|---------------|-------------------|
| **Endpoint** | `GET /api/shows/:showId/sections` | `GET /api/events/:eventId/ticket-types` |
| **Entidad** | Section | TicketType |
| **ID** | `section_id` | `ticket_type_id` |
| **Relación** | Show → Section | Event → TicketType |
| **Reserva** | `POST /api/shows/:showId/reservations` | `POST /api/tickets/reserve` |

---

## 🎯 Checklist

- [ ] Verificar que existan ticket types en la BD
- [ ] Actualizar ShowDetail para usar `getEventTicketTypes()`
- [ ] Verificar logs en consola
- [ ] Probar crear reserva
- [ ] Verificar que NO aparezca `TicketTypeNotFound`
- [ ] Verificar que aparezca mensaje de éxito

---

## 🚨 Si Sigue sin Funcionar

### Pregunta al Backend:

1. **¿Existen ticket types para el evento X?**
   ```sql
   SELECT * FROM ticket_types WHERE event_id = X;
   ```

2. **¿Cómo se relacionan sections con ticket_types?**
   - ¿Hay una tabla intermedia?
   - ¿Las sections tienen un campo `ticket_type_id`?

3. **¿Qué devuelve `GET /api/events/:eventId/ticket-types`?**
   - ¿Devuelve datos?
   - ¿Qué estructura tiene?

---

**Una vez que uses el endpoint correcto y los ticket types existan en la BD, debería funcionar.** ✅

---

**Fecha:** 2025-01-29  
**Estado:** ⚠️ Esperando actualización de ShowDetail.jsx
