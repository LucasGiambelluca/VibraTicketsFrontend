# 🔑 Cómo Obtener una API Key de Google Gemini

## Paso 1: Acceder a Google AI Studio

1. Ve a: **https://makersuite.google.com/app/apikey**
2. Inicia sesión con tu cuenta de Google

## Paso 2: Crear una API Key

1. Haz clic en **"Create API Key"** o **"Crear clave de API"**
2. Selecciona un proyecto de Google Cloud (o crea uno nuevo)
3. Espera unos segundos mientras se genera la key
4. Copia la API Key completa

## Paso 3: Configurar en el Proyecto

1. Abre el archivo `.env` en la raíz del proyecto
2. Busca la línea `VITE_GEMINI_API_KEY`
3. Pega tu API Key así:

```env
VITE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANTE:**
- ✅ NO uses comillas
- ✅ NO dejes espacios antes o después del `=`
- ✅ La key debe empezar con `AIza`
- ✅ Debe ser una sola línea

## Paso 4: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C en la terminal)
npm run dev
```

## Paso 5: Verificar

1. Abre la consola del navegador (F12)
2. Deberías ver: `✅ Gemini API Key cargada correctamente`
3. Prueba el chatbot

## ⚠️ Problemas Comunes

### Error: "API key not valid"
- La key está mal copiada
- Tiene espacios o saltos de línea
- Está entre comillas
- **Solución**: Genera una nueva key y cópiala exactamente

### Error: "API key not found"
- El archivo `.env` no está en la raíz del proyecto
- La variable no se llama exactamente `VITE_GEMINI_API_KEY`
- No reiniciaste el servidor después de cambiar el `.env`
- **Solución**: Verifica el nombre y reinicia el servidor

### Error: "QUOTA_EXCEEDED"
- Excediste el límite gratuito de Gemini
- **Solución**: Espera unos minutos o verifica tu cuota en Google AI Studio

## 📊 Límites Gratuitos de Gemini

- **60 requests por minuto**
- **1,500 requests por día**
- **1 millón de tokens por mes**

## 🔗 Enlaces Útiles

- Google AI Studio: https://makersuite.google.com/
- Documentación: https://ai.google.dev/docs
- Límites y Cuotas: https://ai.google.dev/pricing

## ✅ Ejemplo de `.env` Correcto

```env
# Google Gemini API Configuration
VITE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Otras variables...
VITE_API_URL=http://localhost:3000
```

## 🚨 Seguridad

- ❌ NUNCA subas el archivo `.env` a Git
- ❌ NUNCA compartas tu API Key públicamente
- ✅ El `.env` debe estar en `.gitignore`
- ✅ Usa `.env.example` para documentar (sin la key real)
