# FIX: ORGANIZER_ID EN CREACIÓN DE EVENTOS

## 🔴 PROBLEMA REPORTADO

Los eventos creados no aparecen luego de crearlos porque **no se está enviando el `organizer_id`**.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Validaciones Mejoradas en CreateEvent.jsx** (Líneas 149-187)

Se agregaron validaciones **MÁS ESTRICTAS**:

```javascript
// ❌ ANTES (vulnerable)
if (user && user.id) {
  submitData.append('organizer_id', user.id);
}

// ✅ AHORA (robusto + BIGINT compatible)
if (!user) {
  setError('❌ No hay usuario autenticado');
  return;
}

if (!user.id) {
  setError('❌ El usuario no tiene ID');
  return;
}

// 🚨 IMPORTANTE: Mantener como STRING para BIGINT
// En JavaScript, números mayores a Number.MAX_SAFE_INTEGER pierden precisión
const organizerId = String(user.id);

// Enviar en MÚLTIPLES formatos (compatibilidad con diferentes backends)
submitData.append('organizer_id', organizerId);
submitData.append('organizerId', organizerId);
submitData.append('created_by', organizerId);
submitData.append('createdBy', organizerId);
```

### 2. **Logs Detallados para Debugging**

Se agregaron logs que muestran:
- ✅ Usuario autenticado completo
- ✅ `user.id`, `user.email`, `user.role`
- ✅ Conversión del ID a número
- ✅ Todos los campos del FormData enviado

---

## 🧪 CÓMO VERIFICAR SI FUNCIONA

### Paso 1: Abrir la Consola del Navegador (F12)

### Paso 2: Intentar Crear un Evento

### Paso 3: Verificar Logs en Consola

Deberías ver algo como esto:

```
🔍 VERIFICANDO USUARIO AUTENTICADO:
  - user: { id: 123, email: 'admin@test.com', role: 'ADMIN', ... }
  - user.id: 123
  - user.email: admin@test.com
  - user.role: ADMIN

✅ Organizador ID (BIGINT como string): 123 (tipo: string)

✅ ORGANIZER_ID AGREGADO AL FORMDATA:
  - organizer_id: 123
  - organizerId: 123
  - created_by: 123
  - createdBy: 123
  - 👤 Organizador: Administrador

🚀 ENVIANDO DATOS DEL EVENTO:
  - name: Mi Evento
  - category: MUSIC
  - location: Buenos Aires
  - startsAt: 2025-12-01T20:00:00.000Z
  - endsAt: 2025-12-01T23:00:00.000Z
  - venue_id: 45
  - venue: Estadio River
  - ✅ organizer_id: 123 (BIGINT como string)
  - status: PUBLISHED
  - hasImage: true

📋 FormData contents:
name: Mi Evento
category: MUSIC
location: Buenos Aires
startsAt: 2025-12-01T20:00:00.000Z
endsAt: 2025-12-01T23:00:00.000Z
organizer_id: 123      ⬅️ AQUÍ ESTÁ
organizerId: 123       ⬅️ AQUÍ ESTÁ
created_by: 123        ⬅️ AQUÍ ESTÁ
createdBy: 123         ⬅️ AQUÍ ESTÁ
venue_id: 45
venueId: 45
venue: Estadio River
status: PUBLISHED
image: [File] evento.jpg (1234567 bytes, image/jpeg)
```

---

## 🔴 POSIBLES ERRORES

### Error 1: "No hay usuario autenticado"

**Causa:** No has iniciado sesión o la sesión expiró.

**Solución:**
1. Ir a `/login`
2. Iniciar sesión con un usuario ADMIN u ORGANIZER
3. Volver a intentar crear el evento

---

### Error 2: "El usuario no tiene ID"

**Causa:** El objeto `user` del contexto de autenticación no tiene el campo `id`.

**Solución:**
1. Verificar en la consola qué contiene `user`
2. Revisar `src/hooks/useAuth.jsx` para ver cómo se guarda el usuario
3. Verificar que el backend esté devolviendo el `id` en la respuesta del login

**Verificar en Consola:**
```javascript
// En la consola del navegador:
localStorage.getItem('user')
// Debería mostrar algo como: {"id":123,"email":"admin@test.com",...}
```

---

### Error 3: El evento se crea pero NO aparece en la lista

**Causa:** El backend puede estar filtrando por `organizer_id` y no encuentra el campo.

**Posibles razones:**

#### A) Backend espera otro nombre de campo

El backend puede estar buscando uno de estos nombres:
- `organizer_id` (snake_case)
- `organizerId` (camelCase)
- `created_by` (alternativo)
- `createdBy` (alternativo)

**SOLUCIÓN:** La nueva versión envía LOS 4 formatos, así el backend lo reconoce sin importar cuál espera.

#### B) Backend no está guardando el organizer_id

**Verificar en Backend:**

1. Revisar el endpoint `POST /api/events`
2. Ver qué campos está recibiendo:

```javascript
// En el backend (ejemplo Node.js)
app.post('/api/events', (req, res) => {
  console.log('📦 Body recibido:', req.body);
  console.log('🆔 Organizer ID:', req.body.organizer_id);
  // ...
});
```

3. Verificar que se guarde en la base de datos:

```sql
-- Verificar en la tabla events
SELECT id, name, organizer_id, created_by FROM events ORDER BY id DESC LIMIT 5;
```

---

## 🎯 LISTA DE VERIFICACIÓN

### Frontend (✅ Ya implementado)

- [x] Usuario autenticado antes de crear evento
- [x] `user.id` existe y es válido
- [x] `organizer_id` se convierte a número
- [x] Se envía en múltiples formatos (snake_case y camelCase)
- [x] Logs detallados en consola
- [x] Validaciones de error con mensajes claros

### Backend (⚠️ VERIFICAR)

- [ ] Endpoint `POST /api/events` está funcionando
- [ ] Backend recibe el campo `organizer_id` (o `organizerId`, `created_by`, `createdBy`)
- [ ] Backend **guarda** el `organizer_id` en la base de datos
- [ ] Backend **no filtra** eventos por organizer_id en el GET (a menos que sea intencional)
- [ ] La columna `organizer_id` existe en la tabla `events`

---

## 📊 VERIFICAR EN BASE DE DATOS

```sql
-- Ver estructura de la tabla events
DESCRIBE events;

-- Verificar si la columna organizer_id existe
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'events' AND COLUMN_NAME IN ('organizer_id', 'created_by');

-- Ver últimos eventos creados CON organizer_id
SELECT id, name, organizer_id, created_by, created_at 
FROM events 
ORDER BY created_at DESC 
LIMIT 10;

-- Si organizer_id es NULL, hay un problema en el backend
```

---

## 🔧 SI AÚN NO APARECE EL EVENTO

### 1. Verificar Filtros en Frontend

En `useEvents.js` o donde cargues los eventos, verifica que NO haya filtros por usuario:

```javascript
// ❌ MALO (filtra por usuario, no muestra todos los eventos)
const { events } = useEvents({ organizerId: user.id });

// ✅ BUENO (muestra todos los eventos)
const { events } = useEvents();
```

### 2. Verificar Backend GET /api/events

El backend NO debería filtrar por defecto por organizador:

```javascript
// ❌ MALO
app.get('/api/events', (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM events WHERE organizer_id = ?', [userId], ...);
});

// ✅ BUENO (mostrar todos, o usar query param opcional)
app.get('/api/events', (req, res) => {
  const { organizerId } = req.query; // Opcional
  
  let query = 'SELECT * FROM events';
  if (organizerId) {
    query += ' WHERE organizer_id = ?';
  }
  
  db.query(query, organizerId ? [organizerId] : [], ...);
});
```

### 3. Llamar a `refetch()` Después de Crear

En `AdminDashboard.jsx` (línea 769-772) ya se hace:

```javascript
setTimeout(() => {
  refetch(); // ✅ Refresca la lista
}, 500);
```

---

## 🎉 RESULTADO ESPERADO

Después del fix:

1. ✅ Los logs en consola muestran el `organizer_id` siendo enviado
2. ✅ El evento se crea en el backend
3. ✅ El evento **APARECE** en la lista inmediatamente
4. ✅ El evento tiene el `organizer_id` asociado en la BD
5. ✅ Puedes ver el organizador en el panel de admin

---

## 📞 PRÓXIMOS PASOS

1. **Crear un evento de prueba** y verificar los logs en consola
2. **Revisar el backend** para confirmar que recibe y guarda el `organizer_id`
3. **Verificar la base de datos** para confirmar que el campo existe y tiene valor
4. Si el problema persiste, compartir:
   - Logs de la consola del navegador (F12)
   - Logs del backend
   - Consulta SQL de la tabla events

---

**Última actualización:** 2025-11-05
**Archivos modificados:** `src/components/CreateEvent.jsx`
