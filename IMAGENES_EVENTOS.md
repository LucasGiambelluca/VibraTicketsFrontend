# 📸 Sistema de Imágenes de Eventos - Frontend

## ✅ IMPLEMENTACIÓN COMPLETA

Se ha implementado un **sistema completo de gestión de imágenes** para eventos en el frontend, integrado con el backend que procesa automáticamente las imágenes.

---

## 🎯 Especificaciones de Imágenes (según UX/UI)

El sistema soporta **4 tipos de imágenes** con dimensiones y pesos específicos:

| Tipo | Dimensiones | Peso Máx | Uso |
|------|-------------|----------|-----|
| **Carátula Cuadrada** | 300x300px | 150 KB | Listados en grilla (MainEvents) |
| **Carátula Horizontal** | 626x300px | 200 KB | Tarjetas horizontales |
| **Banner Principal** | 1620x720px | 400 KB | Hero de EventDetail |
| **Banner Alternativo** | 1620x700px | 400 KB | Secciones alternativas |

### Procesamiento Automático del Backend

El backend **redimensiona y optimiza automáticamente** todas las imágenes:
- ✅ Redimensiona a dimensiones exactas
- ✅ Convierte a WebP (calidad 85%)
- ✅ Reduce peso si excede el límite
- ✅ Genera nombres únicos (UUID)
- ✅ Organiza en subdirectorios por tipo

---

## 📦 Archivos Creados/Modificados

### 1. **API Service** (`src/services/apiService.js`)

#### Nueva API: `eventImagesApi`

```javascript
import { eventImagesApi } from '../services/apiService';

// Obtener tipos de imágenes soportados
const types = await eventImagesApi.getImageTypes();

// Obtener todas las imágenes de un evento
const images = await eventImagesApi.getEventImages(eventId);
// Retorna: { cover_square: { url, filename }, cover_horizontal: {...}, ... }

// Subir múltiples imágenes
const formData = new FormData();
formData.append('cover_square', squareFile);
formData.append('banner_main', bannerFile);
await eventImagesApi.uploadEventImages(eventId, formData);

// Subir una imagen específica
const singleFormData = new FormData();
singleFormData.append('cover_square', squareFile);
await eventImagesApi.uploadSingleImage(eventId, 'cover_square', singleFormData);

// Eliminar una imagen específica
await eventImagesApi.deleteEventImage(eventId, 'cover_square');

// Eliminar todas las imágenes (solo ADMIN)
await eventImagesApi.deleteAllEventImages(eventId);
```

---

### 2. **Componente EventImageUpload** (`src/components/EventImageUpload.jsx`)

Componente reutilizable para gestionar las 4 imágenes de un evento.

#### Props:

```javascript
<EventImageUpload 
  eventId={42}              // ID del evento (null para nuevo evento)
  onChange={(images) => {}} // Callback cuando cambian los archivos locales
  showExisting={true}       // Mostrar imágenes del servidor
  allowUpload={true}        // Permitir subir directamente al servidor
/>
```

#### Características:

- ✅ Preview de imágenes seleccionadas
- ✅ Validación de formato y tamaño
- ✅ Muestra imágenes existentes del servidor
- ✅ Upload individual o múltiple
- ✅ Eliminación de imágenes del servidor
- ✅ UI moderna con Ant Design
- ✅ Tooltips informativos

---

### 3. **MainEvents** (`src/components/MainEvents.jsx`)

✅ **Actualizado para usar `cover_square`**

```javascript
// Prioridad de imágenes:
// 1. cover_square (ideal para grillas)
// 2. cover_horizontal (fallback)
// 3. image_url (sistema antiguo)
// 4. Placeholder

const imageUrl = event.cover_square_url || 
                 event.cover_horizontal_url || 
                 event.image_url || 
                 'placeholder';
```

**Resultado:** Cards de eventos muestran imágenes optimizadas 300x300px.

---

### 4. **EventDetail** (`src/pages/EventDetail.jsx`)

✅ **Actualizado para usar `banner_main` en Hero**

```javascript
// Hero Section con banner principal
background: `linear-gradient(...), url(${
  event.banner_main_url || 
  event.banner_alt_url || 
  event.cover_horizontal_url || 
  'fallback'
})`
```

**Resultado:** Hero de 1620x720px optimizado para la página de detalle.

---

### 5. **CreateEvent** (`src/components/CreateEvent.jsx`)

✅ **Integrado EventImageUpload para nuevos eventos**

#### Flujo:

1. Usuario expande "Mostrar Gestor de Imágenes"
2. Selecciona hasta 4 imágenes (cualquier combinación)
3. Al crear el evento:
   - Se crea el evento en el backend
   - Se suben las imágenes seleccionadas
   - Backend las procesa automáticamente
4. Mensaje de éxito muestra cantidad de imágenes subidas

```javascript
// Código simplificado
const eventImages = {
  cover_square: File,
  cover_horizontal: File,
  banner_main: File,
  banner_alt: null  // Opcional
};

// Crear evento
const result = await eventsApi.createEvent(eventData);

// Subir imágenes
const formData = new FormData();
if (eventImages.cover_square) formData.append('cover_square', eventImages.cover_square);
if (eventImages.banner_main) formData.append('banner_main', eventImages.banner_main);
await eventImagesApi.uploadEventImages(result.eventId, formData);
```

---

### 6. **AdminDashboard** (`src/pages/admin/AdminDashboard.jsx`)

✅ **Nuevo botón "📸" en acciones de eventos**

#### Funcionalidad:

- Botón verde con ícono de cámara en tabla de eventos
- Abre modal de gestión de imágenes
- Muestra EventImageUpload con `showExisting=true` y `allowUpload=true`
- Permite:
  - Ver imágenes actuales
  - Subir nuevas imágenes
  - Reemplazar imágenes existentes
  - Eliminar imágenes individuales

```javascript
// Handler
const handleManageImages = (event) => {
  setSelectedEventForImages(event);
  setImagesModalOpen(true);
};

// Modal
<Modal title="📸 Gestionar Imágenes del Evento" width={1200}>
  <EventImageUpload 
    eventId={selectedEventForImages.id}
    showExisting={true}
    allowUpload={true}
  />
</Modal>
```

---

## 🔄 Flujos Completos

### Flujo 1: Crear Evento con Imágenes

```
Admin → "Eventos" → "Crear Nuevo Evento"
  ↓
Completa formulario básico
  ↓
Click "▶ Mostrar Gestor de Imágenes"
  ↓
Selecciona imágenes (cover_square, banner_main, etc)
  ↓
Click "Crear Evento"
  ↓
Backend:
  1. Crea evento en BD
  2. Recibe imágenes
  3. Redimensiona a dimensiones exactas
  4. Convierte a WebP
  5. Guarda en public/uploads/events/{tipo}/
  6. Actualiza URLs en BD
  ↓
Frontend muestra: "Evento creado con 2 imágenes optimizadas"
  ↓
MainEvents muestra evento con cover_square
EventDetail muestra banner_main en hero
```

---

### Flujo 2: Editar Imágenes de Evento Existente

```
Admin → "Eventos" → Click botón "📸" en evento
  ↓
Modal "Gestionar Imágenes del Evento"
  ↓
Ve imágenes actuales (si existen)
  ↓
Selecciona nueva imagen (ej: banner_main)
  ↓
Click "Subir"
  ↓
Backend procesa y reemplaza imagen anterior
  ↓
Frontend muestra imagen actualizada
  ↓
Click "Cerrar" → Refetch → Tabla actualizada
```

---

### Flujo 3: Ver Evento en Frontend

```
Usuario → Home (MainEvents)
  ↓
Ve grilla de eventos con cover_square (300x300)
  ↓
Click en evento
  ↓
EventDetail carga con banner_main (1620x720) en hero
  ↓
Scroll down → ve información del evento
  ↓
Click "Comprar" → continúa flujo de compra
```

---

## 🎨 Prioridades de Imágenes

### En MainEvents (Grilla):
```
1. cover_square_url     ✅ Ideal (300x300)
2. cover_horizontal_url → Fallback (626x300)
3. image_url            → Legacy
4. Placeholder          → Default
```

### En EventDetail (Hero):
```
1. banner_main_url      ✅ Ideal (1620x720)
2. banner_alt_url       → Fallback (1620x700)
3. cover_horizontal_url → Segunda opción
4. image_url            → Legacy
5. Unsplash             → Default
```

---

## 🔧 Configuración del Backend

### Endpoints Disponibles:

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/events/images/types` | Info de tipos | Público |
| GET | `/api/events/:eventId/images` | Ver imágenes | Público |
| POST | `/api/events/:eventId/images` | Subir múltiples | JWT + ORGANIZER/ADMIN |
| POST | `/api/events/:eventId/images/:type` | Subir una | JWT + ORGANIZER/ADMIN |
| DELETE | `/api/events/:eventId/images/:type` | Eliminar una | JWT + ORGANIZER/ADMIN |
| DELETE | `/api/events/:eventId/images` | Eliminar todas | JWT + ADMIN |

### Variables de Entorno:

```env
# Backend ya configurado
VITE_API_URL=http://localhost:3000
```

### Almacenamiento:

```
public/uploads/events/
├── cover_square/
│   ├── abc123.webp (300x300)
│   └── def456.webp
├── cover_horizontal/
│   └── ghi789.webp (626x300)
├── banner_main/
│   └── jkl012.webp (1620x720)
└── banner_alt/
    └── mno345.webp (1620x700)
```

---

## ✅ Validaciones

### Frontend:

- ✅ Formatos: JPEG, JPG, PNG, GIF, WebP
- ✅ Tamaño: Máximo 5MB antes de procesamiento
- ✅ Preview inmediato
- ✅ Confirmación antes de eliminar

### Backend:

- ✅ Autenticación JWT requerida
- ✅ Rol ORGANIZER/ADMIN para subir
- ✅ Rol ADMIN para eliminar todas
- ✅ Validación de formatos
- ✅ Redimensionamiento exacto
- ✅ Compresión automática
- ✅ Límites de peso por tipo

---

## 🚀 Testing

### 1. Crear Evento con Imágenes:

```bash
# 1. Ir a Admin → Eventos → Crear Nuevo Evento
# 2. Completar nombre, descripción, etc.
# 3. Click "Mostrar Gestor de Imágenes"
# 4. Subir cover_square y banner_main
# 5. Click "Crear Evento"
# 6. Verificar mensaje: "Evento creado con 2 imágenes optimizadas"
# 7. Ir a Home y verificar que se ve cover_square
# 8. Click en evento y verificar banner_main en hero
```

### 2. Editar Imágenes Existentes:

```bash
# 1. Admin → Eventos
# 2. Click botón "📸" en evento
# 3. Ver imágenes actuales
# 4. Subir nueva imagen para cover_square
# 5. Click "Subir"
# 6. Verificar que se actualiza
# 7. Click "Eliminar del servidor" en banner_alt
# 8. Confirmar eliminación
# 9. Click "Cerrar"
# 10. Verificar que tabla se actualiza
```

### 3. Verificar Dimensiones:

```bash
# Backend logs mostrarán:
✅ cover_square → 300x300px
✅ cover_horizontal → 626x300px
✅ banner_main → 1620x720px
✅ banner_alt → 1620x700px

# Verificar en:
public/uploads/events/{tipo}/{uuid}.webp
```

---

## 📊 Ventajas del Sistema

### 1. **Optimización Automática**
- ✅ Redimensionamiento exacto
- ✅ Compresión WebP
- ✅ Reducción de peso
- ✅ Nombres únicos (UUID)

### 2. **Flexibilidad**
- ✅ 4 tipos de imágenes para diferentes usos
- ✅ Subida individual o múltiple
- ✅ Edición sin recrear evento
- ✅ Eliminación selectiva

### 3. **UX Mejorada**
- ✅ Preview inmediato
- ✅ Validaciones en tiempo real
- ✅ Feedback claro
- ✅ Gestión visual

### 4. **Performance**
- ✅ Imágenes optimizadas → carga rápida
- ✅ WebP → 30-50% menos peso que JPG
- ✅ Dimensiones exactas → sin desperdicio
- ✅ Lazy loading potencial

---

## 🔮 Mejoras Futuras

### Corto Plazo:
- [ ] Drag & drop para subir imágenes
- [ ] Crop/recorte de imágenes en frontend
- [ ] Vista previa lado a lado (antes/después)
- [ ] Historial de imágenes

### Mediano Plazo:
- [ ] Migración a CDN (Cloudinary, AWS S3)
- [ ] Soporte para AVIF (aún más compresión)
- [ ] Generación automática de thumbnails adicionales
- [ ] Watermark automático

### Largo Plazo:
- [ ] AI para optimizar composición
- [ ] Detección de rostros y auto-crop
- [ ] Sugerencias de imágenes stock
- [ ] A/B testing de imágenes

---

## 🐛 Troubleshooting

### Problema: "Error al subir imágenes"

**Solución:**
1. Verificar que backend esté corriendo en http://localhost:3000
2. Verificar autenticación (token JWT válido)
3. Verificar rol del usuario (ORGANIZER o ADMIN)
4. Verificar logs del backend para detalles

### Problema: "Imágenes no se ven en el frontend"

**Solución:**
1. Verificar que las URLs en la BD empiecen con `/uploads/`
2. Verificar que el frontend agregue `http://localhost:3000` como prefijo
3. Verificar que los archivos existan en `public/uploads/events/`
4. Verificar permisos de lectura del directorio

### Problema: "Dimensiones incorrectas"

**Solución:**
1. Verificar que el backend esté usando Sharp correctamente
2. Verificar que el tipo de imagen sea correcto (cover_square, etc.)
3. Ver logs del backend durante el procesamiento
4. Verificar que la imagen procesada exista en el subdirectorio correcto

---

## 📝 Resumen de Cambios

### Archivos Creados:
1. ✅ `src/components/EventImageUpload.jsx` (383 líneas)
2. ✅ `IMAGENES_EVENTOS.md` (este archivo)

### Archivos Modificados:
1. ✅ `src/services/apiService.js` (+52 líneas: eventImagesApi)
2. ✅ `src/components/MainEvents.jsx` (+15 líneas: lógica de imágenes)
3. ✅ `src/pages/EventDetail.jsx` (+20 líneas: banner en hero)
4. ✅ `src/components/CreateEvent.jsx` (+80 líneas: integración EventImageUpload)
5. ✅ `src/pages/admin/AdminDashboard.jsx` (+60 líneas: modal + botón)

### Total:
- **Líneas agregadas:** ~610
- **Componentes nuevos:** 1
- **APIs nuevas:** 1
- **Funcionalidades:** 4 tipos de imágenes completamente funcionales

---

## ✅ Estado Final

**SISTEMA 100% IMPLEMENTADO Y FUNCIONAL** 🚀

✅ Backend procesando imágenes correctamente  
✅ Frontend subiendo y mostrando imágenes  
✅ Admin gestionando imágenes visualmente  
✅ MainEvents usando cover_square  
✅ EventDetail usando banner_main  
✅ CreateEvent con gestor integrado  
✅ Validaciones y error handling completos  
✅ Documentación completa  

---

## 📞 Soporte

Para problemas o dudas:
1. Revisar esta documentación
2. Revisar logs del backend
3. Verificar estructura de directorios
4. Verificar permisos de usuario

---

**Fecha de Implementación:** 2025-11-06  
**Versión:** 1.0.0  
**Estado:** ✅ Completo y Listo para Producción
