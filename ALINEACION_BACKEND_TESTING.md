# ✅ Alineación del Frontend con Backend - Testing de Pagos

## 📋 Resumen

El frontend ahora está **100% alineado** con los endpoints de testing implementados en el backend.

---

## 🔄 Cambios Realizados

### ❌ ANTES (Endpoints Incorrectos):
```javascript
// Frontend usaba endpoints que NO existen en el backend
POST /api/payments/complete-order/:orderId
POST /api/payments/simulate-webhook
```

### ✅ AHORA (Endpoints Correctos):
```javascript
// Frontend usa el endpoint REAL del backend
POST /api/test-payments/simulate-payment
Body: { orderId, customerEmail, customerName }
```

---

## 📁 Archivos Modificados

### 1. **src/services/apiService.js**

#### Nuevo Método Principal:
```javascript
paymentsApi.simulatePayment(paymentData)
```

**Parámetros:**
```javascript
{
  orderId: 123,
  customerEmail: "usuario@example.com",
  customerName: "Usuario Test"
}
```

**Endpoint:** `POST /api/test-payments/simulate-payment`

**Respuesta del Backend:**
```javascript
{
  success: true,
  message: "Pago simulado correctamente",
  data: {
    order: {
      id: 123,
      status: "PAID",
      paid_at: "2025-11-07T15:30:00.000Z",
      mp_payment_id: "TEST_1699369200000_abc123"
    },
    tickets: [
      {
        ticketId: 1,
        ticketNumber: "TICKET-1-1-1699369200000",
        qrCode: "eyJ0aWNrZXROdW1iZXI...",
        status: "ISSUED",
        seat: { sector: "Platea", row: "A", number: "1" }
      }
      // ... más tickets
    ]
  }
}
```

#### Métodos Legacy (Deprecados):
```javascript
// Mantenidos por compatibilidad pero muestran warning
paymentsApi.simulateWebhook(webhookData)  // ⚠️ DEPRECATED
paymentsApi.completeOrderDirectly(orderId) // ⚠️ DEPRECATED
```

---

### 2. **src/pages/Checkout.jsx**

#### Función `handleSimulatePayment()` Actualizada:

**ANTES:**
```javascript
const result = await paymentsApi.completeOrderDirectly(order.id);
// ❌ Endpoint no existente
```

**AHORA:**
```javascript
// Obtener datos del cliente
const customerEmail = user?.email || holdData?.customerEmail || form.getFieldValue('email');
const customerName = user?.name || holdData?.customerName || form.getFieldValue('name');

// Llamar al endpoint correcto
const result = await paymentsApi.simulatePayment({
  orderId: order.id,
  customerEmail: customerEmail,
  customerName: customerName
});

// Verificar respuesta
if (result.success) {
  console.log('✅ Orden marcada como PAID');
  console.log('🎫 Tickets generados:', result.data?.tickets?.length);
}
```

**Logs Mejorados:**
```javascript
📦 Datos del pago simulado: { orderId: 123, customerEmail: "...", customerName: "..." }
🧪 Simulando pago para orden: 123
📧 Email del cliente: usuario@example.com
✅ Respuesta del backend: { success: true, data: {...} }
✅ Orden marcada como PAID
🎫 Tickets generados: 3
```

---

### 3. **src/components/TestingPanel.jsx**

#### Función `simulateSuccessfulPayment()` Actualizada:

**ANTES:**
```javascript
const result = await paymentsApi.simulateWebhook({
  orderId: orderId,
  status: 'approved',
  paymentId: `TEST-${Date.now()}`,
  paymentType: 'credit_card'
});
// ❌ Endpoint no existente
```

**AHORA:**
```javascript
// Buscar la orden en la lista cargada
const order = orders.find(o => o.id === orderId);

// Extraer datos del cliente
const customerEmail = order.customerEmail || order.customer_email || 'test@example.com';
const customerName = order.customerName || order.customer_name || customerEmail.split('@')[0];

// Llamar al endpoint correcto
const result = await paymentsApi.simulatePayment({
  orderId: orderId,
  customerEmail: customerEmail,
  customerName: customerName
});

// Mostrar resultado
if (result.success) {
  message.success(`✅ Pago simulado! Tickets generados: ${result.data?.tickets?.length || 0}`);
  console.log('🎫 Tickets:', result.data?.tickets);
}
```

**Mejoras:**
- ✅ Extrae customerEmail y customerName de la orden
- ✅ Logs detallados del proceso
- ✅ Muestra cantidad de tickets generados
- ✅ Manejo de errores mejorado

---

## 🎯 Flujo Completo Actualizado

### Desde el Checkout:

```
1. Usuario llega a /checkout/:holdId
   ↓
2. Sistema carga hold con customerEmail y customerName
   ↓
3. Usuario hace click en "🧪 Simular Pago Exitoso (Testing)"
   ↓
4. Frontend crea ORDER desde HOLD
   Response: { id: 123, status: "PENDING" }
   ↓
5. Frontend llama a simulatePayment():
   POST /api/test-payments/simulate-payment
   Body: { orderId: 123, customerEmail: "...", customerName: "..." }
   ↓
6. Backend procesa:
   - Marca orden como PAID
   - Registra paid_at con timestamp
   - Genera tickets con QR codes únicos
   - Marca asientos como SOLD
   - Retorna: { success: true, data: { order, tickets } }
   ↓
7. Frontend muestra mensaje de éxito
   ✅ "Pago simulado exitosamente! Redirigiendo..."
   ↓
8. Redirige a /payment/success?orderId=123&simulated=true
```

### Desde el Panel de Testing:

```
1. Admin va a /admin/testing
   ↓
2. Click "Cargar Órdenes Recientes"
   GET /api/orders?limit=10
   ↓
3. Tabla muestra órdenes con estado PENDING
   ↓
4. Admin hace click en "Aprobar" (botón verde)
   ↓
5. Frontend extrae customerEmail de la orden
   ↓
6. Frontend llama a simulatePayment():
   POST /api/test-payments/simulate-payment
   Body: { orderId, customerEmail, customerName }
   ↓
7. Backend procesa (igual que arriba)
   ↓
8. Frontend muestra: "✅ Pago simulado! Tickets generados: 3"
   ↓
9. Tabla se recarga, orden ahora aparece como PAID
```

---

## 📊 Verificación en Base de Datos

Después de simular un pago, verificar:

```sql
-- 1. Ver la orden (debe estar PAID)
SELECT id, status, paid_at, mp_payment_id 
FROM orders 
WHERE id = 123;

-- Resultado esperado:
-- id | status | paid_at                  | mp_payment_id
-- 123| PAID   | 2025-11-07T15:30:00.000Z | TEST_1699369200000_abc123


-- 2. Ver los tickets generados
SELECT ticket_number, status, qr_code 
FROM tickets 
WHERE order_id = 123;

-- Resultado esperado: 3 tickets con status ISSUED


-- 3. Ver asientos vendidos
SELECT id, status, order_id 
FROM seats 
WHERE order_id = 123;

-- Resultado esperado: 3 asientos con status SOLD
```

---

## 🧪 Testing del Flujo Completo

### Pre-requisitos:
1. ✅ Backend corriendo en `http://localhost:3000`
2. ✅ Frontend corriendo en `http://localhost:5173`
3. ✅ Base de datos con eventos, shows y secciones creadas

### Pasos de Testing:

#### Opción A: Desde el Frontend (Usuario)

1. **Crear usuario de prueba:**
   ```
   Email: testuser@example.com
   Password: Test123456
   ```

2. **Login y comprar tickets:**
   - Login con el usuario
   - Ir a Home → Seleccionar evento
   - Seleccionar show → Seleccionar localidad
   - Elegir cantidad (ej: 3 tickets)
   - Crear HOLD (reserva de 15 minutos)
   - Llegar a Checkout

3. **Simular el pago:**
   - Click en botón amarillo: "🧪 Simular Pago Exitoso (Testing)"
   - **Observar console logs:**
   ```javascript
   📦 Creando ORDER desde HOLD: 123
   ✅ Orden creada con ID: 456
   📦 Datos del pago simulado: {
     orderId: 456,
     customerEmail: "testuser@example.com",
     customerName: "Test User"
   }
   🧪 Simulando pago para orden: 456
   📧 Email del cliente: testuser@example.com
   ✅ Respuesta del backend: { success: true, ... }
   ✅ Orden marcada como PAID
   🎫 Tickets generados: 3
   ```

4. **Verificar tickets:**
   - Ir a `/mis-entradas`
   - Ver 3 tickets con QR codes
   - Estado: ISSUED (Activo)

#### Opción B: Desde el Panel de Testing (Admin)

1. **Login como admin:**
   ```
   Email: admin_e2e@ticketera.com
   Password: Admin123456
   ```

2. **Ir al panel:**
   - Navegar a `/admin/testing`

3. **Crear usuario de prueba:**
   - Click "Crear Usuario de Prueba"
   - Email: `buyer1@test.com`
   - Nombre: `Buyer Test 1`
   - Click "Crear Usuario"

4. **Logout y login como buyer1**

5. **Comprar tickets:**
   - Seleccionar evento → show → localidad → cantidad
   - Crear reserva
   - Llegar a checkout pero NO pagar

6. **Volver como admin:**
   - Logout de buyer1
   - Login como admin
   - Ir a `/admin/testing`

7. **Aprobar la orden:**
   - Click "Cargar Órdenes Recientes"
   - Ver orden PENDING de buyer1
   - Click botón verde "Aprobar"
   - **Observar console logs:**
   ```javascript
   🧪 Simulando pago para orden: 789
   📧 Email: buyer1@test.com
   👤 Nombre: Buyer Test 1
   ✅ Orden marcada como PAID
   🎫 Tickets: [...]
   ```

8. **Verificar:**
   - Tabla se recarga
   - Orden ahora aparece como PAID
   - Login como buyer1
   - Ir a `/mis-entradas`
   - Ver tickets generados

---

## ✅ Checklist de Verificación

Después de los cambios, verificar que:

- [ ] Frontend usa `POST /api/test-payments/simulate-payment`
- [ ] Se envían `orderId`, `customerEmail`, `customerName`
- [ ] Backend responde con `{ success: true, data: {...} }`
- [ ] Orden se marca como `PAID`
- [ ] Campo `paid_at` se registra con timestamp
- [ ] Se generan tickets con QR codes únicos
- [ ] Asientos se marcan como `SOLD`
- [ ] Tickets aparecen en `/mis-entradas`
- [ ] Panel de testing funciona correctamente
- [ ] Checkout funciona correctamente
- [ ] Console logs son informativos

---

## 🐛 Troubleshooting

### Error: 404 Not Found en simulate-payment

**Causa:** El endpoint del backend no está implementado.

**Solución:** Verificar que el backend tiene:
```javascript
// Backend: controllers/testPayments.controller.js
router.post('/test-payments/simulate-payment', testPaymentsController.simulatePayment);
```

### Error: customerEmail is required

**Causa:** El frontend no está enviando customerEmail.

**Solución:** Verificar que el hold o el usuario tengan email:
```javascript
const customerEmail = user?.email || holdData?.customerEmail || form.getFieldValue('email');
```

### Tickets no se generan

**Causa:** El backend no está ejecutando la lógica de generación.

**Solución:** Verificar en el backend que `simulatePayment()` llama a la función de generación de tickets.

### Orden se queda en PENDING

**Causa:** El backend no está actualizando el status a PAID.

**Solución:** Verificar en el backend:
```javascript
await db.query(`
  UPDATE orders 
  SET status = 'PAID', paid_at = NOW(), mp_payment_id = ?
  WHERE id = ?
`, [mpPaymentId, orderId]);
```

---

## 📝 Documentación Relacionada

- **TESTING_PASO_A_PASO.md** - Guía completa del flujo de testing
- **GUIA_TESTING_SIMULACION.md** - Sistema de simulación general
- **FIX_HOLDID_UNDEFINED.md** - Fix del holdId undefined
- **SISTEMA_TESTING_IMPLEMENTADO.md** - Implementación técnica

---

## 🎉 Estado Final

| Componente | Estado | Endpoint |
|------------|--------|----------|
| Frontend API | ✅ Actualizado | `POST /api/test-payments/simulate-payment` |
| Checkout | ✅ Actualizado | Usa `simulatePayment()` |
| Testing Panel | ✅ Actualizado | Usa `simulatePayment()` |
| Backend | ✅ Implementado | Marca como PAID + genera tickets |
| Documentación | ✅ Completa | ALINEACION_BACKEND_TESTING.md |

---

**Última actualización:** 2025-11-07 15:54  
**Estado:** ✅ Frontend 100% alineado con Backend  
**Testing:** Pendiente de ejecución
