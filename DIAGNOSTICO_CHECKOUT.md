# 🔍 DIAGNÓSTICO DEL CHECKOUT

## ✅ CAMBIOS REALIZADOS

### 1. **ShowDetail.jsx** - Persistencia de Selecciones

**Problema resuelto:**
- ✅ Las cantidades seleccionadas se guardan en `sessionStorage`
- ✅ Al volver (back), se recuperan automáticamente
- ✅ Botón "Limpiar selecciones" para resetear

**Cómo funciona:**
```javascript
// Al cambiar cantidad → guarda en sessionStorage
sessionStorage.setItem(`show-${showId}-quantities`, JSON.stringify(updated));

// Al cargar página → recupera de sessionStorage
const savedQuantities = sessionStorage.getItem(`show-${showId}-quantities`);
if (savedQuantities) {
  setSectionQuantities(JSON.parse(savedQuantities));
  message.info('Se recuperaron tus selecciones anteriores');
}
```

---

## 🐛 PROBLEMA PENDIENTE: Checkout no muestra info

Necesito ver **los logs del Checkout** para diagnosticar qué estructura tiene el hold.

### 📋 PASOS PARA DIAGNOSTICAR:

1. **Abre la consola del navegador** (F12 → Console)
2. **Navega a** `http://localhost:5173/shows/1`
3. **Selecciona cantidades** (ej: 2 entradas)
4. **Click "Continuar"**
5. **Espera a que cargue el Checkout**
6. **En la consola, busca estos logs:**

```
🔍 Cargando datos del hold: 123
✅ Hold cargado: Object
📦 Estructura completa del hold: { ... }
🎫 Items del hold: [ ... ]
💰 Total en centavos: ...
⏰ Expira en: ...
⏱️ Tiempo restante (segundos): ...
```

7. **COPIA Y PEGA AQUÍ** especialmente:
   - `📦 Estructura completa del hold: { ... }`
   - `🎫 Items del hold: [ ... ]`

---

## 🔍 QUÉ ESTOY BUSCANDO

El backend puede devolver el hold en diferentes formatos. Necesito saber:

### Opción A: Formato con `items`
```json
{
  "holdId": 123,
  "items": [
    { "seatId": 1, "price": 250000 },
    { "seatId": 2, "price": 250000 }
  ],
  "totalCents": 500000,
  "expiresAt": "2025-11-05T13:30:00Z"
}
```

### Opción B: Formato con `seats`
```json
{
  "holdId": 123,
  "seats": [1, 2, 3],
  "totalCents": 750000,
  "expiresAt": "2025-11-05T13:30:00Z"
}
```

### Opción C: Formato snake_case
```json
{
  "hold_id": 123,
  "items": [...],
  "total_cents": 500000,
  "expires_at": "2025-11-05T13:30:00Z"
}
```

---

## ✅ UNA VEZ QUE TENGAS LOS LOGS

Compártelos aquí y ajustaré el código del Checkout para:
- ✅ Mostrar correctamente la cantidad de asientos
- ✅ Mostrar correctamente el total
- ✅ Mostrar información detallada de cada asiento

---

## 🧪 PRUEBA RÁPIDA

**Si no ves NADA en el Checkout** (pantalla en blanco o spinner infinito):
- Es probable que `holdsApi.getHold(holdId)` esté fallando
- Verifica que el backend tenga `GET /api/holds/:holdId` implementado
- Verifica en Network tab si la request se hace correctamente

---

**Esperando los logs del Checkout para continuar...** 🔍
