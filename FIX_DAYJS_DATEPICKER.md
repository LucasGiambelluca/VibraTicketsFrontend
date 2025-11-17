# FIX: Error con DatePicker en Ant Design v5

## ❌ PROBLEMA

Error al abrir el modal de edición de show:

```
Uncaught TypeError: date4.isValid is not a function
    at Object.isValidate (antd.js?v=2c5dfbce:37867:18)
```

Mensaje de advertencia:
```
An error occurred in the <RefPicker> component.
```

## 🔍 CAUSA

**Ant Design v5 usa `dayjs` en lugar de objetos `Date` nativos para el componente `DatePicker`.**

El código estaba convirtiendo las fechas a objetos `Date` nativos:

```javascript
// ❌ INCORRECTO (causaba el error)
const handleEditShow = (show) => {
  let startsAtValue = null;
  if (show.starts_at) {
    startsAtValue = new Date(show.starts_at); // ❌ Date nativo
  }
  
  editForm.setFieldsValue({
    startsAt: startsAtValue, // ❌ DatePicker espera dayjs
    ...
  });
};
```

## ✅ SOLUCIÓN

### 1. Instalar dayjs

```bash
pnpm add dayjs
# o
npm install dayjs
```

### 2. Convertir las fechas a objetos `dayjs`

```javascript
// ✅ CORRECTO
import dayjs from 'dayjs';

const handleEditShow = (show) => {
  let startsAtValue = null;
  if (show.starts_at || show.startsAt) {
    try {
      const dateStr = show.starts_at || show.startsAt;
      startsAtValue = dayjs(dateStr); // ✅ dayjs
      console.log('📅 Fecha convertida a dayjs:', startsAtValue.format());
    } catch (e) {
      console.error('❌ Error parseando fecha:', e);
    }
  }
  
  editForm.setFieldsValue({
    startsAt: startsAtValue, // ✅ DatePicker recibe dayjs
    status: show.status || 'PUBLISHED',
    venueId: show.venue_id
  });
  setEditModalOpen(true);
};
```

## 📋 CAMBIOS REALIZADOS

### 1. **src/pages/admin/AdminDashboard.jsx**

**Import agregado:**
```javascript
import dayjs from 'dayjs';
```

**Función corregida:**
```javascript
const handleEditShow = (show) => {
  // Convertir a dayjs en lugar de Date
  startsAtValue = dayjs(dateStr); // CAMBIO CLAVE
  ...
}
```

## 🔄 CONVERSIÓN DAYJS vs DATE

### **dayjs → Date (para enviar al backend):**
```javascript
// Opción 1: Usar .toDate()
const date = dayjsObject.toDate();

// Opción 2: Usar .toISOString()
const iso = dayjsObject.toISOString();
```

### **Date/String → dayjs (para DatePicker):**
```javascript
// Desde string ISO
const dayjsObj = dayjs('2025-11-01T20:00:00Z');

// Desde Date
const dayjsObj = dayjs(new Date());

// Desde timestamp
const dayjsObj = dayjs(1730495400000);
```

## 🧪 TESTING

1. Login como ADMIN
2. Ir a Shows
3. Click en "Editar" (✏️) en cualquier show
4. Verificar que el modal se abre sin errores
5. Verificar que la fecha se muestra correctamente en el DatePicker
6. Modificar la fecha
7. Guardar cambios
8. Verificar que se actualiza correctamente

## 📚 DOCUMENTACIÓN OFICIAL

- **Ant Design v5 DatePicker:** https://ant.design/components/date-picker
- **Day.js:** https://day.js.org/docs/en/installation/installation
- **Migración de moment a dayjs:** https://ant.design/docs/react/migration-v5#moment-to-dayjs

## ⚠️ IMPORTANTE

**Ant Design v5 usa dayjs por defecto.** No uses `moment.js` ni `Date` nativos con los componentes de fecha:

- ✅ `DatePicker` espera `dayjs`
- ✅ `TimePicker` espera `dayjs`
- ✅ `RangePicker` espera array de `dayjs`

## 📊 RESULTADO

**Error eliminado:** ✅  
**DatePicker funcional:** ✅  
**Edición de shows sin errores:** ✅  

---

**Fix aplicado:** 2025-11-05  
**Archivo:** src/pages/admin/AdminDashboard.jsx  
**Líneas modificadas:** ~20 líneas
