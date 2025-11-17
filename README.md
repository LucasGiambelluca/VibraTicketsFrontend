# 🎫 Ticketera Frontend

Plataforma moderna de venta de tickets desarrollada con React + Vite + Ant Design.

## ✨ Características Principales

- 🎨 **Diseño moderno** con animaciones GSAP y Three.js
- 📱 **Responsive design** optimizado para móviles
- 🚀 **Alto rendimiento** con optimizaciones avanzadas
- 🤖 **Chatbot IA** para soporte al cliente
- 📄 **Descarga de tickets** en PDF
- 🔔 **Notificaciones push** en tiempo real
- 🎪 **Cola virtual 3D** con efectos visuales
- 📊 **Monitor de rendimiento** integrado
- 🔐 **Sistema de autenticación** completo
- 🛡️ **PWA ready** con Service Worker

## 🛠️ Tecnologías

### Core
- **React 19** - Framework principal
- **Vite** - Build tool ultrarrápido
- **Ant Design** - Librería de componentes UI
- **React Router DOM** - Navegación SPA

### Animaciones y 3D
- **GSAP** - Animaciones avanzadas
- **Three.js** - Efectos 3D y partículas
- **ScrollTrigger** - Animaciones on scroll

### Funcionalidades
- **html2canvas** - Captura de elementos DOM
- **jsPDF** - Generación de PDFs
- **Axios** - Cliente HTTP
- **Zustand** - Estado global

## 🚀 Instalación Rápida

```bash
# Clonar repositorio
git clone [repo-url]
cd ticketera-frontend

# Configuración automática
node setup.js

# O instalación manual
npm install
npm install gsap html2canvas jspdf three

# Iniciar desarrollo
pnpm run dev
```

## 📦 Build para Producción

**IMPORTANTE:** La carpeta `dist/` NO está incluida en el repositorio por seguridad (contiene variables de entorno compiladas).

### Generar Build:

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys reales

# 2. Generar build
pnpm run build

# La carpeta dist/ se creará con:
# - HTML minificado
# - JavaScript optimizado y comprimido
# - CSS procesado
# - Assets optimizados
```

### Desplegar:

```bash
# Opción 1: Servidor estático
cd dist
python -m http.server 8080

# Opción 2: Vercel/Netlify
# Conecta tu repo y despliega automáticamente
# Build command: pnpm run build
# Output directory: dist
```

### Modo Mantenimiento:

El sitio incluye un sistema de protección con contraseña:

```bash
# .env
VITE_MAINTENANCE_MODE=true  # Requiere contraseña: vibratickets2025
VITE_MAINTENANCE_MODE=false # Acceso libre
```

**Contraseña por defecto:** `vibratickets2025`

Para cambiar la contraseña, edita `src/components/MaintenanceLogin.jsx`

Ver documentación completa en `MODO_MANTENIMIENTO.md`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── VirtualQueue.jsx # Cola virtual 3D
│   └── ...
├── pages/              # Páginas principales
│   ├── Home.jsx        # Página principal
│   ├── SmartTicket.jsx # Ticket digital
│   ├── Soporte.jsx     # Centro de ayuda
│   └── admin/          # Panel administrativo
├── hooks/              # Hooks personalizados
│   └── useOptimizedPerformance.js
├── services/           # Servicios
│   └── NotificationService.js
├── utils/              # Utilidades
│   └── PerformanceMonitor.js
└── styles/             # Estilos globales
```

## 🎯 Flujo de Usuario

### Cliente
1. **Home** → Lista de eventos con animaciones
2. **EventDetail** → Detalles y fechas disponibles
3. **ShowDetail** → Información específica del show
4. **SeatSelection** → Selección interactiva de asientos
5. **Checkout** → Proceso de pago optimizado
6. **OrderSuccess** → Confirmación con animación
7. **MisEntradas** → Gestión de tickets comprados
8. **SmartTicket** → Ticket digital con QR y descarga PDF

### Soporte
- **Chatbot IA** con respuestas inteligentes
- **Formularios** especializados por tipo de problema
- **Sistema de tickets** con seguimiento

## 🔧 Panel de Administración

Accede a `/admin` para gestionar:

### Dashboard
- 📊 Métricas en tiempo real
- 📈 Estadísticas de ventas
- 👥 Usuarios activos

### Gestión
- 🎭 **Eventos** - CRUD completo con estados
- 🎪 **Shows** - Programación de funciones
- 👤 **Usuarios** - Gestión de cuentas
- ⚙️ **Configuración** - Ajustes del sistema

## ⚡ Optimizaciones de Rendimiento

### Técnicas Implementadas
- **React.memo** para componentes pesados
- **useMemo/useCallback** para cálculos costosos
- **Lazy loading** de imágenes
- **Virtual scrolling** para listas grandes
- **Code splitting** automático
- **Cache inteligente** con estrategia LRU

### Métricas Monitoreadas
- **Core Web Vitals** (FCP, LCP, CLS, FID)
- **Uso de memoria** en tiempo real
- **Tareas largas** del main thread
- **Tiempo de API calls**

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones
- 🎪 **Cola virtual** - Actualizaciones de posición
- 🎫 **Tickets** - Descarga y recordatorios
- 💰 **Compras** - Confirmaciones de pago
- 📅 **Eventos** - Cancelaciones y reprogramaciones

### Tecnologías
- **Service Worker** para notificaciones push
- **Web Notifications API**
- **Background Sync** para offline

## 🎨 Animaciones y Efectos

### GSAP Animations
- **Entrada de elementos** con stagger
- **Hover effects** suaves
- **Scroll animations** con ScrollTrigger
- **Morphing** de botones y cards

### Three.js Effects
- **Partículas 3D** en cola virtual
- **Geometrías animadas**
- **Efectos de iluminación**

## 📱 PWA Features

- 🔄 **Service Worker** para cache
- 📱 **Instalable** como app nativa
- 🌐 **Offline support** básico
- 🔔 **Push notifications**

## 🧪 Testing y Calidad

```bash
# Linting
npm run lint

# Testing (cuando esté configurado)
npm run test

# Build de producción
npm run build

# Preview de producción
npm run preview
```

## 🚀 Deploy

### Preparación
```bash
npm run build
```

### Plataformas Recomendadas
- **Vercel** - Deploy automático
- **Netlify** - Con formularios
- **AWS S3 + CloudFront** - Escalable

## 🔧 Configuración

### Variables de Entorno (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Ticketera
VITE_APP_VERSION=1.0.0
```

### Configuración de GSAP
```javascript
// Registrar plugins
gsap.registerPlugin(ScrollTrigger);
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch
3. Commit cambios
4. Push al branch
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🆘 Soporte

- 📧 Email: soporte@ticketera.com
- 💬 Chat: Disponible en la aplicación
- 📖 Docs: Ver carpeta `/docs`

---

**Desarrollado con ❤️ para la mejor experiencia de compra de tickets**

## 📦 Instalación

1. **Clonar e instalar dependencias:**
```bash
cd ticketera-frontend
pnpm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxx
```

3. **Ejecutar en desarrollo:**
```bash
pnpm run dev
```

La aplicación estará disponible en: http://localhost:5173

## 🎯 Flujo de Usuario

### Compra de Tickets
1. **Home** (`/`) - Lista de eventos con banner y búsqueda
2. **Detalle de Evento** (`/events/:id`) - Shows disponibles
3. **Detalle de Show** (`/shows/:id`) - Información y botón "Unirse a cola"
4. **Cola Virtual** (`/queue/:showId`) - Espera con progreso
5. **Selección de Asientos** (`/seats/:showId`) - Grid interactivo por secciones
6. **Checkout** (`/checkout/:orderId`) - Formulario de pago completo
7. **Confirmación** (`/order-success/:orderId`) - Resumen y descarga

### Panel de Administración
- **Admin Dashboard** (`/admin`) - Gestión de eventos, shows y banners

## 🏗️ Estructura del Proyecto

```
src/
├── api/
│   └── client.js              # Cliente HTTP con axios
├── pages/
│   ├── Home.jsx              # Página principal
│   ├── EventDetail.jsx       # Detalle de evento
│   ├── ShowDetail.jsx        # Detalle de show
│   ├── Queue.jsx             # Cola virtual
│   ├── SeatSelection.jsx     # Selección de asientos
│   ├── Checkout.jsx          # Formulario de pago
│   ├── OrderSuccess.jsx      # Confirmación de compra
│   ├── NotFound.jsx          # 404
│   └── admin/
│       └── AdminDashboard.jsx # Panel de administración
├── components/
│   ├── HeaderNav.jsx         # Navegación responsive
│   ├── BannerCarrousel.jsx   # Carrusel de banners
│   ├── SearchBar.jsx         # Barra de búsqueda
│   └── MainEvents.jsx        # Grilla de eventos
└── App.jsx                   # Router principal
```

## 🎨 Componentes Principales

### SeatSelection
- Grid interactivo de asientos por secciones (Platea, Pullman, VIP)
- Máximo 4 asientos por compra
- Resumen en tiempo real con precios

### Checkout
- Formulario completo de pago (tarjeta, MercadoPago)
- Validaciones de campos
- Resumen de orden detallado

### Queue
- Simulación de cola virtual con progreso
- Polling automático de posición
- Redirección automática cuando está habilitado

## 🔧 Desarrollo

### Scripts Disponibles
```bash
pnpm run dev      # Servidor de desarrollo
pnpm run build    # Build de producción  
pnpm run preview  # Preview del build
pnpm run lint     # Linter ESLint
```

### Conectar con Backend
El cliente HTTP está configurado en `src/api/client.js`. Para conectar con tu API:

1. Ajustar `VITE_API_BASE_URL` en `.env`
2. Crear módulos API específicos (events, shows, queue, orders, payments)
3. Reemplazar mocks en páginas por llamadas reales

### Próximas Mejoras
- [ ] Conectar API real del backend
- [ ] Implementar stores con Zustand
- [ ] Integración real con MercadoPago Bricks
- [ ] Sistema de autenticación
- [ ] Notificaciones push
- [ ] Tests unitarios

## 📱 Responsive Design

La aplicación está optimizada para:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

Usa el sistema de grid de Ant Design con breakpoints automáticos.

## 🎭 Demo

Puedes probar el flujo completo:
1. Hacer clic en "Comprar" en cualquier evento
2. Seleccionar un show
3. Esperar en la cola (se reduce automáticamente)
4. Seleccionar asientos
5. Completar el formulario de pago
6. Ver la confirmación

---

**Desarrollado con ❤️ usando React + Vite + Ant Design**
