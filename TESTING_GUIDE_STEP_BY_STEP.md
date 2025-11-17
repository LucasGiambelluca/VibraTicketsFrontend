# 🧪 GUÍA DE TESTING PASO A PASO - Sistema de Ticketera

## 📌 BASE URL
```
http://localhost:3000/api
```

---

## 🎯 FLUJO COMPLETO: COMPRA DE TICKETS

### ✅ PASO 1: Obtener Lista de Eventos

**Endpoint:**
```http
GET /api/events
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/events
```

**Ejemplo JavaScript (Frontend):**
```javascript
const response = await fetch('http://localhost:3000/api/events');
const data = await response.json();
console.log('Eventos:', data.events);
```

**Respuesta esperada:**
```json
{
  "events": [
    {
      "id": 1,
      "name": "Concierto Rock",
      "venue_name": "Teatro Gran Rex",
      "venue_city": "Buenos Aires",
      "image_url": "...",
      "next_show_date": "2025-11-15T20:00:00.000Z",
      "show_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

### ✅ PASO 2: Ver Detalles de un Evento

**Endpoint:**
```http
GET /api/events/:id
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/events/1
```

**JavaScript:**
```javascript
const eventId = 1;
const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
const event = await response.json();
console.log('Evento:', event);
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "name": "Concierto Rock",
  "description": "Gran concierto de rock",
  "venue_name": "Teatro Gran Rex",
  "venue_address": "Av. Corrientes 857",
  "venue_city": "Buenos Aires",
  "venue_capacity": 3300,
  "shows": [
    {
      "id": 1,
      "starts_at": "2025-11-15T20:00:00.000Z",
      "status": "PUBLISHED"
    }
  ]
}
```

---

### ✅ PASO 3: Obtener Tipos de Tickets Disponibles

**Endpoint:**
```http
GET /api/events/:eventId/ticket-types
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/events/1/ticket-types
```

**JavaScript:**
```javascript
const eventId = 1;
const response = await fetch(`http://localhost:3000/api/events/${eventId}/ticket-types`);
const data = await response.json();
console.log('Tipos de tickets:', data.ticketTypes);
```

**Respuesta esperada:**
```json
{
  "event": {
    "id": 1,
    "name": "Concierto Rock"
  },
  "ticketTypes": [
    {
      "id": 1,
      "name": "General",
      "description": "Entrada general",
      "price_cents": 5000,
      "price": 50,
      "quantity_total": 100,
      "quantity_sold": 10,
      "quantity_reserved": 5,
      "available": 85,
      "isOnSale": true,
      "availability": "available",
      "sale_start": null,
      "sale_end": null
    },
    {
      "id": 2,
      "name": "VIP",
      "description": "Entrada VIP con acceso preferencial",
      "price_cents": 15000,
      "price": 150,
      "quantity_total": 50,
      "quantity_sold": 5,
      "quantity_reserved": 2,
      "available": 43,
      "isOnSale": true,
      "availability": "available"
    }
  ]
}
```

---

### ✅ PASO 4: Crear Reserva de Tickets

**⚠️ IMPORTANTE:** Este es el paso clave cuando el usuario selecciona tickets en el frontend.

**Endpoint:**
```http
POST /api/tickets/reserve
```

**Body (JSON):**
```json
{
  "eventId": 1,
  "tickets": [
    {
      "typeId": 1,
      "quantity": 2
    },
    {
      "typeId": 2,
      "quantity": 1
    }
  ],
  "customerInfo": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/tickets/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "tickets": [
      {"typeId": 1, "quantity": 2}
    ],
    "customerInfo": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "1234567890"
    }
  }'
```

**JavaScript (Frontend):**
```javascript
async function crearReserva(eventId, ticketsSeleccionados, customerInfo) {
  const response = await fetch('http://localhost:3000/api/tickets/reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventId,
      tickets: ticketsSeleccionados, // [{ typeId: 1, quantity: 2 }]
      customerInfo
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al crear reserva');
  }
  
  return data;
}

// Uso:
const reserva = await crearReserva(1, [
  { typeId: 1, quantity: 2 }
], {
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '1234567890'
});

console.log('Reserva creada:', reserva);
// Guardar reservationIds para el siguiente paso
localStorage.setItem('reservationIds', JSON.stringify(reserva.reservationIds));
```

**Respuesta esperada:**
```json
{
  "reservationIds": [45, 46],
  "reservations": [
    {
      "id": 45,
      "ticketTypeId": 1,
      "ticketTypeName": "General",
      "quantity": 2,
      "unitPrice": 5000,
      "subtotal": 10000,
      "expiresAt": "2025-10-29T18:00:00.000Z"
    }
  ],
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890"
  },
  "totalAmount": 10000,
  "totalAmountFormatted": "100.00",
  "expiresAt": "2025-10-29T18:00:00.000Z",
  "message": "Reserva creada exitosamente. Tienes 15 minutos para completar el pago."
}
```

**⏰ IMPORTANTE:** La reserva expira en 15 minutos. Después de ese tiempo, los tickets vuelven a estar disponibles.

---

### ✅ PASO 5: Crear Preferencia de Pago en MercadoPago

**Endpoint:**
```http
POST /api/payments/create-preference-reservation
```

**Body (JSON):**
```json
{
  "reservationIds": [45, 46],
  "payer": {
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan@example.com",
    "phone": {
      "area_code": "11",
      "number": "1234567890"
    }
  },
  "backUrls": {
    "success": "http://localhost:5173/payment/success",
    "failure": "http://localhost:5173/payment/failure",
    "pending": "http://localhost:5173/payment/pending"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/payments/create-preference-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "reservationIds": [45],
    "payer": {
      "name": "Juan",
      "surname": "Pérez",
      "email": "juan@example.com",
      "phone": {
        "area_code": "11",
        "number": "1234567890"
      }
    },
    "backUrls": {
      "success": "http://localhost:5173/payment/success",
      "failure": "http://localhost:5173/payment/failure",
      "pending": "http://localhost:5173/payment/pending"
    }
  }'
```

**JavaScript (Frontend):**
```javascript
async function crearPreferenciaPago(reservationIds, customerInfo) {
  const response = await fetch('http://localhost:3000/api/payments/create-preference-reservation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reservationIds,
      payer: {
        name: customerInfo.name.split(' ')[0],
        surname: customerInfo.name.split(' ').slice(1).join(' ') || 'Cliente',
        email: customerInfo.email,
        phone: {
          area_code: '11',
          number: customerInfo.phone
        }
      },
      backUrls: {
        success: `${window.location.origin}/payment/success`,
        failure: `${window.location.origin}/payment/failure`,
        pending: `${window.location.origin}/payment/pending`
      }
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al crear preferencia de pago');
  }
  
  return data;
}

// Uso:
const reservationIds = JSON.parse(localStorage.getItem('reservationIds'));
const preferencia = await crearPreferenciaPago(reservationIds, {
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '1234567890'
});

console.log('Preferencia creada:', preferencia);
// Redirigir a MercadoPago
window.location.href = preferencia.initPoint;
```

**Respuesta esperada:**
```json
{
  "reservationIds": [45],
  "preferenceId": "123456789-abcd-efgh-ijkl-123456789012",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcd-efgh-ijkl-123456789012",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcd-efgh-ijkl-123456789012",
  "totalAmount": 10000,
  "totalAmountFormatted": "100.00",
  "itemCount": 2
}
```

---

### ✅ PASO 6: Redirigir a MercadoPago

**JavaScript:**
```javascript
// Después de crear la preferencia, redirigir al usuario
window.location.href = preferencia.initPoint; // Producción
// O para testing:
window.location.href = preferencia.sandboxInitPoint; // Sandbox
```

---

### ✅ PASO 7: Webhook Automático (Backend)

**⚠️ IMPORTANTE:** Este paso es automático. MercadoPago envía una notificación al backend cuando el pago es procesado.

**Endpoint (solo para MercadoPago):**
```http
POST /api/payments/webhook
```

**Qué hace el webhook:**
1. Recibe notificación de MercadoPago
2. Verifica el estado del pago
3. Si está aprobado:
   - Marca las reservas como `PURCHASED`
   - Genera tickets individuales con QR codes
   - Envía email de confirmación al cliente
4. Si está rechazado/cancelado:
   - Marca las reservas como `CANCELLED`
   - Libera los tickets para que otros puedan comprarlos

---

### ✅ PASO 8: Verificar Estado de la Reserva

**Endpoint:**
```http
GET /api/tickets/reservations/:reservationId
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/tickets/reservations/45
```

**JavaScript:**
```javascript
async function verificarReserva(reservationId) {
  const response = await fetch(`http://localhost:3000/api/tickets/reservations/${reservationId}`);
  const data = await response.json();
  return data;
}

const reserva = await verificarReserva(45);
console.log('Estado de la reserva:', reserva.status);
// Posibles estados: 'ACTIVE', 'PURCHASED', 'CANCELLED', 'EXPIRED'
```

**Respuesta esperada:**
```json
{
  "id": 45,
  "eventId": 1,
  "eventName": "Concierto Rock",
  "ticketType": {
    "id": 1,
    "name": "General",
    "price": 5000
  },
  "quantity": 2,
  "totalAmount": 10000,
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890"
  },
  "status": "PURCHASED",
  "expiresAt": "2025-10-29T18:00:00.000Z",
  "createdAt": "2025-10-29T17:45:00.000Z",
  "isExpired": false
}
```

---

## 🎨 EJEMPLO COMPLETO EN REACT

```jsx
import React, { useState, useEffect } from 'react';

function CompraTickets({ eventId }) {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  // 1. Cargar tipos de tickets
  useEffect(() => {
    async function loadTicketTypes() {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/ticket-types`);
      const data = await response.json();
      setTicketTypes(data.ticketTypes);
    }
    loadTicketTypes();
  }, [eventId]);

  // 2. Agregar ticket a la selección
  const agregarTicket = (typeId, quantity) => {
    const existing = selectedTickets.find(t => t.typeId === typeId);
    if (existing) {
      setSelectedTickets(selectedTickets.map(t => 
        t.typeId === typeId ? { ...t, quantity: t.quantity + quantity } : t
      ));
    } else {
      setSelectedTickets([...selectedTickets, { typeId, quantity }]);
    }
  };

  // 3. Calcular total
  const calcularTotal = () => {
    return selectedTickets.reduce((total, ticket) => {
      const type = ticketTypes.find(t => t.id === ticket.typeId);
      return total + (type ? type.price * ticket.quantity : 0);
    }, 0);
  };

  // 4. Procesar compra
  const procesarCompra = async () => {
    setLoading(true);
    try {
      // Paso 1: Crear reserva
      const reservaResponse = await fetch('http://localhost:3000/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          tickets: selectedTickets,
          customerInfo
        })
      });
      
      if (!reservaResponse.ok) {
        const error = await reservaResponse.json();
        throw new Error(error.message || 'Error al crear reserva');
      }
      
      const reserva = await reservaResponse.json();
      console.log('Reserva creada:', reserva);
      
      // Paso 2: Crear preferencia de pago
      const pagoResponse = await fetch('http://localhost:3000/api/payments/create-preference-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationIds: reserva.reservationIds,
          payer: {
            name: customerInfo.name.split(' ')[0],
            surname: customerInfo.name.split(' ').slice(1).join(' ') || 'Cliente',
            email: customerInfo.email,
            phone: {
              area_code: '11',
              number: customerInfo.phone
            }
          },
          backUrls: {
            success: `${window.location.origin}/payment/success`,
            failure: `${window.location.origin}/payment/failure`,
            pending: `${window.location.origin}/payment/pending`
          }
        })
      });
      
      if (!pagoResponse.ok) {
        const error = await pagoResponse.json();
        throw new Error(error.message || 'Error al crear preferencia de pago');
      }
      
      const pago = await pagoResponse.json();
      console.log('Preferencia creada:', pago);
      
      // Guardar info en localStorage para la página de retorno
      localStorage.setItem('lastPurchase', JSON.stringify({
        reservationIds: reserva.reservationIds,
        totalAmount: reserva.totalAmount,
        eventId
      }));
      
      // Paso 3: Redirigir a MercadoPago
      window.location.href = pago.initPoint;
      
    } catch (error) {
      console.error('Error en la compra:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compra-tickets">
      <h2>Seleccionar Tickets</h2>
      
      {/* Lista de tipos de tickets */}
      <div className="ticket-types">
        {ticketTypes.map(type => (
          <div key={type.id} className="ticket-type">
            <h3>{type.name}</h3>
            <p>{type.description}</p>
            <p className="price">${type.price}</p>
            <p className="available">Disponibles: {type.available}</p>
            {type.isOnSale ? (
              <button onClick={() => agregarTicket(type.id, 1)}>
                Agregar
              </button>
            ) : (
              <p className="not-on-sale">No disponible</p>
            )}
          </div>
        ))}
      </div>
      
      {/* Resumen de compra */}
      {selectedTickets.length > 0 && (
        <div className="resumen">
          <h3>Resumen</h3>
          {selectedTickets.map(ticket => {
            const type = ticketTypes.find(t => t.id === ticket.typeId);
            return (
              <div key={ticket.typeId}>
                {type?.name} x {ticket.quantity} = ${type?.price * ticket.quantity}
              </div>
            );
          })}
          <div className="total">
            <strong>Total: ${calcularTotal()}</strong>
          </div>
        </div>
      )}
      
      {/* Formulario de datos del cliente */}
      {selectedTickets.length > 0 && (
        <div className="customer-form">
          <h3>Tus Datos</h3>
          <input
            type="text"
            placeholder="Nombre completo"
            value={customerInfo.name}
            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            value={customerInfo.email}
            onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={customerInfo.phone}
            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
          />
          
          <button 
            onClick={procesarCompra} 
            disabled={loading || !customerInfo.name || !customerInfo.email}
            className="btn-comprar"
          >
            {loading ? 'Procesando...' : 'Ir a Pagar'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CompraTickets;
```

---

## 📝 PÁGINA DE RETORNO (Success)

```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  
  useEffect(() => {
    async function verificarPago() {
      const paymentId = searchParams.get('payment_id');
      const preferenceId = searchParams.get('preference_id');
      
      // Recuperar info de la compra
      const purchaseInfo = JSON.parse(localStorage.getItem('lastPurchase') || '{}');
      
      if (purchaseInfo.reservationIds) {
        // Verificar estado de la primera reserva
        const reservationId = purchaseInfo.reservationIds[0];
        const response = await fetch(`http://localhost:3000/api/tickets/reservations/${reservationId}`);
        const data = await response.json();
        
        if (data.status === 'PURCHASED') {
          setStatus('success');
        } else {
          setStatus('pending');
        }
      }
    }
    
    verificarPago();
  }, [searchParams]);
  
  return (
    <div className="payment-result">
      {status === 'loading' && <p>Verificando pago...</p>}
      {status === 'success' && (
        <div className="success">
          <h1>✅ ¡Pago Exitoso!</h1>
          <p>Tu compra ha sido procesada correctamente.</p>
          <p>Recibirás un email con tus tickets.</p>
        </div>
      )}
      {status === 'pending' && (
        <div className="pending">
          <h1>⏳ Pago Pendiente</h1>
          <p>Tu pago está siendo procesado.</p>
        </div>
      )}
    </div>
  );
}

export default PaymentSuccess;
```

---

## 🔍 TESTING CON POSTMAN

### Colección de Postman

1. **Crear nueva colección**: "Ticketera API"
2. **Agregar variable de entorno**: `base_url = http://localhost:3000/api`

### Requests a crear:

1. **GET Eventos**
   - URL: `{{base_url}}/events`
   - Method: GET

2. **GET Evento por ID**
   - URL: `{{base_url}}/events/1`
   - Method: GET

3. **GET Tipos de Tickets**
   - URL: `{{base_url}}/events/1/ticket-types`
   - Method: GET

4. **POST Crear Reserva**
   - URL: `{{base_url}}/tickets/reserve`
   - Method: POST
   - Body (JSON):
   ```json
   {
     "eventId": 1,
     "tickets": [{"typeId": 1, "quantity": 2}],
     "customerInfo": {
       "name": "Test User",
       "email": "test@example.com",
       "phone": "1234567890"
     }
   }
   ```

5. **POST Crear Preferencia de Pago**
   - URL: `{{base_url}}/payments/create-preference-reservation`
   - Method: POST
   - Body (JSON):
   ```json
   {
     "reservationIds": [45],
     "payer": {
       "name": "Test",
       "surname": "User",
       "email": "test@example.com",
       "phone": {"area_code": "11", "number": "1234567890"}
     },
     "backUrls": {
       "success": "http://localhost:5173/success",
       "failure": "http://localhost:5173/failure",
       "pending": "http://localhost:5173/pending"
     }
   }
   ```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error 404: "NotFound" en /api/events/1/ticket-types
**Solución:** Ya corregido. La ruta ahora está montada correctamente en `/` en lugar de `/ticket-types`.

### Error 409: "InsufficientStock"
**Causa:** No hay suficientes tickets disponibles.
**Solución:** Verificar disponibilidad antes de crear reserva.

### Error 400: "TicketNotOnSale"
**Causa:** El ticket no está en período de venta o está inactivo.
**Solución:** Verificar `isOnSale` antes de permitir selección.

### Reserva expira antes de pagar
**Causa:** Pasaron más de 15 minutos.
**Solución:** Crear nueva reserva.

### No recibo email de confirmación
**Causa:** Servicio de email no configurado o error en envío.
**Solución:** Verificar logs del servidor y configuración SMTP.

---

## 🎯 CHECKLIST DE TESTING

- [ ] ✅ Listar eventos
- [ ] ✅ Ver detalle de evento
- [ ] ✅ Ver tipos de tickets disponibles
- [ ] ✅ Crear reserva con 1 tipo de ticket
- [ ] ✅ Crear reserva con múltiples tipos de tickets
- [ ] ✅ Verificar que la reserva reduce el stock disponible
- [ ] ✅ Crear preferencia de pago
- [ ] ✅ Redirigir a MercadoPago
- [ ] ✅ Completar pago en sandbox
- [ ] ✅ Verificar que el webhook procesa el pago
- [ ] ✅ Verificar que la reserva cambia a PURCHASED
- [ ] ✅ Verificar que se generan tickets con QR
- [ ] ✅ Verificar que se envía email de confirmación
- [ ] ✅ Probar reserva expirada (esperar 15 minutos)
- [ ] ✅ Verificar que el stock se libera al expirar

---

## 🚀 PRÓXIMOS PASOS

1. **Integrar con tu frontend React/Vue/Angular**
2. **Configurar MercadoPago en modo sandbox para testing**
3. **Configurar servicio de email (SMTP)**
4. **Implementar manejo de errores en el frontend**
5. **Agregar loading states y feedback visual**
6. **Implementar timer de expiración de reserva en el frontend**

---

**✅ Sistema listo para testing completo**
