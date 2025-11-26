# 🔧 Solución Error: VITE_GOOGLE_CLIENT_ID no configurado

## ❌ Error Reportado

```
❌ VITE_GOOGLE_CLIENT_ID no está configurado en .env
```

Este error aparece cuando intentas usar el botón "Continuar con Google" en la aplicación pero no tienes configuradas las variables de entorno necesarias para OAuth.

---

## ✅ Solución Rápida

### Opción 1: Desactivar OAuth Temporalmente (Para desarrollo rápido)

Si no necesitas OAuth ahora mismo, puedes desactivar temporalmente los botones:

1. **Agrega valores dummy en tu archivo `.env`:**

```env
# Google OAuth (temporal - no funcionará)
VITE_GOOGLE_CLIENT_ID=dummy-client-id

# Facebook OAuth (temporal - no funcionará)
VITE_FACEBOOK_APP_ID=dummy-app-id
```

2. **Reinicia el servidor de desarrollo:**
```bash
# Ctrl+C para detener
npm run dev
```

Con esto, los botones de OAuth desaparecerán y podrás usar el login tradicional con email/contraseña.

---

### Opción 2: Configurar OAuth Correctamente (Recomendado)

Si quieres que OAuth funcione:

#### Paso 1: Crear archivo .env

Si no tienes un archivo `.env` en la raíz del proyecto, créalo copiando `.env.example`:

```bash
cp .env.example .env
```

O en Windows:
```bash
copy .env.example .env
```

#### Paso 2: Configurar Google OAuth

1. **Ir a Google Cloud Console:**
   - Ve a: https://console.cloud.google.com/
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar Google+ API:**
   - Menú → APIs & Services → Library
   - Busca "Google+ API" y habilítala

3. **Crear credenciales OAuth 2.0:**
   - Menú → APIs & Services → Credentials
   - Clic en "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Tipo de aplicación: **Web application**
   - Nombre: "VibraTickets Frontend"
   
4. **Configurar URIs autorizados:**
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5174
     http://localhost:5173
     ```
   
   - **Authorized redirect URIs:**
     ```
     http://localhost:5174
     http://localhost:5173
     ```

5. **Copiar el Client ID:**
   - Aparecerá un modal con tu Client ID
   - Se ve algo como: `123456789-abc123.apps.googleusercontent.com`
   - Copialo

6. **Agregarlo al archivo `.env`:**
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
   ```

#### Paso 3: Configurar Facebook OAuth (Opcional)

1. **Ir a Meta for Developers:**
   - Ve a: https://developers.facebook.com/apps/
   - Clic en "Create App"

2. **Seleccionar tipo:**
   - Selecciona "Consumer"
   - Nombre de la app: "VibraTickets"

3. **Configurar Facebook Login:**
   - En el dashboard de la app, ve a "Add Product"
   - Selecciona "Facebook Login" → "Web"
   - Site URL: `http://localhost:5174`

4. **Configurar URLs válidas:**
   - Menú → Facebook Login → Settings
   - Valid OAuth Redirect URIs:
     ```
     http://localhost:5174
     ```

5. **Copiar App ID:**
   - En el dashboard principal verás el App ID

6. **Agregarlo al archivo `.env`:**
   ```env
   VITE_FACEBOOK_APP_ID=1234567890123456
   ```

#### Paso 4: Reiniciar el servidor

```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

---

## 📝 Archivo .env Completo de Ejemplo

```env
# API Backend
VITE_API_URL=http://localhost:3000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com

# Facebook OAuth  
VITE_FACEBOOK_APP_ID=1234567890123456

# MercadoPago
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxx

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Gemini AI
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🔍 Verificar que funciona

1. **Abre la consola del navegador** (F12)
2. **Ve a la página de login:** http://localhost:5174/customerlogin
3. **Verifica:**
   - ✅ No debe aparecer el error en consola
   - ✅ Deben verse los botones de Google y Facebook (si configuraste ambos)
   - ✅ Al hacer clic debería abrirse el popup de Google/Facebook

---

## 🚨 Errores Comunes

### "redirect_uri_mismatch"
- **Causa:** Las URIs en Google Cloud Console no coinciden
- **Solución:** Verifica que http://localhost:5174 esté en la lista

### El botón no aparece
- **Causa:** VITE_GOOGLE_CLIENT_ID no está en .env
- **Solución:** Verifica que la variable esté sin espacios ni comillas extras

### "Invalid Client ID"
- **Causa:** El Client ID está mal copiado
- **Solución:** Vuelve a copiar el Client ID desde Google Cloud Console

### Los cambios no se reflejan
- **Causa:** No reiniciaste el servidor después de editar .env
- **Solución:** Detén (Ctrl+C) y reinicia el servidor

---

## 📚 Documentación Adicional

- **Guía completa de OAuth:** Ver `OAUTH_SETUP.md`
- **Instalación de dependencias:** Ver `INSTALL_OAUTH.md`
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **Facebook Login Docs:** https://developers.facebook.com/docs/facebook-login

---

## 🎯 TL;DR (Too Long; Didn't Read)

**Para desarrollo rápido sin OAuth:**
```env
# En tu archivo .env
VITE_GOOGLE_CLIENT_ID=dummy-client-id
VITE_FACEBOOK_APP_ID=dummy-app-id
```

**Para OAuth funcional:**
1. Ve a https://console.cloud.google.com/
2. Crea credenciales OAuth 2.0
3. Agrega http://localhost:5174 a las URIs autorizadas
4. Copia el Client ID al archivo `.env`
5. Reinicia el servidor

¡Listo! 🚀
