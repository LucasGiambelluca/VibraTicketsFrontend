# 🐛 ERROR: JWT Not Active (NotBeforeError)

## Fecha: 2025-11-26
## Prioridad: 🔴 Alta

---

## ❌ Error Observado

```
Error: NotBeforeError: jwt not active
Status: 400 Bad Request
Endpoint: GET /api/manage/orders/pending
```

---

## 🔍 Causa del Error

Este error ocurre cuando el token JWT tiene un campo `nbf` (not before) que indica una fecha futura, o cuando hay un desfase de tiempo entre el servidor y el cliente.

### Estructura del Token JWT:

```javascript
{
  "iat": 1732659600,  // Issued At (cuando se creó)
  "nbf": 1732659600,  // Not Before (desde cuándo es válido)
  "exp": 1732746000,  // Expiration (hasta cuándo es válido)
  "userId": 1,
  "role": "ADMIN"
}
```

### Problema:

El backend está rechazando el token porque:
1. **`nbf` (not before) es mayor que la hora actual del servidor**
2. **Desfase de tiempo** entre frontend y backend
3. **Token generado con fecha futura**

---

## ✅ Soluciones

### Solución 1: Verificar Sincronización de Tiempo (Backend)

**El servidor del backend debe tener la hora correcta.**

```bash
# En el servidor del backend:
date
# Debería mostrar: Tue Nov 26 19:13:00 -03 2025

# Si la hora está mal, sincronizar:
sudo ntpdate -s time.nist.gov
# O
sudo timedatectl set-ntp true
```

### Solución 2: Ajustar Generación del Token (Backend)

**Archivo:** `middleware/auth.js` o donde se genera el token

```javascript
// ❌ MAL - Usando nbf futuro
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { 
    expiresIn: '24h',
    notBefore: '5m'  // ❌ Token no será válido hasta dentro de 5 minutos
  }
);

// ✅ BIEN - Sin nbf o con nbf actual
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { 
    expiresIn: '24h'
    // Sin notBefore, el token es válido inmediatamente
  }
);

// ✅ BIEN - Con nbf pero en el pasado
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { 
    expiresIn: '24h',
    notBefore: '-1m'  // Válido desde hace 1 minuto
  }
);
```

### Solución 3: Agregar Margen de Tolerancia (Backend)

**Archivo:** Donde se verifica el token

```javascript
// ❌ MAL - Sin margen de tolerancia
jwt.verify(token, process.env.JWT_SECRET);

// ✅ BIEN - Con margen de 60 segundos
jwt.verify(token, process.env.JWT_SECRET, {
  clockTolerance: 60  // Tolera 60 segundos de diferencia
});
```

### Solución 4: Regenerar Token (Frontend)

**Si el token actual está mal, hacer logout y login nuevamente:**

```javascript
// En la consola del navegador:
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/adminlogin';
```

---

## 🧪 Debugging

### 1. Verificar Contenido del Token (Frontend)

```javascript
// En la consola del navegador:
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
console.log('iat (issued at):', new Date(payload.iat * 1000));
console.log('nbf (not before):', new Date(payload.nbf * 1000));
console.log('exp (expires):', new Date(payload.exp * 1000));
console.log('Hora actual:', new Date());
```

**Verificar:**
- ✅ `nbf` debe ser <= hora actual
- ✅ `exp` debe ser > hora actual
- ✅ `iat` debe ser <= hora actual

### 2. Verificar Hora del Servidor (Backend)

```javascript
// Agregar endpoint de prueba en el backend:
router.get('/api/debug/time', (req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    serverTimestamp: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});
```

```bash
# Probar:
curl http://localhost:3000/api/debug/time
```

### 3. Comparar Tiempos

```javascript
// En la consola del navegador:
fetch('http://localhost:3000/api/debug/time')
  .then(r => r.json())
  .then(data => {
    console.log('Hora del servidor:', new Date(data.serverTime));
    console.log('Hora del cliente:', new Date());
    console.log('Diferencia (ms):', Date.now() - data.serverTimestamp);
  });
```

---

## 🔧 Fix Recomendado (Backend)

### Archivo: `middleware/auth.js` (o similar)

```javascript
const jwt = require('jsonwebtoken');

// Generar token (en login)
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '24h'
      // ⭐ NO usar notBefore
    }
  );
};

// Verificar token (en middleware)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      clockTolerance: 60  // ⭐ Tolerar 60 segundos de diferencia
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error.message);
    
    if (error.name === 'NotBeforeError') {
      return res.status(400).json({ 
        error: 'Token no activo aún',
        message: 'El token no es válido todavía. Verifica la sincronización de tiempo.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      });
    }
    
    return res.status(403).json({ 
      error: 'Token inválido',
      message: error.message 
    });
  }
};

module.exports = { generateToken, authenticateToken };
```

---

## 📋 Checklist de Solución

### Backend:
- [ ] Verificar hora del servidor (`date`)
- [ ] Sincronizar hora si es necesario (`ntpdate`)
- [ ] Remover `notBefore` de la generación del token
- [ ] Agregar `clockTolerance: 60` en la verificación
- [ ] Reiniciar servidor del backend
- [ ] Probar endpoint `/api/debug/time`

### Frontend:
- [ ] Hacer logout
- [ ] Limpiar localStorage
- [ ] Hacer login nuevamente
- [ ] Verificar nuevo token en consola
- [ ] Probar acceso al panel de órdenes

---

## 🚀 Pasos Inmediatos

### 1. Hacer Logout y Login Nuevamente

```javascript
// En la consola del navegador:
localStorage.clear();
window.location.href = '/adminlogin';
```

### 2. Verificar Nuevo Token

```javascript
// Después de hacer login:
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Nuevo token:', payload);
```

### 3. Probar Endpoint

```bash
curl http://localhost:3000/api/manage/orders/pending \
  -H "Authorization: Bearer NUEVO_TOKEN"
```

---

## 📊 Logs Esperados

### Antes del Fix:

```
❌ Error verificando token: NotBeforeError: jwt not active
❌ Status: 400 Bad Request
```

### Después del Fix:

```
✅ Token verificado correctamente
✅ Usuario: { userId: 1, role: 'ADMIN', email: 'admin@example.com' }
✅ Órdenes encontradas: 5
```

---

## 💡 Prevención Futura

### 1. No usar `notBefore` en tokens de sesión

```javascript
// ❌ Evitar
{ notBefore: '5m' }

// ✅ Usar solo expiresIn
{ expiresIn: '24h' }
```

### 2. Siempre agregar `clockTolerance`

```javascript
jwt.verify(token, secret, { clockTolerance: 60 });
```

### 3. Sincronizar servidores con NTP

```bash
# Configurar NTP en el servidor
sudo apt-get install ntp
sudo systemctl enable ntp
sudo systemctl start ntp
```

---

**Estado:** ⏳ Esperando fix del backend  
**Acción Inmediata:** Hacer logout/login para obtener nuevo token  
**Solución Permanente:** Backend debe ajustar generación de tokens
