# 🎨 Panel de Administración de Banners - COMPLETO

## ✅ IMPLEMENTACIÓN COMPLETA

Sistema completo de administración de banners para homepage, accesible solo para administradores.

---

## 🎯 **Funcionalidades Implementadas**

### 1. ✅ **CRUD Completo de Banners**
- **Crear** nuevos banners con imagen, título, descripción
- **Editar** banners existentes
- **Eliminar** banners (con confirmación)
- **Activar/Desactivar** banners con switch
- **Reordenar** banners con botones ↑ ↓

### 2. ✅ **Gestión de Imágenes**
- **Subida de imágenes** con preview
- **Validación** de formato (JPG/PNG/WebP)
- **Vista previa** antes de guardar
- **Reemplazo** de imagen en edición

### 3. ✅ **Tipos de Enlaces**
- **Ninguno** - Solo visual, no clickeable
- **Evento** - Link a página de evento específico
- **Externa** - Link a URL externa (se abre en nueva pestaña)

### 4. ✅ **Interfaz Intuitiva**
- **Tabla visual** con preview de imágenes
- **Switch** para activar/desactivar rápidamente
- **Botones de reordenamiento** (subir/bajar)
- **Modal** para crear/editar
- **Confirmación** antes de eliminar
- **Alertas informativas**

---

## 📁 **Archivos Creados/Modificados**

| Archivo | Acción | Líneas | Descripción |
|---------|--------|--------|-------------|
| `src/pages/admin/AdminBanners.jsx` | ✅ Creado | 550 | Componente completo de gestión |
| `src/pages/admin/AdminDashboard.jsx` | ✅ Modificado | +3 | Agregado menú y caso |
| `src/services/apiService.js` | ✅ Ya existía | - | APIs ya implementadas |

---

## 🎨 **Interfaz del Panel Admin**

### Vista Principal:

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 Gestión de Banners de Homepage     [+ Crear Banner]     │
├──────────────────────────────────────────────────────────────┤
│  ℹ️ Los banners se muestran en el carousel...               │
├──────┬────────┬─────────┬─────────┬──────────┬───────┬──────┤
│ Orden│ Imagen │ Título  │ Descrip │   Tipo   │Estado │Acción│
├──────┼────────┼─────────┼─────────┼──────────┼───────┼──────┤
│  10  │ [IMG]  │Iron M.  │Tour 2026│Evento:...│ ✅ ON │↑↓✏️🗑│
│  20  │ [IMG]  │Lolla    │Festival │Evento:...│ ❌ OFF│↑↓✏️🗑│
│  30  │ [IMG]  │Coldplay │World..  │Externa   │ ✅ ON │↑↓✏️🗑│
└──────┴────────┴─────────┴─────────┴──────────┴───────┴──────┘
```

### Modal de Crear/Editar:

```
┌────────────────────────────────────┐
│  Crear Banner            [X]       │
├────────────────────────────────────┤
│  Título: ___________________       │
│  Iron Maiden 2026                  │
│                                    │
│  Descripción: _____________        │
│  Run For Your Lives Tour           │
│                                    │
│  Imagen del Banner:                │
│  [📷 Subir Imagen]                │
│  Recomendado: 1920x600px           │
│                                    │
│  Tipo de Enlace: ▼                 │
│  ○ Sin enlace                      │
│  ● Evento                          │
│  ○ URL Externa                     │
│                                    │
│  Seleccionar Evento: ▼             │
│  Iron Maiden - River Plate         │
│                                    │
│  Orden: [ 10 ]                     │
│                                    │
│  ¿Activar banner? [ON] Activo      │
│                                    │
│         [Cancelar] [Crear] ✅      │
└────────────────────────────────────┘
```

---

## 🔧 **Características Técnicas**

### Componente AdminBanners.jsx

**Estados:**
```javascript
const [banners, setBanners] = useState([]);      // Lista de banners
const [events, setEvents] = useState([]);        // Lista de eventos
const [loading, setLoading] = useState(false);   // Estado de carga
const [modalVisible, setModalVisible] = useState(false);  // Modal
const [editingBanner, setEditingBanner] = useState(null); // Banner en edición
const [imageFile, setImageFile] = useState(null);         // Archivo de imagen
const [previewImage, setPreviewImage] = useState(null);   // Preview
```

**Funciones Principales:**
- `loadBanners()` - Cargar todos los banners (GET /api/homepage/banners/all)
- `loadEvents()` - Cargar eventos para vincular (GET /api/events)
- `handleCreate()` - Abrir modal en modo crear
- `handleEdit(banner)` - Abrir modal en modo editar
- `handleSubmit(values)` - Crear o actualizar banner (POST/PUT)
- `handleToggleActive(bannerId)` - Activar/Desactivar (PATCH)
- `handleDelete(bannerId)` - Eliminar banner (DELETE)
- `handleReorder(bannerId, direction)` - Reordenar ↑↓ (PUT /reorder)
- `handleImageChange(info)` - Subir y previsualizar imagen

---

## 📊 **Tabla de Columnas**

| Columna | Ancho | Descripción |
|---------|-------|-------------|
| **Orden** | 80px | Número de orden, sorteable |
| **Imagen** | 150px | Preview 120x50, con fallback |
| **Título** | Auto | Nombre del banner (bold) |
| **Descripción** | Auto | Texto descriptivo (ellipsis) |
| **Tipo de Link** | 120px | Tag con color según tipo |
| **Estado** | 100px | Switch ON/OFF con iconos |
| **Acciones** | 200px | ↑ ↓ Editar Eliminar |

---

## 🎯 **Flujo de Uso**

### Crear Banner:

```
Admin Panel → Banners
  ↓
[+ Crear Banner]
  ↓
Modal se abre
  ├─ Título: "Iron Maiden 2026"
  ├─ Descripción: "Run For Your Lives Tour"
  ├─ Subir imagen (1920x600)
  ├─ Tipo: [Evento]
  ├─ Evento: [Iron Maiden - River Plate]
  ├─ Orden: 10
  └─ Activar: ✅ ON
  ↓
[Crear] → POST /api/homepage/banners
  ↓
Banner creado exitosamente
  ↓
Aparece en tabla
  ↓
Usuario ve banner en Home (si está activo)
```

### Editar Banner:

```
Admin Panel → Banners → Ver tabla
  ↓
Click [✏️ Editar] en banner
  ↓
Modal se abre con datos actuales
  ├─ Título precargado
  ├─ Descripción precargada
  ├─ Imagen actual visible
  ├─ Tipo de link seleccionado
  └─ Estado actual
  ↓
Modificar campos necesarios
  ↓
[Actualizar] → PUT /api/homepage/banners/:id
  ↓
Banner actualizado
  ↓
Cambios visibles en Home
```

### Activar/Desactivar:

```
Admin Panel → Banners → Ver tabla
  ↓
Click en Switch de banner
  ↓
PATCH /api/homepage/banners/:id/toggle
  ↓
Estado cambia instantáneamente
  ├─ ON (✅) → Visible en Home
  └─ OFF (❌) → No visible en Home
```

### Reordenar:

```
Admin Panel → Banners → Ver tabla
  ↓
Click [↑] para subir o [↓] para bajar
  ↓
Intercambia posiciones
  ↓
PUT /api/homepage/banners/reorder
  ↓
Orden actualizado en tabla
  ↓
Carousel en Home respeta nuevo orden
```

### Eliminar:

```
Admin Panel → Banners → Ver tabla
  ↓
Click [🗑️ Eliminar]
  ↓
Popconfirm: "¿Estás seguro?"
  ├─ [No] → Cancelar
  └─ [Sí] → Confirmar
  ↓
DELETE /api/homepage/banners/:id
  ↓
Banner eliminado
  ↓
Desaparece de tabla y de Home
```

---

## 🔐 **Seguridad y Permisos**

### Restricciones:
- ✅ Solo **ADMIN** puede acceder a este panel
- ✅ Validación de rol en **frontend** (useAuth)
- ✅ Validación de rol en **backend** (middleware requireAdmin)
- ✅ Token JWT requerido en todas las peticiones (excepto GET banners activos)

### Validaciones Backend:
```javascript
// Todas las rutas admin requieren autenticación y rol ADMIN
router.post('/banners', requireAdmin, uploadBanner, createBanner);
router.put('/banners/:id', requireAdmin, uploadBanner, updateBanner);
router.patch('/banners/:id/toggle', requireAdmin, toggleBanner);
router.put('/banners/reorder', requireAdmin, reorderBanners);
router.delete('/banners/:id', requireAdmin, deleteBanner);
```

---

## 📸 **Gestión de Imágenes**

### Recomendaciones:
- **Dimensiones:** 1920x600px (ratio 3.2:1)
- **Formato:** JPG, PNG, WebP
- **Tamaño máximo:** 2MB
- **Calidad:** Alta (para pantallas grandes)

### Proceso de Upload:
```
Usuario selecciona imagen
  ↓
beforeUpload={() => false}  // No sube automáticamente
  ↓
FileReader lee archivo
  ↓
Preview se muestra en modal
  ↓
Usuario completa formulario
  ↓
Al hacer submit:
  ├─ FormData con archivo
  ├─ Content-Type: multipart/form-data
  └─ POST/PUT a backend
  ↓
Backend procesa:
  ├─ Valida formato y tamaño
  ├─ Guarda en /uploads/banners/
  ├─ Genera nombre único
  └─ Retorna URL: /uploads/banners/abc123.jpg
  ↓
Frontend recarga banners
  ↓
Imagen visible en tabla y en Home
```

---

## 🎨 **Tipos de Enlaces**

### 1. Sin Enlace (none)
```javascript
{
  link_type: 'none',
  link_url: null,
  event_id: null
}
```
**Comportamiento:**
- Banner solo visual
- No es clickeable
- cursor: default

### 2. Evento (event)
```javascript
{
  link_type: 'event',
  event_id: 123,
  link_url: null
}
```
**Comportamiento:**
- Banner clickeable
- Click → navigate(`/events/${event_id}`)
- Botón "Ver Evento"
- cursor: pointer

### 3. URL Externa (external)
```javascript
{
  link_type: 'external',
  link_url: 'https://ejemplo.com',
  event_id: null
}
```
**Comportamiento:**
- Banner clickeable
- Click → window.open(link_url, '_blank')
- Botón "Más Información"
- cursor: pointer
- Se abre en nueva pestaña

---

## 🧪 **Testing**

### Test 1: Crear Banner
```bash
1. Login como ADMIN
2. Ir a Admin Panel → Banners
3. Click [+ Crear Banner]
4. ✅ Modal se abre
5. Completar:
   - Título: "Iron Maiden 2026"
   - Descripción: "Run For Your Lives Tour"
   - Subir imagen (1920x600)
   - Tipo: Evento
   - Evento: Iron Maiden
   - Orden: 10
   - Activar: ON
6. Click [Crear]
7. ✅ Banner creado
8. ✅ Aparece en tabla
9. Ir a Home (/)
10. ✅ Banner visible en carousel
```

### Test 2: Editar Banner
```bash
1. Admin Panel → Banners
2. Click [✏️ Editar] en banner
3. ✅ Modal con datos actuales
4. Cambiar título a "Iron Maiden 2026 - AGOTADO"
5. Click [Actualizar]
6. ✅ Banner actualizado
7. Verificar en Home
8. ✅ Título actualizado en carousel
```

### Test 3: Activar/Desactivar
```bash
1. Admin Panel → Banners
2. Banner activo (✅ ON)
3. Ir a Home (/)
4. ✅ Banner visible en carousel
5. Volver a Admin Panel
6. Click en Switch → OFF
7. ✅ Switch cambia a ❌ OFF
8. Ir a Home (/)
9. ✅ Banner NO visible
10. Volver a activar
11. ✅ Banner visible nuevamente
```

### Test 4: Reordenar
```bash
1. Admin Panel → Banners
2. 3 banners en orden: A, B, C
3. Banner B en medio
4. Click [↑] en banner B
5. ✅ Orden cambia a: B, A, C
6. Ir a Home (/)
7. ✅ Carousel muestra en orden: B, A, C
8. Click [↓] en banner B
9. ✅ Vuelve a orden: A, B, C
```

### Test 5: Eliminar
```bash
1. Admin Panel → Banners
2. Click [🗑️ Eliminar] en banner
3. ✅ Popconfirm aparece
4. Click [No] → Cancelar
5. ✅ Banner NO eliminado
6. Click [🗑️ Eliminar] nuevamente
7. Click [Sí] → Confirmar
8. ✅ Banner eliminado
9. ✅ Desaparece de tabla
10. Ir a Home (/)
11. ✅ Banner NO visible en carousel
```

### Test 6: Tipo de Enlaces
```bash
# Tipo: Ninguno
1. Crear banner con link_type: none
2. Ir a Home (/)
3. ✅ Banner visible
4. Click en banner
5. ✅ No pasa nada (correcto)

# Tipo: Evento
1. Crear banner con link_type: event
2. Vincular a evento Iron Maiden
3. Ir a Home (/)
4. ✅ Banner visible con botón "Ver Evento"
5. Click en banner o botón
6. ✅ Navega a /events/123

# Tipo: Externa
1. Crear banner con link_type: external
2. URL: https://ticketmaster.com
3. Ir a Home (/)
4. ✅ Banner visible con botón "Más Información"
5. Click en banner o botón
6. ✅ Abre URL en nueva pestaña
```

---

## ✅ **Checklist de Funcionalidades**

### CRUD:
- [x] Crear banner con imagen
- [x] Listar todos los banners
- [x] Editar banner existente
- [x] Eliminar banner (con confirmación)

### Imágenes:
- [x] Subir imagen (upload)
- [x] Preview antes de guardar
- [x] Validación de formato
- [x] Reemplazar imagen en edición

### Enlaces:
- [x] Tipo: Ninguno
- [x] Tipo: Evento (con selector)
- [x] Tipo: Externa (con input URL)

### Gestión:
- [x] Activar/Desactivar con switch
- [x] Reordenar con botones ↑ ↓
- [x] Orden automático (display_order)

### UI/UX:
- [x] Tabla con preview de imágenes
- [x] Modal para crear/editar
- [x] Alertas informativas
- [x] Mensajes de confirmación
- [x] Loading states
- [x] Validaciones de formulario

### Seguridad:
- [x] Solo ADMIN puede acceder
- [x] Token JWT requerido
- [x] Validación backend
- [x] Validación frontend

---

## 🎉 **Resultado Final**

**PANEL DE ADMINISTRACIÓN 100% FUNCIONAL** 🚀

✅ **CRUD completo** - Crear, editar, eliminar banners  
✅ **Upload de imágenes** - Con preview y validación  
✅ **Gestión de enlaces** - Evento, externa, ninguno  
✅ **Activar/Desactivar** - Switch instantáneo  
✅ **Reordenar** - Botones ↑ ↓ intuitivos  
✅ **Interfaz profesional** - Tabla visual con actions  
✅ **Seguridad** - Solo ADMIN puede acceder  
✅ **Integración completa** - Backend ya implementado  

**Los administradores ahora pueden gestionar completamente los banners de la homepage!** 🎨✨

---

**Fecha:** 2025-11-06  
**Versión:** 10.0.0 - Admin Banners Management  
**Estado:** ✅ Completo y Funcional
