# 🎯 Banners Adaptados a la Guía Oficial del Backend

## ✅ ADAPTACIONES COMPLETADAS

Se adaptaron todos los componentes de banners para seguir exactamente la guía oficial del backend.

---

## 🔄 **Cambios Principales**

### 1. **Estructura de Response**

**ANTES (❌ Incorrecto):**
```javascript
const response = await homepageBannersApi.getActiveBanners();
setBanners(response.data.banners);  // ❌ data.banners
```

**DESPUÉS (✅ Correcto según guía):**
```javascript
const response = await homepageBannersApi.getActiveBanners();
setBanners(response.banners);  // ✅ banners directamente
```

---

### 2. **URLs de Imágenes**

**Problema:**
- Backend retorna: `/uploads/banners/abc123.jpg` (ruta relativa)
- Frontend necesita: `http://localhost:3000/uploads/banners/abc123.jpg` (URL completa)

**Solución:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'fallback-url';
  if (imageUrl.startsWith('http')) return imageUrl;  // Ya es completa
  return `${API_BASE_URL}${imageUrl}`;  // Agregar base
};
```

---

### 3. **FormData con Strings**

**ANTES (❌ Posible error):**
```javascript
formData.append('event_id', values.event_id);  // Puede ser número
formData.append('display_order', values.display_order);  // Puede ser número
```

**DESPUÉS (✅ Correcto):**
```javascript
formData.append('event_id', String(values.event_id));  // Siempre string
formData.append('display_order', String(values.display_order || 0));
formData.append('is_active', values.is_active ? 'true' : 'false');  // String booleano
```

---

## 📁 **Archivos Modificados**

### 1. `HomeBannerCarousel.jsx`

**Cambios:**
- ✅ Agregado `API_BASE_URL` constante
- ✅ `response.banners` en lugar de `response.data.banners`
- ✅ Función `getImageUrl()` para URLs completas
- ✅ Uso de `getImageUrl(banner.image_url)` en backgroundImage

**Código relevante:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};

// Uso
backgroundImage: `linear-gradient(...), url(${getImageUrl(banner.image_url)})`
```

---

### 2. `AdminBanners.jsx`

**Cambios:**
- ✅ Agregado `API_BASE_URL` constante
- ✅ `response.all` en lugar de `response.data.all`
- ✅ `response.events` en lugar de `response.data.events`
- ✅ Función `getImageUrl()` para URLs completas
- ✅ Uso en preview de tabla: `src={getImageUrl(url)}`
- ✅ Uso en edición: `setPreviewImage(getImageUrl(banner.image_url))`
- ✅ FormData con strings: `String(values.event_id)`

**Código relevante:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};

// En tabla
<Image src={getImageUrl(url)} ... />

// En FormData
formData.append('event_id', String(values.event_id));
formData.append('display_order', String(values.display_order || 0));
formData.append('is_active', values.is_active ? 'true' : 'false');
```

---

## 🎯 **Endpoints según Guía Oficial**

### GET /api/homepage/banners (Público)
**Response:**
```json
{
  "banners": [
    {
      "id": 1,
      "title": "Iron Maiden 2026",
      "description": "Run For Your Lives Tour",
      "image_url": "/uploads/banners/abc123.jpg",
      "link_type": "event",
      "event_id": 1,
      "link_url": null,
      "display_order": 10
    }
  ],
  "count": 1
}
```

**Frontend:**
```javascript
const response = await homepageBannersApi.getActiveBanners();
const banners = response.banners;  // ✅ Acceso directo
```

---

### GET /api/homepage/banners/all (Admin)
**Response:**
```json
{
  "all": [...],
  "active": [...],
  "inactive": [...],
  "counts": {
    "total": 3,
    "active": 2,
    "inactive": 1
  }
}
```

**Frontend:**
```javascript
const response = await homepageBannersApi.getAllBanners();
const banners = response.all;  // ✅ Acceso directo
```

---

### POST /api/homepage/banners (Admin)
**Request:**
```javascript
const formData = new FormData();
formData.append('title', 'Iron Maiden 2026');           // REQUERIDO
formData.append('banner', imageFile);                   // REQUERIDO
formData.append('description', 'Tour 2026');
formData.append('link_type', 'event');                  // 'event' | 'external' | 'none'
formData.append('event_id', '1');                       // Si link_type = 'event'
formData.append('link_url', 'https://...');             // Si link_type = 'external'
formData.append('is_active', 'true');                   // 'true' | 'false' (string)
formData.append('display_order', '10');                 // String de número

// NO incluir Content-Type, usar postFormData()
await homepageBannersApi.createBanner(formData);
```

---

### PUT /api/homepage/banners/:id (Admin)

**Sin cambiar imagen (JSON):**
```javascript
await fetch(`/api/homepage/banners/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Nuevo título',
    description: 'Nueva descripción',
    display_order: 20
  })
});
```

**Con nueva imagen (FormData):**
```javascript
const formData = new FormData();
formData.append('title', 'Título actualizado');
formData.append('banner', newImageFile);

await homepageBannersApi.updateBanner(id, formData);
```

---

### PATCH /api/homepage/banners/:id/toggle (Admin)
**Response:**
```json
{
  "message": "Banner activado/desactivado",
  "bannerId": 1,
  "isActive": true
}
```

**Frontend:**
```javascript
await homepageBannersApi.toggleBanner(bannerId);
// Recargar banners
loadBanners();
```

---

### PUT /api/homepage/banners/reorder (Admin)
**Request:**
```json
{
  "banners": [
    { "id": 1, "display_order": 30 },
    { "id": 2, "display_order": 10 },
    { "id": 3, "display_order": 20 }
  ]
}
```

**Frontend:**
```javascript
const reorderData = banners.map((banner, index) => ({
  id: banner.id,
  display_order: index * 10
}));

await homepageBannersApi.reorderBanners(reorderData);
```

---

### DELETE /api/homepage/banners/:id (Admin)
**Frontend:**
```javascript
await homepageBannersApi.deleteBanner(bannerId);
loadBanners();
```

---

## 🔑 **Puntos Clave de la Guía**

### 1. **link_type determina el comportamiento**
- `'event'` → Requiere `event_id`
- `'external'` → Requiere `link_url`
- `'none'` → Solo visual, no clickeable

### 2. **FormData para imágenes**
- ✅ NO incluir `Content-Type` en headers
- ✅ El navegador lo configura automáticamente con boundary
- ✅ Usar `apiClient.postFormData()` no `.post()`

### 3. **Orden de visualización**
- Menor `display_order` = aparece primero
- Usar múltiplos de 10: 10, 20, 30...
- Permite insertar entre medio: 15, 25...

### 4. **URLs de imagen**
- Backend retorna: `/uploads/banners/abc.jpg`
- Frontend debe agregar: `http://localhost:3000/uploads/banners/abc.jpg`
- Función helper: `getImageUrl()` maneja automáticamente

---

## 🧪 **Testing de Integración**

### Test 1: Crear Banner
```bash
1. Admin Panel → Banners
2. Click [+ Crear Banner]
3. Completar:
   - Título: "Iron Maiden 2026"
   - Descripción: "Run For Your Lives Tour"
   - Subir imagen
   - Tipo: Evento
   - Evento: Iron Maiden
   - Orden: 10
   - Activar: ON
4. Click [Crear]
5. ✅ Verificar en console:
   - POST /api/homepage/banners
   - FormData con 'true'/'false' strings
   - Response con banner creado
6. ✅ Ir a Home (/)
7. ✅ Ver banner en carousel con imagen correcta
```

### Test 2: URLs de Imagen
```bash
1. Verificar en Network tab (F12)
2. ✅ Request a: http://localhost:3000/uploads/banners/xxx.jpg
3. ✅ Status 200 OK
4. ✅ Imagen se muestra correctamente
5. ✅ No hay errores 404 de imagen
```

### Test 3: Response Structure
```bash
1. Abrir Console (F12)
2. Ir a Home (/)
3. ✅ Ver log: "📸 Banners obtenidos:"
4. ✅ Verificar: { banners: [...], count: X }
5. Admin Panel → Banners
6. ✅ Ver log: "📸 Todos los banners:"
7. ✅ Verificar: { all: [...], active: [...], counts: {...} }
```

### Test 4: FormData Strings
```bash
1. Admin Panel → Crear Banner
2. Abrir Network tab
3. Click [Crear]
4. Ver request POST /api/homepage/banners
5. ✅ Payload → Form Data:
   - event_id: "1" (string)
   - display_order: "10" (string)
   - is_active: "true" (string)
6. ✅ Sin errores de tipo de dato
```

---

## ✅ **Checklist de Adaptación**

### HomeBannerCarousel.jsx:
- [x] Constante API_BASE_URL
- [x] response.banners (no response.data.banners)
- [x] Función getImageUrl()
- [x] URLs completas en backgroundImage
- [x] Fallback a imagen por defecto

### AdminBanners.jsx:
- [x] Constante API_BASE_URL
- [x] response.all (no response.data.all)
- [x] response.events (no response.data.events)
- [x] Función getImageUrl()
- [x] URLs completas en tabla
- [x] URLs completas en preview de edición
- [x] FormData con String(values.event_id)
- [x] FormData con String(values.display_order)
- [x] FormData con 'true'/'false' strings

### apiService.js:
- [x] getActiveBanners() usa .get()
- [x] getAllBanners() usa .get()
- [x] createBanner() usa .postFormData()
- [x] updateBanner() detecta FormData y usa .putFormData()
- [x] toggleBanner() usa .patch()
- [x] reorderBanners() usa .put() con JSON
- [x] deleteBanner() usa .delete()

---

## 🎉 **Resultado Final**

**INTEGRACIÓN 100% COMPATIBLE CON BACKEND** ✅

✅ **Response structures** - Según guía oficial  
✅ **URLs de imágenes** - Completas con base URL  
✅ **FormData strings** - Todos los campos como string  
✅ **Métodos correctos** - postFormData/putFormData  
✅ **Endpoints** - Todos implementados  
✅ **Tipos de link** - event/external/none  
✅ **Orden** - display_order con múltiplos de 10  

**Los banners ahora funcionan exactamente según la especificación del backend!** 🚀

---

**Fecha:** 2025-11-06  
**Versión:** 11.0.0 - Banners Adaptados a Guía Oficial  
**Estado:** ✅ 100% Compatible
