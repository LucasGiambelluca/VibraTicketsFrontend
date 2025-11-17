# 🎫 FLUJO DE COMPRA DE ENTRADAS - FRONTEND

**Fecha**: 2025-10-27  
**Versión**: 1.3.0  
**Estado**: ✅ Completado

---

## 📋 RESUMEN DE CAMBIOS

Se implementó el flujo completo de compra de entradas desde el componente principal de eventos (Home) hasta la selección de shows y secciones.

---

## 🎯 COMPONENTES CREADOS/MODIFICADOS

### 1. **MainEvents.jsx** ✨ NUEVO

**Ubicación**: `src/components/MainEvents.jsx`

**Descripción**: Componente principal que muestra la grilla de eventos en la página de inicio.

**Características**:
- ✅ Usa hook `useEvents` para cargar eventos del backend
- ✅ Muestra 12 eventos por página
- ✅ Cards con imagen, nombre, venue, fecha
- ✅ Tag "Disponible" si tiene shows
- ✅ Tag "Próximamente" si no tiene shows
- ✅ Botón "Comprar" habilitado solo si hay shows
- ✅ Botón "Ver" para ver detalles
- ✅ Navegación a `/events/:id` al hacer click
- ✅ Estados de loading y error
- ✅ Empty state si no hay eventos

**Código clave**:
```javascript
const handleBuyTickets = (event) => {
  if (event.show_count > 0) {
    navigate(`/events/${event.id}`);
  }
};

<Button
  type="primary"
  icon={<ShoppingCartOutlined />}
  onClick={() => handleBuyTickets(event)}
  disabled={!hasShows}
>
  {hasShows ? 'Comprar' : 'Sin funciones'}
</Button>
```

---

### 2. **EventDetail.jsx** 🔧 ACTUALIZADO

**Ubicación**: `src/pages/EventDetail.jsx`

**Cambios realizados**:

#### A. Carga de Datos del Backend
```javascript
// ANTES: Usaba datos mock
const mockEvent = { ... };

// DESPUÉS: Carga datos reales
const eventResponse = await eventsApi.getEvent(eventId);
const showsResponse = await showsApi.listShows({ eventId });
```

#### B. Información del Evento
```javascript
// Muestra venue_name y venue_city del backend
<Text>{event.venue_name || 'Venue por definir'}</Text>
<Text type="secondary">{event.venue_city || 'Ciudad por definir'}</Text>

// Muestra cantidad de funciones
<Text>{shows.length} {shows.length === 1 ? 'función disponible' : 'funciones disponibles'}</Text>
```

#### C. Lista de Shows
```javascript
// Muestra shows reales del backend
shows.map((show) => {
  const showDate = new Date(show.startsAt || show.starts_at);
  const isSoldOut = show.available_seats === 0;
  const hasLowSeats = show.available_seats > 0 && show.available_seats < 50;
  
  return (
    <Card>
      <CalendarOutlined /> {showDate.toLocaleDateString()}
      <ClockCircleOutlined /> {showDate.toLocaleTimeString()}
      <Tag color={isSoldOut ? 'red' : hasLowSeats ? 'orange' : 'green'}>
        {isSoldOut ? 'AGOTADO' : hasLowSeats ? 'POCAS ENTRADAS' : 'DISPONIBLE'}
      </Tag>
      <Link to={`/shows/${show.id}`}>
        <Button disabled={isSoldOut}>
          {isSoldOut ? 'Agotado' : 'Comprar'}
        </Button>
      </Link>
    </Card>
  );
})
```

#### D. Empty State
```javascript
{shows.length === 0 && (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <Text type="secondary">
      No hay funciones disponibles para este evento
    </Text>
  </div>
)}
```

---

## 🔄 FLUJO COMPLETO DE COMPRA

### Paso 1: Página Principal (Home)
```
Usuario → http://localhost:5173/
  ↓
MainEvents carga eventos del backend
  ↓
Muestra grilla de eventos con:
  - Imagen del evento
  - Nombre
  - Venue y ciudad
  - Próxima fecha
  - Cantidad de funciones
  - Botón "Comprar" (habilitado si hay shows)
  - Botón "Ver" (siempre habilitado)
```

### Paso 2: Detalle del Evento
```
Usuario → Click "Comprar" o "Ver"
  ↓
Navega a /events/:id
  ↓
EventDetail carga:
  - Datos del evento (GET /api/events/:id)
  - Shows del evento (GET /api/shows?eventId=:id)
  ↓
Muestra:
  - Hero con imagen y nombre
  - Descripción del evento
  - Información del venue
  - Lista de shows disponibles
```

### Paso 3: Selección de Show
```
Usuario → Click "Comprar" en un show
  ↓
Navega a /shows/:showId
  ↓
ShowDetail carga:
  - Datos del show
  - Secciones disponibles
  - Precios
  ↓
Usuario selecciona sección
  ↓
Procede al checkout
```

---

## 📊 ESTRUCTURA DE DATOS

### Evento (desde backend):
```json
{
  "id": 1,
  "name": "Concierto Rock",
  "description": "Gran concierto de rock",
  "venue_name": "Movistar Arena",
  "venue_city": "Buenos Aires",
  "next_show_date": "2025-12-15T21:00:00.000Z",
  "show_count": 3,
  "image_url": "https://...",
  "created_at": "2025-10-27T...",
  "updated_at": "2025-10-27T..."
}
```

### Show (desde backend):
```json
{
  "id": 1,
  "eventId": 1,
  "startsAt": "2025-12-15T21:00:00.000Z",
  "available_seats": 150,
  "total_capacity": 200,
  "min_price": 1500000,
  "max_price": 5000000,
  "created_at": "2025-10-27T...",
  "updated_at": "2025-10-27T..."
}
```

---

## 🎨 DISEÑO Y UX

### MainEvents - Cards de Eventos

**Características visuales**:
- Imagen de 200px de altura
- Tag "Disponible" (verde) o "Próximamente" (gris)
- Título con ellipsis (máximo 2 líneas)
- Icono de ubicación para venue
- Icono de calendario para fecha
- Tag azul con cantidad de funciones
- 2 botones: "Ver" (default) y "Comprar" (primary con gradient)

**Responsive**:
- xs (móvil): 1 columna (24/24)
- sm (tablet): 2 columnas (12/24)
- lg (desktop): 3 columnas (8/24)
- xl (desktop grande): 4 columnas (6/24)

### EventDetail - Detalle del Evento

**Hero Section**:
- Imagen de fondo con overlay oscuro
- Título grande (3rem)
- Breadcrumbs
- Tags con información

**Content Section**:
- 2 columnas en desktop (14/10)
- Columna izquierda: Información del evento
- Columna derecha: Lista de shows

**Shows Cards**:
- Fecha y hora formateadas
- Precio mínimo
- Entradas disponibles
- Tag de estado (DISPONIBLE/POCAS ENTRADAS/AGOTADO)
- Botón "Comprar" con gradient morado

---

## 🔍 VALIDACIONES Y ESTADOS

### MainEvents

| Estado | Comportamiento |
|--------|----------------|
| Loading | Muestra Spin con mensaje "Cargando eventos..." |
| Error | Muestra caja amarilla con mensaje de error |
| Sin eventos | Muestra Empty con mensaje "No hay eventos disponibles" |
| Con eventos | Muestra grilla de cards |

### EventDetail

| Estado | Comportamiento |
|--------|----------------|
| Loading | Muestra Spin centrado |
| Error | Muestra mensaje de error + redirección |
| Evento no encontrado | Muestra "Evento no encontrado" |
| Sin shows | Muestra mensaje "No hay funciones disponibles" |
| Con shows | Muestra lista de shows |

### Botones de Compra

| Condición | Estado del Botón |
|-----------|------------------|
| Evento sin shows | Disabled + texto "Sin funciones" |
| Show agotado | Disabled + texto "Agotado" |
| Show con entradas | Enabled + texto "Comprar" |

---

## 🧪 TESTING

### Test 1: Ver Eventos en Home
```bash
1. Ir a http://localhost:5173/
2. Verificar que se muestran eventos del backend
3. Verificar que cada card tiene:
   - Imagen
   - Nombre
   - Venue y ciudad
   - Fecha
   - Tag de disponibilidad
   - Botones "Ver" y "Comprar"
```

### Test 2: Comprar Entradas
```bash
1. En Home, click "Comprar" en un evento con shows
2. Verificar navegación a /events/:id
3. Verificar que se muestra:
   - Información del evento
   - Lista de shows
4. Click "Comprar" en un show
5. Verificar navegación a /shows/:showId
```

### Test 3: Evento sin Shows
```bash
1. Crear evento sin shows en admin
2. Ir a Home
3. Verificar que el botón "Comprar" está disabled
4. Verificar que dice "Sin funciones"
5. Click "Ver" para ir al detalle
6. Verificar mensaje "No hay funciones disponibles"
```

### Test 4: Show Agotado
```bash
1. Crear show con 0 entradas disponibles
2. Ir al detalle del evento
3. Verificar tag "AGOTADO" en rojo
4. Verificar botón "Agotado" disabled
```

### Test 5: Responsive
```bash
1. Abrir en móvil (< 576px)
   - Verificar: 1 columna
2. Abrir en tablet (576-992px)
   - Verificar: 2 columnas
3. Abrir en desktop (> 992px)
   - Verificar: 3-4 columnas
```

---

## 📝 ARCHIVOS MODIFICADOS/CREADOS

### Nuevos:
1. ✅ `src/components/MainEvents.jsx` (280 líneas)
   - Componente principal de eventos
   - Grilla responsive
   - Navegación a detalle

### Modificados:
1. ✅ `src/pages/EventDetail.jsx`
   - Carga datos del backend (antes usaba mock)
   - Muestra shows reales
   - Estados de disponibilidad
   - Navegación a shows

2. ✅ `src/pages/Home.jsx`
   - Ya importaba MainEvents (ahora existe)

---

## 🔗 ENDPOINTS UTILIZADOS

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/events` | GET | Listar eventos en MainEvents |
| `/api/events/:id` | GET | Obtener evento específico |
| `/api/shows?eventId=:id` | GET | Listar shows de un evento |

---

## ⚠️ NOTAS IMPORTANTES

### 1. Imágenes de Eventos

Si un evento no tiene imagen, se muestra placeholder:
```javascript
const imageUrl = event.image_url || 'https://via.placeholder.com/400x250?text=Sin+Imagen';
```

### 2. Formato de Fechas

Se usa `date-fns` con locale español:
```javascript
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
```

### 3. Precios

Los precios vienen en centavos desde el backend:
```javascript
const price = show.min_price / 100; // Convertir a pesos
```

### 4. Estados de Shows

- **DISPONIBLE**: `available_seats > 50`
- **POCAS ENTRADAS**: `0 < available_seats < 50`
- **AGOTADO**: `available_seats === 0`

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

### Mejoras Futuras:

1. **Filtros en MainEvents**
   - Por ciudad
   - Por fecha
   - Por categoría
   - Por rango de precio

2. **Ordenamiento**
   - Por fecha (más próximo primero)
   - Por popularidad
   - Por precio

3. **Paginación**
   - Botones "Anterior" y "Siguiente"
   - Infinite scroll
   - "Cargar más"

4. **Favoritos**
   - Marcar eventos como favoritos
   - Ver mis favoritos

5. **Compartir**
   - Botón para compartir en redes sociales
   - Copiar link del evento

6. **Búsqueda Avanzada**
   - Búsqueda por texto
   - Autocompletado
   - Sugerencias

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] MainEvents creado y funcional
- [x] Carga eventos del backend
- [x] Navegación a EventDetail
- [x] EventDetail carga datos reales
- [x] Muestra lista de shows
- [x] Navegación a ShowDetail
- [x] Estados de loading
- [x] Manejo de errores
- [x] Empty states
- [x] Responsive design
- [x] Botones habilitados/deshabilitados según disponibilidad
- [x] Tags de estado (DISPONIBLE/AGOTADO)
- [x] Formato de fechas en español
- [x] Precios convertidos de centavos
- [x] Documentación creada

---

## 📊 RESUMEN EJECUTIVO

**Problema**: No existía el componente MainEvents y EventDetail usaba datos mock.

**Solución**: 
- ✅ Creado MainEvents con grilla de eventos del backend
- ✅ Actualizado EventDetail para usar datos reales
- ✅ Implementado flujo completo de compra

**Resultado**:
- ✅ Usuario puede ver eventos en Home
- ✅ Usuario puede navegar al detalle
- ✅ Usuario puede ver shows disponibles
- ✅ Usuario puede comprar entradas si hay disponibilidad

**Flujo Completo**:
```
Home (MainEvents) 
  → EventDetail (lista de shows) 
    → ShowDetail (selección de sección) 
      → Checkout
```

---

**🎉 FLUJO DE COMPRA COMPLETADO Y FUNCIONAL**

Última actualización: 2025-10-27  
Estado: ✅ Completado y Listo para Producción
