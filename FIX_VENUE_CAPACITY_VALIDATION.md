# 🎯 Fix: Validación de Capacidad del Venue

**Fecha**: 2025-10-27  
**Versión**: 1.7.0  
**Estado**: ✅ Completado

---

## 🐛 PROBLEMA

Al asignar secciones a un show, el backend devolvía error **409 Conflict**:

```
POST http://localhost:3000/api/shows/29/sections 409 (Conflict)
Error: VenueCapacityExceeded
```

**Causa**: La suma de las capacidades de todas las secciones excedía la capacidad máxima del venue.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Validación en Frontend (Antes de enviar)

Agregada validación que previene el envío si la capacidad total excede el límite:

```javascript
// Validar capacidad total
const totalCapacity = sections.reduce((sum, s) => sum + Number(s.capacity || 0), 0);
const venueCapacity = selectedShow.venue_capacity || selectedShow.max_capacity;

if (venueCapacity && totalCapacity > venueCapacity) {
  message.error(
    `La capacidad total de las secciones (${totalCapacity.toLocaleString()}) 
     excede la capacidad del venue (${venueCapacity.toLocaleString()})`
  );
  return; // No envía al backend
}
```

### 2. Indicador Visual de Capacidad

Agregado un **indicador en tiempo real** que muestra:
- Capacidad total vs capacidad del venue
- Porcentaje usado
- Barra de progreso visual
- Alerta si se excede el límite

```
┌─────────────────────────────────────────────┐
│ Capacidad total: 5,000 / 3,300 (151.5%)    │ ← Rojo si excede
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░  │ ← Barra roja
│ ⚠️ La capacidad excede el límite del venue │
└─────────────────────────────────────────────┘
```

### 3. Mejora en Manejo de Errores del Backend

Si el error llega del backend, ahora se muestra un mensaje más claro:

```javascript
if (errorMessage.includes('VenueCapacityExceeded')) {
  errorMessage = `La capacidad total de las secciones excede la capacidad máxima del venue (${venueCapacity?.toLocaleString() || 'N/A'})`;
}
```

---

## 🎨 INTERFAZ MEJORADA

### Modal "Asignar Secciones"

#### Información del Show:
```
┌─────────────────────────────────────────────┐
│ Show: Concierto de Rock 2025               │
│ Fecha: 01 de diciembre de 2025 20:00       │
│ Venue: Teatro Gran Rex                      │
│ Capacidad máxima del venue: 3,300 personas │ ← NUEVO
└─────────────────────────────────────────────┘
```

#### Indicador de Capacidad (Verde - OK):
```
┌─────────────────────────────────────────────┐
│ Capacidad total: 3,000 / 3,300 (90.9%)     │ ← Verde
│ ████████████████████████████████░░░░░░░░░  │ ← Barra verde
└─────────────────────────────────────────────┘
```

#### Indicador de Capacidad (Rojo - Excedido):
```
┌─────────────────────────────────────────────┐
│ Capacidad total: 5,000 / 3,300 (151.5%)    │ ← Rojo
│ ████████████████████████████████████████░  │ ← Barra roja
│ ⚠️ La capacidad excede el límite del venue │
│    Reducí la capacidad de las secciones.   │
└─────────────────────────────────────────────┘
```

---

## 💻 IMPLEMENTACIÓN

### 1. Validación Antes de Enviar

```javascript
const submitAssignSections = async () => {
  try {
    const values = await form.validateFields();
    const sections = values.sections || [];
    
    // Validar capacidad total
    const totalCapacity = sections.reduce((sum, s) => sum + Number(s.capacity || 0), 0);
    const venueCapacity = selectedShow.venue_capacity || selectedShow.max_capacity;
    
    if (venueCapacity && totalCapacity > venueCapacity) {
      message.error(
        `La capacidad total de las secciones (${totalCapacity.toLocaleString()}) 
         excede la capacidad del venue (${venueCapacity.toLocaleString()})`
      );
      return; // ← Previene envío
    }

    // ... resto del código
  }
};
```

### 2. Indicador Visual en Tiempo Real

```javascript
<Form.Item noStyle shouldUpdate>
  {() => {
    const sections = form.getFieldValue('sections') || [];
    const totalCapacity = sections.reduce((sum, s) => sum + Number(s?.capacity || 0), 0);
    const venueCapacity = selectedShow.venue_capacity || selectedShow.max_capacity || 0;
    const percentage = venueCapacity > 0 ? (totalCapacity / venueCapacity) * 100 : 0;
    const isOverCapacity = totalCapacity > venueCapacity;

    return totalCapacity > 0 ? (
      <div style={{ 
        background: isOverCapacity ? '#fff2e8' : '#f6ffed', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 16,
        border: `1px solid ${isOverCapacity ? '#ffbb96' : '#b7eb8f'}`
      }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ color: isOverCapacity ? '#d4380d' : '#52c41a' }}>
            Capacidad total: {totalCapacity.toLocaleString()} / {venueCapacity.toLocaleString()} 
            ({percentage.toFixed(1)}%)
          </Text>
        </div>
        
        {/* Barra de progreso */}
        <div style={{ 
          background: '#fff', 
          height: 20, 
          borderRadius: 10, 
          overflow: 'hidden',
          border: '1px solid #d9d9d9'
        }}>
          <div style={{ 
            width: `${Math.min(percentage, 100)}%`, 
            height: '100%', 
            background: isOverCapacity 
              ? 'linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%)'
              : 'linear-gradient(90deg, #52c41a 0%, #95de64 100%)',
            transition: 'width 0.3s'
          }} />
        </div>
        
        {/* Mensaje de alerta */}
        {isOverCapacity && (
          <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            ⚠️ La capacidad excede el límite del venue. Reducí la capacidad de las secciones.
          </Text>
        )}
      </div>
    ) : null;
  }}
</Form.Item>
```

### 3. Manejo de Errores Mejorado

```javascript
try {
  await showsApi.createSection(selectedShow.id, sectionData);
  createdCount++;
} catch (err) {
  let errorMessage = err.message || 'Error desconocido';
  
  if (errorMessage.includes('VenueCapacityExceeded')) {
    errorMessage = `La capacidad total de las secciones excede la capacidad máxima del venue (${venueCapacity?.toLocaleString() || 'N/A'})`;
  } else if (errorMessage.includes('DuplicateSectionName')) {
    errorMessage = `Ya existe una sección con el nombre "${section.name}"`;
  } else if (errorMessage.includes('InvalidCapacity')) {
    errorMessage = `La capacidad de la sección "${section.name}" no es válida`;
  }
  
  throw new Error(errorMessage);
}
```

---

## 🔄 FLUJO COMPLETO

### Escenario 1: Capacidad OK

```
1. Admin → Shows → Click "Secciones"
   ↓
2. Modal se abre
   ↓
3. Agregar secciones:
   - Platea: 1,500 personas
   - Pullman: 1,000 personas
   - Palco: 500 personas
   ↓
4. Indicador muestra:
   "Capacidad total: 3,000 / 3,300 (90.9%)"
   Barra verde ████████████████████████████░░
   ↓
5. Click "Guardar"
   ↓
6. ✅ Validación pasa
   ↓
7. ✅ Backend crea las secciones
   ↓
8. ✅ Mensaje: "3 sección(es) creada(s) correctamente"
```

### Escenario 2: Capacidad Excedida

```
1. Admin → Shows → Click "Secciones"
   ↓
2. Modal se abre
   ↓
3. Agregar secciones:
   - Platea: 2,000 personas
   - Pullman: 2,000 personas
   - Palco: 1,000 personas
   ↓
4. Indicador muestra:
   "Capacidad total: 5,000 / 3,300 (151.5%)"
   Barra roja ████████████████████████████████
   ⚠️ La capacidad excede el límite del venue
   ↓
5. Click "Guardar"
   ↓
6. ❌ Validación falla
   ↓
7. ❌ Mensaje de error:
   "La capacidad total de las secciones (5,000) 
    excede la capacidad del venue (3,300)"
   ↓
8. Modal NO se cierra
   ↓
9. Usuario debe reducir capacidades
```

---

## 🧪 TESTING

### Test 1: Validación Frontend

```bash
1. Admin → Shows
2. Click "Secciones" en un show
3. Agregar secciones con capacidad total > venue:
   - Sección 1: 2,000
   - Sección 2: 2,000
4. Verificar indicador:
   ✅ Muestra capacidad total en rojo
   ✅ Barra de progreso roja
   ✅ Mensaje de alerta visible
5. Click "Guardar"
6. Verificar:
   ✅ Mensaje de error
   ✅ Modal NO se cierra
   ✅ NO se envía request al backend
```

### Test 2: Indicador en Tiempo Real

```bash
1. Admin → Shows → Click "Secciones"
2. Agregar sección: Capacidad 1,000
3. Verificar indicador:
   ✅ Muestra "1,000 / 3,300"
   ✅ Barra verde
4. Agregar otra sección: Capacidad 1,000
5. Verificar indicador actualiza:
   ✅ Muestra "2,000 / 3,300"
   ✅ Barra verde más llena
6. Agregar otra sección: Capacidad 2,000
7. Verificar indicador:
   ✅ Muestra "4,000 / 3,300"
   ✅ Barra roja
   ✅ Mensaje de alerta
```

### Test 3: Capacidad Exacta

```bash
1. Admin → Shows → Click "Secciones"
2. Venue capacity: 3,300
3. Agregar secciones con total = 3,300:
   - Platea: 1,650
   - Pullman: 1,650
4. Verificar indicador:
   ✅ Muestra "3,300 / 3,300 (100.0%)"
   ✅ Barra verde llena
   ✅ Sin mensaje de alerta
5. Click "Guardar"
6. Verificar:
   ✅ Validación pasa
   ✅ Secciones creadas
```

### Test 4: Manejo de Error del Backend

```bash
1. Deshabilitar validación frontend temporalmente
2. Enviar secciones con capacidad excedida
3. Backend devuelve 409 VenueCapacityExceeded
4. Verificar:
   ✅ Mensaje de error claro
   ✅ Incluye capacidad del venue
   ✅ No muestra error técnico crudo
```

---

## 📊 COMPARACIÓN

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Validación frontend** | ❌ No | ✅ Sí |
| **Indicador visual** | ❌ No | ✅ Barra de progreso |
| **Capacidad del venue visible** | ❌ No | ✅ Sí |
| **Feedback en tiempo real** | ❌ No | ✅ Actualiza al escribir |
| **Mensaje de error claro** | ❌ "VenueCapacityExceeded" | ✅ "Excede capacidad (X/Y)" |
| **Previene envío inválido** | ❌ No | ✅ Sí |

---

## 🎯 BENEFICIOS

### ✅ UX Mejorada
- Usuario ve en tiempo real si excede capacidad
- No necesita enviar para saber si hay error
- Feedback visual inmediato

### ✅ Menos Errores
- Validación antes de enviar
- Previene requests inválidos al backend
- Reduce carga del servidor

### ✅ Mensajes Claros
- Errores específicos y descriptivos
- Incluye números exactos
- Sugiere acción correctiva

### ✅ Transparencia
- Capacidad del venue siempre visible
- Porcentaje usado claro
- Estado visual (verde/rojo)

---

## 📝 ARCHIVOS MODIFICADOS

1. ✅ `src/pages/admin/AdminDashboard.jsx`
   - Validación de capacidad total antes de enviar
   - Indicador visual de capacidad en tiempo real
   - Manejo mejorado de errores del backend
   - Muestra capacidad del venue en info del show

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Validación frontend implementada
- [x] Indicador visual agregado
- [x] Barra de progreso con colores
- [x] Mensaje de alerta cuando excede
- [x] Actualización en tiempo real
- [x] Manejo de errores del backend mejorado
- [x] Capacidad del venue visible
- [x] Previene envío si excede
- [x] Mensajes de error claros
- [x] Documentación completa

---

## 🎉 RESULTADO FINAL

**Antes**:
```
Usuario agrega secciones → Click Guardar → Backend error 409
→ Mensaje: "VenueCapacityExceeded" ❌
```

**Después**:
```
Usuario agrega secciones → Indicador muestra exceso en tiempo real
→ Mensaje claro: "Capacidad excede límite (5,000 / 3,300)" ✅
→ Previene envío → Usuario corrige → Click Guardar → ✅ Éxito
```

---

**🎯 VALIDACIÓN DE CAPACIDAD COMPLETAMENTE FUNCIONAL**

Última actualización: 2025-10-27  
Estado: ✅ Completado y Probado
