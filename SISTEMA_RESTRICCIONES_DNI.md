# 🎫 Sistema de Restricciones de Compra por DNI

## 📋 Resumen

Se implementó el sistema completo de restricciones de compra de tickets basado en DNI, limitando a **5 boletos por evento por persona**.

## ✅ Archivos Creados

### 1. **validators.js** (`src/utils/validators.js`)
Utilidades de validación para DNI y cantidad de tickets:
- `validateDNI(dni)` - Valida formato de DNI argentino (7-8 dígitos)
- `formatDNI(dni)` - Formatea DNI con puntos (12.345.678)
- `validateTicketQuantity(quantity, availability)` - Valida cantidad vs disponibilidad

### 2. **useTicketAvailability.js** (`src/hooks/useTicketAvailability.js`)
Hook para consultar disponibilidad de tickets por evento:
- Consulta endpoint `/api/tickets/available/:eventId`
- Retorna cuántos boletos puede comprar el usuario
- Maneja casos: sin login, sin DNI, límite alcanzado
- Auto-refetch cuando cambia el eventId

### 3. **TicketAvailabilityBadge.jsx** (`src/components/TicketAvailabilityBadge.jsx`)
Badge visual que muestra el estado de disponibilidad:
- 🔒 No autenticado
- ⚠️ DNI requerido (con link a perfil)
- 🚫 Límite alcanzado
- ⚡ Quedan pocos boletos (≤2)
- ✅ Disponible (muestra cantidad)

### 4. **TicketQuantitySelector.jsx** (`src/components/TicketQuantitySelector.jsx`)
Selector de cantidad con botones +/- y validación:
- Input numérico con límite máximo
- Botones de incremento/decremento
- Validación en tiempo real
- Muestra boletos ya comprados
- Callback `onQuantityChange`

### 5. **TicketLimitProgress.jsx** (`src/components/TicketLimitProgress.jsx`)
Barra de progreso visual del límite:
- Progress bar con colores semafóricos
- Verde: <60%, Naranja: 60-80%, Rojo: ≥80%
- Muestra X/5 boletos comprados
- Mensaje cuando alcanza el límite

### 6. **ErrorMessage.jsx** (`src/components/ErrorMessage.jsx`)
Componente de errores mejorado con casos específicos:
- Error DNI requerido (con acción "Ir a perfil")
- Error límite excedido (con detalles del evento)
- Error email duplicado
- Error DNI duplicado
- Error sesión expirada
- Errores genéricos

## 🔄 Archivos Modificados

### 7. **apiService.js** (`src/services/apiService.js`)
Agregado endpoint de disponibilidad al `ticketsApi`:
```javascript
// GET /api/tickets/available/:eventId
getAvailability: (eventId) => {
  return apiClient.get(`${API_BASE}/tickets/available/${eventId}`);
}
```

### 8. **Register.jsx** (`src/pages/Register.jsx`)
- ✅ Campo DNI agregado (obligatorio)
- Validación en tiempo real (solo números, 7-8 dígitos)
- Tooltip informativo
- Incluye DNI en userData al registrar

### 9. **RegisterModal.jsx** (`src/components/RegisterModal.jsx`)
- ✅ Campo DNI agregado (obligatorio)
- Mismas validaciones que Register.jsx
- Diseño consistente con el modal

### 10. **Profile.jsx** (`src/pages/Profile.jsx`)
- ✅ Campo DNI editable
- ⚠️ Alert si no tiene DNI (con botón "Completar DNI")
- Badge "Requerido" si falta DNI
- Mensaje de verificación si tiene DNI
- Tooltip explicativo
- Validación al guardar

## 📡 Endpoint del Backend Esperado

### GET `/api/tickets/available/:eventId`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Respuesta Exitosa (200):**
```json
{
  "available": 3,
  "maxPerEvent": 5,
  "canPurchase": true,
  "purchased": {
    "byUser": 2,
    "byDNI": 2
  }
}
```

**Respuesta - DNI Requerido (400):**
```json
{
  "error": "DNIRequired",
  "reason": "dni_required",
  "message": "Debes completar tu DNI para comprar boletos",
  "canPurchase": false
}
```

**Respuesta - Límite Alcanzado (400):**
```json
{
  "error": "TicketLimitExceeded",
  "limitReason": "user_limit_reached",
  "message": "Ya compraste el máximo de boletos para este evento",
  "available": 0,
  "maxPerEvent": 5,
  "canPurchase": false,
  "purchased": {
    "byUser": 5,
    "byDNI": 5
  },
  "details": {
    "eventName": "Chicha Fest 2.0",
    "alreadyPurchased": 5,
    "maxAllowed": 5
  }
}
```

## 🎨 Uso de Componentes

### Ejemplo 1: Badge de disponibilidad
```jsx
import TicketAvailabilityBadge from '../components/TicketAvailabilityBadge';

function EventDetail({ eventId }) {
  return (
    <div>
      <h1>Chicha Fest 2.0</h1>
      <TicketAvailabilityBadge eventId={eventId} />
      {/* Resto del contenido */}
    </div>
  );
}
```

### Ejemplo 2: Selector de cantidad
```jsx
import TicketQuantitySelector from '../components/TicketQuantitySelector';
import { useTicketAvailability } from '../hooks/useTicketAvailability';

function TicketPurchase({ eventId }) {
  const { availability } = useTicketAvailability(eventId);
  const [quantity, setQuantity] = useState(1);

  return (
    <TicketQuantitySelector
      availability={availability}
      onQuantityChange={setQuantity}
    />
  );
}
```

### Ejemplo 3: Barra de progreso
```jsx
import TicketLimitProgress from '../components/TicketLimitProgress';
import { useTicketAvailability } from '../hooks/useTicketAvailability';

function UserTicketStatus({ eventId }) {
  const { availability } = useTicketAvailability(eventId);
  
  return <TicketLimitProgress availability={availability} />;
}
```

### Ejemplo 4: Manejo de errores
```jsx
import ErrorMessage from '../components/ErrorMessage';

function PurchaseForm() {
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    try {
      // ... lógica de compra
    } catch (err) {
      setError(err.response?.data);
    }
  };

  return (
    <div>
      {error && <ErrorMessage error={error} />}
      {/* Formulario */}
    </div>
  );
}
```

## 🔐 Validaciones Implementadas

### Frontend:
1. ✅ DNI obligatorio en registro (7-8 dígitos numéricos)
2. ✅ Solo números permitidos en input de DNI
3. ✅ Validación de formato al escribir
4. ✅ Cantidad de tickets vs disponibilidad
5. ✅ Verificación de autenticación antes de consultar
6. ✅ Mensajes de error específicos y claros

### Backend (esperado):
1. DNI único por usuario
2. Máximo 5 tickets por DNI por evento
3. Verificación de DNI antes de crear orden
4. Conteo de tickets comprados por usuario y por DNI
5. Rate limiting en endpoint de disponibilidad

## 🎯 Flujo de Usuario

### Registro:
1. Usuario ingresa datos personales
2. **Completa DNI (OBLIGATORIO)** ← NUEVO
3. Sistema valida formato de DNI
4. Se crea cuenta con DNI

### Compra de Tickets:
1. Usuario ve evento
2. Sistema consulta disponibilidad automáticamente
3. **Badge muestra cuántos puede comprar**
4. Si no tiene DNI → Muestra advertencia con link a perfil
5. Si tiene límite alcanzado → Muestra error
6. Si puede comprar → Selector de cantidad habilitado
7. Validación al intentar comprar más del límite

### Perfil:
1. Usuario accede a perfil
2. Si no tiene DNI → **Alert prominente**
3. Puede editar/completar DNI
4. Validación al guardar
5. Mensaje de confirmación con estado de verificación

## 🚀 Próximos Pasos (Backend)

1. Implementar endpoint `/api/tickets/available/:eventId`
2. Validar DNI en endpoint de creación de órdenes
3. Agregar campo `dni` a tabla `users` (VARCHAR 8, UNIQUE)
4. Crear índice en campo DNI para búsquedas rápidas
5. Implementar lógica de conteo de tickets por DNI
6. Manejar casos edge:
   - Cambio de DNI (¿permitir?)
   - Órdenes canceladas (¿cuentan para el límite?)
   - Transferencias de tickets

## 📊 Base de Datos Sugerida

### Tabla `users` (agregar campo):
```sql
ALTER TABLE users ADD COLUMN dni VARCHAR(8) UNIQUE;
CREATE INDEX idx_users_dni ON users(dni);
```

### Query para validar límite:
```sql
SELECT COUNT(*) as tickets_purchased
FROM tickets t
JOIN orders o ON t.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE u.dni = ? 
  AND t.show_id IN (
    SELECT id FROM shows WHERE event_id = ?
  )
  AND o.status = 'PAID';
```

## ✨ Características Implementadas

- ✅ Campo DNI obligatorio en registro
- ✅ Campo DNI editable en perfil
- ✅ Validación de formato DNI (7-8 dígitos)
- ✅ Hook de disponibilidad reutilizable
- ✅ Badge visual de disponibilidad
- ✅ Selector de cantidad con límites
- ✅ Barra de progreso del límite
- ✅ Manejo robusto de errores
- ✅ Mensajes claros y accionables
- ✅ Links directos a soluciones (ej: ir a perfil)
- ✅ Diseño consistente con Ant Design
- ✅ Responsive y accesible

## 📝 Notas Importantes

1. **DNI es obligatorio desde ahora** para nuevos registros
2. Usuarios existentes deben completar DNI antes de comprar
3. El sistema es **fail-soft**: si hay error consultando disponibilidad, no bloquea la compra
4. Todos los mensajes son claros y guían al usuario
5. Los componentes son reutilizables en cualquier página de eventos

---

**Última actualización:** 27 de Noviembre, 2024  
**Versión:** 1.0.0  
**Estado:** ✅ Frontend completamente implementado - Esperando backend
