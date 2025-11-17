# 🔧 FIX: Error 403 (Forbidden) - MercadoPago Config

## 🔴 **PROBLEMA**

Al intentar guardar la configuración de MercadoPago desde el frontend, se recibe el error:

```
POST http://localhost:3000/api/payment-config/mercadopago → 403 (Forbidden)
Error: Forbidden
```

---

## ✅ **SOLUCIONES IMPLEMENTADAS EN EL FRONTEND**

### 1. **Método `PATCH` agregado al ApiClient**

**Problema:** El `ApiClient` no tenía el método `patch()` definido.

**Solución:** Se agregó el método `patch` en `src/api/client.js`:

```javascript
async patch(endpoint, data = {}) {
  return this.request(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}
```

**Estado:** ✅ COMPLETADO

---

## 🔍 **CAUSAS POSIBLES DEL ERROR 403**

El error **403 Forbidden** significa que el servidor está rechazando la petición por falta de permisos. Las causas pueden ser:

### ❌ **1. Usuario sin rol ADMIN/ORGANIZER**

**Descripción:** El endpoint `POST /api/payment-config/mercadopago` probablemente requiere que el usuario autenticado tenga el rol de **ADMIN** o **ORGANIZER**.

**Cómo verificar:**
1. Abre las **DevTools del navegador** (F12)
2. Ve a la pestaña **Application > Local Storage**
3. Busca la key `user` y revisa el valor:

```json
{
  "id": "123",
  "email": "admin@example.com",
  "role": "admin" // <-- Debe ser "admin" o "organizer"
}
```

**Solución:**
- Si tu usuario NO tiene el rol correcto, debes:
  - Crear un nuevo usuario con rol ADMIN
  - O modificar el rol del usuario actual en la base de datos

---

### ❌ **2. Token JWT Expirado**

**Descripción:** El token de autenticación ha expirado.

**Cómo verificar:**
1. Abre las **DevTools del navegador** (F12)
2. Ve a **Application > Local Storage**
3. Busca la key `token`
4. Copia el token y decodifícalo en https://jwt.io
5. Revisa el campo `exp` (expiration timestamp)

**Solución:**
```javascript
// El frontend ya maneja esto automáticamente
// Si el token expiró, redirige a /login
```

---

### ❌ **3. Backend no tiene el endpoint implementado**

**Descripción:** El backend no tiene implementado el endpoint `POST /api/payment-config/mercadopago` o no tiene el middleware de autorización correcto.

**Solución en el Backend (Node.js/Express):**

```javascript
// routes/paymentConfig.routes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// POST /api/payment-config/mercadopago
// Requiere autenticación + rol ADMIN/ORGANIZER
router.post(
  '/mercadopago',
  auth,                              // Middleware: Verifica JWT
  authorize(['admin', 'organizer']), // Middleware: Verifica rol
  async (req, res) => {
    try {
      const { accessToken, publicKey, isSandbox, isActive, config } = req.body;
      
      // Validaciones
      if (!accessToken) {
        return res.status(400).json({ error: 'Access Token requerido' });
      }
      
      // Guardar en base de datos
      // ... tu lógica aquí
      
      res.json({
        success: true,
        message: 'Configuración guardada exitosamente',
        data: { /* ... */ }
      });
    } catch (error) {
      console.error('Error al guardar config:', error);
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  }
);

module.exports = router;
```

---

### ❌ **4. Middleware de autorización incorrecto**

**Descripción:** El middleware `authorize` en el backend está bloqueando la petición.

**Solución:** Verifica que el middleware esté configurado correctamente:

```javascript
// middleware/auth.js

// Verificar JWT
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No autorizado - Token requerido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verificar rol
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acceso denegado - Rol insuficiente',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

module.exports = { auth, authorize };
```

---

### ❌ **5. CORS mal configurado**

**Descripción:** El servidor backend está bloqueando las peticiones por problemas de CORS.

**Solución en el Backend:**

```javascript
// server.js o app.js
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🧪 **CÓMO PROBAR**

### **1. Verificar que estás logueado como ADMIN**

```javascript
// En la consola del navegador (DevTools)
const user = JSON.parse(localStorage.getItem('user'));
console.log('Usuario actual:', user);
console.log('Rol:', user?.role);

// Debe mostrar: role: "admin" o "organizer"
```

### **2. Verificar que el token esté presente**

```javascript
// En la consola del navegador
const token = localStorage.getItem('token');
console.log('Token presente:', !!token);
console.log('Token:', token);
```

### **3. Probar el endpoint manualmente con curl**

```bash
# Reemplaza <YOUR_TOKEN> con tu token JWT
curl -X POST http://localhost:3000/api/payment-config/mercadopago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "accessToken": "TEST-123456",
    "isSandbox": true,
    "isActive": false
  }'
```

### **4. Ver logs del backend**

Asegúrate de que el backend esté loggeando información útil:

```javascript
// En el middleware de autorización
console.log('🔐 Usuario autenticado:', req.user);
console.log('🔑 Rol del usuario:', req.user?.role);
console.log('✅ Roles permitidos:', roles);
```

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [ ] ¿El usuario tiene rol `admin` o `organizer`?
- [ ] ¿El token JWT está presente en localStorage?
- [ ] ¿El token JWT NO ha expirado?
- [ ] ¿El backend tiene el endpoint implementado?
- [ ] ¿El middleware de autenticación está configurado?
- [ ] ¿El middleware de autorización permite el rol del usuario?
- [ ] ¿CORS está configurado correctamente?
- [ ] ¿El método `PATCH` está implementado en el ApiClient? ✅

---

## 🚀 **SIGUIENTE PASO**

1. **Verifica tu rol de usuario** en LocalStorage
2. **Si no eres ADMIN**, crea un usuario ADMIN o modifica tu usuario actual
3. **Verifica que el backend tenga el endpoint implementado**
4. **Prueba nuevamente desde el frontend**

---

## 📝 **EJEMPLO DE RESPUESTA EXITOSA**

```json
{
  "success": true,
  "message": "Configuración guardada exitosamente",
  "data": {
    "provider": "mercadopago",
    "hasAccessToken": true,
    "publicKey": "TEST-pub-123...",
    "isSandbox": true,
    "isActive": false,
    "updatedAt": "2025-11-05T21:34:00.000Z"
  }
}
```

---

## 🔗 **REFERENCIAS**

- HTTP Status 403: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
- JWT Authentication: https://jwt.io/introduction
- Express Middleware: https://expressjs.com/en/guide/using-middleware.html
