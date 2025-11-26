# 🚨 URGENTE: Endpoints de Gestión de Órdenes No Encontrados (404)

## Fecha: 2025-11-26
## Prioridad: 🔴 CRÍTICA

---

## ❌ Problema

El frontend está intentando acceder a los endpoints de gestión de órdenes pero está recibiendo **404 Not Found**.

### Endpoints que faltan:

```
❌ GET  /api/manage/orders/pending         → 404 Not Found
❌ GET  /api/manage/orders/:orderId/status → No probado aún
❌ POST /api/manage/orders/:orderId/cancel → No probado aún
```

### Error en Frontend:

```
Failed to read resources: the server responded with a status of 404 (Not Found)
GET http://localhost:3000/api/manage/orders/pending
```

---

## 🔍 Verificaciones Necesarias

### 1. Verificar que los endpoints existen en el código

```bash
# En el directorio del backend:
grep -r "manage/orders" .
grep -r "/manage/orders/pending" .
```

**Resultado esperado:**
```javascript
// Debería encontrar algo como:
router.get('/manage/orders/pending', authenticateToken, requireAdmin, async (req, res) => {
  // ...
});
```

### 2. Verificar la estructura de rutas

**Opción A: Prefijo global `/api`**
```javascript
// server.js o app.js
app.use('/api', routes);

// routes/manage.js
router.get('/manage/orders/pending', ...);
// Resultado: /api/manage/orders/pending ✅
```

**Opción B: Sin prefijo global**
```javascript
// server.js o app.js
app.use('/', routes);

// routes/manage.js
router.get('/api/manage/orders/pending', ...);
// Resultado: /api/manage/orders/pending ✅
```

**Opción C: Prefijo específico**
```javascript
// server.js o app.js
app.use('/manage', manageRoutes);

// routes/manage.js
router.get('/orders/pending', ...);
// Resultado: /manage/orders/pending ⚠️
```

### 3. Verificar que el archivo de rutas está importado

```javascript
// server.js o app.js
const manageRoutes = require('./routes/manage');
app.use('/api', manageRoutes);  // ¿Está esta línea?
```

### 4. Probar el endpoint manualmente

```bash
# Opción 1: Con /api
curl -X GET http://localhost:3000/api/manage/orders/pending \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json"

# Opción 2: Sin /api
curl -X GET http://localhost:3000/manage/orders/pending \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (200 OK):**
```json
[
  {
    "orderId": 123,
    "status": "PENDING",
    "total_cents": 20000,
    "created_at": "2025-11-26T18:30:00.000Z",
    "userEmail": "user@example.com",
    "itemCount": 2
  }
]
```

---

## 📋 Checklist de Implementación

### Backend debe tener:

- [ ] Archivo `routes/manage.js` (o similar) creado
- [ ] Endpoints implementados:
  - [ ] `GET /manage/orders/pending`
  - [ ] `GET /manage/orders/:orderId/status`
  - [ ] `POST /manage/orders/:orderId/cancel`
- [ ] Middlewares de autenticación:
  - [ ] `authenticateToken` - Verifica JWT
  - [ ] `requireAdmin` - Verifica rol ADMIN
- [ ] Rutas registradas en `server.js` o `app.js`
- [ ] Modelos de base de datos:
  - [ ] `Order` con relación a `User`
  - [ ] `OrderItem` con relación a `Order`
- [ ] Validaciones implementadas:
  - [ ] Validar que User existe antes de acceder a `.email`
  - [ ] Validar que OrderItems existe antes de acceder a `.length`
  - [ ] Usar `required: false` en includes

---

## 🔧 Código de Referencia

### Estructura Mínima del Endpoint

```javascript
// routes/manage.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Order, User, OrderItem } = require('../models');

// GET /manage/orders/pending
router.get('/manage/orders/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📥 Obteniendo órdenes pendientes...');
    console.log('👤 Usuario:', req.user);
    
    const orders = await Order.findAll({
      where: { status: 'PENDING' },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'name'],
          required: false  // LEFT JOIN
        },
        {
          model: OrderItem,
          required: false  // LEFT JOIN
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ Encontradas ${orders.length} órdenes`);
    
    const ordersData = orders.map(order => ({
      orderId: order.id,
      status: order.status,
      total_cents: order.totalCents || 0,
      created_at: order.createdAt,
      userEmail: order.User?.email || 'Sin usuario',
      itemCount: order.OrderItems?.length || 0
    }));
    
    res.json(ordersData);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Error al obtener órdenes',
      message: error.message 
    });
  }
});

// GET /manage/orders/:orderId/status
router.get('/manage/orders/:orderId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        error: 'OrderNotFound',
        message: 'La orden no fue encontrada.'
      });
    }
    
    res.json({
      id: order.id,
      status: order.status,
      total_cents: order.totalCents,
      created_at: order.createdAt,
      paid_at: order.paidAt
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /manage/orders/:orderId/cancel
router.post('/manage/orders/:orderId/cancel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem }]
    });
    
    if (!order) {
      return res.status(404).json({
        error: 'OrderNotFound',
        message: 'La orden no fue encontrada.'
      });
    }
    
    if (order.status !== 'PENDING') {
      return res.status(409).json({
        error: 'OrderNotPending',
        message: `La orden no se puede cancelar porque su estado es '${order.status}'. Solo se pueden cancelar órdenes PENDING.`
      });
    }
    
    // Cancelar orden
    await order.update({ status: 'CANCELLED' });
    
    // Liberar asientos (implementar según tu lógica)
    const seatsFreed = order.OrderItems?.length || 0;
    
    res.json({
      success: true,
      message: `La orden ${orderId} ha sido cancelada y se liberaron ${seatsFreed} asientos.`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Registrar las Rutas

```javascript
// server.js o app.js
const manageRoutes = require('./routes/manage');

// Si usas prefijo /api global:
app.use('/api', manageRoutes);

// O sin prefijo:
app.use('/', manageRoutes);
```

---

## 🧪 Testing

### 1. Verificar que el servidor está corriendo

```bash
curl http://localhost:3000/api/health
# Debería devolver 200 OK
```

### 2. Verificar autenticación

```bash
# Obtener token de admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Respuesta:
# { "token": "eyJhbGc...", "user": {...} }
```

### 3. Probar endpoint de órdenes

```bash
curl -X GET http://localhost:3000/api/manage/orders/pending \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

---

## 📊 Logs Esperados

### Backend debe mostrar:

```
📥 Obteniendo órdenes pendientes...
👤 Usuario: { id: 1, email: 'admin@example.com', role: 'ADMIN' }
✅ Encontradas 5 órdenes
```

### Frontend debe mostrar:

```
🔍 Cargando órdenes pendientes...
🔍 URL Base: http://localhost:3000
🔍 Token presente: true
📦 Respuesta del backend (tipo): object
📦 Es array?: true
✅ Respuesta es array directo
✅ Órdenes procesadas: 5
```

---

## 🚨 Errores Comunes

### Error 1: "Cannot GET /api/manage/orders/pending"

**Causa:** Ruta no registrada

**Solución:**
```javascript
// Verificar que está en server.js:
app.use('/api', manageRoutes);
```

### Error 2: "authenticateToken is not defined"

**Causa:** Middleware no importado

**Solución:**
```javascript
const { authenticateToken, requireAdmin } = require('../middleware/auth');
```

### Error 3: "Order is not defined"

**Causa:** Modelo no importado

**Solución:**
```javascript
const { Order, User, OrderItem } = require('../models');
```

---

## 📞 Próximos Pasos

1. **Backend Team:**
   - Verificar que los endpoints existen
   - Implementar si no existen (usar código de referencia)
   - Probar con curl/Postman
   - Compartir logs del servidor

2. **Frontend Team:**
   - Esperar confirmación del backend
   - Probar cuando esté listo
   - Verificar logs en consola

---

**Estado:** ⏳ Esperando implementación del backend  
**Bloqueante:** 🔴 Sí - No se puede usar la funcionalidad  
**Tiempo estimado:** 30-60 minutos de implementación
