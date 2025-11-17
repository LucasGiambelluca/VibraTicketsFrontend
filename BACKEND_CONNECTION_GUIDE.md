# 🔌 Guía de Conexión con el Backend

## 📊 Estado Actual

✅ **Frontend**: Funcionando correctamente en http://localhost:5173/
❌ **Backend**: No detectado en http://localhost:3000

## 🚀 Cómo Conectar el Backend

### Opción 1: Iniciar el Backend Manualmente

1. **Abrir nueva terminal** en el directorio del backend
2. **Ejecutar el servidor**:
   ```bash
   # Si es un proyecto Node.js
   npm start
   # o
   npm run dev
   # o
   node server.js
   ```

3. **Verificar que esté corriendo**:
   - Deberías ver un mensaje como: "Server running on port 3000"
   - Probar: http://localhost:3000/health

### Opción 2: Verificar si el Backend ya está Corriendo

```bash
# Verificar procesos en puerto 3000
netstat -ano | findstr :3000

# Probar conexión directa
curl http://localhost:3000/health
```

## 🔄 Reconexión Automática

El frontend está configurado para:
- ✅ **Detectar automáticamente** cuando el backend se conecte
- ✅ **Recargar datos** automáticamente al reconectarse
- ✅ **Mostrar notificaciones** de estado de conexión
- ✅ **Funcionar en modo demo** mientras no haya backend

## 🎯 Qué Esperar Cuando se Conecte

1. **Banner amarillo desaparecerá**
2. **Datos reales** reemplazarán los de ejemplo
3. **Consola mostrará**: "✅ Backend conectado correctamente"
4. **Todas las funciones** estarán disponibles

## 🧪 Probar la Conexión

Una vez que el backend esté corriendo:

1. **Ir a Admin Panel**: http://localhost:5173/admin
2. **Clic en "Estado del Sistema"**
3. **Verificar el componente HealthCheck**

## 📝 Endpoints que el Frontend Intentará Usar

Según la documentación, el backend debería tener:

- `GET /health` - Health check
- `GET /api/events` - Lista de eventos
- `GET /api/events/search` - Búsqueda de eventos
- `GET /api/shows/:id` - Detalles de shows
- `POST /api/queue/:showId/join` - Cola virtual
- Y muchos más...

## 🔧 Troubleshooting

### Si el backend no se conecta:

1. **Verificar puerto**: ¿Está corriendo en 3000?
2. **Verificar CORS**: ¿Permite http://localhost:5173?
3. **Verificar logs**: ¿Hay errores en el backend?
4. **Verificar variables de entorno**: ¿Están configuradas?

### Variables de entorno del backend que podrían ser necesarias:

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 🎉 ¡Todo Listo!

El frontend está completamente preparado para conectarse automáticamente cuando el backend esté disponible. Solo necesitas iniciar el servidor backend en el puerto 3000.

---

**Nota**: Mientras tanto, puedes probar todas las funcionalidades del frontend con los datos de ejemplo que se muestran automáticamente.
