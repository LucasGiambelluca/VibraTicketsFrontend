# 🔐 Configuración de OAuth - Google y Meta (Facebook)

## 📋 Variables de Entorno Necesarias

Agregá estas variables a tu archivo `.env`:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com

# Meta (Facebook) OAuth
VITE_FACEBOOK_APP_ID=tu-facebook-app-id

# Backend API URL
VITE_API_URL=http://localhost:3000
```

---

## 🌐 Configuración de Google Cloud Console

### Paso 1: Crear un Proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "VibraTicket Production"

### Paso 2: Habilitar Google+ API
1. Ve a **APIs & Services** > **Library**
2. Busca "Google+ API" o "Google Identity"
3. Haz clic en **Enable**

### Paso 3: Crear Credenciales OAuth 2.0
1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Tipo de aplicación: **Web application**
4. Nombre: "VibraTicket Web Client"

### Paso 4: Configurar URIs de Redirección
**Authorized JavaScript origins:**
```
http://localhost:5174
http://localhost:3000
https://tudominio.com
```

**Authorized redirect URIs:**
```
http://localhost:5174/auth/google/callback
http://localhost:3000/api/auth/google/callback
https://tudominio.com/auth/google/callback
```

### Paso 5: Obtener Client ID
1. Copia el **Client ID** que se genera
2. Agrégalo a tu `.env` como `VITE_GOOGLE_CLIENT_ID`

---

## 📘 Configuración de Meta for Developers (Facebook)

### Paso 1: Crear una App
1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en **My Apps** > **Create App**
3. Tipo: **Consumer** (para login de usuarios)
4. Nombre: "VibraTicket"

### Paso 2: Agregar Facebook Login
1. En tu app, ve a **Add Products**
2. Busca **Facebook Login** y haz clic en **Set Up**
3. Selecciona **Web** como plataforma

### Paso 3: Configurar Facebook Login
1. Ve a **Facebook Login** > **Settings**
2. **Valid OAuth Redirect URIs:**
```
http://localhost:5174/auth/facebook/callback
http://localhost:3000/api/auth/facebook/callback
https://tudominio.com/auth/facebook/callback
```

### Paso 4: Configurar Dominios
1. Ve a **Settings** > **Basic**
2. **App Domains:**
```
localhost
tudominio.com
```

### Paso 5: Obtener App ID y Secret
1. En **Settings** > **Basic**
2. Copia el **App ID**
3. Copia el **App Secret** (para el backend)
4. Agrega el App ID a `.env` como `VITE_FACEBOOK_APP_ID`

---

## 🔧 Configuración del Backend

El backend necesita estas rutas:

### Endpoints Requeridos:

```javascript
// POST /api/auth/google
// Body: { token: "google-id-token" }
// Verifica el token con Google, crea/obtiene usuario, retorna JWT

// POST /api/auth/facebook  
// Body: { accessToken: "facebook-access-token" }
// Verifica el token con Facebook, crea/obtiene usuario, retorna JWT
```

### Flujo de Autenticación:

1. **Frontend** obtiene el token de Google/Facebook
2. **Frontend** envía el token al backend
3. **Backend** verifica el token con Google/Facebook API
4. **Backend** crea/obtiene el usuario en la base de datos
5. **Backend** genera un JWT propio
6. **Frontend** guarda el JWT y el usuario en localStorage

---

## 📦 Dependencias del Backend (Node.js)

```bash
npm install google-auth-library passport-facebook
```

---

## 🚀 Ejemplo de Endpoint Backend (Express)

```javascript
// routes/auth.js
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verificar token con Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // Buscar o crear usuario
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId,
        role: 'CUSTOMER',
        isActive: true,
        // No password - OAuth user
      });
    }
    
    // Generar JWT propio
    const jwt = generateToken(user);
    
    res.json({
      success: true,
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Token de Google inválido' 
    });
  }
});

// POST /api/auth/facebook
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    // Verificar token con Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture'
      }
    });
    
    const { id: facebookId, name, email, picture } = response.data;
    
    // Buscar o crear usuario
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      user = await User.create({
        email,
        name,
        facebookId,
        role: 'CUSTOMER',
        isActive: true,
      });
    }
    
    // Generar JWT propio
    const jwt = generateToken(user);
    
    res.json({
      success: true,
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Token de Facebook inválido' 
    });
  }
});
```

---

## ⚠️ Modo de Desarrollo vs Producción

### Desarrollo (Facebook)
- La app estará en **Development Mode**
- Solo usuarios agregados como testers pueden hacer login
- Agrega testers en **Roles** > **Test Users** o **Roles** > **Roles**

### Producción (Facebook)
- Necesitas hacer **App Review** para que cualquier usuario pueda hacer login
- Especialmente para el permiso `email`
- Esto puede tomar varios días

### Google
- Funciona inmediatamente en desarrollo
- Para producción, verifica tu dominio en Google Search Console

---

## 🔒 Seguridad

1. **Nunca** expongas los Client Secrets en el frontend
2. Los Client Secrets solo van en el backend
3. En el frontend solo usá Client IDs
4. Valida **siempre** los tokens en el backend
5. Genera tu propio JWT después de validar

---

## 📚 Recursos Útiles

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Meta Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)
- [React Facebook Login](https://www.npmjs.com/package/react-facebook-login)

---

## 🎯 Próximos Pasos

1. ✅ Configurar Google Cloud Console
2. ✅ Configurar Meta for Developers
3. ✅ Agregar variables de entorno
4. ✅ Implementar endpoints en el backend
5. ✅ Instalar dependencias del frontend
6. ✅ Usar los componentes OAuth en CustomerLogin

¡Todo listo! 🚀
