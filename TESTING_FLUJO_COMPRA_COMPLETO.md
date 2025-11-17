# 🧪 Testing Completo del Flujo de Compra - Frontend + Backend

## 📋 Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Testing Paso a Paso](#testing-paso-a-paso)
4. [Checklist de Verificación](#checklist-de-verificación)
5. [Problemas Detectados y Soluciones](#problemas-detectados-y-soluciones)
6. [Datos de Prueba](#datos-de-prueba)

---

## 🔧 Pre-requisitos

### Backend Debe Estar Corriendo

✅ URL: `http://localhost:3000` o túnel público (ngrok/cloudflare)
✅ Base de datos con migraciones ejecutadas
✅ Credenciales de MercadoPago configuradas (TEST mode)

### Frontend Debe Estar Corriendo

✅ URL: `http://localhost:5173`
✅ Variables de entorno configuradas en `.env`

### Verificar Configuración del .env

```bash
# 1. Verificar VITE_API_URL
VITE_API_URL=http://localhost:3000

# 2. Verificar VITE_MP_PUBLIC_KEY (debe empezar con TEST-)
VITE_MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxx

# ⚠️ IMPORTANTE: Si está con "TEST-xxxxxxxxxxxxxxxx" genérico, necesitas reemplazarlo
```

---

## ⚙️ Configuración Inicial

### PASO 1: Configurar Credenciales de MercadoPago en el Backend

#### Opción A: Desde Postman/REST Client

```http
### 1.1 Login como ADMIN
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin_e2e@ticketera.com",
  "password": "Admin123456"
}

# RESPONSE: Copiar el "token"

### 1.2 Configurar MercadoPago
POST http://localhost:3000/api/payment-config/mercadopago
Authorization: Bearer [TU_TOKEN_AQUI]
Content-Type: application/json

{
  "accessToken": "TEST-1234567890123456-112233-abcdef1234567890abcdef1234567890-123456789",
  "publicKey": "TEST-abc123def456-789012-ghi345jkl678-mno901pqr234",
  "isSandbox": true,
  "isActive": true,
  "config": {
    "notificationUrl": "https://tu-url-publica.ngrok-free.app/api/payments/webhook",
    "timeout": 5000,
    "maxInstallments": 12
  }
}

### 1.3 Probar Conexión
POST http://localhost:3000/api/payment-config/mercadopago/test
Authorization: Bearer [TU_TOKEN_AQUI]

# EXPECTED: { "success": true, "message": "Conexión exitosa con MercadoPago" }
```

#### Opción B: Desde el Frontend (Si hay panel de admin)

1. Login como admin en: `http://localhost:5173/login`
2. Ir a: `/admin` → "Configuración" → "MercadoPago"
3. Ingresar credenciales TEST
4. Guardar y probar conexión

### PASO 2: Verificar que hay Eventos con Asientos Disponibles

```http
### 2.1 Ver eventos
GET http://localhost:3000/api/events

### 2.2 Ver shows de un evento
GET http://localhost:3000/api/events/1/shows

### 2.3 Ver secciones de un show
GET http://localhost:3000/api/shows/1/sections

### 2.4 Ver asientos disponibles
GET http://localhost:3000/api/shows/1/seats?status=AVAILABLE
```

**Si no hay datos:**
- Ir a `/admin` en el frontend
- Crear un evento
- Crear un show para ese evento
- Asignar secciones al show
- Verificar que se generaron asientos automáticamente

---

## 🚀 Testing Paso a Paso

### TEST 1: Ver Eventos Disponibles

**URL:** `http://localhost:5173/`

**Verificar:**
- [ ] Se muestran los eventos en la grilla
- [ ] Cada card tiene imagen, nombre, fecha, venue
- [ ] Botón "Comprar" está habilitado si hay shows
- [ ] Botón "Ver" siempre está habilitado

**Bugs Potenciales:**
- ❌ No se muestran eventos → Verificar que el backend tenga eventos
- ❌ Imágenes rotas → Verificar URLs de imágenes
- ❌ Error 401 → Verificar que los endpoints públicos no requieran auth

**Console Logs Esperados:**
```javascript
🎭 Obteniendo eventos...
✅ Eventos cargados: 5
```

---

### TEST 2: Ver Detalle del Evento

**URL:** `http://localhost:5173/events/:id`

**Verificar:**
- [ ] Se muestra el hero con imagen del evento
- [ ] Información del evento: nombre, descripción, venue
- [ ] Lista de shows (fechas disponibles)
- [ ] Cada show tiene: fecha, hora, precio, disponibilidad
- [ ] Botón "Comprar" habilitado solo si hay disponibilidad

**Bugs Potenciales:**
- ❌ No se muestran shows → Verificar que el evento tenga shows asociados
- ❌ Precio en $0 → Verificar que las secciones tengan precio configurado
- ❌ "Disponibles: undefined" → Verificar que el backend retorne available_seats

**Console Logs Esperados:**
```javascript
🎭 Obteniendo evento: 1
✅ Evento cargado: { id: 1, name: "Iron Maiden", ... }
📅 Obteniendo shows del evento: 1
✅ Shows cargados: 2
```

---

### TEST 3: Seleccionar Show y Ver Secciones

**URL:** `http://localhost:5173/shows/:showId`

**Desde:** Click en "Comprar" de un show en EventDetail

**Verificar:**
- [ ] Se muestran las secciones/localidades disponibles
- [ ] Cada sección tiene: nombre, tipo (GA/SEATED), precio, disponibilidad
- [ ] Tags de estado: DISPONIBLE (verde), POCAS (naranja), AGOTADO (rojo)
- [ ] Borde azul al seleccionar una sección
- [ ] Barra inferior con resumen y botón "Continuar"

**Bugs Potenciales:**
- ❌ No se muestran secciones → Verificar que el show tenga secciones creadas
- ❌ Secciones con capacidad 0 → Verificar que se generaron asientos
- ❌ Error al seleccionar → Verificar que el state se pase correctamente

**Console Logs Esperados:**
```javascript
🎪 Obteniendo show: 1
✅ Show cargado: { id: 1, event_id: 1, starts_at: "...", ... }
🎫 Obteniendo secciones del show: 1
✅ Secciones cargadas: 3
```

---

### TEST 4: Seleccionar Asientos (Entrada General)

**URL:** `http://localhost:5173/seats/:showId`

**Desde:** Click en "Continuar" con sección GA seleccionada

**Verificar:**
- [ ] Muestra precio por entrada
- [ ] InputNumber para cantidad (min: 1, max: 10)
- [ ] Disponibilidad actualizada
- [ ] Botón "Continuar con la compra" o "Continuar como invitado"

**Para Usuario Autenticado:**
- [ ] Botón dice "Continuar con la compra"
- [ ] Click → Crea reserva (HOLD) directamente
- [ ] Redirige a `/checkout/:holdId`

**Para Usuario NO Autenticado (Guest):**
- [ ] Botón dice "Continuar como invitado"
- [ ] Click → Abre modal de Guest Checkout
- [ ] Formulario con: email, nombre, teléfono
- [ ] Checkbox "Crear cuenta para futuras compras"
- [ ] Submit → Crea cuenta (opcional) + reserva (HOLD)
- [ ] Redirige a `/checkout/:holdId`

**Bugs Potenciales:**
- ❌ Cantidad > disponibles → Debe mostrar warning y limitar
- ❌ No crea HOLD → Verificar endpoint POST /api/holds
- ❌ Error "asientos no encontrados" → Verificar que existan asientos GA del sector
- ❌ Modal guest no cierra → Verificar setShowGuestForm(false)

**Console Logs Esperados:**
```javascript
🪑 Asientos disponibles cargados: 100
👤 Usuario autenticado: false
🔒 Creando HOLD: { showId: 1, seatIds: [1, 2, 3], customerEmail: "...", ... }
✅ HOLD creado: { holdId: 123, expiresAt: "...", ttlMinutes: 15 }
```

---

### TEST 5: Checkout y Crear Orden

**URL:** `http://localhost:5173/checkout/:holdId`

**Desde:** Después de crear HOLD exitosamente

**Verificar:**
- [ ] Countdown de expiración (15 minutos)
- [ ] Resumen de la orden:
  - Evento
  - Fecha y hora
  - Venue
  - Asientos/Cantidad
  - Subtotal
  - Cargo por servicio (15%)
  - Total
- [ ] Formulario de datos del pagador:
  - Nombre
  - Apellido
  - Email
  - Teléfono
  - DNI
  - (Opcional) Dirección
- [ ] Botón "Proceder al pago con Mercado Pago"

**Flujo al hacer click en "Proceder al pago":**

1. **Crear ORDER desde HOLD**
   ```javascript
   POST /api/orders
   Body: { holdId: 123 }
   
   Response: { id: 456, totalCents: 50000, status: "PENDING", ... }
   ```

2. **Crear Preferencia de Pago**
   ```javascript
   POST /api/payments/create-preference
   Body: { 
     orderId: 456, 
     payer: { ... },
     backUrls: { success: "...", failure: "...", pending: "..." }
   }
   
   Response: { 
     initPoint: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
     preferenceId: "12345-abcde"
   }
   ```

3. **Redirección a MercadoPago**
   - Se abre la página de pago de MercadoPago
   - Usuario ingresa datos de tarjeta de prueba

**Bugs Potenciales:**
- ❌ Hold no carga → Verificar GET /api/holds/:holdId
- ❌ Countdown no funciona → Verificar formato de expiresAt (ISO 8601)
- ❌ Error al crear orden → Verificar que el hold no haya expirado
- ❌ "Configuración de MercadoPago no encontrada" → Volver al PASO 1
- ❌ "No se pudo crear la preferencia" → Verificar credenciales TEST

**Console Logs Esperados:**
```javascript
🔍 Cargando datos del hold: 123
✅ Hold cargado: { holdId: 123, items: [...], totalCents: 50000, ... }
⏱️ Tiempo restante (segundos): 900
📦 Creando ORDER desde HOLD: 123
✅ ORDER creada: { id: 456, totalCents: 50000, status: "PENDING" }
💳 Creando preferencia de pago para orden: 456
✅ Preferencia creada: { initPoint: "https://...", preferenceId: "..." }
```

---

### TEST 6: Pago en MercadoPago (Sandbox)

**URL:** `https://www.mercadopago.com.ar/checkout/...`

**Tarjetas de Prueba:**

#### ✅ APROBADA
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Titular: APRO
DNI: 12345678
```

#### ❌ RECHAZADA (Fondos insuficientes)
```
Número: 5031 4332 1540 6351
CVV: 123
Fecha: 11/25
Titular: CALL
DNI: 12345678
```

#### ⏳ PENDIENTE
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Titular: CONT
DNI: 12345678
```

**Verificar:**
- [ ] Formulario de MercadoPago se carga correctamente
- [ ] Se muestran los datos de la orden (monto, descripción)
- [ ] Se pueden ingresar datos de tarjeta
- [ ] Botón "Pagar" está habilitado

**Bugs Potenciales:**
- ❌ Página en blanco → Verificar que las credenciales sean de TEST
- ❌ Error "preferencia no válida" → Verificar que el accessToken sea correcto
- ❌ "Monto inválido" → Verificar que totalCents > 0

---

### TEST 7: Webhook y Generación de Tickets

**Cuando el usuario paga en MercadoPago, sucede:**

1. **MercadoPago envía Webhook**
   ```http
   POST https://tu-url-publica.ngrok-free.app/api/payments/webhook
   Body: {
     "type": "payment",
     "data": { "id": "123456789" }
   }
   ```

2. **Backend procesa el webhook:**
   - Obtiene info del pago desde la API de MercadoPago
   - Busca la orden asociada al `external_reference`
   - Actualiza orden a `PAID`
   - Marca asientos como `SOLD`
   - Genera tickets individuales con QR codes
   - Envía email de confirmación (opcional)

**Verificar en Console del Backend:**
```javascript
✅ Webhook received from MercadoPago
✅ Payment approved for order 456
✅ Order updated: PENDING -> PAID
✅ Seats marked as SOLD: [1, 2, 3]
✅ Tickets generated: 3
📧 Email sent to: user@example.com
```

**Verificar en Base de Datos:**
```sql
-- Ver la orden
SELECT * FROM orders WHERE id = 456;
-- Debería tener status = 'PAID'

-- Ver el pago
SELECT * FROM payments WHERE order_id = 456;
-- Debería tener status = 'approved', payment_id de MP

-- Ver los tickets generados
SELECT * FROM tickets WHERE order_id = 456;
-- Debería haber 3 tickets con qr_code únicos

-- Ver asientos marcados como SOLD
SELECT * FROM seats WHERE id IN (1, 2, 3);
-- Debería tener status = 'SOLD'
```

**Bugs Potenciales:**
- ❌ Webhook no llega → Verificar que el túnel (ngrok/cloudflare) esté activo
- ❌ Orden no se actualiza → Verificar logs del backend
- ❌ Tickets no se generan → Verificar que el pago esté approved
- ❌ Email no llega → Verificar configuración de SMTP (opcional)

---

### TEST 8: Páginas de Retorno

**Después del pago, MercadoPago redirige a:**

#### ✅ PAGO APROBADO
**URL:** `http://localhost:5173/payment/success?collection_id=123&external_reference=456&payment_type=credit_card&...`

**Verificar:**
- [ ] Mensaje de éxito con check verde
- [ ] Número de orden visible
- [ ] Botón "Ver mis tickets"
- [ ] Botón "Volver al inicio"

**Console Logs Esperados:**
```javascript
✅ Pago exitoso para orden: 456
🎫 Obteniendo tickets de la orden...
✅ Tickets obtenidos: 3
```

#### ❌ PAGO RECHAZADO
**URL:** `http://localhost:5173/payment/failure?collection_id=123&external_reference=456&...`

**Verificar:**
- [ ] Mensaje de error con X roja
- [ ] Razón del rechazo (fondos insuficientes, etc.)
- [ ] Botón "Reintentar"
- [ ] Botón "Volver al inicio"

#### ⏳ PAGO PENDIENTE
**URL:** `http://localhost:5173/payment/pending?collection_id=123&external_reference=456&...`

**Verificar:**
- [ ] Mensaje de "pago pendiente" con reloj
- [ ] Instrucciones sobre qué hacer
- [ ] Botón "Volver al inicio"

**Bugs Potenciales:**
- ❌ Página en blanco → Verificar rutas en App.jsx
- ❌ "Orden no encontrada" → Verificar que el external_reference sea correcto
- ❌ Tickets no aparecen → Verificar que el webhook se haya procesado

---

### TEST 9: Ver Mis Tickets

**URL:** `http://localhost:5173/mis-entradas`

**Usuario debe estar autenticado**

**Verificar:**
- [ ] Estadísticas: Total, Activos, Usados
- [ ] Filtros: Todos, Activos, Usados, Cancelados
- [ ] Búsqueda por evento/venue/sector
- [ ] Cards de tickets con:
  - Imagen del evento
  - Badge de estado
  - Fecha y hora
  - Venue
  - Sector y asiento
  - Botón "Ver QR Code"
  - Botón "Descargar PDF"

**Bugs Potenciales:**
- ❌ No se muestran tickets → Verificar GET /api/users/me/tickets
- ❌ QR no se genera → Verificar formato del qr_code en DB
- ❌ PDF no descarga → Verificar implementación de generación de PDF

**Console Logs Esperados:**
```javascript
🎫 Obteniendo mis tickets
✅ Tickets cargados: 3
```

---

## ✅ Checklist de Verificación

### Pre-compra
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Credenciales de MercadoPago configuradas (TEST)
- [ ] Conexión con MercadoPago exitosa
- [ ] Eventos con shows y asientos disponibles

### Flujo de Compra
- [ ] Ver lista de eventos
- [ ] Ver detalle de evento con shows
- [ ] Seleccionar show y ver secciones
- [ ] Seleccionar cantidad de entradas
- [ ] Guest checkout o usuario autenticado
- [ ] Crear HOLD (reserva temporal)
- [ ] Ver countdown de expiración
- [ ] Ver resumen de orden
- [ ] Crear ORDER desde HOLD
- [ ] Crear preferencia de MercadoPago
- [ ] Redirigir a MercadoPago
- [ ] Pagar con tarjeta de prueba
- [ ] Webhook recibido y procesado
- [ ] Orden marcada como PAID
- [ ] Asientos marcados como SOLD
- [ ] Tickets generados con QR codes
- [ ] Redirección a página de éxito
- [ ] Ver tickets en "Mis Entradas"

---

## 🐛 Problemas Detectados y Soluciones

### PROBLEMA 1: "Configuración de MercadoPago no encontrada"

**Causa:** No se configuraron las credenciales de MercadoPago en el backend

**Solución:**
```http
POST http://localhost:3000/api/payment-config/mercadopago
Authorization: Bearer [ADMIN_TOKEN]
Content-Type: application/json

{
  "accessToken": "TEST-...",
  "publicKey": "TEST-...",
  "isSandbox": true,
  "isActive": true
}
```

---

### PROBLEMA 2: "No se pudo crear la preferencia"

**Causas posibles:**
1. Access Token incorrecto o vencido
2. Access Token de producción en lugar de TEST
3. Public Key no coincide con Access Token

**Solución:**
1. Verificar que ambas credenciales empiecen con `TEST-`
2. Obtener nuevas credenciales desde el panel de MercadoPago
3. Probar conexión:
```http
POST http://localhost:3000/api/payment-config/mercadopago/test
Authorization: Bearer [ADMIN_TOKEN]
```

---

### PROBLEMA 3: Webhook no llega al backend

**Causas posibles:**
1. URL de webhook incorrecta en la configuración
2. Túnel (ngrok/cloudflare) caído
3. MercadoPago no puede alcanzar la URL

**Solución:**
1. Verificar que el túnel esté activo:
   ```bash
   # Ngrok
   ngrok http 3000
   
   # Cloudflare
   cloudflared tunnel --url http://localhost:3000
   ```

2. Actualizar URL de webhook en la configuración:
   ```http
   POST http://localhost:3000/api/payment-config/mercadopago
   {
     ...
     "config": {
       "notificationUrl": "https://nueva-url.ngrok-free.app/api/payments/webhook"
     }
   }
   ```

3. Probar webhook manualmente:
   ```http
   POST http://localhost:3000/api/payments/webhook
   Content-Type: application/json
   
   {
     "type": "payment",
     "data": { "id": "123456789" }
   }
   ```

---

### PROBLEMA 4: HOLD expira antes de pagar

**Causa:** El tiempo de expiración (15 minutos) es demasiado corto

**Solución Temporal:** Aumentar el TTL en el backend
**Solución Permanente:** Implementar renovación de HOLD desde el frontend

---

### PROBLEMA 5: Error 401 en endpoints públicos

**Causa:** Algunos endpoints requieren autenticación cuando no deberían

**Endpoints que DEBEN ser públicos:**
- GET /api/events
- GET /api/events/:id
- GET /api/events/:id/shows
- GET /api/shows/:id
- GET /api/shows/:id/sections
- GET /api/shows/:id/seats

**Solución:** Verificar middleware de autenticación en el backend

---

### PROBLEMA 6: Tickets no se generan después del pago

**Causas posibles:**
1. Webhook no llegó
2. Pago no está en estado "approved"
3. Error en la generación de QR codes

**Verificación:**
```sql
-- Ver el pago
SELECT * FROM payments WHERE order_id = 456;

-- Si status != 'approved', el webhook no se procesó correctamente
```

**Solución:** Forzar el procesamiento del webhook manualmente o verificar logs del backend

---

### PROBLEMA 7: .env con credenciales genéricas

**Problema:** El `.env` tiene `VITE_MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxx`

**Impacto:** El SDK de MercadoPago en el frontend no funcionará

**Solución:**
1. Obtener credenciales reales (TEST) de MercadoPago
2. Reemplazar en `.env`:
   ```bash
   VITE_MP_PUBLIC_KEY=TEST-abc123def456-789012-ghi345jkl678-mno901pqr234
   ```
3. Reiniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## 📊 Datos de Prueba

### Usuarios de Prueba

```javascript
// Admin
email: "admin_e2e@ticketera.com"
password: "Admin123456"

// Organizador
email: "productor1@rockprod.com"
password: "Producer123"

// Cliente
email: "cliente1_e2e@test.com"
password: "Cliente123"
```

### Tarjetas de Prueba MercadoPago

```javascript
// APROBADA ✅
{
  numero: "5031 7557 3453 0604",
  cvv: "123",
  fecha: "11/25",
  titular: "APRO",
  dni: "12345678"
}

// RECHAZADA ❌
{
  numero: "5031 4332 1540 6351",
  cvv: "123",
  fecha: "11/25",
  titular: "CALL",
  dni: "12345678"
}

// PENDIENTE ⏳
{
  numero: "5031 7557 3453 0604",
  cvv: "123",
  fecha: "11/25",
  titular: "CONT",
  dni: "12345678"
}
```

---

## 📞 Próximos Pasos

Una vez completado el testing:

1. ✅ Documentar todos los bugs encontrados
2. ✅ Priorizar fixes críticos vs. mejoras
3. ✅ Crear issues en GitHub/Jira
4. ✅ Implementar correcciones
5. ✅ Re-testear flujo completo
6. ✅ Preparar para producción

---

## 🔗 Links Útiles

- [Guía Backend MercadoPago](./TESTING_GUIDE_STEP_BY_STEP.md)
- [Documentación MercadoPago Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/notifications/webhooks)

---

**¡Listo para empezar el testing!** 🚀

**Recomendación:** Ir paso a paso, anotando CADA problema encontrado con screenshots de console logs y errores.
