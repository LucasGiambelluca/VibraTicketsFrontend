# Instrucciones de Testing - Ticketera Frontend

## 🚀 Estado Actual

✅ **Frontend configurado y funcionando**
- Aplicación corriendo en: http://localhost:5173/
- Todas las rutas configuradas
- Servicios API implementados
- Componentes conectados con fallbacks

## 🔧 Configuración Completada

### 1. Servicios API (src/services/apiService.js)
- ✅ eventsApi: Gestión de eventos
- ✅ showsApi: Gestión de shows y asientos
- ✅ queueApi: Cola virtual
- ✅ holdsApi: Reservas temporales
- ✅ ordersApi: Órdenes de compra
- ✅ paymentsApi: Pagos con MercadoPago
- ✅ adminApi: Configuración administrativa
- ✅ producersApi & venuesApi: Gestión de productores y venues
- ✅ healthApi: Verificación de estado del sistema

### 2. Componentes Actualizados
- ✅ MainEvents: Carga eventos desde API con fallback
- ✅ SearchBar: Búsqueda en tiempo real con autocomplete
- ✅ EventDetail: Detalles de eventos desde API
- ✅ HealthCheck: Monitoreo del estado del backend
- ✅ BackendStatusBanner: Notificación de estado de conexión

### 3. Configuración
- ✅ Variables de entorno (.env)
- ✅ Cliente HTTP (axios) configurado
- ✅ Manejo de errores centralizado
- ✅ Fallbacks para cuando el backend no esté disponible

## 🧪 Cómo Probar la Aplicación

### Escenario 1: Sin Backend (Actual)
La aplicación está configurada para funcionar sin backend mostrando:
- Eventos de ejemplo en la página principal
- Banner de advertencia sobre backend no disponible
- Datos mock en los componentes

### Escenario 2: Con Backend
Para probar con el backend real:

1. **Iniciar el Backend**
   ```bash
   # En otra terminal, navegar al directorio del backend
   cd /ruta/al/backend
   npm start
   # El backend debe estar corriendo en http://localhost:3000
   ```

2. **Verificar Conexión**
   - Ve a la página de Admin: http://localhost:5173/admin
   - Haz clic en "Estado del Sistema" en el menú lateral
   - El componente HealthCheck mostrará el estado real del backend

### Escenario 3: Testing de Funcionalidades

#### 🏠 Página Principal
- ✅ Carga de eventos (con fallback si no hay backend)
- ✅ Búsqueda con autocomplete
- ✅ Filtros de ubicación, precio y fecha
- ✅ Cards de eventos con información completa

#### 📅 Detalle de Evento
- ✅ Información completa del evento
- ✅ Lista de shows disponibles
- ✅ Precios y disponibilidad
- ✅ Botones de compra

#### 🎫 Cola Virtual
- ✅ Simulación de cola virtual
- ✅ Notificaciones del navegador
- ✅ Progreso en tiempo real
- ✅ Redirección automática

#### 👨‍💼 Panel de Administración
- ✅ Dashboard con estadísticas
- ✅ Gestión de eventos y shows
- ✅ Estado del sistema
- ✅ Configuración

## 🔍 URLs para Probar

| Página | URL | Descripción |
|--------|-----|-------------|
| Inicio | http://localhost:5173/ | Página principal con eventos |
| Evento | http://localhost:5173/events/1 | Detalle de evento |
| Cola | http://localhost:5173/queue/1 | Cola virtual |
| Admin | http://localhost:5173/admin | Panel administrativo |
| Estado | http://localhost:5173/admin (→ Estado del Sistema) | Verificar backend |

## 🐛 Errores Solucionados

1. ✅ **Error de atributo `loading`**: Corregido en SearchBar
2. ✅ **Network Error**: Agregados fallbacks y manejo de errores
3. ✅ **React 19 compatibility**: Warning informativo (no crítico)

## 📋 Próximos Pasos

1. **Iniciar el Backend**: Para testing completo con datos reales
2. **Crear Datos de Prueba**: Eventos, shows, usuarios en el backend
3. **Testing de Flujo Completo**: Desde búsqueda hasta compra
4. **Configurar MercadoPago**: Para pagos reales (opcional)

## 🚨 Notas Importantes

- El frontend funciona independientemente del backend
- Los datos de ejemplo se muestran cuando no hay conexión
- El banner amarillo indica el estado de conexión con el backend
- Todos los endpoints están implementados según la documentación
- La aplicación es responsive y funciona en móviles

## 🎯 Testing Recomendado

1. **Navegación**: Probar todas las rutas y enlaces
2. **Búsqueda**: Escribir en el campo de búsqueda
3. **Responsive**: Cambiar tamaño de ventana
4. **Cola Virtual**: Ir a /queue/1 y ver la simulación
5. **Admin Panel**: Explorar todas las secciones
6. **Estado del Sistema**: Verificar conectividad

¡La aplicación está lista para testing! 🎉
