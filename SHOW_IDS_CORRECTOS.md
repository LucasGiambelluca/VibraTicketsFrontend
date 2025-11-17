# 🎯 SHOW IDS CORRECTOS - REFERENCIA RÁPIDA

**Fecha:** 2025-10-30  
**Problema resuelto:** Show ID incorrecto

---

## ✅ DATOS CORRECTOS DEL BACKEND

### Show Activo:
- **Show ID:** `38` ✅
- **Event ID:** `41`
- **Evento:** Iron Maiden Run For Your Lives World Tour 2026
- **Fecha:** 2025-11-01
- **Asientos disponibles:** 100
- **Secciones:** 1

### Sección Disponible:
- **ID:** `20`
- **Nombre:** "vip delantero"
- **Tipo:** GA (General Admission)
- **Capacidad:** 100
- **Precio:** $250,000.00 ARS
- **Asientos:** GA1 - GA99

---

## 🔗 URLs CORRECTAS

### Frontend:
```
✅ http://localhost:5173/shows/38
✅ http://localhost:5173/events/41

❌ http://localhost:5173/shows/34  (NO EXISTE)
```

### Backend API:
```
✅ GET http://localhost:3000/api/shows/38
✅ GET http://localhost:3000/api/shows/38/seats
✅ GET http://localhost:3000/api/shows/38/sections
✅ GET http://localhost:3000/api/events/41

❌ GET http://localhost:3000/api/shows/34  (NO EXISTE)
```

---

## 🧪 TESTING PASO A PASO

### 1. Verificar que el show existe:
```bash
curl http://localhost:3000/api/shows/38
```

**Respuesta esperada:**
```json
{
  "id": 38,
  "event_id": 41,
  "show_date": "2025-11-01",
  "show_time": "20:00:00"
}
```

### 2. Verificar asientos disponibles:
```bash
curl http://localhost:3000/api/shows/38/seats | jq length
```

**Respuesta esperada:**
```
100
```

### 3. Verificar secciones:
```bash
curl http://localhost:3000/api/shows/38/sections
```

**Respuesta esperada:**
```json
[
  {
    "id": 20,
    "name": "vip delantero",
    "kind": "GA",
    "capacity": 100,
    "price_cents": 25000000
  }
]
```

---

## 🎯 FLUJO DE COMPRA COMPLETO

### Paso 1: Navegar al show correcto
```
http://localhost:5173/shows/38
```

### Paso 2: Seleccionar cantidades
- vip delantero: 2 tickets
- Total: $500,000

### Paso 3: Click "Continuar"
**Logs esperados:**
```
📋 Sectores únicos disponibles en asientos: ["vip delantero"]
🔍 Buscando asientos para sección: "vip delantero" (ID: 20)
✅ Asientos encontrados en vip delantero: 100
📌 Asientos seleccionados: [1, 2]
🔒 Creando HOLD con datos: { showId: 38, seatIds: [1, 2], ... }
✅ HOLD creado exitosamente: { holdId: X, ... }
```

### Paso 4: Checkout
```
http://localhost:5173/checkout/:holdId
```
- Countdown: 15:00
- Resumen de asientos

### Paso 5: Crear ORDER y pagar
```
POST /api/orders
Body: { holdId: X }
```

### Paso 6: Mercado Pago
- Pagar con tarjeta de prueba
- Redirigir a /payment/success

---

## 📊 COMPARACIÓN

| Item | ❌ Incorrecto (antes) | ✅ Correcto (ahora) |
|------|----------------------|---------------------|
| Show ID | 34 | 38 |
| Event ID | ? | 41 |
| Asientos | 0 | 100 |
| Secciones | 0 | 1 |
| URL | /shows/34 | /shows/38 |

---

## 🔧 SI NECESITAS CREAR UN NUEVO SHOW

### 1. Crear show en el admin:
```
Admin → Shows → Crear Show
- Evento: Iron Maiden...
- Fecha: 2025-11-01
- Hora: 20:00
```

### 2. Asignar secciones:
```
Admin → Shows → Click "Secciones"
- Nombre: vip delantero
- Tipo: GA
- Capacidad: 100
- Precio: $250,000
```

### 3. Verificar asientos generados:
```bash
# Obtener el nuevo show ID (ej: 39)
curl http://localhost:3000/api/shows | jq '.[0].id'

# Verificar asientos
curl http://localhost:3000/api/shows/39/seats | jq length
```

### 4. Actualizar URL:
```
http://localhost:5173/shows/39
```

---

## ✅ VERIFICACIÓN FINAL

Antes de probar el flujo completo, verifica:

- [ ] Backend corriendo en http://localhost:3000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Show 38 existe y tiene 100 asientos
- [ ] Navegas a http://localhost:5173/shows/38
- [ ] Ves la sección "vip delantero" con 100 disponibles
- [ ] Puedes seleccionar cantidades
- [ ] El total se calcula correctamente

---

## 🎉 CONCLUSIÓN

**NO había inconsistencias en la base de datos.**  
**El problema era simplemente usar el Show ID incorrecto.**

✅ Show 38 tiene todo configurado correctamente  
✅ 100 asientos disponibles  
✅ Sección "vip delantero" funcional  
✅ Sistema de HOLDS implementado  
✅ Listo para probar el flujo completo  

**¡AHORA SÍ DEBERÍA FUNCIONAR!** 🚀
