# Integración de Google Gemini en el Chatbot

## 📋 Resumen

Se migró el chatbot de **Groq API** a **Google Gemini API** para aprovechar las capacidades avanzadas del modelo Gemini 1.5 Flash de Google.

---

## 🔧 Cambios Realizados

### 1. **ModernChatbot.jsx**

#### Imports actualizados:
```javascript
// ANTES
import axios from 'axios';

// AHORA
import { GoogleGenerativeAI } from '@google/generative-ai';
```

#### Configuración de API:
```javascript
// ANTES
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'gsk_your_api_key_here';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// AHORA
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
```

#### Función de respuesta:
```javascript
// ANTES: getGroqResponse()
// AHORA: getGeminiResponse()
```

#### Modelo utilizado:
- **Modelo**: `gemini-1.5-flash`
- **Temperature**: 0.7
- **Max Output Tokens**: 600
- **System Instruction**: Prompt completo de Vibra BOT

---

## 🔑 Variables de Entorno

### Archivo `.env`:
```env
VITE_GEMINI_API_KEY=tu_api_key_de_google_gemini
```

### Obtener API Key:
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API Key
4. Copia la key y pégala en el archivo `.env`

---

## 📦 Instalación de Dependencias

### Instalar el SDK de Google Gemini:
```bash
npm install @google/generative-ai
```

---

## 🤖 Características del Bot

### Especializado en VibraTicket:
- ✅ Compra de tickets
- ✅ Información de eventos
- ✅ Cola virtual
- ✅ Problemas de pago
- ✅ Gestión de entradas
- ✅ Creación de eventos (para organizadores)

### Asistente General:
- ✅ Responde preguntas sobre cualquier tema
- ✅ Explicaciones y definiciones
- ✅ Cálculos y traducciones
- ✅ Curiosidades y chistes
- ✅ Mantiene contexto de conversación

---

## 🔄 Flujo de Conversación

1. **Usuario envía mensaje** → `handleSendMessage()`
2. **Se construye historial** → Últimos 6 mensajes para contexto
3. **Se llama a Gemini** → `getGeminiResponse(userMessage)`
4. **Gemini procesa** → Con system instruction + historial
5. **Respuesta generada** → Se muestra al usuario
6. **Fallback automático** → Si hay error, respuestas predefinidas

---

## 🎨 Interfaz

### Header:
- Título: "RS BOT"
- Subtítulo: "Asistente Virtual"
- Icono: Robot
- Color: Gradiente verde (#00d4aa → #00b894)

### Footer:
- Texto: "powered by Google Gemini"

### Sugerencias Rápidas:
- ¿Cómo compro un ticket?
- ¿Qué es la cola virtual?
- Problemas con el pago
- ¿Cómo creo un evento?
- Explícame algo interesante
- Cuéntame un chiste

---

## 🛡️ Manejo de Errores

### Si Gemini API falla:
El bot tiene respuestas **fallback** predefinidas para:
- `ticket` → Ayuda con tickets
- `pago` → Problemas de pago
- `evento` → Información de eventos
- `cola` → Cola virtual
- `comprar` → Proceso de compra
- `crear` → Crear eventos
- `hola` → Saludo
- `gracias` → Agradecimiento
- `ayuda` → Menú de ayuda
- `default` → Mensaje genérico de error

---

## 📊 Ventajas de Gemini vs Groq

| Característica | Groq (Mixtral) | Gemini 1.5 Flash |
|----------------|----------------|------------------|
| **Velocidad** | Muy rápido | Ultra rápido |
| **Contexto** | 32K tokens | 1M tokens |
| **Multimodal** | ❌ No | ✅ Sí (texto, imágenes) |
| **Costo** | Pago | Gratis (con límites) |
| **Idiomas** | Bueno | Excelente |
| **Actualización** | Modelo fijo | Actualizaciones frecuentes |

---

## 🚀 Próximas Mejoras

- [ ] Agregar soporte para imágenes (Gemini es multimodal)
- [ ] Implementar streaming de respuestas
- [ ] Guardar historial de conversaciones en localStorage
- [ ] Agregar botones de acción rápida en respuestas
- [ ] Integrar con backend para consultas de base de datos

---

## 📝 Notas Importantes

1. **API Key Segura**: La API key está en `.env` y NO se sube a Git
2. **Límites de Uso**: Gemini tiene límites gratuitos (60 requests/min)
3. **Fallback**: Siempre hay respuestas de respaldo si falla la API
4. **Contexto**: Se envían los últimos 6 mensajes para mantener contexto
5. **System Instruction**: El prompt define el comportamiento del bot

---

## 🔗 Enlaces Útiles

- [Google AI Studio](https://makersuite.google.com/)
- [Documentación Gemini API](https://ai.google.dev/docs)
- [SDK de Node.js](https://github.com/google/generative-ai-js)
- [Límites y Cuotas](https://ai.google.dev/pricing)

---

## ✅ Checklist de Implementación

- [x] Instalar `@google/generative-ai`
- [x] Configurar `VITE_GEMINI_API_KEY` en `.env`
- [x] Actualizar imports en `ModernChatbot.jsx`
- [x] Migrar de `getGroqResponse()` a `getGeminiResponse()`
- [x] Actualizar footer "powered by Google Gemini"
- [x] Probar conversaciones básicas
- [x] Verificar fallback responses
- [x] Documentar cambios

---

**Fecha de Implementación**: 19 de Noviembre, 2025  
**Desarrollador**: Lucas Giambelluca  
**Versión**: 1.0
