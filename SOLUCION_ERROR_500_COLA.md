# 🔥 SOLUCIÓN: Error 500 en Cola Virtual

## 🔴 ERROR DETECTADO

El backend está devolviendo **Error 500** cuando intentas consultar tu posición en la cola.

```
❌ Error al consultar posición
❌ Status: 500
🔥 ERROR 500 DEL BACKEND - El servidor tiene un problema
```

---

## ✅ CAMBIOS APLICADOS EN EL FRONTEND

### 1. Validación de Respuesta
Ahora el frontend valida que la respuesta del backend tenga datos válidos antes de usarlos:

```javascript
// ✅ Validar que la respuesta existe
if (!response) {
  console.error('❌ Respuesta vacía del backend');
  return;
}

// ✅ Validar que tiene "position"
if (typeof response.position === 'undefined') {
  console.error('❌ La respuesta no incluye "position"');
  return;
}
```

### 2. Manejo de Errores Mejorado
El frontend ahora muestra mensajes claros cuando hay errores:

- **Error 500:** "Error del servidor. Reintentando en el próximo ciclo..."
- **Error de Red:** "Problema de conexión. Verificá que el backend esté corriendo."

### 3. No Detiene el Polling
Aunque haya un error, el polling continúa (reintenta cada 10 segundos).

---

## 🔍 CAUSA DEL ERROR 500

El error 500 significa que **el backend tiene un bug** en el endpoint:

```
GET /api/queue/:showId/position
```

### Posibles causas en el backend:

1. **Usuario no está en la cola:**
   - El backend intenta buscar al usuario en la cola pero no lo encuentra
   - Falta validación para este caso

2. **Redis no está conectado:**
   - El backend intenta acceder a Redis pero la conexión falló
   - Verifica los logs del backend

3. **Error de autenticación:**
   - El JWT no se puede verificar
   - El userId extraído del JWT es inválido

4. **Datos corruptos en Redis:**
   - La cola en Redis tiene datos en formato incorrecto
   - Se necesita limpiar Redis

---

## 🔧 CÓMO SOLUCIONAR (BACKEND)

### Paso 1: Ver Logs del Backend

En la terminal donde corre el backend, busca:

```
[Queue] Error getting position for user X
[Queue] Error: ...stack trace...
```

Copia el error completo y compártelo.

### Paso 2: Verificar que Redis está Corriendo

```bash
# En la terminal:
redis-cli ping

# Debería responder:
PONG
```

Si dice "Could not connect" → Redis no está corriendo.

**Iniciar Redis:**
```bash
# Windows (si usas WSL):
sudo service redis-server start

# macOS:
brew services start redis

# Linux:
sudo systemctl start redis
```

### Paso 3: Limpiar la Cola en Redis (Temporal)

Si la cola tiene datos corruptos, límpiarla:

```bash
redis-cli

# Ver la cola:
LRANGE queue:show:38 0 -1

# Limpiar la cola (⚠️ esto borra todos los usuarios en cola):
DEL queue:show:38

# Limpiar tokens de acceso:
KEYS access:*
DEL access:token-viejo-1
DEL access:token-viejo-2

# Salir:
exit
```

### Paso 4: Agregar Validación en el Backend

El endpoint `GET /queue/:showId/position` debe validar:

```javascript
// Pseudo-código del backend
async getQueuePosition(req, res) {
  try {
    const { showId } = req.params;
    const userId = req.user.id; // Del JWT
    
    // ✅ Validar que el show existe
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }
    
    // ✅ Validar que hay una cola para este show
    const queueKey = `queue:show:${showId}`;
    const queueExists = await redis.exists(queueKey);
    
    if (!queueExists) {
      // No hay cola activa, crear una nueva o devolver posición 0
      return res.json({
        showId,
        position: 0,
        queueSize: 0,
        estimatedWaitTime: 0,
        message: 'No queue active for this show'
      });
    }
    
    // ✅ Buscar posición del usuario
    const position = await redis.lpos(queueKey, userId);
    
    if (position === null) {
      // Usuario no está en la cola
      return res.json({
        showId,
        position: -1, // Indicador de "no en cola"
        queueSize: await redis.llen(queueKey),
        message: 'User not in queue'
      });
    }
    
    // Usuario está en la cola
    const queueSize = await redis.llen(queueKey);
    const estimatedWaitTime = position * 30; // 30s por persona
    
    // Si está en posición 1 o 0, generar accessToken
    let accessToken = null;
    if (position <= 1) {
      accessToken = generateAccessToken(userId, showId);
      await redis.setex(`access:${accessToken}`, 900, JSON.stringify({
        userId,
        showId,
        expiresAt: Date.now() + 900000
      }));
    }
    
    res.json({
      showId,
      position: position + 1, // +1 porque LPOS es 0-indexed
      queueSize,
      estimatedWaitTime,
      accessToken,
      expiresAt: accessToken ? new Date(Date.now() + 900000) : null
    });
    
  } catch (error) {
    // ⚠️ Nunca devolver 500 sin logs
    console.error('[Queue] Error getting position:', error);
    console.error('[Queue] User:', req.user.id);
    console.error('[Queue] Show:', req.params.showId);
    console.error('[Queue] Stack:', error.stack);
    
    res.status(500).json({
      error: 'Error getting queue position',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
```

---

## 🧪 TESTING DESPUÉS DEL FIX

1. **Recarga la página** en `/queue/:showId`
2. **Abre la consola** (F12)
3. **Verifica los logs:**
   - ✅ "📊 RESPUESTA COMPLETA DEL BACKEND: {...}"
   - ✅ Debería incluir `position`, `queueSize`, etc.
   - ❌ NO debería decir "Error 500"

4. **Si sigue fallando:**
   - Copia los logs del backend
   - Copia los logs del frontend
   - Verifica que Redis esté corriendo

---

## 📋 CHECKLIST

### Frontend ✅
- [x] Valida respuesta antes de acceder a propiedades
- [x] Muestra mensaje de error claro
- [x] Continúa polling después de errores
- [x] Logs detallados para debug

### Backend ❓
- [ ] Redis está corriendo
- [ ] Endpoint `/queue/:showId/position` no devuelve 500
- [ ] Valida que el usuario esté en la cola
- [ ] Genera accessToken cuando position <= 1
- [ ] Logs de errores están habilitados

---

## 🎯 PRÓXIMOS PASOS

1. **Ver logs del backend** → Identificar causa del error 500
2. **Verificar Redis** → `redis-cli ping`
3. **Limpiar cola corrupta** → `DEL queue:show:38`
4. **Agregar validaciones** → En el endpoint del backend
5. **Probar nuevamente** → Debería funcionar sin error 500

---

## 💡 TIP

Si queres probar rápido sin arreglar el backend, podes comentar temporalmente el polling y simular la redirección:

```javascript
// En Queue.jsx, dentro del useEffect inicial:
// Comentar startPolling() y agregar:

setTimeout(() => {
  const fakeToken = 'fake-token-for-testing';
  sessionStorage.setItem(`queue-access-${showId}`, fakeToken);
  navigate(`/shows/${showId}`, {
    state: { accessToken: fakeToken, fromQueue: true }
  });
}, 3000);
```

Pero esto es **solo para testing**. El flujo real necesita el backend funcionando correctamente.
