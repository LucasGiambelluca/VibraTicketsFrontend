# reCAPTCHA TEMPORALMENTE DESHABILITADO

## ⚠️ Estado Actual

El sistema de Google reCAPTCHA v2 ha sido **temporalmente deshabilitado** en las páginas de Login y Register hasta que se complete la configuración necesaria.

---

## 📋 ¿Qué se Deshabilitó?

### Archivos Modificados:

1. **src/pages/Login.jsx**
2. **src/pages/Register.jsx**

### Código Comentado:

✅ Import del componente ReCaptcha  
✅ Estados: `captchaToken`, `recaptchaRef`  
✅ Validación de token antes del submit  
✅ Envío de `captchaToken` al backend  
✅ Handlers: `handleCaptchaChange`, `handleCaptchaExpired`  
✅ Reset de reCAPTCHA en caso de error  
✅ Componente `<ReCaptcha />` en el formulario  

---

## 🔧 ¿Qué Falta para Reactivarlo?

### 1. **Obtener Site Key de Google reCAPTCHA**

Ir a: https://www.google.com/recaptcha/admin/create

- Seleccionar **reCAPTCHA v2** (Checkbox "No soy un robot")
- Agregar dominios:
  - `localhost` (desarrollo)
  - Tu dominio de producción (ej: `ticketera.com`)
- Copiar la **Site Key** y **Secret Key**

### 2. **Configurar Frontend**

Agregar en `.env`:

```env
VITE_RECAPTCHA_SITE_KEY=tu_site_key_aqui
```

### 3. **Configurar Backend**

El backend debe validar el token reCAPTCHA en los endpoints de auth:

**POST /api/auth/login**  
**POST /api/auth/register**

**Instalación en backend:**

```bash
npm install axios
```

**Validación del token (Backend Node.js):**

```javascript
const axios = require('axios');

async function validateRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify`,
    null,
    {
      params: {
        secret: secretKey,
        response: token
      }
    }
  );

  return response.data.success;
}

// En el endpoint de login/register:
router.post('/login', async (req, res) => {
  const { email, password, captchaToken } = req.body;

  // Validar reCAPTCHA
  const isValidCaptcha = await validateRecaptcha(captchaToken);
  if (!isValidCaptcha) {
    return res.status(400).json({ message: 'Validación de reCAPTCHA fallida' });
  }

  // ... resto de la lógica de login
});
```

**Variables de entorno del backend:**

```env
RECAPTCHA_SECRET_KEY=tu_secret_key_aqui
```

---

## 🔄 Cómo Reactivar el reCAPTCHA

Una vez que tengas **Site Key** y el **backend configurado**, sigue estos pasos:

### 1. **Descomentar en Login.jsx**

Buscar y descomentar:

```javascript
// Línea 6-7
import ReCaptcha from '../components/ReCaptcha';

// Línea 17-18
const [captchaToken, setCaptchaToken] = useState(null);
const recaptchaRef = useRef(null);

// Línea 23-27
if (!captchaToken) {
  message.error('Por favor completa el reCAPTCHA');
  return;
}

// Línea 34
console.log('🤖 Token reCAPTCHA:', captchaToken);

// Línea 40-41
captchaToken: captchaToken

// Línea 66-69
if (recaptchaRef.current) {
  recaptchaRef.current.reset();
  setCaptchaToken(null);
}

// Línea 76-85
const handleCaptchaChange = (token) => {
  console.log('🤖 reCAPTCHA token recibido:', token ? 'Verificado' : 'Vacío');
  setCaptchaToken(token);
};

const handleCaptchaExpired = () => {
  console.warn('⚠️ reCAPTCHA expirado');
  setCaptchaToken(null);
  message.warning('El reCAPTCHA ha expirado. Por favor verifícalo nuevamente.');
};

// Línea 173-177
<ReCaptcha
  ref={recaptchaRef}
  onChange={handleCaptchaChange}
  onExpired={handleCaptchaExpired}
/>
```

### 2. **Descomentar en Register.jsx**

Aplicar los mismos cambios que en Login.jsx (líneas similares).

### 3. **Verificar .env**

Asegurarse de que `.env` tenga:

```env
VITE_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 4. **Reiniciar el servidor de desarrollo**

```bash
npm run dev
# o
pnpm dev
```

---

## 🎯 Componente ReCaptcha

El componente ya está implementado en:

**`src/components/ReCaptcha.jsx`**

```javascript
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Form } from 'antd';

const ReCaptcha = forwardRef(({ onChange, onExpired }, ref) => {
  const recaptchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    },
    getValue: () => {
      return recaptchaRef.current ? recaptchaRef.current.getValue() : null;
    },
    execute: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.execute();
      }
    }
  }));

  return (
    <Form.Item style={{ marginBottom: 16 }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={onChange}
        onExpired={onExpired}
      />
    </Form.Item>
  );
});

export default ReCaptcha;
```

---

## ✅ Dependencias

Ya instalada:

```json
{
  "react-google-recaptcha": "^3.1.0"
}
```

---

## 🧪 Testing

Una vez reactivado:

1. Abrir `/login` o `/register`
2. Completar el formulario
3. Marcar el checkbox "No soy un robot"
4. Verificar que el token se envía al backend
5. Backend debe validar el token con Google
6. Si la validación falla, debe rechazar el login/registro

---

## 📊 Resumen

| Estado | Componente | Funcionalidad |
|--------|-----------|---------------|
| ✅ | ReCaptcha.jsx | Implementado |
| ✅ | react-google-recaptcha | Instalado |
| ⏸️ | Site Key | Pendiente configuración |
| ⏸️ | Backend validation | Pendiente implementación |
| ⏸️ | Login.jsx | Deshabilitado temporalmente |
| ⏸️ | Register.jsx | Deshabilitado temporalmente |

---

## 📚 Referencias

- [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [react-google-recaptcha Docs](https://github.com/dozoisch/react-google-recaptcha)
- [reCAPTCHA v2 Docs](https://developers.google.com/recaptcha/docs/display)

---

**Última actualización:** 2025-11-07  
**Estado:** ⏸️ TEMPORALMENTE DESHABILITADO
