# 🧪 Guía de Testing con Simulación de Pagos

## 📋 Resumen

Ahora puedes probar **TODO el flujo de compra SIN necesidad de configurar MercadoPago**. El sistema detecta automáticamente cuando estás en modo desarrollo y te permite simular pagos exitosos.

---

## 🎯 ¿Qué se Habilitó?

### ✅ 1. Panel de Testing en Admin
**Ruta:** `http://localhost:5173/admin/testing`

**Funcionalidades:**
- Crear usuarios de prueba rápidamente
- Ver órdenes pendientes
- Aprobar/Rechazar pagos manualmente
- Simular webhooks de MercadoPago

### ✅ 2. Botón "Simular Pago" en Checkout
**Ubicación:** Página de Checkout (`/checkout/:holdId`)

**Características:**
- Solo aparece en modo desarrollo (localhost)
- Simula un pago exitoso instantáneo
- Genera tickets automáticamente
- Redirige a página de éxito

### ✅ 3. Banner de Modo Testing
**Ubicación:** Checkout

**Info:**
- Indica que estás en modo testing
- Tag "DEV" para recordarte que no es producción

---

## 🚀 Flujo de Testing Completo

### PASO 1: Crear Usuario de Prueba

**Opción A: Desde el Panel de Testing**
1. Login como admin: `admin_e2e@ticketera.com` / `Admin123456`
2. Ir a: `http://localhost:5173/admin/testing`
3. Click en "Crear Usuario de Prueba"
4. Llenar formulario:
   - Email: `test1@example.com`
   - Nombre: `Usuario Test 1`
   - Teléfono: `1234567890`
   - Contraseña: `Test123456` (por defecto)
5. Click "Crear Usuario"
6. ✅ Usuario creado

**Opción B: Registro Manual**
1. Ir a: `http://localhost:5173/register`
2. Completar formulario
3. Registrarse normalmente

---

### PASO 2: Iniciar Sesión con el Usuario de Prueba

1. Logout si estás como admin
2. Login con el usuario creado:
   - Email: `test1@example.com`
   - Contraseña: `Test123456`

---

### PASO 3: Comprar Tickets

#### 3.1 Buscar un Evento
1. Ir a Home: `http://localhost:5173/`
2. Ver lista de eventos disponibles
3. Click en "Comprar" de un evento

#### 3.2 Ver Shows Disponibles
1. Seleccionar una fecha/show
2. Click en "Comprar"

#### 3.3 Seleccionar Localidad
1. Ver secciones disponibles
2. Click en una sección
3. Click "Continuar"

#### 3.4 Seleccionar Cantidad
1. Elegir cantidad de entradas (1-10)
2. Click "Continuar con la compra"
3. Se crea un HOLD (reserva temporal de 15 minutos)
4. Redirige a Checkout

---

### PASO 4: Simular el Pago (2 opciones)

#### Opción A: Botón de Simulación en Checkout (✨ RECOMENDADO)

1. Estás en: `/checkout/:holdId`
2. Verás:
   - Banner naranja: "Modo Testing: Puedes simular pagos..."
   - Countdown de 15 minutos
   - Formulario de pago (opcional llenarlo)
3. Scrollear hasta el final
4. Verás 2 botones:
   - `Pagar $XXX` (iría a MercadoPago real)
   - `🧪 Simular Pago Exitoso (Testing)` ← **Click aquí**
5. El sistema:
   - Crea la orden
   - Simula el webhook de MercadoPago
   - Marca la orden como PAID
   - Genera tickets con QR codes
   - Redirige a `/payment/success`

#### Opción B: Panel de Testing (Manual)

1. Completa el formulario de checkout (no hace falta pagar)
2. Vuelve al panel de testing: `/admin/testing`
3. Click "Cargar Órdenes Recientes"
4. Verás la orden con estado PENDING
5. Click en "Aprobar" 
6. El sistema genera los tickets
7. Volver a la app y verificar en "Mis Entradas"

---

### PASO 5: Ver los Tickets Generados

1. Ir a: `http://localhost:5173/mis-entradas`
2. Verás tus tickets con:
   - ✅ Estado: ISSUED (Activo)
   - 🎭 Evento
   - 📅 Fecha y hora
   - 🏟️ Venue
   - 🪑 Sector y asiento
3. Click "Ver QR Code" para ver el código QR
4. (Opcional) Click "Descargar PDF"

---

## 📊 Verificación Completa

### Checklist de Testing:

- [ ] Usuario de prueba creado
- [ ] Login exitoso
- [ ] Eventos visibles en home
- [ ] Shows visibles en detalle de evento
- [ ] Secciones visibles en show
- [ ] Cantidad de entradas seleccionada
- [ ] HOLD creado (reserva temporal)
- [ ] Countdown de 15 minutos visible
- [ ] Botón "Simular Pago" visible en checkout
- [ ] Pago simulado exitosamente
- [ ] Redirección a página de éxito
- [ ] Tickets visibles en "Mis Entradas"
- [ ] QR code generado correctamente

---

## 🎭 Escenarios de Testing

### Escenario 1: Compra Simple
- **Usuario:** Cliente nuevo
- **Evento:** Cualquiera con shows disponibles
- **Cantidad:** 1-2 tickets
- **Método:** Simulación desde checkout
- **Objetivo:** Verificar flujo completo

### Escenario 2: Compra Múltiple
- **Usuario:** El mismo de antes
- **Evento:** Otro evento diferente
- **Cantidad:** 5-10 tickets
- **Método:** Simulación desde panel de testing
- **Objetivo:** Verificar múltiples tickets, múltiples eventos

### Escenario 3: Guest Checkout
- **Usuario:** NO autenticado (invitado)
- **Evento:** Cualquiera
- **Cantidad:** 2-3 tickets
- **Proceso:**
  1. Logout
  2. Seleccionar evento y asientos
  3. Click "Continuar como invitado"
  4. Completar modal de guest
  5. (Opcional) Marcar "Crear cuenta"
  6. Continuar con simulación de pago
- **Objetivo:** Verificar compra sin registro previo

### Escenario 4: Múltiples Usuarios
- **Usuarios:** test1, test2, test3
- **Evento:** El mismo para todos
- **Cantidad:** 2-3 tickets cada uno
- **Objetivo:** Verificar que los asientos se asignan correctamente y no se solapan

### Escenario 5: Expiración de HOLD
- **Usuario:** Cualquiera
- **Proceso:**
  1. Crear reserva (HOLD)
  2. Ir a checkout
  3. NO pagar
  4. Esperar 15 minutos
  5. Verificar que expira
  6. Verificar que asientos se liberan
- **Objetivo:** Comprobar sistema de expiración

---

## 🐛 Detección de Bugs

### ¿Qué buscar?

1. **Errores de Carga:**
   - Eventos no se muestran
   - Shows no aparecen
   - Secciones vacías
   - Console errors

2. **Problemas de Reserva:**
   - HOLD no se crea
   - Countdown no funciona
   - Error al asignar asientos
   - Asientos duplicados

3. **Problemas de Pago:**
   - Botón de simulación no aparece
   - Error al simular pago
   - Orden no se marca como PAID
   - Tickets no se generan

4. **Problemas de Visualización:**
   - Tickets no aparecen en "Mis Entradas"
   - QR no se genera
   - Información incorrecta
   - Imágenes rotas

### Cómo Reportar Bugs:

```markdown
### Bug: [Título descriptivo]

**Pasos para reproducir:**
1. ...
2. ...
3. ...

**Resultado esperado:**
...

**Resultado actual:**
...

**Console logs:**
```
[Pegar logs aquí]
```

**Screenshots:**
[Adjuntar si es posible]

**Navegador:** Chrome/Firefox/Safari
**Usuario:** test1@example.com
```

---

## 🔧 Archivos Modificados

### Backend (Necesario implementar):

Estos endpoints deben estar implementados en el backend:

```javascript
// POST /api/payments/simulate-webhook
// Body: { orderId, status, paymentId, paymentType, statusDetail? }
// Acción: Simular webhook de MercadoPago

// POST /api/payments/complete-order/:orderId
// Acción: Completar orden directamente sin MercadoPago
```

### Frontend (Ya implementados):

1. **src/components/TestingPanel.jsx** (NUEVO)
   - Panel de administración de testing
   - Creación de usuarios
   - Aprobación/Rechazo de órdenes

2. **src/pages/Checkout.jsx** (ACTUALIZADO)
   - Banner de modo testing
   - Botón de simulación de pago
   - Handler `handleSimulatePayment()`

3. **src/services/apiService.js** (ACTUALIZADO)
   - `paymentsApi.simulateWebhook()`
   - `paymentsApi.completeOrderDirectly()`

4. **src/App.jsx** (ACTUALIZADO)
   - Ruta `/admin/testing`

---

## 📝 Notas Importantes

### 🚨 Modo Desarrollo vs Producción

**En Desarrollo (localhost):**
- ✅ Botón "Simular Pago" visible
- ✅ Banner de testing visible
- ✅ Panel de testing accesible
- ✅ No se requiere MercadoPago configurado

**En Producción:**
- ❌ Botón "Simular Pago" NO visible
- ❌ Banner de testing NO visible
- ❌ Solo pago real con MercadoPago
- ✅ Panel de testing solo para admin (opcional)

### 🔒 Seguridad

Los endpoints de simulación **DEBEN** estar protegidos en producción:

```javascript
// Backend - Middleware de protección
if (process.env.NODE_ENV === 'production') {
  return res.status(403).json({ 
    error: 'Simulación no disponible en producción' 
  });
}
```

### ⏰ TTL de HOLD

- Por defecto: 15 minutos
- Configurable en backend
- Limpieza automática cada 2 minutos
- Countdown visible en checkout

---

## 🎯 Próximos Pasos

Una vez que completes el testing:

1. ✅ Documentar todos los bugs encontrados
2. ✅ Fixear bugs críticos
3. ✅ Re-testear después de fixes
4. ✅ Configurar MercadoPago real (seguir TESTING_GUIDE_STEP_BY_STEP.md)
5. ✅ Testing con tarjetas de prueba de MercadoPago
6. ✅ Testing en staging/pre-producción
7. ✅ Deploy a producción

---

## 📞 Ayuda y Soporte

### Console Logs Importantes:

```javascript
// Creación de HOLD
🔒 Creando HOLD: { showId, seatIds, customerEmail, customerName }
✅ HOLD creado: { holdId, expiresAt, ttlMinutes }

// Checkout
🔍 Cargando datos del hold: [holdId]
✅ Hold cargado: { holdId, items, totalCents, expiresAt }
⏱️ Tiempo restante (segundos): 900

// Simulación de Pago
📦 Creando ORDER desde HOLD: [holdId]
✅ ORDER creada: { id, totalCents, status }
🧪 Completando orden directamente: [orderId]
✅ Pago simulado exitosamente

// Tickets
🎫 Obteniendo mis tickets
✅ Tickets cargados: 3
```

### Verificar en Base de Datos:

```sql
-- Ver órdenes
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Ver tickets generados
SELECT * FROM tickets WHERE order_id = [orderId];

-- Ver asientos reservados
SELECT * FROM seats WHERE status = 'SOLD' AND show_id = [showId];

-- Ver holds activos
SELECT * FROM holds WHERE expires_at > NOW();
```

---

## 🎉 ¡Listo para Testing!

Ahora puedes:

1. ✅ Crear usuarios de prueba rápidamente
2. ✅ Comprar tickets sin configurar MercadoPago
3. ✅ Simular pagos exitosos con 1 click
4. ✅ Verificar generación de tickets
5. ✅ Probar todo el flujo end-to-end

**¡Empieza a testear y reporta cualquier bug que encuentres!** 🚀

---

## 📚 Referencias

- **TESTING_FLUJO_COMPRA_COMPLETO.md** - Testing completo con MercadoPago real
- **Guía Backend de MercadoPago** - Configuración de credenciales
- **RECAPTCHA_DESHABILITADO.md** - reCAPTCHA (actualmente deshabilitado)

---

**Última actualización:** 2025-11-07  
**Estado:** ✅ Sistema de Simulación Habilitado
