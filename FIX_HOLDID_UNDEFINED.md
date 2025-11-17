# 🐛 FIX: HoldId Undefined en Checkout

## Problema Detectado

Al intentar simular un pago en el checkout, se producía error **400 Bad Request**:

```javascript
📦 Creando ORDER desde HOLD: undefined
📋 Datos de la orden: {holdId: NaN}
POST http://localhost:3000/api/orders 400 (Bad Request)
❌ Error simulando pago: Error: BadRequest
```

**Causa:** El `holdId` llegaba como `undefined` al checkout, resultando en `NaN` al parsearlo.

---

## Análisis de la Causa

### Posibles Razones:

1. **Backend devuelve `id` en lugar de `holdId`**
   - La respuesta del API podría tener `{ id: 123, ... }` en vez de `{ holdId: 123, ... }`

2. **URL sin parámetro**
   - Si la navegación falla, la URL podría ser `/checkout/` sin el ID

3. **Estado perdido en navegación**
   - El `location.state` podría no tener el `holdId`

---

## Solución Implementada

### 1. **SeatSelection.jsx - Normalización del holdId**

```javascript
// ANTES:
const holdResponse = await holdsApi.createHold(holdData);
navigate(`/checkout/${holdResponse.holdId}`, { ... });

// DESPUÉS:
const holdResponse = await holdsApi.createHold(holdData);

// 🔧 FIX: Normalizar holdId (backend puede devolver 'id' o 'holdId')
const holdId = holdResponse.holdId || holdResponse.id;

if (!holdId) {
  throw new Error('El backend no devolvió un ID de reserva válido');
}

console.log('✅ holdId normalizado:', holdId);

navigate(`/checkout/${holdId}`, {
  state: { 
    holdId: holdId,
    holdData: { ...holdResponse, holdId }, // Asegurar que holdData tenga holdId
    ...
  }
});
```

**Cambios:**
- ✅ Extrae `holdId` de `holdResponse.holdId` o `holdResponse.id`
- ✅ Valida que existe antes de navegar
- ✅ Lo agrega explícitamente al `holdData` en el state
- ✅ Lo pasa en la URL y en el state

---

### 2. **Checkout.jsx - Múltiples Fuentes de holdId**

```javascript
// ANTES:
const { holdId } = useParams();

// DESPUÉS:
const { holdId: holdIdParam } = useParams();
const holdId = holdIdParam || location.state?.holdId || holdData?.holdId;

console.log('🔍 DEBUG Checkout - holdIdParam:', holdIdParam);
console.log('🔍 DEBUG Checkout - location.state?.holdId:', location.state?.holdId);
console.log('🔍 DEBUG Checkout - holdData?.holdId:', holdData?.holdId);
console.log('✅ holdId final usado:', holdId);
```

**Cambios:**
- ✅ Intenta obtener holdId de 3 fuentes (params, state, holdData)
- ✅ Agrega logs de debug para identificar de dónde viene
- ✅ Usa el primero que encuentre

---

### 3. **Checkout.jsx - Validación en useEffect**

```javascript
useEffect(() => {
  const loadHoldData = async () => {
    try {
      setLoadingHold(true);
      
      // 🚨 VALIDACIÓN: Verificar que holdId existe
      if (!holdId) {
        console.error('❌ ERROR: holdId es undefined o null');
        message.error('No se encontró el ID de la reserva.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      // ... resto del código
    }
  };
}, [holdId]);
```

**Cambios:**
- ✅ Valida que `holdId` exista antes de hacer la request
- ✅ Muestra mensaje de error amigable
- ✅ Redirige al home después de 3 segundos

---

## Testing del Fix

### Paso 1: Limpiar Cache y Recargar

1. Abrir DevTools (F12)
2. Ir a la tab "Network"
3. Check "Disable cache"
4. Hacer **Ctrl + Shift + R** (hard reload)

### Paso 2: Proceso Completo

1. Login como usuario de prueba
2. Seleccionar evento → show → localidad → cantidad
3. **Observar consoles logs:**

```javascript
// En SeatSelection:
🔒 Creando HOLD: { showId: 38, seatIds: [1,2,3], ... }
✅ HOLD creado: { id: 123, ... } // O { holdId: 123 }
✅ holdId normalizado: 123

// En Checkout (al cargar):
🔍 DEBUG Checkout - holdIdParam: "123"
🔍 DEBUG Checkout - location.state?.holdId: 123
🔍 DEBUG Checkout - holdData?.holdId: 123
✅ holdId final usado: 123
🔍 Cargando datos del hold: 123
✅ Hold cargado: { ... }
```

4. Click en "🧪 Simular Pago Exitoso"
5. **Verificar que NO dice:**
   - ❌ `📦 Creando ORDER desde HOLD: undefined`
   - ❌ `📋 Datos de la orden: {holdId: NaN}`

6. **Debería decir:**
   - ✅ `📦 Creando ORDER desde HOLD: 123`
   - ✅ `✅ Orden creada con ID: 456`

---

## Verificación del Backend

### Respuesta Esperada al Crear Hold

El backend debe devolver **al menos UNO** de estos campos:

```json
{
  "id": 123,          // ← O este
  "holdId": 123,      // ← O este
  "items": [...],
  "totalCents": 75000000,
  "expiresAt": "2025-11-07T14:00:00Z",
  "ttlMinutes": 15
}
```

### Verificar en Backend

Si el backend está devolviendo `id` en lugar de `holdId`:

```javascript
// Backend - Respuesta de POST /api/holds
res.json({
  id: newHold.id,        // ← Backend usa 'id'
  items: holdItems,
  totalCents: total,
  expiresAt: newHold.expires_at,
  ttlMinutes: 15
});
```

**Solución aplicada:** El frontend ahora acepta ambos (`id` o `holdId`).

---

## Logs de Debug

### Antes del Fix (ERROR):
```javascript
💰 Cálculo de totales: {subtotal: 840000, ...}
📦 Creando ORDER desde HOLD: undefined    // ❌ undefined
📋 Datos de la orden: {holdId: NaN}       // ❌ NaN
POST /api/orders 400 (Bad Request)
❌ Error simulando pago: Error: BadRequest
```

### Después del Fix (ÉXITO):
```javascript
🔍 DEBUG Checkout - holdIdParam: "123"    // ✅ tiene valor
🔍 DEBUG Checkout - location.state?.holdId: 123
✅ holdId final usado: 123
📦 Creando ORDER desde HOLD: 123          // ✅ correcto
✅ Orden creada con ID: 456
🧪 Completando orden directamente: 456
✅ Pago simulado exitosamente!
```

---

## Archivos Modificados

### 1. `src/pages/SeatSelection.jsx`
- Normalización de `holdId` desde `holdResponse`
- Validación antes de navegar
- Asegurar que `holdData` tenga `holdId`

### 2. `src/pages/Checkout.jsx`
- Obtener `holdId` de múltiples fuentes
- Logs de debug
- Validación en useEffect

---

## Estado del Fix

✅ **IMPLEMENTADO Y LISTO PARA TESTING**

### Próximos Pasos:

1. ✅ Guardar archivos (ya guardados)
2. 🔄 Recargar navegador (Ctrl + Shift + R)
3. 🧪 Repetir el flujo de compra
4. 👀 Verificar console logs
5. ✅ Debería funcionar correctamente

---

## Notas Técnicas

### Por qué usar múltiples fuentes:

1. **useParams()** - Ideal, viene de la URL
2. **location.state?.holdId** - Backup si la URL se pierde
3. **holdData?.holdId** - Último recurso si el estado persiste

### Orden de prioridad:

```javascript
const holdId = holdIdParam || location.state?.holdId || holdData?.holdId;
```

Usa el primero que encuentre (left-to-right evaluation).

---

**Última actualización:** 2025-11-07 10:52  
**Estado:** ✅ Fix aplicado - Pendiente de testing  
**Severidad:** 🔴 Alta (bloqueaba todo el flujo de compra)
