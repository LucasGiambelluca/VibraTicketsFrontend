# 🚨 Problema: Reset Password - Error 404 y ValidationError

## Problema Actual

Al intentar restablecer la contraseña desde el frontend, se reciben los siguientes errores:

```
Error: response: 404-Not
Error: message: ValidationError
Error: validationError at authApi.resetPassword (email-validator.js:...)
```

## Endpoint Requerido

### POST /api/auth/reset-password

**URL completa**: `https://vibra-tickets-backend.onrender.com/api/auth/reset-password`

**Request Body**:
```json
{
  "token": "string (UUID o token generado)",
  "newPassword": "string (mínimo 6 caracteres)"
}
```

**Response Exitosa (200)**:
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

**Errores Posibles**:

**400 - Token Inválido o Expirado**:
```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

**400 - Contraseña Inválida**:
```json
{
  "success": false,
  "error": "La contraseña debe tener al menos 6 caracteres"
}
```

**404 - Usuario No Encontrado**:
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

## Implementación Backend Requerida

### 1. Ruta (routes/auth.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// ... otras rutas ...

// Reset Password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
```

### 2. Controlador (controllers/auth.controller.js)

```javascript
const authService = require('../services/auth.service');

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validar campos requeridos
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token y nueva contraseña son requeridos'
      });
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Llamar al servicio
    const result = await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en resetPassword:', error);

    // Manejar errores específicos
    if (error.message === 'Token inválido o expirado') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    // Error genérico
    res.status(500).json({
      success: false,
      error: 'Error al restablecer la contraseña'
    });
  }
};
```

### 3. Servicio (services/auth.service.js)

```javascript
const bcrypt = require('bcrypt');
const db = require('../config/database');

exports.resetPassword = async (token, newPassword) => {
  try {
    // 1. Buscar el token en la base de datos
    const [tokenRecords] = await db.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = ? 
       AND expires_at > NOW() 
       AND used_at IS NULL`,
      [token]
    );

    if (tokenRecords.length === 0) {
      throw new Error('Token inválido o expirado');
    }

    const tokenRecord = tokenRecords[0];
    const userId = tokenRecord.user_id;

    // 2. Verificar que el usuario existe
    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    // 3. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar la contraseña del usuario
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    // 5. Marcar el token como usado
    await db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    );

    return true;

  } catch (error) {
    console.error('Error en resetPassword service:', error);
    throw error;
  }
};
```

## Verificación de la Tabla

Asegúrate de que la tabla `password_reset_tokens` existe:

```sql
SELECT * FROM password_reset_tokens 
WHERE expires_at > NOW() 
AND used_at IS NULL 
LIMIT 5;
```

Si no existe, créala:

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);
```

## Verificación del Endpoint

### Usando curl:

```bash
curl -X POST https://vibra-tickets-backend.onrender.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123",
    "newPassword": "nuevaPassword123"
  }'
```

### Usando Postman:

**URL**: `POST https://vibra-tickets-backend.onrender.com/api/auth/reset-password`

**Headers**:
```
Content-Type: application/json
```

**Body (raw JSON)**:
```json
{
  "token": "abc123xyz789",
  "newPassword": "nuevaPassword123"
}
```

## Problema del ValidationError

El error `ValidationError at email-validator.js` sugiere que hay un middleware de validación que está rechazando la petición.

**Posibles causas**:

1. **Middleware de validación mal configurado**: Está esperando un campo `email` que no se está enviando
2. **Ruta incorrecta**: El endpoint está en una ruta diferente
3. **CORS**: El backend no está aceptando peticiones desde el frontend

**Solución**:

1. Verificar que el endpoint `/api/auth/reset-password` existe
2. Verificar que NO requiere autenticación (debe ser público)
3. Verificar que acepta `token` y `newPassword` en el body
4. Verificar que CORS está configurado para aceptar peticiones desde `http://localhost:5174`

## CORS Configuration

En el backend, asegúrate de tener:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://vibratickets.online',
  'https://www.vibratickets.online'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Testing

Una vez implementado, probar:

1. **Token válido + contraseña válida**: Debe retornar 200 y actualizar la contraseña
2. **Token inválido**: Debe retornar 400 con mensaje de error
3. **Token expirado**: Debe retornar 400 con mensaje de error
4. **Token ya usado**: Debe retornar 400 con mensaje de error
5. **Contraseña muy corta**: Debe retornar 400 con mensaje de error
6. **Sin token**: Debe retornar 400 con mensaje de error
7. **Sin contraseña**: Debe retornar 400 con mensaje de error

## Logs del Frontend

El frontend está enviando:

```javascript
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123xyz789",
  "newPassword": "nuevaPassword123"
}
```

Y esperando:

```javascript
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

## Estado Actual

- ✅ Frontend implementado y funcionando
- ❌ Backend devolviendo 404 o ValidationError
- ⏳ Necesita implementación del endpoint

## Próximos Pasos

1. Verificar que el endpoint existe en el backend
2. Verificar que acepta los campos correctos
3. Verificar que CORS está configurado
4. Probar con Postman/curl
5. Verificar logs del backend para más detalles
6. Una vez funcionando, probar desde el frontend

---

**Urgencia**: Alta - Funcionalidad crítica para recuperación de contraseñas
**Impacto**: Los usuarios no pueden recuperar sus contraseñas
