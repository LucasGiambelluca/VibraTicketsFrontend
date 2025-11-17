# Configuración de Groq API para el Chatbot

## 🤖 ¿Qué es Groq?

Groq es una plataforma de IA que ofrece modelos de lenguaje ultrarrápidos, perfecta para chatbots en tiempo real.

## 🚀 Configuración

### 1. Obtener API Key de Groq

1. Ve a [https://console.groq.com](https://console.groq.com)
2. Crea una cuenta gratuita
3. Ve a "API Keys" en el dashboard
4. Crea una nueva API key
5. Copia la key (empieza con `gsk_`)

### 2. Configurar en el proyecto

1. **Crea archivo `.env`** en la raíz del proyecto:
```bash
cp .env.example .env
```

2. **Edita `.env`** y agrega tu API key:
```env
VITE_GROQ_API_KEY=gsk_tu_api_key_aqui
```

### 3. Reiniciar el servidor

```bash
pnpm dev
```

## 🎯 Funcionalidades del Chatbot

### Características principales:
- ✅ **Diseño moderno** como el que mostraste
- ✅ **Integración con Groq** para respuestas inteligentes
- ✅ **Respuestas contextuales** sobre Ticketera
- ✅ **Fallback responses** si Groq no está disponible
- ✅ **Botón flotante** siempre accesible
- ✅ **Animaciones suaves**
- ✅ **Responsive design**

### Modelo utilizado:
- **mixtral-8x7b-32768** - Modelo multilingüe rápido y preciso

## 🔧 Personalización

### Cambiar el modelo:
En `ModernChatbot.jsx`, línea ~47:
```javascript
model: 'mixtral-8x7b-32768', // Cambiar por otro modelo
```

### Modelos disponibles en Groq:
- `mixtral-8x7b-32768` - Recomendado para español
- `llama2-70b-4096` - Alternativa potente
- `gemma-7b-it` - Más rápido, menos preciso

### Personalizar respuestas:
Edita el `systemPrompt` en `ModernChatbot.jsx` líneas ~30-45

## 🎨 Diseño

El chatbot replica exactamente el diseño que mostraste:
- **Header verde** con avatar del bot
- **Mensajes con burbujas** redondeadas
- **Input con botón circular** de envío
- **"powered by Groq"** en el footer
- **Animaciones fluidas**

## 🔒 Seguridad

- ✅ API key en variables de entorno
- ✅ Validación de inputs
- ✅ Rate limiting natural de Groq
- ✅ Fallback para errores

## 📱 Uso

1. **Botón flotante** aparece en todas las páginas
2. **Click** para abrir el chat
3. **Escribe tu pregunta** sobre tickets, eventos, etc.
4. **RS BOT responde** usando IA de Groq
5. **Click en X** para cerrar

## 🆘 Troubleshooting

### Error "API key not found":
- Verifica que `.env` existe
- Verifica que la variable empieza con `VITE_`
- Reinicia el servidor

### Error de CORS:
- Groq maneja CORS automáticamente
- Si hay problemas, verifica la API key

### Respuestas lentas:
- Groq es muy rápido, puede ser tu conexión
- Verifica el modelo utilizado

## 💡 Sin Groq API

Si no tienes API key, el bot funciona con respuestas predefinidas inteligentes basadas en palabras clave.
