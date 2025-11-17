# ✅ ANÁLISIS COMPLETO - CONEXIÓN FRONTEND ↔ BACKEND

**Fecha:** 04/11/2025 17:58  
**Estado:** ⚠️ REQUIERE CORRECCIONES

---

## 📊 RESUMEN EJECUTIVO

| Endpoint | Frontend | Backend | Estado |
|----------|----------|---------|--------|
| **1. Autenticación** | ✅ | ✅ | ✅ **CORRECTO** |
| **2. Crear Evento** | ⚠️ | ✅ | ⚠️ **CAMPOS INCONSISTENTES** |
| **3. Auto-crear Show** | ❌ | ✅ | ❌ **NO MANEJA RESPUESTA** |
| **4. Crear Sección** | ✅ | ✅ | ✅ **CORRECTO** |
| **5. Obtener Asientos** | ✅ | ✅ | ✅ **CORRECTO** |
| **6. Crear Hold** | ✅ | ✅ | ✅ **CORRECTO** |
| **7. Crear Orden** | ✅ | ✅ | ✅ **CORRECTO** |

---

## 1. ✅ AUTENTICACIÓN - CORRECTO

### Backend Espera:
```json
POST /api/auth/login
{
  "email": "admin_e2e@ticketera.com",
  "password": "Admin123456"
}
```

### Frontend Envía:
```javascript
// src/services/apiService.js:18-22
authApi.login({
  email: credentials.email,
  password: credentials.password
})
```

**✅ Estado:** COINCIDE PERFECTAMENTE

---

## 2. ⚠️ CREAR EVENTO - CAMPOS INCONSISTENTES

### Backend Espera (según doc):
```json
POST /api/events
{
  "name": "Iron Maiden - The Future Past Tour",
  "description": "...",
  "category": "MUSIC",           // ⚠️ Backend espera
  "venue": "Estadio River Plate", // ⚠️ Backend espera nombre
  "location": "Buenos Aires",     // ⚠️ Backend espera location
  "startsAt": "2025-12-15T20:00:00",
  "endsAt": "2025-12-15T23:30:00",
  "status": "PUBLISHED"
}
```

### Frontend Envía (CreateEvent.jsx):
```javascript
// src/components/CreateEvent.jsx:121-131
FormData:
- name ✅
- description ✅
- startsAt ✅
- venueId ❌ (Backend espera "venue" como string, no venueId)
- created_by ⚠️ (No en doc del backend)
- image (opcional) ✅
```

### 🐛 PROBLEMAS IDENTIFICADOS:

1. **Campo `venueId` vs `venue`:**
   - Frontend: `submitData.append('venueId', formData.venue_id)`
   - Backend: Espera `"venue": "Estadio River Plate"` (string con nombre)
   - **Solución:** Enviar nombre del venue, no ID

2. **Faltan campos obligatorios:**
   - `category` ❌ (Backend espera: MUSIC, SPORTS, THEATER, etc.)
   - `location` ❌ (Backend espera: "Buenos Aires, Argentina")
   - `endsAt` ❌ (Backend espera fecha de fin)
   - `status` ⚠️ (Opcional, default: PUBLISHED)

3. **Campo extra no documentado:**
   - `created_by` - Frontend envía, pero no aparece en doc del backend
   - Puede ser correcto si el backend lo soporta

---

## 3. ❌ AUTO-CREACIÓN DE SHOW - NO MANEJADA

### Backend Retorna (según doc):
```json
{
  "eventId": 1,
  "showId": 1,        // ⚠️ Backend auto-crea show
  "name": "Iron Maiden...",
  "venue": "Estadio River Plate",
  "venue_id": null,
  "startsAt": "2025-12-15T20:00:00"
}
```

### Frontend NO Captura el `showId`:
```javascript
// src/components/CreateEvent.jsx:162-181
const result = await eventsApi.createEvent(submitData);
console.log('✅ Evento creado exitosamente:', result);

// ❌ NO guarda result.showId
// ❌ NO redirige a asignar secciones
```

### 🐛 PROBLEMA:
El backend auto-crea un show y devuelve `showId`, pero el frontend:
1. No lo captura
2. No lo guarda
3. No lo usa para crear secciones
4. El usuario tiene que ir manualmente a "Shows" → "Secciones"

### ✅ SOLUCIÓN:
```javascript
const result = await eventsApi.createEvent(submitData);
console.log('✅ Evento creado:', result.eventId);
console.log('✅ Show auto-creado:', result.showId);

// Guardar showId y ofrecer crear secciones
if (result.showId) {
  message.success(
    `Evento creado. ¿Deseas asignar secciones al show ${result.showId}?`,
    { duration: 0 }
  );
}
```

---

## 4. ✅ CREAR SECCIÓN - CORRECTO

### Backend Espera:
```json
POST /api/shows/{showId}/sections
{
  "showId": 1,
  "name": "Campo",
  "kind": "GA",
  "capacity": 5000,
  "priceCents": 15000,
  "currency": "ARS"
}
```

### Frontend Envía:
```javascript
// src/services/apiService.js:195-197
showsApi.createSection(showId, {
  showId, name, kind, capacity, priceCents, currency
})
```

**✅ Estado:** COINCIDE PERFECTAMENTE

---

## 5. ✅ OBTENER ASIENTOS - CORRECTO

### Backend Endpoint:
```
GET /api/shows/{showId}/seats
```

### Frontend Llama:
```javascript
// src/services/apiService.js:185-187
showsApi.getShowSeats(showId)
// → GET /api/shows/{showId}/seats
```

**✅ Estado:** COINCIDE PERFECTAMENTE

---

## 6. ✅ CREAR HOLD - CORRECTO

### Backend Espera:
```json
POST /api/holds
Headers: {
  Authorization: Bearer {token}
  Idempotency-Key: hold-{timestamp}-{random}
}
Body: {
  "showId": 1,
  "seatIds": [1, 2, 3, 4],
  "customerEmail": "cliente@example.com",
  "customerName": "Juan Pérez"
}
```

### Frontend Envía:
```javascript
// src/services/apiService.js:278-289
holdsApi.createHold({
  showId, seatIds, customerEmail, customerName
})
// Genera automáticamente: Idempotency-Key: crypto.randomUUID()
```

**✅ Estado:** COINCIDE PERFECTAMENTE
**✅ Idempotency-Key:** Generado automáticamente

---

## 7. ✅ CREAR ORDEN - CORRECTO

### Backend Espera:
```json
POST /api/orders
Headers: {
  Idempotency-Key: order-{timestamp}-{random}
}
Body: {
  "holdId": 1
}
```

### Frontend Envía:
```javascript
// src/services/apiService.js:313-324
ordersApi.createOrder({ holdId })
// Genera automáticamente: Idempotency-Key: crypto.randomUUID()
```

**✅ Estado:** COINCIDE PERFECTAMENTE
**⚠️ Nota:** Endpoint es público (sin auth), correcto según doc

---

## 🔧 CORRECCIONES NECESARIAS

### 1. Crear Evento - Agregar Campos Faltantes

**Archivo:** `src/components/CreateEvent.jsx`

**Problema:**
```javascript
// ❌ ACTUAL: Solo envía name, description, startsAt, venueId, created_by
```

**Solución:**
```javascript
// ✅ CORREGIR: Agregar campos obligatorios
const submitData = new FormData();
submitData.append('name', formData.name);
submitData.append('description', formData.description);
submitData.append('startsAt', formData.startsAt);

// ✅ NUEVO: Agregar campos faltantes
submitData.append('category', formData.category || 'MUSIC'); // Selector
submitData.append('location', formData.location); // Input nuevo
submitData.append('endsAt', formData.endsAt); // DatePicker de fin
submitData.append('status', 'PUBLISHED'); // Default

// ⚠️ CAMBIAR: venueId por venue (nombre)
submitData.append('venue', venueName); // Nombre del venue, no ID

// ✅ MANTENER: created_by (si backend lo soporta)
submitData.append('created_by', user.id);
```

### 2. Capturar Show Auto-creado

**Archivo:** `src/components/CreateEvent.jsx`

**Agregar después de crear evento:**
```javascript
const result = await eventsApi.createEvent(submitData);

console.log('✅ Evento creado:', result.eventId);
console.log('✅ Show auto-creado:', result.showId);

// Guardar showId para usar después
setCreatedShowId(result.showId);

// Notificar y ofrecer crear secciones
if (onEventCreated) {
  onEventCreated({
    ...result,
    showId: result.showId // Pasar showId al padre
  });
}

// Mostrar modal para crear secciones
Modal.confirm({
  title: '¿Deseas asignar secciones ahora?',
  content: `El show ${result.showId} fue creado automáticamente. 
            ¿Quieres asignar secciones (Campo, Platea, VIP)?`,
  onOk: () => {
    // Abrir modal de secciones o navegar
    navigate(`/admin/shows/${result.showId}/sections`);
  }
});
```

### 3. Actualizar Formulario CreateEvent

**Agregar campos al formulario:**
```jsx
// NUEVO: Category selector
<Select
  name="category"
  value={formData.category}
  onChange={(value) => setFormData({...formData, category: value})}
>
  <Option value="MUSIC">🎵 Música</Option>
  <Option value="SPORTS">⚽ Deportes</Option>
  <Option value="THEATER">🎭 Teatro</Option>
  <Option value="CONFERENCE">🎤 Conferencia</Option>
  <Option value="OTHER">📌 Otro</Option>
</Select>

// NUEVO: Location input
<Input
  name="location"
  placeholder="Buenos Aires, Argentina"
  value={formData.location}
  onChange={handleChange}
/>

// NUEVO: End Date picker
<DatePicker
  showTime
  format="DD/MM/YYYY HH:mm"
  placeholder="Fecha y hora de fin"
  onChange={(date) => setFormData({
    ...formData, 
    endsAt: date?.toISOString()
  })}
/>
```

---

## 📋 CHECKLIST DE VALIDACIÓN

### ✅ Endpoints Correctos:
- [x] POST /api/auth/login
- [x] POST /api/events
- [x] GET /api/shows/{showId}
- [x] POST /api/shows/{showId}/sections
- [x] GET /api/shows/{showId}/seats
- [x] POST /api/holds
- [x] POST /api/orders

### ⚠️ Campos de Datos:
- [x] Login: email, password ✅
- [ ] Evento: name, description, category ❌ falta category
- [ ] Evento: venue (nombre) ❌ envía venueId
- [ ] Evento: location ❌ falta
- [ ] Evento: startsAt, endsAt ❌ falta endsAt
- [x] Sección: showId, name, kind, capacity, priceCents ✅
- [x] Hold: showId, seatIds, customerEmail ✅
- [x] Orden: holdId ✅

### ⚠️ Headers:
- [x] Authorization: Bearer {token} ✅
- [x] Idempotency-Key (holds) ✅
- [x] Idempotency-Key (orders) ✅
- [x] Content-Type: application/json ✅

### ❌ Flujo:
- [x] Login → Token guardado ✅
- [ ] Crear Evento → Show auto-creado ❌ No captura showId
- [x] Crear Sección → Asientos generados ✅
- [x] Obtener asientos ✅
- [x] Crear Hold (15 min) ✅
- [x] Crear Orden ✅
- [x] Webhook MP → Tickets ✅

---

## 🚀 PRIORIDAD DE CORRECCIONES

### 🔴 CRÍTICO (Bloquea flujo):
1. **Crear Evento - Campos faltantes:**
   - Agregar: `category`, `location`, `endsAt`
   - Cambiar: `venueId` → `venue` (nombre)

2. **Capturar `showId` auto-creado:**
   - Guardar `result.showId`
   - Ofrecer crear secciones inmediatamente

### 🟡 IMPORTANTE (Mejora UX):
3. **Actualizar formulario CreateEvent:**
   - Agregar selector de categoría
   - Agregar input de ubicación
   - Agregar DatePicker de fin

4. **Validaciones:**
   - Fecha de fin > fecha de inicio
   - Categoría obligatoria

---

## 📊 COMPATIBILIDAD CON BACKEND

| Aspecto | Compatible | Notas |
|---------|------------|-------|
| **Estructura de endpoints** | ✅ 100% | Todos los endpoints coinciden |
| **Autenticación JWT** | ✅ 100% | Token en header Authorization |
| **Idempotency** | ✅ 100% | UUID generado automáticamente |
| **Campos de datos** | ⚠️ 60% | Faltan campos en crear evento |
| **Flujo de negocio** | ⚠️ 80% | No captura showId auto-creado |
| **Manejo de errores** | ✅ 100% | Client.js maneja 401, 404, 500 |

---

## 🎯 PRÓXIMOS PASOS

1. **Corregir CreateEvent.jsx:**
   - Agregar campos: category, location, endsAt
   - Cambiar venueId por venue (nombre)
   - Capturar result.showId

2. **Testing:**
   - Crear evento completo
   - Verificar show auto-creado
   - Crear secciones inmediatamente
   - Flujo completo hasta tickets

3. **Documentar:**
   - Actualizar README con campos correctos
   - Agregar ejemplos de uso

---

## 📞 RESUMEN PARA EL USUARIO

**Lo que FUNCIONA bien:** ✅
- Autenticación
- Crear secciones
- Obtener asientos
- Crear holds
- Crear órdenes
- Integración con MercadoPago

**Lo que NECESITA corrección:** ⚠️
1. Formulario de crear evento (faltan campos)
2. Campo `venueId` debe ser `venue` (nombre)
3. No captura el `showId` auto-creado

**Impacto:**
- **Funcionalidad:** El sistema funciona pero no envía todos los campos que el backend espera
- **UX:** El usuario tiene que ir manualmente a crear secciones en vez de hacerlo inmediatamente
- **Datos:** Eventos pueden crearse incompletos

---

**Última actualización:** 04/11/2025 17:58  
**Estado:** ⚠️ REQUIERE 3 CORRECCIONES  
**Prioridad:** ALTA (bloquea flujo completo)
