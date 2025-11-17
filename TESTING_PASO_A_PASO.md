# 🧪 Testing Paso a Paso - Flujo Completo de Compra

## 📋 Objetivo
Probar el **flujo completo** desde que un usuario ve un evento hasta que tiene los tickets en su cuenta.

---

## ⚙️ Pre-requisitos

### 1. Backend y Frontend Corriendo
```bash
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### 2. Crear Usuario de Prueba
**Desde Panel de Testing:**
1. Login como admin: `admin_e2e@ticketera.com` / `Admin123456`
2. Ir a: `http://localhost:5173/admin/testing`
3. Crear usuario:
   - Email: `comprador1@test.com`
   - Nombre: `Comprador Test 1`
   - Password: `Test123456` (por defecto)

---

## 🎬 TESTING - Flujo Completo

---

## PASO 1: Login ✅

**URL:** `http://localhost:5173/login`

1. Email: `comprador1@test.com`
2. Password: `Test123456`
3. Click "Iniciar Sesión"

**Verificar:**
- [ ] Redirige a Home
- [ ] Header muestra nombre del usuario
- [ ] Console: `✅ Login exitoso`

---

## PASO 2: Seleccionar Evento ✅

**URL:** `http://localhost:5173/`

1. Ver grilla de eventos
2. Click en "Comprar" de un evento con tag verde "Disponible"

**Verificar:**
- [ ] Redirige a `/events/:eventId`
- [ ] Muestra detalle del evento
- [ ] Console: `✅ Evento cargado`

---

## PASO 3: Seleccionar Show (Fecha) ✅

**URL:** `/events/:eventId`

1. Scrollear a "Fechas Disponibles"
2. Click "Comprar" en un show DISPONIBLE

**Verificar:**
- [ ] Redirige a `/shows/:showId`
- [ ] Muestra secciones disponibles
- [ ] Console: `✅ Show cargado`, `✅ Secciones cargadas`

---

## PASO 4: Seleccionar Localidad/Sección ✅

**URL:** `/shows/:showId`

1. Ver cards de secciones (VIP, Platea, Campo, etc.)
2. Click en una sección (debe marcarse con borde azul)
3. Ver barra inferior con total
4. Click "Continuar"

**Verificar:**
- [ ] Card seleccionada tiene borde azul
- [ ] Barra inferior muestra total
- [ ] Redirige a `/seats/:showId`
- [ ] Console: `🎫 Sección seleccionada`

---

## PASO 5: Seleccionar Cantidad ✅

**URL:** `/seats/:showId`

**Para Entrada General (GA):**
1. Ver precio por entrada
2. Cambiar cantidad (ej: 3 tickets)
3. Ver total actualizado
4. Click "Continuar con la compra"

**Para Asientos Numerados:**
1. Click en asientos del mapa
2. Ver seleccionados en azul
3. Click "Continuar con la compra"

**Verificar:**
- [ ] Total calcula correctamente: `cantidad × precio + 15%`
- [ ] Console: `🎫 Cantidad seleccionada: 3`

---

## PASO 6: Crear Reserva (HOLD) ✅

1. Sistema crea HOLD automáticamente
2. Ver mensaje: "¡Asientos reservados! Tenés 15 minutos..."

**Verificar:**
- [ ] Loading: "Creando reserva temporal..."
- [ ] Mensaje de éxito aparece
- [ ] Redirige a `/checkout/:holdId`
- [ ] Console: `✅ HOLD creado: { holdId: 123, expiresAt: ..., ttlMinutes: 15 }`

**Console Logs:**
```javascript
🔒 Creando HOLD: { showId: 38, seatIds: [1,2,3] }
POST /api/holds
✅ HOLD creado: { holdId: 123, totalCents: 75000000 }
```

---

## PASO 7: Checkout - Ver Resumen ✅

**URL:** `/checkout/:holdId`

**Verificar Pantalla:**

### Banner (solo DEV):
- [ ] "⚠️ Modo Testing: Puedes simular pagos..." [DEV]

### Countdown:
- [ ] "Tu reserva expira en: 14:58" (cuenta regresiva)

### Resumen (Columna Izquierda):
- [ ] Evento: "Iron Maiden..."
- [ ] Fecha: "1 de noviembre..."
- [ ] Venue: "Estadio River Plate"
- [ ] Asientos: "3x vip delantero - GA1, GA2, GA3"
- [ ] Subtotal: "$750,000"
- [ ] Cargo servicio: "$112,500"
- [ ] Total: "$862,500"

### Formulario (Columna Derecha):
- [ ] Campos pre-llenados (nombre, email, DNI)
- [ ] Botón "Pagar $862,500"
- [ ] Botón "🧪 Simular Pago Exitoso" (amarillo, solo DEV)

**Console Logs:**
```javascript
🔍 Cargando datos del hold: 123
GET /api/holds/123
✅ Hold cargado: { holdId: 123, totalCents: 75000000 }
⏱️ Tiempo restante (segundos): 900
💰 Cálculo de totales: { subtotal: 750000, total: 862500 }
```

---

## PASO 8: Simular el Pago 🎯

**⭐ MOMENTO CLAVE ⭐**

1. Scrollear al final del formulario
2. Click en botón amarillo: **"🧪 Simular Pago Exitoso (Testing)"**

**Verificar Secuencia:**

### 1. Crear ORDER:
- [ ] Loading: "Creando orden de compra..."
- [ ] Console: `📦 Creando ORDER desde HOLD: 123`
- [ ] Console: `✅ Orden creada con ID: 456`

### 2. Simular Pago:
- [ ] Loading: "Simulando pago exitoso..."
- [ ] Console: `🧪 Completando orden directamente: 456`
- [ ] Backend genera tickets con QR codes

### 3. Redirección:
- [ ] Mensaje: "✅ Pago simulado exitosamente! Redirigiendo..."
- [ ] Espera 2 segundos
- [ ] Redirige a `/payment/success?orderId=456&simulated=true`

**Console Logs Completos:**
```javascript
// PASO 1: Crear ORDER
📦 Creando ORDER desde HOLD: 123
POST /api/orders { "holdId": 123 }
✅ Orden creada: { id: 456, status: "PENDING" }

// PASO 2: Simular Pago
🧪 Completando orden directamente: 456
POST /api/payments/complete-order/456

// Backend procesa (logs del servidor):
✅ Webhook received (simulated)
✅ Payment approved for order 456
✅ Order updated: PENDING -> PAID
✅ Seats marked as SOLD: [1, 2, 3]
✅ Tickets generated: 3
  - Ticket #789: GA1 - QR: TKT-789-ABC123
  - Ticket #790: GA2 - QR: TKT-790-DEF456
  - Ticket #791: GA3 - QR: TKT-791-GHI789

// Frontend recibe:
✅ Pago simulado exitosamente!
→ Navegando a: /payment/success?orderId=456
```

---

## PASO 9: Página de Éxito ✅

**URL:** `/payment/success?orderId=456&simulated=true`

**Verificar:**
- [ ] ✅ Icono de check verde grande
- [ ] Título: "¡Pago Exitoso!"
- [ ] Número de orden: "#456"
- [ ] Alert: "⚠️ Este pago fue simulado" (si tiene `simulated=true`)
- [ ] Botón: "Ver Mis Tickets"
- [ ] Botón: "Volver al Inicio"

**Console Logs:**
```javascript
✅ Pago exitoso para orden: 456
GET /api/orders/456
Response: { id: 456, status: "PAID" }

🎫 Obteniendo tickets...
GET /api/orders/456/tickets
✅ Tickets obtenidos: 3
```

---

## PASO 10: Ver Mis Tickets 🎯

**URL:** `/mis-entradas`

1. Click en "Ver Mis Tickets"

**Verificar Estadísticas:**
- [ ] Total de Tickets: **3**
- [ ] Activos (ISSUED): **3**
- [ ] Usados: 0

**Verificar Cards de Tickets (debe haber 3):**

### Ticket #1:
- [ ] Imagen del evento
- [ ] Badge verde: "ACTIVO"
- [ ] Título: "Iron Maiden Run For Your Lives"
- [ ] Fecha: "1 de noviembre de 2025, 20:00"
- [ ] Venue: "📍 Estadio River Plate"
- [ ] Sector: "🎫 vip delantero"
- [ ] Asiento: "GA1"
- [ ] Precio: "$250,000"
- [ ] Botón "Ver QR Code"
- [ ] Botón "Descargar PDF"

### Ticket #2 y #3:
- [ ] Misma info con asientos "GA2" y "GA3"

**Console Logs:**
```javascript
🎫 Obteniendo mis tickets
GET /api/users/me/tickets

Response: {
  tickets: [
    {
      id: 789,
      event_name: "Iron Maiden...",
      venue: "Estadio River Plate",
      show_date: "2025-11-01T20:00:00Z",
      sector: "vip delantero",
      seat_number: "GA1",
      qr_code: "TKT-789-ABC123",
      status: "ISSUED",
      price_cents: 25000000
    },
    // ... ticket 790 y 791
  ]
}

✅ Tickets cargados: 3
📊 Estadísticas: { total: 3, activos: 3, usados: 0 }
```

**Verificar QR Code:**
1. Click "Ver QR Code" en un ticket
2. Ver modal con código QR visible
3. Texto del QR: `TKT-789-ABC123`

---

## ✅ CHECKLIST FINAL

- [ ] Usuario creado y login exitoso
- [ ] Evento seleccionado desde home
- [ ] Show/fecha seleccionada
- [ ] Localidad/sección seleccionada
- [ ] Cantidad de tickets elegida
- [ ] HOLD creado (reserva de 15 min)
- [ ] Countdown visible en checkout
- [ ] Resumen de orden correcto
- [ ] Botón de simulación visible (DEV)
- [ ] Pago simulado exitosamente
- [ ] ORDER creada con status PAID
- [ ] 3 Tickets generados con QR codes únicos
- [ ] Asientos marcados como SOLD
- [ ] Redirección a página de éxito
- [ ] Tickets visibles en "Mis Entradas"
- [ ] QR codes generados correctamente

---

## 🐛 Errores Comunes

### Error: "No se pudieron reservar los asientos"
- **Causa:** Asientos ya reservados por otro usuario
- **Solución:** Seleccionar otros asientos

### Error: "Reserva expirada"
- **Causa:** Pasaron más de 15 minutos
- **Solución:** Volver a seleccionar

### Error: "Configuración de MercadoPago no encontrada"
- **Causa:** Intentaste usar botón "Pagar" real (no simulación)
- **Solución:** Usar botón de simulación o configurar MP

### Error: 404 en `/api/payments/complete-order/:orderId`
- **Causa:** Backend no tiene endpoint implementado
- **Solución:** Implementar endpoint según docs

### Error: "Tickets no aparecen"
- **Causa:** Backend no generó tickets
- **Solución:** Verificar logs del servidor y BD

---

## 📊 Verificar en Base de Datos

```sql
-- Ver la orden
SELECT * FROM orders WHERE id = 456;
-- status debe ser 'PAID'

-- Ver los tickets
SELECT * FROM tickets WHERE order_id = 456;
-- debe haber 3 tickets con qr_code único

-- Ver asientos vendidos
SELECT * FROM seats WHERE id IN (1,2,3);
-- status debe ser 'SOLD', order_id = 456
```

---

## 🎉 ¡Testing Completado!

Si llegaste hasta aquí y TODO está ✅:
- El sistema funciona end-to-end
- Puedes hacer más pruebas con otros eventos
- Estás listo para testing real con MercadoPago

**Próximo paso:** Probar con múltiples usuarios comprando al mismo evento.

---

**Última actualización:** 2025-11-07  
**Duración estimada:** 10-15 minutos  
**Nivel:** Completo - Paso a Paso
