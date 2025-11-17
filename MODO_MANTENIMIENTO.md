# 🔒 Modo Mantenimiento con Contraseña

## Descripción

Se ha implementado un sistema de protección con contraseña que se muestra **antes de cargar cualquier parte de la aplicación**. Esto permite desplegar el sitio en producción sin que usuarios no autorizados puedan acceder.

## 🔑 Contraseña de Acceso

```
vibratickets2025
```

## ⚙️ Configuración

### Activar/Desactivar Modo Mantenimiento

Edita el archivo `.env`:

```bash
# Activado (requiere contraseña)
VITE_MAINTENANCE_MODE=true

# Desactivado (acceso libre)
VITE_MAINTENANCE_MODE=false
```

**IMPORTANTE:** Después de cambiar `.env`, debes **reiniciar el servidor de desarrollo** o **hacer rebuild** para que tome efecto.

```bash
# Desarrollo
pnpm run dev

# Producción
pnpm run build
```

## 📋 Flujo de Usuario

1. **Usuario entra al sitio**
   - Si `VITE_MAINTENANCE_MODE=true` → Pantalla de login de mantenimiento
   - Si `VITE_MAINTENANCE_MODE=false` → Acceso directo a la app

2. **Usuario ingresa contraseña correcta**
   - Se guarda en `localStorage`
   - Redirige automáticamente a la app
   - No vuelve a pedir contraseña (hasta que limpie localStorage)

3. **Usuario ingresa contraseña incorrecta**
   - Mensaje de error
   - Campo se limpia
   - Puede reintentar

## 🎨 Características del Componente

- ✅ **Diseño profesional** con gradientes y animaciones
- ✅ **Logo de VibraTicket** visible
- ✅ **Input de contraseña** (oculta los caracteres)
- ✅ **Mensajes claros** de lo que está pasando
- ✅ **Loading state** al procesar
- ✅ **Responsive** para mobile y desktop
- ✅ **Persistencia** en localStorage

## 🚀 Uso en Despliegue

### Opción 1: Con Modo Mantenimiento (Recomendado para staging)

```bash
# .env
VITE_MAINTENANCE_MODE=true
VITE_API_URL=https://vibratickets.online
```

```bash
pnpm run build
# Subir carpeta dist/ a tu servidor
```

**Resultado:** Los usuarios verán la pantalla de contraseña

### Opción 2: Sin Modo Mantenimiento (Para producción final)

```bash
# .env
VITE_MAINTENANCE_MODE=false
VITE_API_URL=https://vibratickets.online
```

```bash
pnpm run build
# Subir carpeta dist/ a tu servidor
```

**Resultado:** Los usuarios entran directamente a la app

## 🔐 Cambiar la Contraseña

Si quieres cambiar la contraseña, edita:

**Archivo:** `src/components/MaintenanceLogin.jsx`

```javascript
const MAINTENANCE_PASSWORD = 'vibratickets2025'; // ← Cambia aquí
```

Luego rebuild:

```bash
pnpm run build
```

## 🗑️ Limpiar Autenticación (Testing)

Si necesitas probar la pantalla de login nuevamente:

### Desde DevTools:
1. F12 → Console
2. Ejecuta: `localStorage.removeItem('maintenance_auth')`
3. Recarga la página (F5)

### Desde el navegador:
1. Borra los datos del sitio
2. Recarga la página

## 📁 Archivos Modificados

- `src/components/MaintenanceLogin.jsx` - Componente de login
- `src/App.jsx` - Lógica de verificación
- `.env` - Variable de configuración
- `MODO_MANTENIMIENTO.md` - Esta documentación

## ⚠️ Notas Importantes

1. **La contraseña está en el frontend**: Esto es solo una medida temporal para evitar acceso casual. No es seguridad real ya que cualquiera que inspeccione el código fuente puede ver la contraseña.

2. **Para seguridad real**: Si necesitas seguridad robusta, deberías implementar autenticación en el backend con JWT.

3. **localStorage persiste**: Una vez autenticado, el usuario no vuelve a ver la pantalla hasta que limpie localStorage o navegue en incógnito.

4. **Reiniciar servidor**: Siempre reinicia después de cambiar `.env`

## 🎯 Casos de Uso

### Staging/Pre-producción
```bash
VITE_MAINTENANCE_MODE=true
```
- Equipo interno puede acceder con contraseña
- Usuarios externos ven pantalla de "Sitio en Mantenimiento"
- Ideal para testing en producción

### Producción Final
```bash
VITE_MAINTENANCE_MODE=false
```
- Acceso público sin restricciones
- App completamente disponible
- Sin pantalla de contraseña

### Mantenimiento Real
```bash
VITE_MAINTENANCE_MODE=true
```
- Mientras haces actualizaciones
- Solo staff autorizado puede entrar
- Mensaje claro a usuarios finales

## ✅ Estado Actual

**Modo Mantenimiento:** `ACTIVADO` ✓
**Contraseña:** `vibratickets2025`
**Persistencia:** `localStorage`

---

**¡Listo para desplegar en staging!** 🚀
