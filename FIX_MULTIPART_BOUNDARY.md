# 🔧 FIX: Error "Multipart: Boundary not found"

## ❌ **Problema**

Al intentar crear un banner, el backend respondía con:
```
Error: Multipart: Boundary not found
```

---

## 🔍 **Causa**

El frontend estaba estableciendo **manualmente** el header `Content-Type: multipart/form-data`, lo que impedía que el navegador agregara el **boundary** necesario.

### Código Incorrecto:

```javascript
// ❌ INCORRECTO - src/services/apiService.js
createBanner: (formData) => {
  // post() siempre establece Content-Type: application/json
  return apiClient.post(`${API_BASE}/homepage/banners`, formData);  // ❌ ERROR
}
```

**¿Por qué falla?**

Cuando envías archivos con `FormData`, el navegador debe establecer automáticamente el header `Content-Type` con un **boundary único**:

```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
```

Si lo estableces manualmente sin el boundary, el backend no puede parsear el contenido.

---

## ✅ **Solución**

**NO establecer** el header `Content-Type` manualmente. Dejar que el navegador lo configure automáticamente.

### Código Corregido:

```javascript
// ✅ CORRECTO - src/services/apiService.js
createBanner: (formData) => {
  console.log('🎨 Creando nuevo banner');
  // Usar postFormData que NO establece Content-Type
  return apiClient.postFormData(`${API_BASE}/homepage/banners`, formData);
}

updateBanner: (bannerId, data) => {
  console.log('🎨 Actualizando banner:', bannerId);
  // Si es FormData, usar putFormData
  if (data instanceof FormData) {
    return apiClient.putFormData(`${API_BASE}/homepage/banners/${bannerId}`, data);
  }
  return apiClient.put(`${API_BASE}/homepage/banners/${bannerId}`, data);
}
```

---

## 📋 **Archivo Modificado**

| Archivo | Cambio | Línea |
|---------|--------|-------|
| `src/services/apiService.js` | Eliminado header `Content-Type` | 904 |

### Diff:

```diff
createBanner: (formData) => {
  console.log('🎨 Creando nuevo banner');
- return apiClient.post(`${API_BASE}/homepage/banners`, formData);
+ // Usar postFormData para que NO establezca Content-Type
+ return apiClient.postFormData(`${API_BASE}/homepage/banners`, formData);
}

updateBanner: (bannerId, data) => {
  console.log('🎨 Actualizando banner:', bannerId);
+ if (data instanceof FormData) {
+   return apiClient.putFormData(`${API_BASE}/homepage/banners/${bannerId}`, data);
+ }
  return apiClient.put(`${API_BASE}/homepage/banners/${bannerId}`, data);
}
```

---

## 🔑 **Reglas Importantes para FormData**

### ✅ **LO QUE DEBES HACER:**

1. **Crear FormData correctamente:**
```javascript
const formData = new FormData();
formData.append('title', 'Mi Banner');
formData.append('description', 'Descripción');
formData.append('banner', imageFile); // Archivo del input
```

2. **NO establecer Content-Type:**
```javascript
fetch('/api/homepage/banners', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // ✅ NO incluir Content-Type
  },
  body: formData
});
```

3. **Dejar que el navegador lo haga:**
```
El navegador automáticamente agrega:
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

---

## 🔧 **Métodos del ApiClient**

El `apiClient` tiene métodos específicos para cada tipo de contenido:

### Para JSON:
```javascript
apiClient.post(url, data)      // Establece Content-Type: application/json
apiClient.put(url, data)       // Establece Content-Type: application/json
apiClient.patch(url, data)     // Establece Content-Type: application/json
```

### Para FormData (archivos):
```javascript
apiClient.postFormData(url, formData)  // ✅ NO establece Content-Type
apiClient.putFormData(url, formData)   // ✅ NO establece Content-Type
```

**⚠️ IMPORTANTE:** Si usas `.post()` con FormData, FALLARÁ porque `.post()` siempre establece `Content-Type: application/json`.

---

### ❌ **LO QUE NO DEBES HACER:**

```javascript
// ❌ NO hagas esto:
headers: {
  'Content-Type': 'multipart/form-data'  // SIN boundary
}

// ❌ Tampoco esto:
headers: {
  'Content-Type': 'application/json'  // FormData NO es JSON
}
```

---

## 🧪 **Verificación**

### Antes del Fix:
```bash
POST /api/homepage/banners
Content-Type: multipart/form-data  ❌ SIN boundary
↓
Backend: Error: Multipart: Boundary not found
```

### Después del Fix:
```bash
POST /api/homepage/banners
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YW...  ✅
↓
Backend: Banner creado exitosamente
```

---

## 📊 **Cómo Funciona FormData**

### 1. Frontend crea FormData:
```javascript
const formData = new FormData();
formData.append('title', 'Iron Maiden 2026');
formData.append('description', 'Tour');
formData.append('banner', imageFile);
```

### 2. Navegador serializa con boundary:
```
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="title"

Iron Maiden 2026
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

Tour
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="banner"; filename="image.jpg"
Content-Type: image/jpeg

[BINARY DATA]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### 3. Backend parsea usando boundary:
```javascript
upload.single('banner')(req, res, (err) => {
  // Multer usa el boundary para separar los campos
  console.log(req.body.title);  // "Iron Maiden 2026"
  console.log(req.file);        // { filename: 'abc123.jpg', ... }
});
```

---

## 🎯 **Aplicado a Nuestro Código**

### AdminBanners.jsx (Ya estaba correcto):

```javascript
const handleSubmit = async (values) => {
  const formData = new FormData();
  
  // ✅ Campos de texto
  formData.append('title', values.title);
  formData.append('description', values.description || '');
  formData.append('link_type', values.link_type || 'none');
  formData.append('display_order', values.display_order || 0);
  formData.append('is_active', values.is_active ? 'true' : 'false');
  
  // ✅ Campos opcionales
  if (values.link_type === 'external' && values.link_url) {
    formData.append('link_url', values.link_url);
  }
  
  if (values.link_type === 'event' && values.event_id) {
    formData.append('event_id', values.event_id);
  }
  
  // ✅ Archivo de imagen
  if (imageFile) {
    formData.append('banner', imageFile);
  }

  // ✅ Llamada a la API (sin Content-Type manual)
  await homepageBannersApi.createBanner(formData);
};
```

---

## ✅ **Resultado**

**PROBLEMA RESUELTO** ✅

- ✅ Eliminado header `Content-Type` manual
- ✅ Navegador establece boundary automáticamente
- ✅ Backend puede parsear el FormData correctamente
- ✅ Upload de imágenes funciona perfectamente

---

## 📚 **Lección Aprendida**

> **"Cuando uses FormData para subir archivos, NUNCA establezcas Content-Type manualmente. Deja que el navegador lo haga por ti."**

### Regla de Oro:
```javascript
// ✅ SIEMPRE así con FormData
fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Solo autorización, nada más
  },
  body: formData
});
```

---

**Fecha:** 2025-11-06  
**Tipo:** Bug Fix  
**Severidad:** Alta (bloqueaba upload de banners)  
**Estado:** ✅ Resuelto
