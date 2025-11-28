# 🚨 FIX URGENTE - Problema Identificado

## El Problema

Tu archivo `.env` tiene configurado:
```
VITE_API_URL=http://localhost:3000
```

**Pero tu backend NO está en localhost**, está en Render (`https://vibra-tickets-backend.onrender.com`).

Por eso todas las peticiones fallan con **404 (Not Found)**.

## Solución en 3 Pasos

### Paso 1: Editar el archivo .env

Abre el archivo `.env` en la raíz del proyecto y **comenta o elimina** la línea:

```env
# COMENTAR ESTA LÍNEA:
# VITE_API_URL=http://localhost:3000

# O DEJARLA VACÍA:
VITE_API_URL=
```

El archivo `.env` debe quedar así:

```env
# Frontend environment variables

# API Configuration - Usar proxy de Vite
VITE_API_URL=

VITE_APP_NAME=VibraTickets
VITE_APP_VERSION=1.0.0

# ... resto de configuración
```

### Paso 2: Reiniciar el Servidor

**IMPORTANTE**: Vite solo lee el `.env` al iniciar, por lo que DEBES reiniciar:

```bash
# 1. Detén el servidor actual
Ctrl + C

# 2. Reinicia el servidor
pnpm run dev

# 3. Espera a que diga "Local: http://localhost:5173"
```

### Paso 3: Probar

1. Abre el navegador en `http://localhost:5173`
2. Abre la consola (F12)
3. Limpia la consola
4. Selecciona un evento y asientos
5. Intenta pagar

**Ahora las peticiones deberían ir a través del proxy de Vite y NO deberías ver errores 404**.

## ¿Por qué funciona esto?

Con `VITE_API_URL` vacío:
- Las peticiones van a `/api/events` (relativo)
- El proxy de Vite intercepta `/api/*`
- Redirige a `https://vibra-tickets-backend.onrender.com/api/*`
- Evita problemas de CORS

Con `VITE_API_URL=http://localhost:3000`:
- Las peticiones van a `http://localhost:3000/api/events`
- No hay servidor en localhost:3000
- Resultado: **404 Not Found**

## Verificación

Después de reiniciar, verifica en la consola del navegador:

✅ **Correcto**: Las peticiones van a `http://localhost:5173/api/...`
❌ **Incorrecto**: Las peticiones van a `http://localhost:3000/api/...`

## Si aún no funciona

Si después de estos pasos aún tienes problemas:

1. Verifica que el archivo `.env` se guardó correctamente
2. Asegúrate de haber reiniciado el servidor completamente
3. Limpia la caché del navegador (Ctrl+Shift+Delete)
4. Recarga la página con Ctrl+F5 (recarga forzada)

## Configuración Actual de Archivos

### vite.config.js ✅
```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://vibra-tickets-backend.onrender.com',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### src/api/client.js ✅
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
```

### .env ❌ (NECESITA CORRECCIÓN)
```env
# Debe estar vacío o comentado:
VITE_API_URL=
```

---

**Resumen**: El problema es que `.env` apunta a localhost:3000 donde NO hay servidor. Déjalo vacío para usar el proxy.
