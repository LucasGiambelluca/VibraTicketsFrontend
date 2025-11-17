# ENDPOINTS FALTANTES EN EL BACKEND

## ❌ PROBLEMA ACTUAL

Al intentar **editar una sección** desde el frontend, obtenemos error **404 Not Found**:

```
PUT /api/shows/3/sections/45 → 404 Not Found
```

Esto significa que el backend **no tiene implementado** este endpoint.

---

## 📋 ENDPOINTS QUE FALTAN

### 1. **Actualizar Sección** (❌ NO IMPLEMENTADO)

```http
PUT /api/shows/:showId/sections/:sectionId
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Body:
{
  "name": "Campo VIP Premium",
  "kind": "GA",
  "capacity": 600,
  "priceCents": 2000000
}
```

**Respuesta esperada (200 OK):**
```json
{
  "id": 45,
  "show_id": 3,
  "name": "Campo VIP Premium",
  "kind": "GA",
  "capacity": 600,
  "price_cents": 2000000,
  "available_seats": 600,
  "sold_seats": 0,
  "updated_at": "2025-11-05T23:54:00Z"
}
```

**Validaciones necesarias:**
- ✅ JWT válido y rol ADMIN
- ✅ Show existe
- ✅ Sección existe
- ✅ Capacidad >= tickets ya vendidos
- ✅ Capacidad total de secciones <= capacidad del venue
- ✅ Nombre único dentro del show

**Códigos de error:**
- `400` - Validación fallida (ej: capacidad < tickets vendidos)
- `403` - Sin permisos (no es ADMIN)
- `404` - Show o sección no encontrada
- `409` - Conflicto (nombre duplicado)

---

### 2. **Eliminar Sección** (❌ NO IMPLEMENTADO)

```http
DELETE /api/shows/:showId/sections/:sectionId
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta esperada (200 OK):**
```json
{
  "message": "Sección eliminada correctamente",
  "deletedSectionId": 45
}
```

**Validaciones necesarias:**
- ✅ JWT válido y rol ADMIN
- ✅ Show existe
- ✅ Sección existe
- ✅ No hay tickets vendidos para esta sección

**Códigos de error:**
- `403` - Sin permisos (no es ADMIN)
- `404` - Show o sección no encontrada
- `409` - No se puede eliminar (tiene tickets vendidos)

---

## ✅ ENDPOINTS YA IMPLEMENTADOS

Estos endpoints **SÍ funcionan** en el backend:

### 1. **Crear Sección** ✅
```http
POST /api/shows/:showId/sections
```

### 2. **Listar Secciones** ✅
```http
GET /api/shows/:showId/sections
```

### 3. **Eliminar Show** ✅
```http
DELETE /api/shows/:showId
```

---

## 🔧 IMPLEMENTACIÓN SUGERIDA (Backend)

### **Ruta: `/api/shows/:showId/sections/:sectionId`**

```javascript
// routes/shows.js o routes/sections.js

// Actualizar sección
router.put('/shows/:showId/sections/:sectionId', 
  authenticate, 
  requireRole(['ADMIN']), 
  async (req, res) => {
    try {
      const { showId, sectionId } = req.params;
      const { name, kind, capacity, priceCents } = req.body;
      
      // 1. Verificar que el show existe
      const show = await db.query('SELECT * FROM shows WHERE id = ?', [showId]);
      if (!show) return res.status(404).json({ message: 'Show no encontrado' });
      
      // 2. Verificar que la sección existe
      const section = await db.query('SELECT * FROM sections WHERE id = ? AND show_id = ?', [sectionId, showId]);
      if (!section) return res.status(404).json({ message: 'Sección no encontrada' });
      
      // 3. Verificar tickets vendidos
      const soldTickets = await db.query('SELECT COUNT(*) as sold FROM tickets WHERE section_id = ? AND status IN ("ISSUED", "REDEEMED")', [sectionId]);
      if (capacity < soldTickets.sold) {
        return res.status(400).json({ 
          message: `No se puede reducir la capacidad por debajo de los tickets ya vendidos (${soldTickets.sold})` 
        });
      }
      
      // 4. Verificar capacidad del venue
      const totalCapacity = await db.query('SELECT SUM(capacity) as total FROM sections WHERE show_id = ? AND id != ?', [showId, sectionId]);
      const newTotal = (totalCapacity.total || 0) + capacity;
      const venueCapacity = await db.query('SELECT v.max_capacity FROM shows s JOIN events e ON s.event_id = e.id JOIN venues v ON e.venue_id = v.id WHERE s.id = ?', [showId]);
      
      if (venueCapacity.max_capacity && newTotal > venueCapacity.max_capacity) {
        return res.status(400).json({ 
          message: `Capacidad total excede la del venue (${venueCapacity.max_capacity})` 
        });
      }
      
      // 5. Verificar nombre único
      const duplicate = await db.query('SELECT id FROM sections WHERE show_id = ? AND name = ? AND id != ?', [showId, name, sectionId]);
      if (duplicate) {
        return res.status(409).json({ message: 'Ya existe una sección con ese nombre' });
      }
      
      // 6. Actualizar sección
      await db.query('UPDATE sections SET name = ?, kind = ?, capacity = ?, price_cents = ?, updated_at = NOW() WHERE id = ?', 
        [name, kind, capacity, priceCents, sectionId]);
      
      // 7. Ajustar asientos si cambió la capacidad
      const currentSeats = await db.query('SELECT COUNT(*) as count FROM seats WHERE section_id = ?', [sectionId]);
      if (capacity > currentSeats.count) {
        // Generar asientos adicionales
        // ... lógica para crear nuevos asientos
      } else if (capacity < currentSeats.count) {
        // Eliminar asientos sobrantes (solo los disponibles)
        await db.query('DELETE FROM seats WHERE section_id = ? AND status = "AVAILABLE" LIMIT ?', [sectionId, currentSeats.count - capacity]);
      }
      
      // 8. Retornar sección actualizada
      const updatedSection = await db.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
      res.json(updatedSection);
      
    } catch (error) {
      console.error('Error actualizando sección:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);

// Eliminar sección
router.delete('/shows/:showId/sections/:sectionId', 
  authenticate, 
  requireRole(['ADMIN']), 
  async (req, res) => {
    try {
      const { showId, sectionId } = req.params;
      
      // 1. Verificar que la sección existe
      const section = await db.query('SELECT * FROM sections WHERE id = ? AND show_id = ?', [sectionId, showId]);
      if (!section) return res.status(404).json({ message: 'Sección no encontrada' });
      
      // 2. Verificar que no hay tickets vendidos
      const soldTickets = await db.query('SELECT COUNT(*) as sold FROM tickets WHERE section_id = ? AND status IN ("ISSUED", "REDEEMED")', [sectionId]);
      if (soldTickets.sold > 0) {
        return res.status(409).json({ 
          message: `No se puede eliminar la sección porque tiene ${soldTickets.sold} tickets vendidos` 
        });
      }
      
      // 3. Eliminar asientos de la sección
      await db.query('DELETE FROM seats WHERE section_id = ?', [sectionId]);
      
      // 4. Eliminar sección
      await db.query('DELETE FROM sections WHERE id = ?', [sectionId]);
      
      res.json({ message: 'Sección eliminada correctamente', deletedSectionId: parseInt(sectionId) });
      
    } catch (error) {
      console.error('Error eliminando sección:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);
```

---

## 🎯 FRONTEND YA IMPLEMENTADO

El frontend **YA ESTÁ LISTO** y tiene implementado:

### ✅ Editar Sección:
- Modal con formulario completo
- Validaciones
- Conversión de precio (pesos → centavos)
- Llamada a API: `showsApi.updateSection(showId, sectionId, data)`

### ✅ Eliminar Sección:
- Confirmación antes de eliminar
- Manejo de errores
- Llamada a API: `showsApi.deleteSection(showId, sectionId)`

### ✅ Tabla de Secciones:
- Botones de editar y eliminar
- Columnas: Nombre, Tipo, Precio, Capacidad, Disponibles

---

## 🚀 PRÓXIMOS PASOS

### Para que funcione completamente:

1. **Backend**: Implementar los 2 endpoints faltantes:
   - `PUT /api/shows/:showId/sections/:sectionId`
   - `DELETE /api/shows/:showId/sections/:sectionId`

2. **Testing**: Probar ambos endpoints con:
   - Casos válidos
   - Casos de error (sin permisos, tickets vendidos, etc.)
   - Validación de capacidad

3. **Frontend**: Ya está 100% funcional, solo espera el backend

---

## 📊 ESTADO ACTUAL

| Funcionalidad | Frontend | Backend | Estado |
|---------------|----------|---------|--------|
| Crear Sección | ✅ | ✅ | ✅ Funcional |
| Listar Secciones | ✅ | ✅ | ✅ Funcional |
| Editar Sección | ✅ | ❌ | ⏳ Esperando backend |
| Eliminar Sección | ✅ | ❌ | ⏳ Esperando backend |
| Eliminar Show | ✅ | ✅ | ✅ Funcional |

---

## 💡 WORKAROUND TEMPORAL

Mientras se implementan los endpoints en el backend, podés:

1. **Eliminar la sección** y crear una nueva con los datos actualizados
2. **Editar directamente en la base de datos** (no recomendado para producción)
3. **Comentar temporalmente** los botones de editar/eliminar en el frontend

---

**Resumen:** El frontend está 100% listo. Solo falta implementar estos 2 endpoints en el backend para que todo funcione. 🚀
