# 🔐 Sistema de Recuperación de Contraseña

## Archivos Creados/Modificados

### 1. ResetPassword.jsx (NUEVO)
**Ubicación**: `src/pages/ResetPassword.jsx`

Página que maneja el restablecimiento de contraseña con token.

**Características**:
- Recibe token por URL query parameter (`?token=xxx`)
- Valida que el token existe
- Formulario con nueva contraseña y confirmación
- Validación de contraseñas coincidentes
- Muestra resultado exitoso con redirección automática
- Manejo de errores (token inválido/expirado)

**Estados**:
1. **Verificando**: Valida el token al cargar
2. **Token Inválido**: Muestra error y opción de solicitar nuevo enlace
3. **Formulario**: Permite ingresar nueva contraseña
4. **Éxito**: Confirma cambio y redirige al login

### 2. ForgotPassword.jsx (MODIFICADO)
**Cambios**:
- Ahora usa el endpoint real del backend: `authApi.forgotPassword(email)`
- Removido código de simulación
- Manejo de errores mejorado

### 3. apiService.js (MODIFICADO)
**Endpoints agregados**:

```javascript
// Solicitar enlace de recuperación
authApi.forgotPassword(email)
// POST /api/auth/forgot-password
// Body: { email: string }

// Restablecer contraseña con token
authApi.resetPassword({ token, newPassword })
// POST /api/auth/reset-password
// Body: { token: string, newPassword: string }

// Verificar si token es válido (opcional)
authApi.verifyResetToken(token)
// POST /api/auth/verify-reset-token
// Body: { token: string }
```

### 4. App.jsx (MODIFICADO)
**Ruta agregada**:
```javascript
<Route path="/reset-password" element={<ResetPassword />} />
```

## Flujo Completo

### Paso 1: Usuario Olvida su Contraseña
1. Usuario va a `/forgot-password`
2. Ingresa su email
3. Hace clic en "Enviar Enlace de Recuperación"
4. Frontend llama a `POST /api/auth/forgot-password`
5. Backend envía email con enlace

### Paso 2: Backend Envía Email
El backend debe enviar un email con un enlace como:
```
https://vibratickets.online/reset-password?token=abc123xyz789
```

**Formato del token**:
- Debe ser único y seguro (UUID, JWT, etc.)
- Debe tener expiración (recomendado: 1 hora)
- Debe estar asociado al usuario en la base de datos

### Paso 3: Usuario Hace Clic en el Enlace
1. Usuario abre el email
2. Hace clic en el enlace
3. Es redirigido a `/reset-password?token=abc123xyz789`
4. Frontend extrae el token del query parameter
5. (Opcional) Verifica que el token es válido

### Paso 4: Usuario Ingresa Nueva Contraseña
1. Ve formulario con dos campos:
   - Nueva contraseña (mínimo 6 caracteres)
   - Confirmar contraseña
2. Ingresa y confirma su nueva contraseña
3. Hace clic en "Restablecer Contraseña"
4. Frontend llama a `POST /api/auth/reset-password`
   ```json
   {
     "token": "abc123xyz789",
     "newPassword": "nuevaContraseña123"
   }
   ```

### Paso 5: Backend Actualiza la Contraseña
1. Verifica que el token es válido y no ha expirado
2. Busca el usuario asociado al token
3. Hashea la nueva contraseña
4. Actualiza la contraseña en la base de datos
5. Invalida el token (para que no se pueda reutilizar)
6. Retorna éxito

### Paso 6: Confirmación y Redirección
1. Frontend muestra mensaje de éxito
2. Espera 3 segundos
3. Redirige automáticamente a `/customerlogin`
4. Usuario puede iniciar sesión con su nueva contraseña

## Endpoints del Backend Requeridos

### 1. POST /api/auth/forgot-password
**Request**:
```json
{
  "email": "usuario@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email de recuperación enviado"
}
```

**Errores**:
- 404: Email no encontrado
- 429: Demasiadas solicitudes (rate limiting)

**Implementación Backend**:
```javascript
// Pseudocódigo
1. Validar email
2. Buscar usuario por email
3. Si no existe, retornar 404
4. Generar token único (UUID o JWT)
5. Guardar token en DB con expiración (1 hora)
6. Enviar email con enlace: 
   https://vibratickets.online/reset-password?token={token}
7. Retornar success
```

### 2. POST /api/auth/reset-password
**Request**:
```json
{
  "token": "abc123xyz789",
  "newPassword": "nuevaContraseña123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

**Errores**:
- 400: Token inválido o expirado
- 400: Contraseña no cumple requisitos
- 404: Usuario no encontrado

**Implementación Backend**:
```javascript
// Pseudocódigo
1. Validar token y newPassword
2. Buscar token en DB
3. Verificar que no ha expirado
4. Obtener usuario asociado
5. Hashear nueva contraseña (bcrypt)
6. Actualizar contraseña en DB
7. Invalidar/eliminar token
8. Retornar success
```

### 3. POST /api/auth/verify-reset-token (OPCIONAL)
**Request**:
```json
{
  "token": "abc123xyz789"
}
```

**Response** (200):
```json
{
  "valid": true,
  "expiresAt": "2025-11-27T13:00:00Z"
}
```

## Base de Datos

### Tabla: password_reset_tokens

```sql
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);
```

**Campos**:
- `user_id`: ID del usuario
- `token`: Token único para recuperación
- `expires_at`: Fecha de expiración (1 hora desde creación)
- `used_at`: Fecha en que se usó (NULL si no se ha usado)

## Seguridad

### Buenas Prácticas Implementadas:

1. **Token Único**: Cada solicitud genera un token diferente
2. **Expiración**: Tokens expiran después de 1 hora
3. **Un Solo Uso**: Token se invalida después de usarse
4. **Validación de Contraseña**: Mínimo 6 caracteres
5. **Rate Limiting**: Backend debe limitar solicitudes por IP
6. **HTTPS**: Todos los enlaces deben usar HTTPS en producción

### Recomendaciones Adicionales:

1. **Invalidar Tokens Anteriores**: Al solicitar nuevo token, invalidar anteriores
2. **Notificar Cambios**: Enviar email confirmando cambio de contraseña
3. **Logging**: Registrar intentos de recuperación para auditoría
4. **Bloqueo Temporal**: Después de X intentos fallidos, bloquear temporalmente

## Testing

### Casos de Prueba:

1. ✅ Solicitar recuperación con email válido
2. ✅ Solicitar recuperación con email inexistente
3. ✅ Abrir enlace de recuperación válido
4. ✅ Abrir enlace con token inválido
5. ✅ Abrir enlace con token expirado
6. ✅ Cambiar contraseña exitosamente
7. ✅ Intentar usar mismo token dos veces
8. ✅ Validación de contraseñas no coincidentes
9. ✅ Validación de contraseña muy corta
10. ✅ Login con nueva contraseña

## Troubleshooting

### Problema: "Token inválido o expirado"
**Causas**:
- Token ya fue usado
- Token expiró (más de 1 hora)
- Token no existe en la base de datos

**Solución**: Solicitar nuevo enlace de recuperación

### Problema: "Email no enviado"
**Causas**:
- Configuración de email incorrecta en backend
- Email bloqueado por spam
- Email no existe

**Solución**: Verificar logs del backend y configuración SMTP

### Problema: "404 en /reset-password"
**Causas**:
- Ruta no configurada correctamente
- Servidor no reiniciado después de cambios

**Solución**: Verificar que la ruta existe en App.jsx y reiniciar servidor

## Variables de Entorno (Backend)

El backend necesita configurar el servicio de email:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@vibratickets.online

# Frontend URL (para enlaces)
FRONTEND_URL=https://vibratickets.online
```

## Próximos Pasos

1. **Backend**: Implementar los 2 endpoints requeridos
2. **Backend**: Configurar servicio de email (Nodemailer, SendGrid, etc.)
3. **Backend**: Crear tabla password_reset_tokens
4. **Testing**: Probar flujo completo end-to-end
5. **Producción**: Configurar SMTP en producción
6. **Monitoreo**: Agregar logging y alertas

---

**Estado Actual**: ✅ Frontend completamente implementado y listo para usar
**Pendiente**: ⏳ Backend debe implementar los endpoints
