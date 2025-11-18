# 📦 Instalación de Dependencias OAuth

## Paso 1: Instalar Dependencias del Frontend

Ejecutá estos comandos en la terminal del frontend:

```bash
# Con npm:
npm install @react-oauth/google @greatsumini/react-facebook-login

# O con pnpm (recomendado para React 19):
pnpm add @react-oauth/google @greatsumini/react-facebook-login
```

⚠️ **Nota**: Usamos `@greatsumini/react-facebook-login` en lugar de `react-facebook-login` porque es compatible con React 19.

## Paso 2: Configurar Variables de Entorno

Creá o editá el archivo `.env` en la raíz del proyecto:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# Facebook OAuth
VITE_FACEBOOK_APP_ID=TU_FACEBOOK_APP_ID

# Backend API
VITE_API_URL=http://localhost:3000
```

⚠️ **IMPORTANTE**: Reemplazá los valores con tus credenciales reales después de configurar Google Cloud Console y Meta for Developers.

## Paso 3: Reiniciar el Servidor de Desarrollo

Después de instalar las dependencias y configurar las variables de entorno:

```bash
# Detener el servidor (Ctrl+C)
# Iniciar nuevamente
npm run dev
```

## Paso 4: Configurar el Backend

El backend necesita estos endpoints:

### Instalar Dependencias del Backend:
```bash
npm install google-auth-library axios
```

### Crear las Rutas:
```javascript
// routes/auth.js o routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verificar el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // Buscar o crear usuario en tu base de datos
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId,
        profilePicture: picture,
        role: 'CUSTOMER',
        isActive: true,
        // No password - es usuario OAuth
      });
    }
    
    // Generar JWT propio
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error en Google OAuth:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Token de Google inválido' 
    });
  }
});

// POST /api/auth/facebook
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userID } = req.body;
    
    // Verificar el token con Facebook Graph API
    const response = await axios.get('https://graph.facebook.com/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture'
      }
    });
    
    const { id: facebookId, name, email, picture } = response.data;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener el email de Facebook'
      });
    }
    
    // Buscar o crear usuario
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      user = await User.create({
        email,
        name,
        facebookId,
        profilePicture: picture?.data?.url,
        role: 'CUSTOMER',
        isActive: true,
      });
    }
    
    // Generar JWT propio
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error en Facebook OAuth:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Token de Facebook inválido' 
    });
  }
});

module.exports = router;
```

### Montar las Rutas en tu server.js o app.js:
```javascript
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

### Variables de Entorno del Backend (.env):
```env
# Google
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Facebook
FACEBOOK_APP_ID=tu-facebook-app-id
FACEBOOK_APP_SECRET=tu-facebook-app-secret

# JWT
JWT_SECRET=tu-jwt-secret-super-seguro
```

## Paso 5: Migración de Base de Datos

Agregá campos para OAuth en tu tabla de usuarios:

```sql
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL,
ADD COLUMN facebook_id VARCHAR(255) NULL,
ADD COLUMN profile_picture VARCHAR(500) NULL;

-- Índices para búsqueda rápida
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_facebook_id ON users(facebook_id);
```

## Paso 6: Probar la Integración

1. Asegurate de que el backend esté corriendo
2. Asegurate de que el frontend esté corriendo
3. Ve a `http://localhost:5174/customerlogin`
4. Hace clic en "Continuar con Google" o "Continuar con Facebook"
5. Completá el flujo de OAuth
6. Deberías ser redirigido al inicio con sesión iniciada

## 🔍 Troubleshooting

### Error: "VITE_GOOGLE_CLIENT_ID no está configurado"
- Verificá que el archivo `.env` existe
- Verificá que la variable esté nombrada exactamente como `VITE_GOOGLE_CLIENT_ID`
- Reiniciá el servidor de desarrollo

### Error: "redirect_uri_mismatch" (Google)
- Verificá que las URIs de redirección en Google Cloud Console incluyan:
  - `http://localhost:5174`
  - La URL de tu frontend en producción

### Error: "Can't Load URL" (Facebook)
- Verificá que las URIs de redirección en Meta for Developers incluyan:
  - `http://localhost:5174`
  - Que el dominio esté agregado en "App Domains"

### Facebook solo funciona para mí
- Facebook requiere "App Review" para que usuarios públicos puedan hacer login
- En desarrollo, solo los usuarios agregados como testers pueden usarlo
- Ve a **Roles** > **Roles** en Meta for Developers para agregar testers

## 📚 Documentación de Referencia

- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [@greatsumini/react-facebook-login](https://www.npmjs.com/package/@greatsumini/react-facebook-login)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login/web)

## ✅ Checklist de Configuración

- [ ] Dependencias npm instaladas
- [ ] Variables de entorno configuradas
- [ ] Google Cloud Console configurado
- [ ] Meta for Developers configurado
- [ ] Endpoints del backend implementados
- [ ] Base de datos migrada
- [ ] Servidor reiniciado
- [ ] Probado en desarrollo

¡Todo listo para usar OAuth! 🚀
