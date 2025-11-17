# 🔄 AUDITORÍA - FLUJO DETALLADO END-TO-END

**Fecha:** 2025-11-02  
**Documento:** Diagrama de secuencia y análisis de flujo

---

## 1. DIAGRAMA DE SECUENCIA COMPLETO

```
Usuario → Frontend → API → Backend → Database → Mercado Pago

FASE 1: NAVEGACIÓN DE EVENTOS
═══════════════════════════════════════════════════════════════

[Usuario] Abre app → http://localhost:5173/
    ↓
[Frontend] GET /api/events?status=active&page=1&limit=20
    ↓ [200 OK]
[Backend] SELECT * FROM events WHERE status='active' LIMIT 20
    ↓
[Database] Retorna 10 eventos
    ↓
[Frontend] Renderiza grilla de eventos
    ↓
[Usuario] Ve eventos disponibles ✅


FASE 2: SELECCIÓN DE EVENTO
═══════════════════════════════════════════════════════════════

[Usuario] Click en evento → /events/123
    ↓
[Frontend] GET /api/events/123
    ↓ [200 OK]
[Backend] SELECT e.*, v.name as venue_name, v.city as venue_city
          FROM events e
          LEFT JOIN venues v ON e.venue_id = v.id
          WHERE e.id = 123
    ↓
[Database] Retorna evento con venue
    ↓
[Frontend] GET /api/shows?eventId=123
    ↓ [200 OK]
[Backend] SELECT * FROM shows WHERE event_id = 123 AND status='active'
    ↓
[Database] Retorna 3 shows
    ↓
[Frontend] Renderiza lista de shows con fechas/horarios
    ↓
[Usuario] Ve shows disponibles ✅


FASE 3: SELECCIÓN DE SHOW Y LOCALIDADES
═══════════════════════════════════════════════════════════════

[Usuario] Click "Comprar" en show → /shows/456
    ↓
[Frontend] GET /api/shows/456
    ↓ [200 OK]
[Backend] SELECT * FROM shows WHERE id = 456
    ↓
[Database] Retorna show
    ↓
[Frontend] GET /api/events/123/ticket-types
    ↓ [200 OK] ⚠️ PUNTO DE FALLO #1
[Backend] SELECT * FROM ticket_types WHERE event_id = 123
    ↓
[Database] ❌ RETORNA [] (vacío - tabla sin datos)
    ↓
[Frontend] ⚠️ FALLBACK: GET /api/shows/456/sections (V1)
    ↓ [200 OK]
[Backend] SELECT * FROM sections WHERE show_id = 456
    ↓
[Database] Retorna 3 sections (V1)
    [
      {id: 1, name: "Platea", kind: "NUMBERED", price_cents: 5000, 
       capacity: 100, available_seats: 85},
      {id: 2, name: "Pullman", kind: "NUMBERED", price_cents: 3000,
       capacity: 150, available_seats: 120},
      {id: 3, name: "General", kind: "GENERAL", price_cents: 2000,
       capacity: 200, available_seats: 180}
    ]
    ↓
[Frontend] Renderiza cards de localidades
    ↓
[Usuario] Selecciona "Platea" (section.id = 1)
    ↓
[Frontend] navigate('/seats/456', {state: {section: {id: 1, ...}, show, event}})
    ↓
[Usuario] Ve mapa de butacas ✅


FASE 4: SELECCIÓN DE ASIENTOS
═══════════════════════════════════════════════════════════════

[Usuario] En /seats/456
    ↓
[Frontend] Renderiza mapa de butacas (si NUMBERED) o selector cantidad (si GENERAL)
    ↓
[Usuario] Selecciona asientos A10, A11 (o cantidad: 2)
    ↓
[Usuario] Click "Continuar con la compra"
    ↓
[Frontend] handleCreateOrder()
    ↓
    Prepara reservationData:
    {
      eventId: 123,
      tickets: [
        {
          typeId: 1,  ⚠️ PROBLEMA: section.id (V1) != ticket_type_id (V2)
          quantity: 2
        }
      ],
      customerInfo: {
        name: "Juan Pérez",
        email: "juan@example.com",
        phone: "1234567890"
      }
    }


FASE 5: CREAR RESERVA (⚠️ PUNTO DE FALLO CRÍTICO)
═══════════════════════════════════════════════════════════════

[Frontend] POST /api/tickets/reserve
    Headers: {
      Authorization: "Bearer eyJhbGc...",
      Content-Type: "application/json"
    }
    Body: {reservationData}
    ↓
[API Gateway] ❌ FALLO #2: Ruta no existe
    ↓
    Respuesta: 404 Not Found
    {
      "error": "NotFound",
      "message": "Cannot POST /api/tickets/reserve"
    }
    ↓
[Frontend] catch(error)
    console.error('❌ Error al crear reserva:', error)
    message.error('Error al crear la reserva. Intentá nuevamente.')
    ↓
[Usuario] ❌ Ve mensaje de error, no puede continuar


ALTERNATIVA: SI LA RUTA EXISTIERA
═══════════════════════════════════════════════════════════════

[Frontend] POST /api/tickets/reserve
    ↓ [Ruta existe]
[Backend] Valida JWT token ✅
    ↓
[Backend] Extrae datos: eventId=123, typeId=1, quantity=2
    ↓
[Backend] SELECT * FROM ticket_types WHERE id = 1
    ↓
[Database] ❌ FALLO #3: No existe ticket_type con id=1
    (porque id=1 es un section_id, no un ticket_type_id)
    ↓
[Backend] Respuesta: 404 TicketTypeNotFound
    {
      "error": "TicketTypeNotFound",
      "message": "Ticket type with id 1 not found",
      "ticketTypeId": 1
    }
    ↓
[Frontend] catch(error)
    console.error('❌ Error al crear reserva:', error)
    message.error('Error al crear la reserva. Intentá nuevamente.')
    ↓
[Usuario] ❌ Ve mensaje de error, no puede continuar


HAPPY PATH: SI TODO FUNCIONARA
═══════════════════════════════════════════════════════════════

[Backend] SELECT * FROM ticket_types WHERE id = 1 AND event_id = 123
    ↓
[Database] Retorna ticket_type ✅
    {id: 1, event_id: 123, name: "Platea", price_cents: 5000, 
     capacity: 100, available: 85}
    ↓
[Backend] BEGIN TRANSACTION
    ↓
    UPDATE ticket_types 
    SET available = available - 2 
    WHERE id = 1 AND available >= 2
    ↓
    INSERT INTO ticket_reservations 
    (event_id, ticket_type_id, quantity, customer_name, customer_email, 
     customer_phone, status, expires_at)
    VALUES 
    (123, 1, 1, 'Juan Pérez', 'juan@example.com', '1234567890', 
     'ACTIVE', NOW() + INTERVAL '15 minutes'),
    (123, 1, 1, 'Juan Pérez', 'juan@example.com', '1234567890', 
     'ACTIVE', NOW() + INTERVAL '15 minutes')
    RETURNING id
    ↓
[Database] Retorna ids: [45, 46]
    ↓
[Backend] COMMIT TRANSACTION
    ↓
[Backend] Respuesta: 200 OK
    {
      "reservationIds": [45, 46],
      "reservations": [...],
      "totalAmount": 10000,
      "expiresAt": "2025-11-02T18:00:00Z",
      "message": "Reserva creada. Tienes 15 minutos para completar el pago."
    }
    ↓
[Frontend] message.success('Reserva creada. Tenés 15 minutos...')
    ↓
[Frontend] navigate('/checkout/temp', {state: {reservationIds: [45,46], ...}})
    ↓
[Usuario] Ve página de checkout ✅


FASE 6: CHECKOUT Y PAGO
═══════════════════════════════════════════════════════════════

[Usuario] En /checkout/temp
    ↓
[Frontend] Muestra resumen de compra
    - 2 entradas Platea
    - Total: $100.00
    - Expira en: 14:32 minutos
    ↓
[Usuario] Completa formulario de pago
    - Nombre: Juan
    - Apellido: Pérez
    - Email: juan@example.com
    - Teléfono: 11-12345678
    - DNI: 12345678
    ↓
[Usuario] Click "Pagar con Mercado Pago"
    ↓
[Frontend] POST /api/payments/create-preference-reservation
    Headers: {Authorization: "Bearer ..."}
    Body: {
      reservationIds: [45, 46],
      payer: {
        name: "Juan",
        surname: "Pérez",
        email: "juan@example.com",
        phone: {area_code: "11", number: "12345678"},
        identification: {type: "DNI", number: "12345678"}
      },
      backUrls: {
        success: "http://localhost:5173/payment/success",
        failure: "http://localhost:5173/payment/failure",
        pending: "http://localhost:5173/payment/pending"
      }
    }
    ↓ [200 OK]
[Backend] Valida reservationIds existen y están ACTIVE
    ↓
[Backend] Calcula total: 2 × $50.00 = $100.00
    ↓
[Backend] POST https://api.mercadopago.com/checkout/preferences
    Body: {
      items: [{
        title: "2 entradas - Concierto de Rock - Platea",
        quantity: 1,
        unit_price: 100.00
      }],
      payer: {...},
      back_urls: {...},
      external_reference: "45,46",
      expires: true,
      expiration_date_from: "2025-11-02T17:45:00Z",
      expiration_date_to: "2025-11-02T18:00:00Z"
    }
    ↓ [201 Created]
[Mercado Pago] Retorna preferencia
    {
      "id": "123456-abc-def",
      "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456-abc-def"
    }
    ↓
[Backend] Respuesta: 200 OK
    {
      "preferenceId": "123456-abc-def",
      "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456-abc-def",
      "totalAmount": 10000
    }
    ↓
[Frontend] window.location.href = initPoint
    ↓
[Usuario] Redirigido a Mercado Pago ✅


FASE 7: PAGO EN MERCADO PAGO
═══════════════════════════════════════════════════════════════

[Usuario] En sitio de Mercado Pago
    ↓
[Usuario] Ingresa datos de tarjeta
    - Número: 5031 7557 3453 0604 (tarjeta de prueba)
    - CVV: 123
    - Fecha: 11/25
    - Nombre: APRO
    ↓
[Usuario] Click "Pagar"
    ↓
[Mercado Pago] Procesa pago
    ↓
[Mercado Pago] POST http://localhost:3000/api/payments/webhook (IPN)
    Headers: {
      x-signature: "...",
      x-request-id: "..."
    }
    Body: {
      action: "payment.created",
      data: {
        id: "789012"
      }
    }
    ↓
[Backend] Valida firma de Mercado Pago ✅
    ↓
[Backend] GET https://api.mercadopago.com/v1/payments/789012
    ↓
[Mercado Pago] Retorna detalles del pago
    {
      "id": 789012,
      "status": "approved",
      "external_reference": "45,46",
      "transaction_amount": 100.00,
      ...
    }
    ↓
[Backend] BEGIN TRANSACTION
    ↓
    UPDATE ticket_reservations 
    SET status = 'PURCHASED', updated_at = NOW()
    WHERE id IN (45, 46)
    ↓
    INSERT INTO orders 
    (user_id, event_id, total_cents, status, payment_id, created_at)
    VALUES 
    (user_id, 123, 10000, 'PAID', 789012, NOW())
    RETURNING id
    ↓
    -- Genera 2 tickets con QR único
    INSERT INTO tickets 
    (order_id, ticket_type_id, ticket_number, qr_code, status, created_at)
    VALUES 
    (order_id, 1, '1-1730577600000-0', 'eyJhbGc...', 'ISSUED', NOW()),
    (order_id, 1, '1-1730577600000-1', 'eyJhbGc...', 'ISSUED', NOW())
    ↓
[Backend] COMMIT TRANSACTION
    ↓
[Backend] Envía email de confirmación (async)
    ↓
[Mercado Pago] Redirige usuario a:
    http://localhost:5173/payment/success?payment_id=789012&status=approved&external_reference=45,46
    ↓
[Usuario] Ve página de éxito ✅


FASE 8: CONFIRMACIÓN
═══════════════════════════════════════════════════════════════

[Usuario] En /payment/success
    ↓
[Frontend] Extrae payment_id de URL
    ↓
[Frontend] GET /api/payments/status/789012
    Headers: {Authorization: "Bearer ..."}
    ↓ [200 OK]
[Backend] SELECT o.*, t.* 
          FROM orders o
          LEFT JOIN tickets t ON t.order_id = o.id
          WHERE o.payment_id = 789012
    ↓
[Database] Retorna orden con tickets
    {
      "orderId": order_id,
      "paymentId": "789012",
      "status": "approved",
      "orderStatus": "PAID",
      "amount": 10000,
      "approvedAt": "2025-11-02T17:50:00Z",
      "tickets": [
        {
          "id": 1,
          "ticketNumber": "1-1730577600000-0",
          "qrCode": "eyJhbGc...",
          "status": "ISSUED"
        },
        {
          "id": 2,
          "ticketNumber": "1-1730577600000-1",
          "qrCode": "eyJhbGc...",
          "status": "ISSUED"
        }
      ]
    }
    ↓
[Frontend] Renderiza confirmación
    - ✅ Pago exitoso
    - Número de orden: #order_id
    - 2 entradas generadas
    - Botón "Ver Mis Entradas"
    - Botón "Descargar PDF"
    ↓
[Usuario] ✅ COMPRA COMPLETADA EXITOSAMENTE
```

---

## 2. FLUJO NUMERADO CON TIMESTAMPS

### Escenario Real (Con Fallos)

```
T+0:00  [Usuario] Abre http://localhost:5173/
T+0:05  [Frontend] GET /api/events → 200 OK (10 eventos)
T+0:10  [Usuario] Click en "Concierto de Rock"
T+0:12  [Frontend] GET /api/events/123 → 200 OK
T+0:13  [Frontend] GET /api/shows?eventId=123 → 200 OK (3 shows)
T+0:20  [Usuario] Click "Comprar" en show del 15/11
T+0:22  [Frontend] GET /api/shows/456 → 200 OK
T+0:23  [Frontend] GET /api/events/123/ticket-types → 200 OK []
T+0:24  [Frontend] ⚠️ Fallback: GET /api/shows/456/sections → 200 OK (3 sections)
T+0:30  [Usuario] Selecciona "Platea"
T+0:32  [Frontend] navigate('/seats/456')
T+0:40  [Usuario] Selecciona asientos A10, A11
T+0:45  [Usuario] Click "Continuar con la compra"
T+0:46  [Frontend] POST /api/tickets/reserve → ❌ 404 Not Found
T+0:47  [Frontend] message.error('Error al crear la reserva')
T+0:50  [Usuario] ❌ ABANDONA (frustrado)
```

**Tiempo total hasta fallo:** 50 segundos  
**Punto de fallo:** T+0:46 (POST /api/tickets/reserve)

---

## 3. PUNTOS DE FALLO IDENTIFICADOS

### Fallo #1: ticket_types vacío (T+0:23)

**Ubicación:** `ShowDetail.jsx` línea 50  
**Request:** `GET /api/events/123/ticket-types`  
**Response:** `[]` (array vacío)  
**Causa:** Tabla `ticket_types` sin datos  
**Impacto:** Medio (tiene fallback a sections V1)

### Fallo #2: Ruta no existe (T+0:46)

**Ubicación:** `SeatSelection.jsx` línea 113  
**Request:** `POST /api/tickets/reserve`  
**Response:** `404 Not Found`  
**Causa:** Backend no tiene ruta montada o está en `/api/ticket-types/tickets/reserve`  
**Impacto:** CRÍTICO (bloquea compra)

### Fallo #3: TicketTypeNotFound (alternativo)

**Ubicación:** Backend (si ruta existiera)  
**Request:** `POST /api/tickets/reserve` con `typeId: 1`  
**Response:** `404 TicketTypeNotFound`  
**Causa:** `typeId=1` es un `section_id`, no un `ticket_type_id`  
**Impacto:** CRÍTICO (bloquea compra)

---

## 4. DEPENDENCIAS ENTRE PASOS

```
Step 1 (GET /events) → Step 2 (GET /events/:id)
    ↓
Step 3 (GET /shows?eventId=X)
    ↓
Step 4 (GET /shows/:showId)
    ↓
Step 5 (GET /events/:eventId/ticket-types) ⚠️ FALLO #1
    ↓ (fallback)
Step 5b (GET /shows/:showId/sections) ✅ FUNCIONA
    ↓
Step 6 (navigate /seats/:showId con section data)
    ↓
Step 7 (Usuario selecciona asientos)
    ↓
Step 8 (POST /api/tickets/reserve) ❌ FALLO #2 o #3
    ↓ (bloqueado)
Step 9-14 (Checkout, Pago, Confirmación) 🚫 NUNCA SE EJECUTAN
```

**Conclusión:** El fallo en Step 8 bloquea completamente el flujo. Steps 9-14 son inalcanzables.

---

## 5. DATOS DE EJEMPLO

### Request Real (SeatSelection)

```javascript
// Timestamp: T+0:46
POST http://localhost:3000/api/tickets/reserve
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
Body: {
  "eventId": 123,
  "tickets": [
    {
      "typeId": 1,  // ⚠️ Este es section.id, no ticket_type_id
      "quantity": 2
    }
  ],
  "customerInfo": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890"
  }
}
```

### Response Real (404)

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "NotFound",
  "message": "Cannot POST /api/tickets/reserve"
}
```

---

**Documento relacionado:** `AUDITORIA_RESUMEN_EJECUTIVO.md`  
**Próximo:** `AUDITORIA_API_INVENTORY.md`
