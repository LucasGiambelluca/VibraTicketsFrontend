# 🐛 DEBUG: Error en Endpoint de Órdenes Pendientes

## Fecha: 2025-11-26
## Prioridad: 🔴 Alta

---

## ❌ Error Observado

### Frontend:
- Endpoint: `GET /api/manage/orders/pending`
- Error: 500 Internal Server Error
- Mensaje en consola: "Cannot read properties of null"

### Captura de Pantalla:
Ver imagen adjunta mostrando:
- Panel de órdenes vacío
- Errores en consola del navegador
- Error 500 del backend

---

## 🔍 Análisis del Problema

### Error en Backend:

El error "Cannot read properties of null" sugiere que el backend está intentando acceder a propiedades de objetos que son `null` o `undefined`.

**Posibles causas:**

1. **Relaciones de Base de Datos:**
   ```javascript
   // ❌ Problema: User es null
   order.User.email  // Error: Cannot read properties of null (reading 'email')
   ```

2. **Joins Faltantes:**
   ```javascript
   // ❌ Sin include de User
   const orders = await Order.findAll({
     where: { status: 'PENDING' }
   });
   
   // Luego intenta acceder a order.User.email → Error
   ```

3. **Datos Inconsistentes:**
   - Órdenes sin usuario asociado (userId null)
   - Órdenes sin items (OrderItems vacío)

---

## ✅ Solución Propuesta

### Endpoint: `GET /api/manage/orders/pending`

```javascript
// routes/manage.js o similar
router.get('/manage/orders/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📥 Obteniendo órdenes pendientes...');
    
    // ⭐ IMPORTANTE: Incluir relaciones necesarias
    const orders = await Order.findAll({
      where: { status: 'PENDING' },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'name'],
          required: false  // ⭐ LEFT JOIN para no excluir órdenes sin usuario
        },
        {
          model: OrderItem,
          required: false,  // ⭐ LEFT JOIN para no excluir órdenes sin items
          include: [
            {
              model: Ticket,
              required: false
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log(`✅ Encontradas ${orders.length} órdenes pendientes`);
    
    // Mapear a formato esperado por el frontend
    const ordersData = orders.map(order => {
      // ⭐ Validar que User existe antes de acceder a sus propiedades
      const userEmail = order.User?.email || 'Sin usuario';
      
      // ⭐ Contar items de forma segura
      const itemCount = order.OrderItems?.length || 0;
      
      return {
        orderId: order.id,
        status: order.status,
        total_cents: order.totalCents || order.total_cents || 0,
        created_at: order.createdAt || order.created_at,
        userEmail: userEmail,
        itemCount: itemCount
      };
    });
    
    console.log('📦 Datos mapeados:', ordersData.length);
    
    // Devolver array directamente
    res.json(ordersData);
    
  } catch (error) {
    console.error('❌ Error obteniendo órdenes pendientes:', error);
    console.error('❌ Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Error al obtener órdenes pendientes',
      message: error.message,
      // Solo en desarrollo:
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
```

---

## 🔧 Validaciones Importantes

### 1. Verificar que User existe:

```javascript
// ❌ MAL - Puede causar error
const userEmail = order.User.email;

// ✅ BIEN - Validación con optional chaining
const userEmail = order.User?.email || 'Sin usuario';
```

### 2. Verificar que OrderItems existe:

```javascript
// ❌ MAL - Puede causar error
const itemCount = order.OrderItems.length;

// ✅ BIEN - Validación
const itemCount = order.OrderItems?.length || 0;
```

### 3. Usar LEFT JOIN en lugar de INNER JOIN:

```javascript
// ✅ BIEN - No excluye órdenes sin usuario
include: [
  {
    model: User,
    required: false  // LEFT JOIN
  }
]

// ❌ MAL - Excluye órdenes sin usuario
include: [
  {
    model: User,
    required: true  // INNER JOIN
  }
]
```

---

## 🧪 Testing del Endpoint

### Test 1: Verificar que el endpoint existe

```bash
curl -X GET http://localhost:3000/api/manage/orders/pending \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Respuesta esperada:**
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

### Test 2: Verificar con órdenes sin usuario

```sql
-- Crear orden de prueba sin usuario
INSERT INTO Orders (status, totalCents, userId, createdAt, updatedAt)
VALUES ('PENDING', 10000, NULL, NOW(), NOW());
```

El endpoint debe devolver esta orden con `userEmail: "Sin usuario"`.

### Test 3: Verificar con órdenes sin items

```sql
-- Crear orden sin items
INSERT INTO Orders (status, totalCents, userId, createdAt, updatedAt)
VALUES ('PENDING', 10000, 1, NOW(), NOW());
-- No insertar OrderItems
```

El endpoint debe devolver esta orden con `itemCount: 0`.

---

## 📊 Estructura de Datos

### Base de Datos:

```
Orders
├── id (PK)
├── status ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED')
├── totalCents (integer)
├── userId (FK → Users.id, nullable)
├── createdAt (timestamp)
└── updatedAt (timestamp)

OrderItems
├── id (PK)
├── orderId (FK → Orders.id)
├── ticketId (FK → Tickets.id)
├── quantity (integer)
└── priceCents (integer)

Users
├── id (PK)
├── email (string)
└── name (string)
```

### Respuesta del Endpoint:

```typescript
interface OrderResponse {
  orderId: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  total_cents: number;
  created_at: string;  // ISO 8601 format
  userEmail: string;
  itemCount: number;
}
```

---

## 🔍 Debugging en Backend

### Agregar logs detallados:

```javascript
router.get('/manage/orders/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📥 Usuario solicitante:', req.user);
    console.log('📥 Es admin?', req.user.role === 'ADMIN');
    
    const orders = await Order.findAll({
      where: { status: 'PENDING' },
      include: [
        {
          model: User,
          required: false
        },
        {
          model: OrderItem,
          required: false
        }
      ]
    });
    
    console.log('📦 Órdenes encontradas:', orders.length);
    
    // Log de cada orden para ver cuál causa el error
    orders.forEach((order, index) => {
      console.log(`📋 Orden ${index + 1}:`, {
        id: order.id,
        hasUser: !!order.User,
        userEmail: order.User?.email,
        hasItems: !!order.OrderItems,
        itemCount: order.OrderItems?.length
      });
    });
    
    // ... resto del código
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🚨 Errores Comunes

### Error 1: "User is not associated to Order"

**Causa:** Falta definir la relación en los modelos

**Solución:**
```javascript
// models/Order.js
Order.belongsTo(User, { foreignKey: 'userId' });

// models/User.js
User.hasMany(Order, { foreignKey: 'userId' });
```

### Error 2: "Cannot read properties of null (reading 'email')"

**Causa:** Orden sin usuario asociado

**Solución:**
```javascript
const userEmail = order.User?.email || 'Sin usuario';
```

### Error 3: "Cannot read properties of undefined (reading 'length')"

**Causa:** OrderItems es undefined

**Solución:**
```javascript
const itemCount = order.OrderItems?.length || 0;
```

---

## ✅ Checklist de Verificación

### Backend:
- [ ] Endpoint `/api/manage/orders/pending` existe
- [ ] Middleware `authenticateToken` funciona
- [ ] Middleware `requireAdmin` funciona
- [ ] Include de User con `required: false`
- [ ] Include de OrderItem con `required: false`
- [ ] Validación de `order.User?.email`
- [ ] Validación de `order.OrderItems?.length`
- [ ] Logs de debugging agregados
- [ ] Manejo de errores con try-catch
- [ ] Respuesta en formato correcto

### Frontend:
- [ ] Endpoint configurado en `apiService.js`
- [ ] Token JWT se envía en headers
- [ ] Manejo de errores mejorado
- [ ] Logs de debugging agregados

---

## 📝 Próximos Pasos

1. **Backend Team:**
   - Implementar las validaciones propuestas
   - Agregar logs de debugging
   - Probar con órdenes sin usuario
   - Probar con órdenes sin items
   - Verificar que devuelve array vacío si no hay órdenes

2. **Testing:**
   - Probar endpoint con Postman
   - Verificar logs en consola del backend
   - Verificar respuesta en formato correcto

3. **Deploy:**
   - Hacer commit de los cambios
   - Deploy a desarrollo
   - Verificar en frontend
   - Deploy a producción

---

## 📞 Contacto

Si el error persiste después de implementar estas soluciones, proporcionar:

1. **Logs completos del backend** cuando se hace la request
2. **Estructura de la tabla Orders** (`DESCRIBE Orders;`)
3. **Estructura de la tabla OrderItems** (`DESCRIBE OrderItems;`)
4. **Query SQL generada** por Sequelize (activar logging)
5. **Stack trace completo** del error

---

**Estado:** ⏳ Esperando implementación del backend  
**Prioridad:** 🔴 Alta - Bloquea funcionalidad de administración  
**Tiempo estimado:** 15-30 minutos
