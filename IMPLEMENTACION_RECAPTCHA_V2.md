# 🤖 Implementación de reCAPTCHA v2

## ✅ **TAREA COMPLETADA**

Se ha implementado **Google reCAPTCHA v2** ("I'm not a robot" Checkbox) en las páginas de **Login** y **Register** para proteger contra bots y spam.

---

## 📦 **DEPENDENCIAS INSTALADAS**

### **react-google-recaptcha**

```json
"react-google-recaptcha": "^3.1.0"
```

Esta librería ya estaba instalada en el proyecto.

**Instalación manual (si no está instalada):**
```bash
pnpm add react-google-recaptcha
# o
npm install react-google-recaptcha
```

---

## 🗂️ **ARCHIVOS CREADOS Y MODIFICADOS**

### ✨ **1. Componente Reutilizable: `ReCaptcha.jsx`**

**Ubicación:** `src/components/ReCaptcha.jsx`

**Descripción:** Componente reutilizable que encapsula la funcionalidad de reCAPTCHA v2.

**Características:**
- ✅ Manejo de eventos: `onChange`, `onExpired`, `onError`
- ✅ Temas: `light` / `dark`
- ✅ Tamaños: `normal` / `compact`
- ✅ Métodos expuestos via ref: `reset()`, `getValue()`, `execute()`
- ✅ Validación automática de la Site Key
- ✅ Mensaje de advertencia si no está configurada la clave

**Código:**
```jsx
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const ReCaptcha = forwardRef(({ 
  onChange, 
  onExpired, 
  onError,
  theme = 'light',
  size = 'normal'
}, ref) => {
  const recaptchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Exponer métodos mediante ref
  useImperativeHandle(ref, () => ({
    reset: () => recaptchaRef.current?.reset(),
    getValue: () => recaptchaRef.current?.getValue(),
    execute: () => recaptchaRef.current?.execute()
  }));

  if (!siteKey) {
    return <div>⚠️ reCAPTCHA no configurado</div>;
  }

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={siteKey}
      onChange={onChange}
      onExpired={onExpired}
      onErrored={onError}
      theme={theme}
      size={size}
    />
  );
});

export default ReCaptcha;
```

---

### 📝 **2. Página de Registro: `Register.jsx`**

**Ubicación:** `src/pages/Register.jsx`

**Cambios implementados:**

#### **Importaciones agregadas:**
```jsx
import { useState, useRef } from 'react';
import ReCaptcha from '../components/ReCaptcha';
```

#### **Estado y ref agregados:**
```jsx
const [captchaToken, setCaptchaToken] = useState(null);
const recaptchaRef = useRef(null);
```

#### **Validación en handleSubmit:**
```jsx
const handleSubmit = async (values) => {
  // Validar reCAPTCHA
  if (!captchaToken) {
    message.error('Por favor completa el reCAPTCHA');
    return;
  }

  // Enviar captchaToken al backend
  const userData = {
    ...values,
    captchaToken: captchaToken
  };

  // ...resto del código
};
```

#### **Handlers de reCAPTCHA:**
```jsx
const handleCaptchaChange = (token) => {
  setCaptchaToken(token);
};

const handleCaptchaExpired = () => {
  setCaptchaToken(null);
  message.warning('El reCAPTCHA ha expirado. Por favor verifícalo nuevamente.');
};
```

#### **Reset en caso de error:**
```jsx
catch (error) {
  // Resetear reCAPTCHA en caso de error
  if (recaptchaRef.current) {
    recaptchaRef.current.reset();
    setCaptchaToken(null);
  }
}
```

#### **Componente en el formulario:**
```jsx
<ReCaptcha
  ref={recaptchaRef}
  onChange={handleCaptchaChange}
  onExpired={handleCaptchaExpired}
/>
```

---

### 🔐 **3. Página de Login: `Login.jsx`**

**Ubicación:** `src/pages/Login.jsx`

**Cambios implementados:** (idénticos a Register.jsx)

#### **Importaciones, estado, handlers y componente** igual que Register.jsx

---

### ⚙️ **4. Configuración: `.env`**

**Ubicación:** `.env`

**Cambio agregado:**
```bash
# Google reCAPTCHA v2 Site Key
# Obtén tu site key en: https://www.google.com/recaptcha/admin/create
# Selecciona reCAPTCHA v2 "I'm not a robot" Checkbox
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

**⚠️ IMPORTANTE:** Debes reemplazar `your_recaptcha_site_key_here` con tu **Site Key** real de Google reCAPTCHA.

---

## 🔑 **CÓMO OBTENER TUS CLAVES DE reCAPTCHA**

### **Paso 1: Ir al Panel de Admin de reCAPTCHA**

Visita: [https://www.google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create)

### **Paso 2: Crear un nuevo sitio**

1. **Label:** Nombre de tu aplicación (ej: "RS Tickets - Frontend")
2. **reCAPTCHA type:** Selecciona **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
3. **Domains:** Agrega tus dominios:
   - `localhost` (para desarrollo)
   - `tu-dominio.com` (para producción)
4. Click en **Submit**

### **Paso 3: Copiar las claves**

Recibirás dos claves:

#### **Site Key (Clave del sitio) - FRONTEND** 🔑
- Esta va en `.env` como `VITE_RECAPTCHA_SITE_KEY`
- Es pública y se usa en el cliente

#### **Secret Key (Clave secreta) - BACKEND** 🔒
- Esta va en el backend (Node.js)
- **NUNCA** la expongas en el frontend

---

## 🛠️ **CONFIGURACIÓN DEL BACKEND**

El backend debe validar el token de reCAPTCHA que envía el frontend.

### **Endpoint de validación (Node.js/Express)**

```javascript
const axios = require('axios');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, phone, captchaToken } = req.body;

  // 1. Validar reCAPTCHA
  if (!captchaToken) {
    return res.status(400).json({ error: 'reCAPTCHA requerido' });
  }

  try {
    // 2. Verificar token con Google
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    
    const { data } = await axios.post(verifyUrl);
    
    // 3. Validar respuesta
    if (!data.success) {
      return res.status(400).json({ 
        error: 'Verificación de reCAPTCHA fallida',
        details: data['error-codes']
      });
    }

    // 4. Proceder con el registro
    // ... tu lógica de registro aquí
    
    res.json({ success: true, user: newUser });
    
  } catch (error) {
    console.error('Error verificando reCAPTCHA:', error);
    res.status(500).json({ error: 'Error al verificar reCAPTCHA' });
  }
});
```

### **Variables de entorno del backend**

```bash
# .env (Backend)
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

---

## 🧪 **CÓMO PROBAR**

### **1. Configurar la Site Key**

Edita `.env` y agrega tu Site Key real:

```bash
VITE_RECAPTCHA_SITE_KEY=6Lc...tu_site_key_aqui
```

### **2. Reiniciar el servidor de desarrollo**

```bash
pnpm dev
# o
npm run dev
```

**⚠️ IMPORTANTE:** Debes reiniciar el servidor para que Vite cargue las nuevas variables de entorno.

### **3. Probar en el navegador**

1. Ve a `/register` o `/login`
2. Completa el formulario
3. **Marca el checkbox "I'm not a robot"**
4. Haz click en "Crear cuenta" o "Sign in"

**✅ Comportamiento esperado:**
- Si NO marcas el captcha → Mensaje: "Por favor completa el reCAPTCHA"
- Si marcas el captcha → Se envía el formulario con el token

### **4. Verificar en DevTools**

Abre la consola del navegador (F12) y verifica:

```
🤖 reCAPTCHA token recibido: Verificado
📝 Intentando registro con: usuario@example.com
🤖 Token reCAPTCHA: 03AGdBq2...token_largo...
```

---

## 🎨 **PERSONALIZACIÓN**

### **Cambiar el tema**

```jsx
<ReCaptcha
  theme="dark"  // 'light' | 'dark'
  onChange={handleCaptchaChange}
/>
```

### **Cambiar el tamaño**

```jsx
<ReCaptcha
  size="compact"  // 'normal' | 'compact'
  onChange={handleCaptchaChange}
/>
```

---

## 🔍 **MÉTODOS DISPONIBLES VIA REF**

```jsx
const recaptchaRef = useRef(null);

// Resetear el captcha
recaptchaRef.current.reset();

// Obtener el token actual
const token = recaptchaRef.current.getValue();

// Ejecutar el captcha programáticamente (para invisible)
recaptchaRef.current.execute();
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Instalar `react-google-recaptcha`
- [x] Crear componente `ReCaptcha.jsx`
- [x] Integrar en `Register.jsx`
- [x] Integrar en `Login.jsx`
- [x] Agregar `VITE_RECAPTCHA_SITE_KEY` en `.env`
- [x] Agregar validación en `handleSubmit`
- [x] Resetear captcha en caso de error
- [x] Enviar `captchaToken` al backend
- [ ] **Obtener Site Key de Google reCAPTCHA** ⚠️ (PENDIENTE)
- [ ] **Configurar backend para validar token** ⚠️ (PENDIENTE)

---

## 🚨 **IMPORTANTE: PRÓXIMOS PASOS**

### ⚠️ **1. OBTENER TUS CLAVES DE reCAPTCHA**

Actualmente el `.env` tiene:
```bash
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

**Debes reemplazar esto con tu Site Key real.**

Ve a: https://www.google.com/recaptcha/admin/create

### ⚠️ **2. CONFIGURAR EL BACKEND**

El backend debe:
- Recibir `captchaToken` en el body
- Validarlo con la API de Google
- Rechazar la petición si la validación falla

**Sin esto, el reCAPTCHA NO está protegiendo tu aplicación.**

---

## 🎉 **RESULTADO FINAL**

✅ **Login y Register ahora tienen reCAPTCHA v2**  
✅ **Componente reutilizable creado**  
✅ **Validación en frontend implementada**  
✅ **Reset automático en caso de error**  
✅ **Manejo de expiración del token**  

---

## 📚 **REFERENCIAS**

- **react-google-recaptcha:** https://github.com/dozoisch/react-google-recaptcha
- **Google reCAPTCHA Admin:** https://www.google.com/recaptcha/admin
- **reCAPTCHA v2 Docs:** https://developers.google.com/recaptcha/docs/display
- **Server-side Verification:** https://developers.google.com/recaptcha/docs/verify

---

## 🐛 **TROUBLESHOOTING**

### **No aparece el reCAPTCHA**

1. Verifica que `.env` tenga `VITE_RECAPTCHA_SITE_KEY`
2. Reinicia el servidor (`pnpm dev`)
3. Revisa la consola del navegador para errores

### **Error: "Invalid site key"**

- Tu Site Key es incorrecta
- El dominio no está autorizado en la configuración de reCAPTCHA

### **El captcha aparece pero no envía el formulario**

- Verifica que `captchaToken` no sea `null`
- Revisa la consola del navegador
- Asegúrate de que `handleCaptchaChange` esté siendo llamado

---

**Implementación completada el:** 2025-11-06  
**Autor:** Cascade AI Assistant  
**Versión:** 1.0.0
