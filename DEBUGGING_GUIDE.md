# 🔍 GUÍA DE DEBUGGING - VIBRATICKET

## 🚨 Problemas Identificados y Soluciones

### 1. **Error en Simulación de Pago**

**Síntomas:**
- Botón "Simular Pago (Testing)" falla
- Errores en consola del navegador

**Posibles Causas:**
1. Hold expirado (15 minutos)
2. Hold no existe
3. Problema de comunicación con backend
4. Datos faltantes en el formulario

### 2. **Pasos de Debugging**

#### Paso 1: Abrir DevTools
1. Presiona `F12` en el navegador
2. Ve a la pestaña **Console**
3. Ve a la pestaña **Network**

#### Paso 2: Reproducir el Error
1. Ve a un evento → Selecciona show → Selecciona sección
2. En la página de selección de asientos, observa la consola
3. Busca estos logs:
   ```
   🔒 Creando HOLD con idempotency key: hold-xxx
   📋 Datos del hold: { showId, seatIds, customerEmail, customerName }
   ✅ HOLD creado: { holdId, expiresAt, totalCents }
   ```

#### Paso 3: En Checkout
1. Observa estos logs al cargar:
   ```
   🔍 DEBUG Checkout - holdIdParam: xxx
   🔍 Cargando datos del hold: xxx
   ✅ Hold cargado: { ... }
   ```

2. Al hacer click en "Simular Pago":
   ```
   🔍 Hold disponible: { holdId, holdData }
   📦 Creando ORDER desde HOLD: xxx
   📤 Enviando datos de orden: { holdId: xxx }
   ✅ ORDER creada: { orderId, status, totalCents }
   🧪 Simulando pago para orden: xxx
   ✅ Respuesta del backend: { success: true, ... }
   ```

#### Paso 4: Verificar Network Tab
1. Busca estas requests:
   - `POST /api/holds` (status 200/201)
   - `GET /api/holds/:holdId` (status 200)
   - `POST /api/orders` (status 200/201)
   - `POST /api/test-payments/simulate-payment` (status 200)

### 3. **Errores Comunes y Soluciones**

#### Error: "No hay datos de hold disponibles"
**Causa:** Hold expirado o no existe
**Solución:** Volver a seleccionar asientos

#### Error: "HoldExpired"
**Causa:** Han pasado más de 15 minutos
**Solución:** Crear nuevo hold

#### Error: "ValidationError: orderId es requerido"
**Causa:** Orden no se creó correctamente
**Solución:** Verificar que el hold existe

#### Error: "SeatsAlreadySold"
**Causa:** Asientos vendidos por otro usuario
**Solución:** Seleccionar otros asientos

### 4. **Testing Manual del Backend**

Abre el archivo `test-api.html` en tu navegador:
```
http://localhost:5173/test-api.html
```

**Tests a ejecutar:**
1. **Test Health** - Verifica que backend responde
2. **Create Hold** - Crea una reserva temporal
3. **Create Order** - Convierte hold en orden
4. **Simulate Payment** - Simula pago exitoso

### 5. **Verificación de Estado del Backend**

#### Verificar que el backend está corriendo:
```bash
netstat -an | findstr :3000
```

#### Test directo con curl:
```bash
# Test health
curl http://localhost:3000/api/events

# Test create hold
curl -X POST http://localhost:3000/api/holds \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: hold-test-123" \
  -d '{"showId":1,"seatIds":[1,2],"customerEmail":"test@test.com","customerName":"Test"}'

# Test simulate payment
curl -X POST http://localhost:3000/api/test-payments/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{"orderId":1,"customerEmail":"test@test.com","customerName":"Test"}'
```

### 6. **Logs Esperados en Consola**

#### Frontend (Consola del navegador):
```
🚀 POST request to: /api/holds
📦 Data: { showId: 1, seatIds: [1,2], ... }
🔧 Options: { headers: { "Idempotency-Key": "hold-xxx" } }
📋 Final request config: { method: "POST", headers: {...}, body: "..." }
Respuesta del servidor: { holdId: 123, expiresAt: "...", totalCents: 5000 }
```

#### Backend (Terminal):
```
POST /api/holds 201 - 45.123 ms
POST /api/orders 201 - 23.456 ms
POST /api/test-payments/simulate-payment 200 - 12.789 ms
```

### 7. **Solución Rápida**

Si nada funciona, ejecuta estos pasos:

1. **Reiniciar Backend:**
   ```bash
   cd ../ticketera
   npm start
   ```

2. **Limpiar Cache del Frontend:**
   ```bash
   # En el navegador:
   Ctrl + Shift + R (hard refresh)
   
   # O limpiar localStorage:
   localStorage.clear()
   ```

3. **Verificar .env:**
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. **Test con datos conocidos:**
   - Usar showId = 1 (si existe)
   - Usar seatIds = [1, 2]
   - Email válido

### 8. **Contacto de Soporte**

Si el problema persiste:
1. Copia los logs de la consola
2. Copia los errores del Network tab
3. Indica en qué paso específico falla
4. Adjunta screenshot de los errores

---

## 🎯 CHECKLIST DE VERIFICACIÓN

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Consola sin errores CORS
- [ ] Network tab muestra requests exitosas
- [ ] Hold se crea correctamente
- [ ] Order se crea desde hold
- [ ] Simulate payment funciona
- [ ] Redirección a success page

---

**Última actualización:** 11 de Noviembre 2024
