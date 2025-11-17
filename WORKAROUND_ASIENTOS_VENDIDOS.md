# 🚧 WORKAROUND: Filtro de Asientos Vendidos

## 🐛 PROBLEMA DETECTADO

**El backend NO actualiza el status de los asientos después de la venta.**

### Estado Actual:
```
Asiento 1: Status = "AVAILABLE" ❌ (debería ser "SOLD")
Asiento 2: Status = "AVAILABLE" ❌ (debería ser "SOLD")
```

### Causa:
El backend no está ejecutando `UPDATE seats SET status = 'SOLD'` cuando:
- Se completa el pago (webhook de Mercado Pago)
- Se emiten los tickets

**Resultado:** Los asientos quedan como "AVAILABLE" para siempre, causando que se puedan "vender" múltiples veces.

---

## ✅ WORKAROUND IMPLEMENTADO (Frontend)

### Solución Temporal:
**Filtrar asientos que YA tienen tickets emitidos**, además del filtro por status.

### Lógica:
```javascript
// 1. Obtener tickets del show
const tickets = await showsApi.getShowTickets(showId);

// 2. Extraer seat_ids de los tickets
const soldSeatIds = tickets.map(t => t.seat_id);

// 3. Filtrar asientos
const availableSeats = seats.filter(seat => 
  seat.status === 'AVAILABLE' &&    // Status OK
  !soldSeatIds.includes(seat.id)    // ← WORKAROUND: No tiene ticket
);
```

---

## 📁 ARCHIVOS MODIFICADOS

### 1. `apiService.js`
**Agregado:**
```javascript
export const showsApi = {
  // ... otros métodos ...
  
  // Obtener tickets emitidos de un show (para workaround de status)
  getShowTickets: (showId) => {
    console.log('🎫 Obteniendo tickets del show:', showId);
    return apiClient.get(`${API_BASE}/shows/${showId}/tickets`);
  }
};
```

### 2. `ShowDetail.jsx`
**Modificado `loadSeats()`:**
```javascript
const loadSeats = async () => {
  try {
    // 🚧 WORKAROUND: Obtener tickets del show
    let soldSeatIds = [];
    try {
      const ticketsResponse = await showsApi.getShowTickets(showId);
      const ticketsList = Array.isArray(ticketsResponse) 
        ? ticketsResponse 
        : (ticketsResponse?.tickets || ticketsResponse?.data || []);
      
      soldSeatIds = ticketsList
        .map(ticket => ticket.seat_id || ticket.seatId)
        .filter(Boolean);
      
      console.log('🚫 Asientos con tickets (vendidos):', soldSeatIds);
    } catch (ticketsError) {
      console.warn('⚠️ No se pudieron cargar tickets:', ticketsError.message);
      // Continuar sin el filtro de tickets
    }
    
    // Cargar asientos
    const seatsResponse = await showsApi.getShowSeats(showId);
    const seatsList = seatsResponse?.seats || seatsResponse;
    
    // Filtrar: AVAILABLE + NO tiene ticket
    const availableSeats = seatsList.filter(seat => {
      const isAvailable = seat.status === 'AVAILABLE';
      const hasSoldTicket = soldSeatIds.includes(seat.id);
      
      // 🚧 WORKAROUND: Excluir si tiene ticket
      if (hasSoldTicket) {
        return false; // No disponible
      }
      
      return isAvailable;
    });
    
    return availableSeats;
  } catch (error) {
    console.error('Error al cargar asientos:', error);
    return [];
  }
};
```

---

## 🧪 TESTING

### Flujo Esperado:

1. **Cargar página** `/shows/1`
   ```
   🚧 WORKAROUND: Cargando tickets del show para filtrar vendidos...
   🎫 Tickets encontrados: 3
   🚫 Asientos con tickets (vendidos): [1, 2, 3]
   🔬 PRIMEROS 10 ASIENTOS CON STATUS:
     - ID: 1, Status: "AVAILABLE", HasTicket: true
     - ID: 2, Status: "AVAILABLE", HasTicket: true
     - ID: 3, Status: "AVAILABLE", HasTicket: true
     - ID: 4, Status: "AVAILABLE", HasTicket: false
   🚫 Asiento 1 EXCLUIDO: tiene ticket asociado
   🚫 Asiento 2 EXCLUIDO: tiene ticket asociado
   🚫 Asiento 3 EXCLUIDO: tiene ticket asociado
   ✅ Asientos disponibles (después de filtros): 97
   🆔 IDs disponibles: [4, 5, 6, 7, 8, 9, 10, 11, ...]
   ✅ Verificación OK: Asientos 1 y 2 excluidos correctamente
   ```

2. **Seleccionar 2 entradas y "Continuar"**
   ```
   🔄 Recargando asientos antes de crear hold...
   🆕 Asientos recién cargados: 97
   🔍 Buscando asientos para sección: "vip delantero"
   ✅ Asientos encontrados: 97
   📌 Asientos seleccionados: [4, 5]  ← ✅ CORRECTO (no 1, 2)
   🔒 Creando HOLD: { seatIds: [4, 5], ... }
   ✅ HOLD creado exitosamente
   ```

3. **Backend responde:**
   ```
   200 OK
   {
     "holdId": 125,
     "items": [
       { "seatId": 4, "seatNumber": "GA4" },
       { "seatId": 5, "seatNumber": "GA5" }
     ]
   }
   ```

---

## 🔧 ENDPOINT REQUERIDO EN BACKEND

El workaround necesita este endpoint:

```
GET /api/shows/:showId/tickets
```

**Respuesta esperada:**
```json
{
  "tickets": [
    {
      "id": 1,
      "order_id": 123,
      "seat_id": "1",
      "seat_number": "GA1",
      "status": "ISSUED"
    },
    {
      "id": 2,
      "order_id": 123,
      "seat_id": "2",
      "seat_number": "GA2",
      "status": "ISSUED"
    }
  ]
}
```

**Query SQL sugerida:**
```sql
SELECT 
  t.id,
  t.order_id,
  t.seat_id,
  s.seat_number,
  t.status
FROM tickets t
INNER JOIN seats s ON s.id = t.seat_id
WHERE s.show_id = ?
AND t.status IN ('ISSUED', 'REDEEMED')
ORDER BY t.id;
```

---

## ⚠️ LIMITACIONES DEL WORKAROUND

### Problemas potenciales:

1. **Performance:** Hace 2 requests en lugar de 1
   - `GET /shows/:showId/seats`
   - `GET /shows/:showId/tickets`

2. **Race Condition:** Si alguien compra mientras cargas los datos
   - Workaround: El backend valida en el POST de holds

3. **No muestra holds activos:** Solo filtra tickets emitidos
   - Solución: El backend devuelve 409 si el asiento está en hold

### Ventajas:

✅ Funciona inmediatamente sin cambios en el backend  
✅ Previene intentos de reservar asientos vendidos  
✅ Mejora la UX al mostrar disponibilidad real  
✅ Graceful degradation: Si falla, solo usa el status  

---

## 🎯 SOLUCIÓN DEFINITIVA (Backend)

### Lo que DEBE hacer el backend:

#### 1. Al crear HOLD:
```sql
UPDATE seats 
SET status = 'HELD' 
WHERE id IN (1, 2);
```

#### 2. Al confirmar pago (webhook MP):
```sql
-- Emitir tickets
INSERT INTO tickets (order_id, seat_id, qr_code, status)
SELECT ?, seat_id, generate_qr(), 'ISSUED'
FROM seat_hold_items
WHERE hold_id = ?;

-- Marcar asientos como vendidos
UPDATE seats 
SET status = 'SOLD'
WHERE id IN (
  SELECT seat_id FROM tickets WHERE order_id = ?
);

-- Eliminar hold
DELETE FROM seat_holds WHERE id = ?;
```

#### 3. Al expirar HOLD:
```sql
-- Liberar asientos si NO tienen ticket
UPDATE seats s
SET status = 'AVAILABLE'
WHERE s.id IN (
  SELECT shi.seat_id 
  FROM seat_hold_items shi
  WHERE shi.hold_id = ?
)
AND NOT EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.seat_id = s.id 
  AND t.status IN ('ISSUED', 'REDEEMED')
);

-- Eliminar hold
DELETE FROM seat_holds WHERE id = ?;
```

---

## 📊 COMPARACIÓN

| Aspecto | ❌ Antes | 🚧 Workaround | ✅ Solución Final |
|---------|---------|---------------|-------------------|
| Asientos 1-2 | AVAILABLE (incorrecto) | Excluidos por filtro | SOLD (correcto) |
| Requests | 1 | 2 | 1 |
| Performance | Rápido | Un poco más lento | Rápido |
| Confiabilidad | Baja | Media | Alta |
| Mantención | N/A | Temporal | Permanente |

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Implementar workaround** (HECHO)
2. ⏳ **Probar el workaround**
3. ⏳ **Arreglar el backend** para actualizar status
4. ⏳ **Remover el workaround** cuando el backend esté fixed

---

**Fecha:** 2025-11-05  
**Estado:** WORKAROUND ACTIVO  
**Autor:** RS Tickets Development Team  
**Versión:** 1.0 - Workaround temporal
