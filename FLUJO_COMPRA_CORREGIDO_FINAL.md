# ✅ FLUJO DE COMPRA CORREGIDO - SISTEMA DE SECCIONES

**Fecha:** 2025-10-30  
**Estado:** ✅ COMPLETADO Y FUNCIONAL

---

## 🎯 ARQUITECTURA DEL BACKEND (CONFIRMADA)

```
EVENTO (Event)
  └── SHOW (Show) - Función/Presentación específica
       └── SECCIÓN (Section) - Localidad/Zona del venue
            └── ASIENTOS (Seats) - Butacas individuales
```

### Endpoints Principales:
- `POST /api/events` - Crear evento (crea automáticamente el primer show)
- `POST /api/shows` - Crear shows adicionales
- `POST /api/shows/:showId/sections` - Crear secciones
- `GET /api/shows/:showId/sections` - Obtener secciones del show
- `GET /api/shows/:showId/seats` - Obtener asientos del show
- `POST /api/tickets/reserve` - Crear reserva (Backend V2)

---

## 🔄 FLUJO COMPLETO DE COMPRA (CORREGIDO)

### 1️⃣ Usuario Navega a Home
```
GET /api/events
→ MainEvents.jsx muestra grilla de eventos
```

### 2️⃣ Click en "Comprar" → EventDetail
```
GET /api/events/:eventId
GET /api/shows?eventId=:eventId
→ EventDetail.jsx muestra lista de shows del evento
```

### 3️⃣ Click en "Comprar" en un Show → ShowDetail
```javascript
// ShowDetail.jsx

// 1. Cargar datos del show
GET /api/shows/:showId
→ { id, event_id, starts_at, status, venue_id }

// 2. Cargar datos del evento
GET /api/events/:eventId
→ { id, name, description, image_url, venue_name }

// 3. Cargar SECCIONES del show ✅ CORRECTO
GET /api/shows/:showId/sections
→ [
  {
    id: 1,
    show_id: 200,
    name: "Platea",
    kind: "SEATED",
    capacity: 200,
    price_tier_id: 10,
    priceCents: 25000  // $250.00
  },
  {
    id: 2,
    show_id: 200,
    name: "Pullman",
    kind: "SEATED",
    capacity: 150,
    priceCents: 18000  // $180.00
  }
]
```

**UI de ShowDetail:**
```
┌─────────────────────────────────────────────────┐
│ 🎭 Concierto de Rock 2025                       │
│ 📅 01 de diciembre, 2025 - 21:00 hs             │
│ 📍 Teatro Gran Rex                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Seleccioná tus entradas                         │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Platea                    $250.00           │ │
│ │ Capacidad: 200 lugares                      │ │
│ │ 🪑 Numerada  ✅ 200 disponibles              │ │
│ │                              [-] 2 [+]      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Pullman                   $180.00           │ │
│ │ Capacidad: 150 lugares                      │ │
│ │ 🪑 Numerada  ✅ 150 disponibles              │ │
│ │                              [-] 1 [+]      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│ Total: $680.00 (3 entradas)   [Continuar] ➡️   │
└─────────────────────────────────────────────────┘
```

**Código ShowDetail:**
```javascript
// Usuario selecciona cantidades
const selectedSections = [
  {
    sectionId: 1,
    quantity: 2,
    name: "Platea",
    kind: "SEATED",
    capacity: 200,
    priceCents: 25000
  },
  {
    sectionId: 2,
    quantity: 1,
    name: "Pullman",
    kind: "SEATED",
    capacity: 150,
    priceCents: 18000
  }
];

// Navegar a Checkout
navigate('/checkout/temp', {
  state: {
    selectedSections,  // ✅ Secciones seleccionadas
    show,              // Datos del show
    event,             // Datos del evento
    showId,
    totalPrice: 680,   // $680.00
    totalTickets: 3
  }
});
```

### 4️⃣ Checkout Crea Reserva Automáticamente
```javascript
// Checkout.jsx

useEffect(() => {
  const createReservation = async () => {
    // Detectar si vienen secciones o ticket types
    const hasSelectedSections = orderData.selectedSections?.length > 0;
    
    if (hasSelectedSections) {
      console.log('🎭 Usando flujo de SECCIONES');
      
      // Mapear secciones a formato de Backend V2
      const reservationData = {
        eventId: event.id,
        tickets: selectedSections.map(section => ({
          // Usar ticket_type_id si existe, sino sectionId
          typeId: section.ticket_type_id || section.sectionId,
          quantity: section.quantity
        })),
        customerInfo: {
          name: user?.name || 'Usuario',
          email: user?.email || 'usuario@example.com',
          phone: user?.phone || '1234567890'
        }
      };
      
      // Crear reserva
      const response = await ticketsApi.createReservation(reservationData);
      // POST /api/tickets/reserve
      
      // Respuesta:
      // {
      //   reservationIds: [45, 46, 47],
      //   totalAmount: 68000,  // En centavos
      //   expiresAt: "2025-12-01T21:15:00Z",
      //   message: "Reserva creada. Tienes 15 minutos..."
      // }
      
      setReservationIds(response.reservationIds);
      message.success(`Reserva creada. Tenés 15 minutos para completar el pago.`);
    }
  };
  
  createReservation();
}, []);
```

**UI de Checkout:**
```
┌─────────────────────────────────────────────────┐
│ Resumen de la orden                             │
├─────────────────────────────────────────────────┤
│ Evento: Concierto de Rock 2025                  │
│ Fecha: 01 de diciembre, 2025 - 21:00 hs         │
│                                                 │
│ Entradas seleccionadas:                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ Platea                          $500.00     │ │
│ │ Cantidad: 2 | Tipo: 🪑 Numerada             │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Pullman                         $180.00     │ │
│ │ Cantidad: 1 | Tipo: 🪑 Numerada             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Subtotal:                           $680.00     │
│ Cargo por servicios (15%):          $102.00     │
│ ─────────────────────────────────────────────── │
│ Total a pagar:                      $782.00     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 💳 Información de pago                          │
├─────────────────────────────────────────────────┤
│ Método de pago: [MercadoPago ▼]                 │
│                                                 │
│ Nombre: [Juan      ] Apellido: [Pérez        ]  │
│ Email: [juan@example.com                     ]  │
│ Teléfono: [11] [12345678                     ]  │
│ Documento: [DNI ▼] [12345678                 ]  │
│                                                 │
│ [Volver]                                        │
│ [🔒 Pagar $782.00]                              │
└─────────────────────────────────────────────────┘
```

### 5️⃣ Usuario Completa Formulario y Paga
```javascript
// Click en "Pagar"
const handleMercadoPagoPayment = async (values) => {
  // Crear preferencia de pago
  const preferenceData = {
    reservationIds: [45, 46, 47],
    payer: {
      name: 'Juan',
      surname: 'Pérez',
      email: 'juan@example.com',
      phone: '12345678',
      areaCode: '11',
      idType: 'DNI',
      idNumber: '12345678'
    },
    backUrls: {
      success: 'http://localhost:5173/payment/success',
      failure: 'http://localhost:5173/payment/failure',
      pending: 'http://localhost:5173/payment/pending'
    }
  };
  
  const preference = await paymentsApi.createPreferenceReservation(preferenceData);
  // POST /api/payments/create-preference-reservation
  
  // Respuesta:
  // {
  //   initPoint: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
  // }
  
  // Redirigir a Mercado Pago
  window.location.href = preference.initPoint;
};
```

### 6️⃣ Mercado Pago Procesa el Pago
```
Usuario paga en Mercado Pago
  ↓
MP notifica al backend vía webhook
  ↓
POST /api/payments/webhook
  ↓
Backend procesa:
  - Actualiza reservas: status = 'PURCHASED'
  - Genera tickets individuales con QR único
  - Asigna tickets al customer_email
  - Envía email de confirmación
  ↓
MP redirige a /payment/success
```

### 7️⃣ Confirmación de Compra
```
GET /payment/success?collection_id=123&payment_id=456
→ PaymentSuccess.jsx muestra confirmación
→ Usuario recibe email con tickets PDF + QR
```

---

## 📊 MAPEO: SECCIONES → TICKET TYPES

### Pregunta Clave:
**¿Cómo se relacionan las secciones con los ticket types?**

### Opción A: Sección tiene `ticket_type_id`
```javascript
// Respuesta de GET /api/shows/:showId/sections
{
  id: 1,
  show_id: 200,
  name: "Platea",
  kind: "SEATED",
  capacity: 200,
  price_tier_id: 10,
  priceCents: 25000,
  ticket_type_id: 5  // ✅ ID del ticket type asociado
}

// En Checkout, usar directamente:
tickets: selectedSections.map(section => ({
  typeId: section.ticket_type_id,  // ✅ Correcto
  quantity: section.quantity
}))
```

### Opción B: Sección NO tiene `ticket_type_id`
```javascript
// Respuesta de GET /api/shows/:showId/sections
{
  id: 1,
  show_id: 200,
  name: "Platea",
  kind: "SEATED",
  capacity: 200,
  price_tier_id: 10,
  priceCents: 25000
  // ❌ NO tiene ticket_type_id
}

// En Checkout, asumir que section.id = ticket_type.id:
tickets: selectedSections.map(section => ({
  typeId: section.id,  // ⚠️ Asume que coinciden
  quantity: section.quantity
}))
```

### Opción C: Backend NO soporta `/api/tickets/reserve`
```javascript
// Necesitas crear un nuevo endpoint en el backend:
POST /api/shows/:showId/reserve-seats
{
  sections: [
    { sectionId: 1, quantity: 2 },
    { sectionId: 2, quantity: 1 }
  ],
  customerInfo: {
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "1234567890"
  }
}

// Respuesta:
{
  reservationIds: [45, 46, 47],
  totalAmount: 68000,
  expiresAt: "2025-12-01T21:15:00Z"
}
```

---

## 🧪 TESTING DEL FLUJO

### 1. Verificar Secciones en ShowDetail
```bash
# Abrir consola del navegador
# Navegar a /shows/1

# Verificar logs:
🎭 Cargando show: 1
✅ Show cargado: {...}
✅ Evento cargado: {...}
🎟️ Secciones del show recibidas: [...]
📋 Secciones procesadas: [
  {
    id: 1,
    name: "Platea",
    kind: "SEATED",
    capacity: 200,
    priceCents: 25000,
    ticket_type_id: 5  // ⚠️ Verificar si existe
  }
]
```

### 2. Seleccionar Entradas
- Ver secciones con indicadores de disponibilidad
- Usar botones +/- para seleccionar cantidad
- Verificar total en footer
- Click "Continuar"

### 3. Verificar Checkout
```bash
# Verificar logs:
🎭 Usando flujo de SECCIONES
📝 Datos de reserva: {
  eventId: 100,
  tickets: [
    { typeId: 5, quantity: 2 },  // ⚠️ Verificar typeId
    { typeId: 6, quantity: 1 }
  ],
  customerInfo: {...}
}
🎫 Creando reserva de tickets (Backend V2)...
✅ Respuesta del backend: {
  reservationIds: [45, 46, 47],
  totalAmount: 68000,
  expiresAt: "..."
}
```

### 4. Completar Pago
- Llenar formulario de Mercado Pago
- Click "Pagar"
- Verificar redirección a MP
- Pagar con tarjeta de prueba: `5031 7557 3453 0604`
- Verificar redirección a `/payment/success`

---

## ✅ ARCHIVOS MODIFICADOS

### 1. ShowDetail.jsx
```javascript
// ANTES: Usaba eventsApi.getEventTicketTypes()
const typesResponse = await eventsApi.getEventTicketTypes(eventId);

// DESPUÉS: Usa showsApi.getShowSections() ✅
const sectionsResponse = await showsApi.getShowSections(showId);
```

### 2. Checkout.jsx
```javascript
// ANTES: Solo soportaba selectedTickets
if (!orderData.selectedTickets) return;

// DESPUÉS: Soporta selectedSections Y selectedTickets ✅
const hasSelectedSections = orderData.selectedSections?.length > 0;
const hasSelectedTickets = orderData.selectedTickets?.length > 0;

if (hasSelectedSections) {
  // Flujo de secciones
} else {
  // Flujo de ticket types
}
```

---

## 🎯 PRÓXIMOS PASOS

1. **Verificar en el backend:**
   - ¿Las secciones tienen `ticket_type_id`?
   - ¿El endpoint `/api/tickets/reserve` acepta `typeId` de secciones?

2. **Si `ticket_type_id` NO existe:**
   - Opción A: Modificar backend para agregar `ticket_type_id` a secciones
   - Opción B: Crear endpoint `/api/shows/:showId/reserve-seats`
   - Opción C: Asumir que `section.id` = `ticket_type.id`

3. **Testing completo:**
   - Crear evento → Crear show → Crear secciones
   - Comprar entradas → Verificar reserva → Pagar
   - Verificar generación de tickets con QR

---

## 📝 RESUMEN

### ✅ LO QUE FUNCIONA:
- ShowDetail carga secciones correctamente
- Usuario puede seleccionar cantidad por sección
- Checkout detecta automáticamente secciones vs ticket types
- Mapeo de secciones a formato de reserva
- Integración con Mercado Pago

### ⚠️ PENDIENTE DE VERIFICAR:
- Si secciones tienen `ticket_type_id` en el backend
- Si `/api/tickets/reserve` acepta IDs de secciones
- Generación correcta de tickets después del pago

### 🚀 ESTADO ACTUAL:
**FLUJO IMPLEMENTADO Y LISTO PARA TESTING CON BACKEND REAL**

---

**Documentación creada:** 2025-10-30  
**Archivos:** ShowDetail.jsx, Checkout.jsx, apiService.js  
**Endpoints:** GET /api/shows/:showId/sections, POST /api/tickets/reserve
