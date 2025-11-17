# 🐛 DEBUG: Problema al Comprar en ShowDetail

**URL:** http://localhost:5173/shows/34  
**Problema:** El botón "Continuar" no hace nada

---

## 🔍 PASOS PARA DEBUGGING

### 1. Abrir la Consola del Navegador
```
F12 → Pestaña "Console"
```

### 2. Ir a la URL del Show
```
http://localhost:5173/shows/34
```

### 3. Verificar Logs de Carga
Deberías ver en consola:
```
🎭 Cargando show: 34
✅ Show cargado: {...}
✅ Evento cargado: {...}
🎟️ Secciones del show recibidas: [...]
📋 Secciones procesadas: [...]
🪑 Asientos del show recibidos: [...]
✅ Asientos disponibles: X
```

**¿Qué verificar?**
- ✅ ¿Cuántas secciones se cargaron?
- ✅ ¿Cuántos asientos disponibles hay?
- ⚠️ Si asientos = 0, ese es el problema

### 4. Seleccionar Tickets
Selecciona 2 tickets de cualquier sección.

### 5. Click en "Continuar"
Deberías ver en consola:
```
🚀 Iniciando proceso de compra...
📊 Total de tickets seleccionados: 2
✅ Usuario autenticado: tu@email.com
📋 Secciones seleccionadas: [...]
🪑 Total de asientos disponibles: X
```

**Si ves:**
```
❌ No hay asientos disponibles en el sistema
```
**Entonces el problema es que el show no tiene asientos configurados.**

### 6. Si hay asientos, verás:
```
🔍 Buscando asientos para sección: Platea (ID: 1)
  🔎 Asiento 1: sector="Platea", section_id=1, status=AVAILABLE
     Matches: sector=true, sectionId=true, available=true
✅ Asientos encontrados en Platea: 10
📊 Asientos de esta sección: [...]
📌 Asientos seleccionados de Platea: [1, 2]
🪑 IDs de asientos seleccionados (total): [1, 2]
🔒 Creando HOLD con datos: {...}
```

### 7. Si el HOLD se crea exitosamente:
```
✅ HOLD creado exitosamente: { holdId: 123, ... }
```
Y deberías ser redirigido a `/checkout/123`

---

## 🐛 POSIBLES PROBLEMAS

### Problema 1: No hay asientos disponibles
**Síntoma:**
```
❌ No hay asientos disponibles en el sistema
```

**Causa:** El show no tiene asientos configurados en la base de datos.

**Solución:** Verificar en el backend que el show tenga asientos:
```sql
SELECT * FROM seats WHERE show_id = 34;
```

---

### Problema 2: Los asientos no coinciden con las secciones
**Síntoma:**
```
✅ Asientos encontrados en Platea: 0
```

**Causa:** Los asientos tienen un `sector` o `section_id` diferente al de la sección seleccionada.

**Ejemplo:**
- Sección: `name = "Platea", id = 1`
- Asiento: `sector = "Platea Alta", section_id = 2`
- ❌ No coincide

**Solución:** Verificar que los asientos tengan el mismo `sector` o `section_id`:
```sql
-- Ver secciones del show
SELECT * FROM sections WHERE show_id = 34;

-- Ver asientos del show
SELECT id, sector, section_id, status FROM seats WHERE show_id = 34;
```

---

### Problema 3: Usuario no autenticado
**Síntoma:**
```
Debes iniciar sesión para continuar con la compra.
```

**Solución:** Iniciar sesión antes de intentar comprar.

---

### Problema 4: Error al crear HOLD
**Síntoma:**
```
❌ Error al crear hold: [mensaje de error]
```

**Posibles causas:**
- Backend no responde
- Endpoint `/api/holds` no existe
- Datos inválidos

**Solución:** Verificar que el backend esté corriendo y que el endpoint esté implementado.

---

## 📊 DATOS ESPERADOS

### Estructura de Secciones
```javascript
{
  id: 1,
  name: "Platea",
  sector: "Platea",
  capacity: 100,
  price_cents: 15000
}
```

### Estructura de Asientos
```javascript
{
  id: 1,
  show_id: 34,
  sector: "Platea",        // Debe coincidir con section.name
  section_id: 1,           // O debe coincidir con section.id
  seat_number: "A1",
  status: "AVAILABLE"
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Copia esto en la consola y verifica cada punto:

```javascript
// 1. ¿Hay secciones?
console.log('Secciones:', sections);

// 2. ¿Hay asientos?
console.log('Asientos:', seats);

// 3. ¿Hay cantidades seleccionadas?
console.log('Cantidades:', sectionQuantities);

// 4. ¿Hay usuario autenticado?
console.log('Usuario:', user);

// 5. ¿Cuál es el total?
console.log('Total tickets:', totalTickets);
console.log('Total precio:', totalPrice);
```

---

## 🔧 SOLUCIÓN RÁPIDA

Si el problema es que **no hay asientos**, puedes:

### Opción A: Crear asientos en el backend
```sql
-- Insertar asientos de prueba para el show 34
INSERT INTO seats (show_id, sector, section_id, seat_number, status)
VALUES 
  (34, 'Platea', 1, 'A1', 'AVAILABLE'),
  (34, 'Platea', 1, 'A2', 'AVAILABLE'),
  (34, 'Platea', 1, 'A3', 'AVAILABLE'),
  (34, 'Pullman', 2, 'B1', 'AVAILABLE'),
  (34, 'Pullman', 2, 'B2', 'AVAILABLE');
```

### Opción B: Usar otro show que tenga asientos
Buscar un show que ya tenga asientos configurados:
```sql
SELECT show_id, COUNT(*) as asientos
FROM seats
WHERE status = 'AVAILABLE'
GROUP BY show_id;
```

---

## 📝 REPORTE DE DEBUGGING

Después de seguir estos pasos, reporta:

1. **¿Cuántos asientos disponibles hay?**
   ```
   Respuesta: _____
   ```

2. **¿Qué logs ves en consola al hacer click en "Continuar"?**
   ```
   Pegar logs aquí
   ```

3. **¿Hay algún error en rojo?**
   ```
   Pegar error aquí
   ```

4. **¿Qué muestra la estructura de asientos?**
   ```javascript
   console.log(seats[0]);
   // Pegar resultado aquí
   ```

5. **¿Qué muestra la estructura de secciones?**
   ```javascript
   console.log(sections[0]);
   // Pegar resultado aquí
   ```

---

Con esta información podremos identificar exactamente dónde está el problema. 🎯
