# ✅ Validación de Secciones Duplicadas - Frontend

## 🎯 Problema Resuelto

Al crear múltiples secciones en un show, el sistema fallaba sin dar mensajes de error claros cuando había nombres duplicados. El backend ya implementó las validaciones necesarias, y ahora el **frontend tiene validaciones preventivas** para evitar errores antes de enviar al backend.

---

## 🔧 Solución Implementada

### 1. **Validaciones Preventivas (Frontend)**

El frontend ahora valida **ANTES** de enviar al backend:

#### ✅ Validación 1: Nombres vacíos o solo espacios
```javascript
const emptyNames = sections.filter(s => !s.name || s.name.trim() === '');
if (emptyNames.length > 0) {
  message.error('❌ Todas las secciones deben tener un nombre');
  return;
}
```

#### ✅ Validación 2: Precios negativos
```javascript
const negativePrice = sections.find(s => Number(s.price) < 0);
if (negativePrice) {
  message.error(`❌ El precio de "${negativePrice.name}" no puede ser negativo`);
  return;
}
```

#### ✅ Validación 3: Capacidad inválida
```javascript
const invalidCapacity = sections.find(s => Number(s.capacity) <= 0);
if (invalidCapacity) {
  message.error(`❌ La capacidad de "${invalidCapacity.name}" debe ser mayor a 0`);
  return;
}
```

#### ✅ Validación 4: Nombres duplicados en el formulario
```javascript
const sectionNames = sections.map(s => s.name.trim().toLowerCase());
const duplicatesInForm = sectionNames.filter((name, index) => 
  sectionNames.indexOf(name) !== index
);
if (duplicatesInForm.length > 0) {
  const duplicateOriginal = sections.find(s => 
    s.name.trim().toLowerCase() === duplicatesInForm[0]
  );
  message.error(`❌ Ya existe una sección llamada "${duplicateOriginal.name}" en el formulario.`);
  return;
}
```

#### ✅ Validación 5: Nombres duplicados con secciones existentes
```javascript
const existingNames = showSections.map(s => s.name.toLowerCase());
const duplicateWithExisting = sections.find(s => 
  existingNames.includes(s.name.trim().toLowerCase())
);
if (duplicateWithExisting) {
  message.error({
    content: (
      <div>
        <div>❌ Ya existe una sección llamada <strong>"{duplicateWithExisting.name}"</strong></div>
        <div>Secciones existentes: {showSections.map(s => s.name).join(', ')}</div>
      </div>
    ),
    duration: 5
  });
  return;
}
```

---

### 2. **Alerta Visual de Secciones Existentes**

Cuando seleccionas un show que ya tiene secciones, aparece una **alerta naranja** mostrando:

```jsx
{selectedShowId && showSections.length > 0 && (
  <div style={{
    background: '#fff7e6',
    border: '1px solid #ffd591',
    borderRadius: 8,
    padding: 12
  }}>
    <span>⚠️</span>
    <Text strong>Secciones existentes en este show:</Text>
    <div>
      {showSections.map(s => (
        <Tag color="orange">{s.name}</Tag>
      ))}
    </div>
    <Text type="secondary">
      💡 Recordá que no podés usar nombres duplicados.
    </Text>
  </div>
)}
```

**Resultado:**
- ⚠️ **Secciones existentes en este show:**
- 🏷️ Tags naranjas con cada nombre: `Platea` `Pullman` `Palco`
- 💡 Tip: "Recordá que no podés usar nombres duplicados"

---

### 3. **Manejo de Errores del Backend**

Si alguna sección falla al crearse, el frontend captura el código de error del backend:

```javascript
try {
  await showsApi.createSection(selectedShowId, sectionData);
  createdCount++;
} catch (err) {
  const errorCode = err.response?.data?.code;
  
  if (errorCode === 'DuplicateSectionName') {
    errors.push(`"${section.name}": Ya existe en este show`);
  } else if (errorCode === 'VenueCapacityExceeded') {
    errors.push(`"${section.name}": Excede la capacidad del venue`);
  } else {
    errors.push(`"${section.name}": ${errorMsg}`);
  }
}
```

**Códigos de error del backend:**
- `DuplicateSectionName` → Nombre duplicado
- `VenueCapacityExceeded` → Capacidad excedida
- `BadRequest` → Datos inválidos
- `ShowNotFound` → Show no existe

---

### 4. **Mensajes de Resultado Mejorados**

#### ✅ Éxito Total:
```
✅ 3 sección(es) creada(s) correctamente
```

#### ⚠️ Éxito Parcial:
```
✅ 2 sección(es) creada(s) correctamente

❌ Errores al crear algunas secciones:
• "Platea": Ya existe en este show
• "VIP Premium": Excede la capacidad del venue
```

#### ❌ Error Total:
```
❌ Errores al crear algunas secciones:
• "Campo": Ya existe en este show
• "Tribuna": Ya existe en este show
```

---

## 🎭 Ejemplos de Uso

### ✅ CORRECTO - Nombres Únicos

**Show ID 38 - Iron Maiden**

**Secciones existentes:** Ninguna

**Crear:**
1. Campo VIP - GA - $25,000 - 100
2. Platea Baja - SEATED - $18,000 - 150
3. Tribuna Norte - SEATED - $12,000 - 200

**Resultado:** ✅ 3 secciones creadas correctamente

---

### ❌ INCORRECTO - Nombres Duplicados en Formulario

**Crear:**
1. Platea - GA - $15,000 - 100
2. Pullman - SEATED - $12,000 - 150
3. **Platea** - SEATED - $18,000 - 80 ❌

**Error preventivo:**
```
❌ Ya existe una sección llamada "Platea" en el formulario. 
Por favor usá nombres únicos.
```

**Resultado:** No se envía nada al backend (validación preventiva)

---

### ❌ INCORRECTO - Nombres Duplicados con Existentes

**Secciones existentes:** Platea, Pullman, Palco

**Crear:**
1. Cazuela - SEATED - $10,000 - 100
2. **Platea** - GA - $20,000 - 50 ❌

**Error preventivo:**
```
❌ Ya existe una sección llamada "Platea" en este show.
Secciones existentes: Platea, Pullman, Palco
```

**Resultado:** No se envía nada al backend (validación preventiva)

---

## 🎨 Flujo de Usuario Mejorado

```
1. Admin → Eventos → Click "Secciones" en un show
   ↓
2. Modal se abre
   ↓
3. Selecciona show del dropdown
   ↓
4. ⚠️ Aparece alerta naranja con secciones existentes (si hay)
   ↓
5. Click "Agregar Sección"
   ↓
6. Completa: Nombre, Tipo, Precio, Capacidad
   ↓
7. Puede agregar múltiples secciones
   ↓
8. Click "Guardar"
   ↓
9. ✅ Validaciones preventivas (5 checks)
   ↓
10. Si pasa validaciones → Envía al backend
   ↓
11. Backend valida y crea secciones
   ↓
12. Frontend muestra resultado:
    - ✅ Éxito total → Cierra modal
    - ⚠️ Éxito parcial → Muestra errores, NO cierra modal
    - ❌ Error total → Muestra errores, NO cierra modal
   ↓
13. Refetch automático de secciones
```

---

## 📋 Checklist de Validaciones

### Frontend (Preventivas):
- ✅ Nombres vacíos o solo espacios
- ✅ Precios negativos
- ✅ Capacidad <= 0
- ✅ Nombres duplicados en el formulario
- ✅ Nombres duplicados con secciones existentes
- ✅ Trim de espacios en nombres

### Backend (Definitivas):
- ✅ Nombre obligatorio y no vacío
- ✅ Show existente
- ✅ Nombres duplicados en BD (UNIQUE constraint)
- ✅ Capacidad total no excede venue
- ✅ Precio no negativo

---

## 🧪 Cómo Probar

### Test 1: Validación de nombres vacíos
1. Crear sección sin nombre
2. Click "Guardar"
3. **Esperado:** ❌ "Todas las secciones deben tener un nombre"

### Test 2: Validación de precio negativo
1. Crear sección con precio -100
2. Click "Guardar"
3. **Esperado:** ❌ "El precio de 'X' no puede ser negativo"

### Test 3: Validación de duplicados en formulario
1. Agregar 2 secciones con el mismo nombre
2. Click "Guardar"
3. **Esperado:** ❌ "Ya existe una sección llamada 'X' en el formulario"

### Test 4: Validación de duplicados con existentes
1. Seleccionar show que tiene "Platea"
2. Ver alerta naranja con "Platea"
3. Intentar crear otra "Platea"
4. Click "Guardar"
5. **Esperado:** ❌ "Ya existe una sección llamada 'Platea' en este show"

### Test 5: Creación exitosa
1. Seleccionar show
2. Crear 3 secciones con nombres únicos
3. Click "Guardar"
4. **Esperado:** ✅ "3 sección(es) creada(s) correctamente"
5. Modal se cierra
6. Tabla se actualiza

### Test 6: Éxito parcial
1. Crear 3 secciones: 2 válidas + 1 duplicada (que pase validación frontend pero falle en backend)
2. **Esperado:** 
   - ✅ "2 sección(es) creada(s) correctamente"
   - ❌ Errores con la que falló
   - Modal NO se cierra (para corregir)

---

## 📊 Comparación Antes vs Después

| Aspecto | ❌ Antes | ✅ Ahora |
|---------|---------|----------|
| Validación preventiva | No | Sí (5 validaciones) |
| Alerta de existentes | No | Sí (tags naranjas) |
| Mensajes de error | Genéricos | Específicos con emojis |
| Trim de espacios | No | Sí |
| Manejo de errores backend | Básico | Códigos específicos |
| Éxito parcial | No soportado | Sí (muestra qué falló) |
| Modal en error | Se cierra | Se mantiene abierto |
| UX | Confusa | Clara y guiada |

---

## 🎯 Beneficios

1. **Menos errores:** Validación preventiva evita llamadas innecesarias al backend
2. **Mejor UX:** Usuario ve secciones existentes antes de crear
3. **Mensajes claros:** Errores específicos con emojis y contexto
4. **Éxito parcial:** Si 2 de 3 secciones se crean, muestra resultado mixto
5. **No pierde trabajo:** Modal no se cierra si hay errores
6. **Consistencia:** Nombres siempre trimmed (sin espacios extra)
7. **Visual:** Tags naranjas destacan secciones existentes

---

## 📁 Archivos Modificados

### Frontend:
- ✅ `src/pages/admin/AdminDashboard.jsx`
  - Función `submitAssignTickets()` con 5 validaciones
  - Alerta visual de secciones existentes
  - Manejo de errores mejorado
  - Mensajes de resultado con emojis

### Backend (ya implementado):
- ✅ `controllers/sections.controller.js`
- ✅ `GUIA_CREACION_MULTIPLES_SECCIONES.md`
- ✅ `SOLUCION_MULTIPLES_SECCIONES.md`

---

## 💡 Consejos para Admins

1. **Planificá antes de crear:** Define todos los nombres que usarás
2. **Revisá la alerta naranja:** Muestra qué nombres ya están en uso
3. **Usá nombres descriptivos:** "Platea Baja" en vez de "Sección 1"
4. **Mantené consistencia:** Mismo esquema para todos tus eventos
5. **No uses espacios extra:** El sistema los elimina automáticamente

---

## ✅ Estado Final

- ✅ **Frontend:** Validaciones preventivas implementadas
- ✅ **Backend:** Validaciones definitivas ya implementadas
- ✅ **UI/UX:** Alerta visual con secciones existentes
- ✅ **Mensajes:** Claros, específicos y con emojis
- ✅ **Documentación:** Completa con ejemplos

**¡El sistema ahora previene errores de nombres duplicados desde el frontend!** 🎉
