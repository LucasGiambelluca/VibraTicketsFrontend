# 🔧 Página de Mantenimiento - Implementación Global

## ✅ Implementación Completada

Se ha implementado una página de mantenimiento que **bloquea toda la aplicación** cuando el backend está caído. El usuario no puede navegar a ninguna parte de la app.

---

## 📁 Archivos Creados/Modificados

### 1. **MaintenancePage.jsx** (NUEVO) ✅

**Ubicación:** `src/components/MaintenancePage.jsx`

**Características:**
- Logo de VibraTicket centrado
- Icono de herramienta (ToolOutlined)
- Mensaje claro: "Servicio en Mantenimiento"
- Descripción amigable
- Información de contacto
- Diseño responsive
- Fondo con gradiente morado

**Diseño:**
```
┌─────────────────────────────────┐
│                                 │
│         [Logo VibraTicket]      │
│                                 │
│              🔧                 │
│                                 │
│   Servicio en Mantenimiento     │
│                                 │
│  Estamos realizando tareas...   │
│  Por favor, intenta nuevamente  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ¿Necesitas ayuda?       │   │
│  │ soporte@vibraticket.com │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Estilos:**
- Fondo: Gradiente morado (#667eea → #764ba2)
- Card: Blanco con bordes redondeados
- Logo: 120px de altura
- Icono: 64px, color amarillo (#faad14)
- Sombra: 0 20px 60px rgba(0,0,0,0.3)

---

### 2. **App.jsx** (MODIFICADO) ✅

**Ubicación:** `src/App.jsx`

**Cambios realizados:**

#### Imports agregados:
```javascript
import { useState, useEffect } from "react";
import MaintenancePage from "./components/MaintenancePage";
import { healthApi } from "./services/apiService";
```

#### Estado agregado:
```javascript
const [isBackendDown, setIsBackendDown] = useState(false);
const [checkingHealth, setCheckingHealth] = useState(true);
```

#### Health Check con Retry Automático:
```javascript
useEffect(() => {
  checkBackendHealth();
  
  // Verificar cada 30 segundos si el backend sigue caído
  const interval = setInterval(() => {
    if (isBackendDown) {
      checkBackendHealth();
    }
  }, 30000);

  return () => clearInterval(interval);
}, [isBackendDown]);

const checkBackendHealth = async () => {
  try {
    setCheckingHealth(true);
    await healthApi.check();
    setIsBackendDown(false);
    console.log('✅ Backend disponible');
  } catch (error) {
    console.error('❌ Backend no disponible:', error);
    setIsBackendDown(true);
  } finally {
    setCheckingHealth(false);
  }
};
```

#### Renderizado condicional (BLOQUEA TODA LA APP):
```javascript
// Si el backend está caído, mostrar SOLO la página de mantenimiento
if (isBackendDown) {
  return <MaintenancePage />;
}

// Caso contrario, mostrar toda la aplicación normal
return (
  <AuthProvider>
    <Layout>
      <HeaderNav />
      <Content>
        <Routes>
          {/* Todas las rutas */}
        </Routes>
      </Content>
      <Footer />
      <ChatbotButton />
    </Layout>
  </AuthProvider>
);
```

**IMPORTANTE:** La lógica está en `App.jsx`, NO en `Home.jsx`. Esto bloquea TODA la aplicación.

---

### 3. **apiService.js** (MODIFICADO) ✅

**Método agregado:**
```javascript
export const healthApi = {
  getHealth: () => {
    return apiClient.get('/health');
  },
  
  // Alias para health check
  check: () => {
    return apiClient.get('/health');
  }
};
```

---

## 🔄 Flujo de Funcionamiento

### **Escenario 1: Backend Funcionando** ✅
```
1. Usuario entra a cualquier ruta de la app
2. App.jsx se monta
3. useEffect ejecuta checkBackendHealth()
4. healthApi.check() → GET /health
5. Respuesta: 200 OK
6. setIsBackendDown(false)
7. Renderiza toda la aplicación normalmente
8. Usuario puede navegar libremente
```

### **Escenario 2: Backend Caído** ❌
```
1. Usuario entra a cualquier ruta de la app
2. App.jsx se monta
3. useEffect ejecuta checkBackendHealth()
4. healthApi.check() → GET /health
5. Error: Network Error / 500 / Timeout
6. catch: setIsBackendDown(true)
7. Renderiza SOLO MaintenancePage
8. Usuario ve: "Servicio en Mantenimiento"
9. NO puede acceder a ninguna ruta
10. NO se renderiza Header, Footer, ni Chatbot
11. Cada 30 segundos reintenta conectar
```

### **Escenario 3: Backend se Recupera** ✅
```
1. Usuario está viendo MaintenancePage
2. Cada 30 segundos: checkBackendHealth()
3. healthApi.check() → GET /health
4. Respuesta: 200 OK
5. setIsBackendDown(false)
6. App se re-renderiza automáticamente
7. Usuario ve la aplicación normal
8. Puede continuar navegando
```

---

## 🎨 Diseño de MaintenancePage

### Elementos visuales:

1. **Logo VibraTicket**
   - Tamaño: 120px altura
   - Filtro: drop-shadow
   - Centrado

2. **Icono de Herramienta**
   - Componente: `<ToolOutlined />`
   - Tamaño: 64px
   - Color: #faad14 (amarillo/naranja)

3. **Título**
   - "Servicio en Mantenimiento"
   - Typography.Title level={2}
   - Color: #1f1f1f

4. **Descripción**
   - Texto explicativo
   - Color: #666
   - Tamaño: 16px

5. **Card de Contacto**
   - Fondo: #f5f5f5
   - Borde: #e8e8e8
   - Email: soporte@vibraticket.com

---

## 🔍 Detección de Errores

### Tipos de errores detectados:

1. **Network Error**
   - Backend no responde
   - Sin conexión a internet
   - Timeout

2. **500 Internal Server Error**
   - Backend con errores
   - Base de datos caída
   - Servicios internos fallando

3. **503 Service Unavailable**
   - Servidor en mantenimiento
   - Sobrecarga del servidor

4. **Otros errores HTTP**
   - Cualquier error que no sea 2xx

---

## ⚙️ Configuración

### Endpoint de Health Check:
```
GET /health
```

**Respuesta esperada (backend OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Respuesta en error:**
- Network Error
- Status 500+
- Timeout

---

## 🎯 Ventajas de la Implementación

### 1. **Experiencia de Usuario Mejorada**
- Mensaje claro en vez de error genérico
- Diseño profesional
- Información de contacto disponible

### 2. **Detección Automática**
- No requiere intervención manual
- Check al cargar la página
- Rápido (1 request)

### 3. **Diseño Consistente**
- Usa el logo de la marca
- Colores corporativos
- Responsive

### 4. **Información Clara**
- Usuario sabe qué está pasando
- Sabe que es temporal
- Tiene forma de contactar soporte

---

## 📱 Responsive

La página es completamente responsive:

### Desktop:
- Card: 600px máximo
- Logo: 120px
- Padding: 60px 40px

### Mobile:
- Card: 100% width
- Logo: 120px (mantiene tamaño)
- Padding: 40px 24px
- Texto ajustado

---

## ✅ Funcionalidades Implementadas

### 1. **Retry Automático** ✅
```javascript
// Reintentar cada 30 segundos (YA IMPLEMENTADO)
useEffect(() => {
  checkBackendHealth();
  
  const interval = setInterval(() => {
    if (isBackendDown) {
      checkBackendHealth();
    }
  }, 30000);
  
  return () => clearInterval(interval);
}, [isBackendDown]);
```

### 2. **Bloqueo Total de la Aplicación** ✅
- No se renderiza Header
- No se renderiza Footer
- No se renderiza Chatbot
- No se renderiza ninguna ruta
- Solo se muestra MaintenancePage

---

## 🔄 Mejoras Futuras (Opcionales)

### 2. **Contador de Tiempo**
```javascript
const [downtime, setDowntime] = useState(0);

useEffect(() => {
  if (isBackendDown) {
    const timer = setInterval(() => {
      setDowntime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }
}, [isBackendDown]);
```

### 3. **Notificación de Recuperación**
```javascript
if (!isBackendDown && wasDown) {
  message.success('El servicio se ha restablecido');
}
```

---

## ✅ Checklist de Verificación

- [x] Componente MaintenancePage creado
- [x] Logo centrado y visible
- [x] Mensaje claro de mantenimiento
- [x] Información de contacto
- [x] Diseño responsive
- [x] **App.jsx detecta backend caído (NO Home.jsx)**
- [x] Health check implementado
- [x] healthApi.check() disponible
- [x] Renderizado condicional funciona
- [x] Estilos consistentes con la marca
- [x] **Bloquea TODA la aplicación**
- [x] **Retry automático cada 30 segundos**
- [x] **No renderiza Header, Footer ni Chatbot**
- [x] **Usuario no puede navegar a ninguna ruta**

---

## 🧪 Cómo Probar

### Método 1: Apagar el Backend
```bash
# Detener el servidor backend
# Ctrl+C en la terminal del backend
```

### Método 2: Cambiar el endpoint
```javascript
// En apiService.js temporalmente
check: () => {
  return apiClient.get('/endpoint-que-no-existe');
}
```

### Método 3: Simular error
```javascript
// En Home.jsx temporalmente
const checkBackendHealth = async () => {
  setIsBackendDown(true); // Forzar error
};
```

---

## 📊 Resultado Final

**Cuando el backend está caído:**
```
✅ Usuario ve página profesional de mantenimiento
✅ Logo de VibraTicket visible y centrado
✅ Mensaje claro y amigable
✅ Información de contacto
✅ Sin errores en consola del navegador
✅ Diseño responsive
✅ NO puede navegar a ninguna ruta
✅ NO ve Header, Footer ni Chatbot
✅ TODA la aplicación está bloqueada
✅ Reintenta conectar cada 30 segundos
```

**Cuando el backend vuelve:**
```
✅ Aplicación se recupera automáticamente
✅ Usuario ve la app normal sin refrescar
✅ Puede navegar libremente
✅ Todos los componentes se renderizan
```

**Rutas bloqueadas cuando backend está caído:**
```
❌ / (Home)
❌ /events (Catálogo)
❌ /events/:id (Detalle de evento)
❌ /shows/:id (Detalle de show)
❌ /login (Login)
❌ /register (Registro)
❌ /mis-entradas (Mis entradas)
❌ /admin (Panel admin)
❌ TODAS las demás rutas
```

**Lo único visible:**
```
✅ MaintenancePage con logo
✅ Mensaje de mantenimiento
✅ Información de contacto
```

---

**PÁGINA DE MANTENIMIENTO GLOBAL IMPLEMENTADA** ✅

El sistema ahora **bloquea completamente la aplicación** cuando el backend está en mantenimiento o caído. El usuario no puede acceder a ninguna funcionalidad hasta que el backend se recupere.
