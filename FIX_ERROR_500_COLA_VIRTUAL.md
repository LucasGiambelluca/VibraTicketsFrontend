# 🔴 ERROR 500 - Cola Virtual (CRÍTICO)

**Fecha:** 2025-11-14  
**Estado:** ❌ **BACKEND FALLANDO**

---

## 🐛 PROBLEMA

Al intentar unirse a la cola virtual del show ID 9, el **backend devuelve error 500 (Internal Server Error)**.

### Error en Consola:
```
POST http://localhost:3000/api/queue/9/join 500 (Internal Server Error)
❌ Error al unirse a la cola: Error: InternalError
❌ Status: 500
❌ Message: InternalError
```

### Request Enviado (Frontend):
```http
POST /api/queue/9/join
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userInfo": {
    "name": "Admin E2E",
    "email": "admin_e2e@ticketera.com"
  }
}
```

### Usuario:
- Email: `admin_e2e@ticketera.com`
- Rol: `ADMIN`
- Show ID: `9`

---

## 🔍 POSIBLES CAUSAS (Backend)

### 1. **Show ID 9 No Existe**
El show con ID 9 podría no existir en la base de datos.

**Verificación:**
```sql
SELECT * FROM shows WHERE id = 9;
```

### 2. **Error en JWT Decoding**
El backend podría estar fallando al extraer el `userId` del token JWT.

**Verificación en Backend:**
```javascript
// controllers/queue.controller.js
exports.joinQueue = async (req, res) => {
  const { showId } = req.params;
  const userId = req.user?.id; // ¿Existe req.user?
  
  console.log('🔍 Show ID:', showId);
  console.log('👤 User ID from JWT:', userId);
  console.log('👤 User object:', req.user);
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  // ... resto del código
};
```

### 3. **Error en Base de Datos**
Podría haber un error de sintaxis SQL o de conexión.

**Verificación:**
```javascript
try {
  // Query para insertar en cola
  const result = await db.query(
    'INSERT INTO queue_entries (...) VALUES (...)',
    [...]
  );
  console.log('✅ Query exitoso:', result);
} catch (error) {
  console.error('❌ Error en DB:', error.message);
  console.error('❌ Stack:', error.stack);
  throw error;
}
```

### 4. **Tabla `queue_entries` No Existe**
La tabla de cola virtual podría no estar creada.

**Verificación:**
```sql
SHOW TABLES LIKE 'queue_entries';
DESC queue_entries;
```

### 5. **Middleware de Autenticación Falta**
La ruta podría no estar protegida correctamente.

**Verificación en routes/index.js:**
```javascript
// ¿Tiene el middleware de auth?
router.post('/queue/:showId/join', authenticateJWT, queueController.joinQueue);
```

---

## 🛠️ SOLUCIÓN PASO A PASO

### Paso 1: Ver Logs del Backend
```bash
# En la terminal del backend, verificar:
# 1. ¿Se recibe la petición?
# 2. ¿Hay algún error específico?
# 3. ¿Qué línea de código falla?
```

### Paso 2: Agregar Debugging en Backend
```javascript
// controllers/queue.controller.js
exports.joinQueue = async (req, res) => {
  try {
    const { showId } = req.params;
    const { userInfo } = req.body;
    
    console.log('========== JOIN QUEUE DEBUG ==========');
    console.log('📍 Show ID:', showId);
    console.log('👤 req.user:', req.user);
    console.log('👤 User ID:', req.user?.id);
    console.log('📦 User Info:', userInfo);
    console.log('=====================================');
    
    // 1. Verificar que el show existe
    const [shows] = await db.query(
      'SELECT * FROM shows WHERE id = ?',
      [showId]
    );
    
    if (shows.length === 0) {
      console.error('❌ Show no encontrado:', showId);
      return res.status(404).json({ error: 'Show not found' });
    }
    
    console.log('✅ Show encontrado:', shows[0]);
    
    // 2. Extraer userId del JWT
    const userId = req.user?.id;
    
    if (!userId) {
      console.error('❌ User ID no disponible en req.user');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('✅ User ID extraído:', userId);
    
    // 3. Intentar insertar en cola
    console.log('🔄 Insertando en cola...');
    const [result] = await db.query(
      `INSERT INTO queue_entries (show_id, user_id, position, status, created_at)
       VALUES (?, ?, ?, 'waiting', NOW())`,
      [showId, userId, 1] // Position temporal
    );
    
    console.log('✅ Inserción exitosa:', result);
    
    return res.json({
      position: 1,
      queueSize: 1,
      message: 'Joined queue successfully'
    });
    
  } catch (error) {
    console.error('❌❌❌ ERROR COMPLETO ❌❌❌');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    
    return res.status(500).json({
      error: 'InternalError',
      message: error.message,
      details: error.stack // Solo en desarrollo
    });
  }
};
```

### Paso 3: Verificar Estructura de BD
```sql
-- Verificar que la tabla existe
SHOW TABLES LIKE 'queue_entries';

-- Ver estructura
DESC queue_entries;

-- Debería tener:
-- id (INT PRIMARY KEY AUTO_INCREMENT)
-- show_id (INT NOT NULL)
-- user_id (INT NOT NULL)
-- position (INT)
-- status (VARCHAR/ENUM)
-- access_token (VARCHAR NULL)
-- expires_at (DATETIME NULL)
-- created_at (DATETIME)
```

### Paso 4: Verificar que el Show 9 Existe
```sql
-- Ver show ID 9
SELECT * FROM shows WHERE id = 9;

-- Si no existe, crear uno de prueba
INSERT INTO shows (event_id, starts_at, status, created_at)
VALUES (1, '2025-12-01 20:00:00', 'active', NOW());
```

### Paso 5: Probar con curl
```bash
# Copiar el token JWT de localStorage (F12 → Application → localStorage → token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/queue/9/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userInfo": {
      "name": "Test User",
      "email": "test@test.com"
    }
  }' \
  -v
```

---

## 📊 DEBUGGING CHECKLIST

- [ ] Backend está corriendo en puerto 3000
- [ ] Logs del backend muestran la petición recibida
- [ ] Show ID 9 existe en la base de datos
- [ ] Tabla `queue_entries` existe
- [ ] Middleware `authenticateJWT` está aplicado a la ruta
- [ ] `req.user` tiene los datos del usuario
- [ ] `req.user.id` existe y no es undefined
- [ ] Base de datos tiene conexión activa
- [ ] No hay errores de sintaxis SQL

---

## 🎯 RESPUESTA ESPERADA DEL BACKEND

**Éxito (200 OK):**
```json
{
  "position": 1,
  "hasAccess": true,
  "accessToken": "abc-xyz-123",
  "queueSize": 1,
  "estimatedWaitTime": 0,
  "expiresAt": "2025-11-14T16:00:00Z",
  "message": "Queue position assigned"
}
```

**Show No Existe (404):**
```json
{
  "error": "Show not found",
  "showId": 9
}
```

**Usuario No Autenticado (401):**
```json
{
  "error": "User not authenticated"
}
```

---

## 🔄 WORKAROUND TEMPORAL (Solo desarrollo)

Si necesitas testear el frontend sin arreglar el backend, puedes comentar la validación de cola:

```javascript
// ShowDetail.jsx o donde se use la cola
const handleBuyTickets = async (showId) => {
  // TEMPORAL: Saltar cola virtual en desarrollo
  if (import.meta.env.DEV) {
    console.warn('⚠️ DESARROLLO: Saltando cola virtual');
    navigate(`/shows/${showId}/seats`);
    return;
  }
  
  // Código normal de cola virtual
  navigate(`/queue/${showId}`);
};
```

---

## 📝 PRÓXIMOS PASOS

1. **Revisar logs del backend** (terminal donde corre el servidor)
2. **Agregar console.log** en `queue.controller.js` según el código de debugging
3. **Verificar que show ID 9 existe** en la BD
4. **Verificar tabla `queue_entries`** existe y tiene la estructura correcta
5. **Probar con curl** para aislar el problema del frontend
6. **Compartir logs completos** del error para diagnóstico más específico

---

## ⚠️ IMPORTANTE

Este es un **error del BACKEND**, no del frontend. El frontend está enviando la petición correctamente con:
- ✅ Token JWT válido
- ✅ Show ID correcto (9)
- ✅ Body con userInfo
- ✅ Headers correctos

El problema está en el servidor que devuelve 500 en lugar de procesar la solicitud.

---

**ESTADO:** ⏸️ **ESPERANDO FIX EN BACKEND**

Última actualización: 2025-11-14
