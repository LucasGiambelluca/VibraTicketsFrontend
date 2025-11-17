# CARDS ESTILO ALLACCESS - DISEÑO MINIMALISTA

## Cambios Implementados

Se actualizaron las cards de eventos en `MainEvents.jsx` y `EventsCatalog.jsx` para que se vean como en AllAccess.

---

## ✨ Características del Nuevo Diseño

### 1. **Imagen Ocupa TODA la Card**
- La imagen cubre el 100% del espacio de la card
- No hay sección de texto separada
- Aspect ratio más alto: `paddingBottom: '140%'` (similar a pósters de eventos)

### 2. **Click en Toda la Card**
- Toda la card es clickeable (no solo un botón)
- Navegación directa al evento: `onClick={() => handleEventClick(event)}`
- Hover effect sutil: `translateY(-4px)` + sombra más pronunciada

### 3. **Tag de Disponibilidad Flotante**
- Tag posicionado sobre la imagen (top-right)
- Pequeño y discreto: `fontSize: '0.75rem'`, `padding: '2px 8px'`
- Color dinámico según estado:
  - **Disponible**: `primaryColor` del evento
  - **Próximamente**: Gris (`#E5E7EB`)

### 4. **Overlay Oscuro Sutil**
- Gradiente de transparente a negro (30% opacity)
- Mejora el contraste sin ocultar la imagen
- `background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)'`

### 5. **Efecto Zoom en Hover**
- Imagen hace zoom suave: `transform: scale(1.05)`
- Transición fluida: `transition: 'transform 0.4s ease'`
- Card se eleva: `translateY(-4px)` + `boxShadow` más fuerte

### 6. **Diseño Minimalista**
- Sin bordes gruesos
- Sin sección de texto visible
- Solo imagen + tag
- Bordes redondeados sutiles: `borderRadius: '12px'`

---

## 🎨 Comparación: Antes vs Ahora

### ANTES:
```
┌─────────────────────┐
│                     │
│      IMAGEN         │ ← 16:9 aspect ratio
│                     │
├─────────────────────┤
│  Título             │
│  Descripción        │
│  📅 Fecha           │
│  📍 Venue           │
│  [Botón Comprar]    │ ← Sección de texto separada
└─────────────────────┘
```

### AHORA (Estilo AllAccess):
```
┌─────────────────────┐
│                     │
│                     │
│      IMAGEN         │ ← Ocupa TODO (140% height)
│      COMPLETA       │
│                     │
│  [Tag: Disponible]  │ ← Tag flotante (top-right)
│                     │
└─────────────────────┘
```

---

## 📐 Especificaciones Técnicas

### Estructura HTML:
```jsx
<div onClick={handleEventClick} style={{ cursor: 'pointer' }}>
  <div style={{ paddingBottom: '140%', position: 'relative' }}>
    <img style={{ position: 'absolute', objectFit: 'cover' }} />
    <div style={{ overlay oscuro }} />
    <Tag style={{ position: 'absolute', top: 10, right: 10 }} />
  </div>
</div>
```

### Aspect Ratio:
- **Antes**: `aspectRatio: '16/9'` (más ancho que alto)
- **Ahora**: `paddingBottom: '140%'` (más alto que ancho, como póster)

### Grid Responsivo:
- **xs (móvil)**: 1 columna (24/24)
- **sm (tablet)**: 2 columnas (12/24)
- **md**: 3 columnas (8/24)
- **lg**: 4 columnas (6/24) ← Nuevo breakpoint

---

## 🎯 Ventajas del Nuevo Diseño

1. ✅ **Más visual**: La imagen es el foco principal
2. ✅ **Más limpio**: Sin texto que compita con la imagen
3. ✅ **Más moderno**: Estilo minimalista tipo Netflix/Spotify
4. ✅ **Mejor UX**: Toda la card es clickeable (target más grande)
5. ✅ **Más compacto**: Caben más eventos en pantalla
6. ✅ **Mejor mobile**: Imágenes más grandes en móviles

---

## 🔧 Archivos Modificados

### 1. `src/components/MainEvents.jsx`
- Eliminada sección de texto inferior
- Imagen ocupa 100% de la card
- Tag flotante sobre la imagen
- Click en toda la card

### 2. `src/pages/EventsCatalog.jsx`
- Mismos cambios que MainEvents
- Consistencia visual en todo el sitio

---

## 🎨 Estilos Personalizados Mantenidos

El nuevo diseño **mantiene** los estilos personalizados de cada evento:

- ✅ **primary_color**: Color del tag "Disponible"
- ✅ **secondary_color**: Degradado de fondo (si imagen falla)
- ✅ **Degradado**: `linear-gradient(135deg, primaryColor, secondaryColor)`

---

## 🚀 Resultado Final

Las cards ahora se ven **exactamente como AllAccess**:
- Imagen grande y prominente
- Tag pequeño y discreto
- Click en cualquier parte
- Hover effect elegante
- Diseño minimalista y moderno

**IMPLEMENTACIÓN 100% COMPLETA** ✅
