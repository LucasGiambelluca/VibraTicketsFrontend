# 🔧 FIX: Problema de JSON Malformado

## 🚨 **Problema Identificado**

Basándome en los logs del backend, el problema es que el JSON está llegando con caracteres escapados incorrectamente:

```
Error: "Expected property name or '}' in JSON at position 1 (line 1 column 2)"
body: '{\\"orderId\\": 1, \\"customerEmail\\": \\"test@test.com\\", \\"customerName\\": \\"Test\\"}'
```

## 🔍 **Diagnóstico**

1. **JSON mal escapado**: Las comillas están siendo escapadas como `\\"` en lugar de `"`
2. **Content-Type incorrecto**: Posible problema con el header
3. **Encoding issues**: El JSON no se está enviando en el formato correcto

## ✅ **Soluciones Implementadas**

### 1. **Mejorado el logging en apiClient.js**
```javascript
console.log('🌐 Request URL:', url);
console.log('📋 Request headers:', headers);
console.log('📦 Request body:', config.body);
console.log('📄 JSON Body:', jsonBody);
```

### 2. **Creado test simple: quick-test.html**
Para probar la comunicación directa con el backend sin el framework.

### 3. **Actualizado test-api.html**
Con showId correcto (38) y mejor logging.

## 🧪 **Pasos de Testing**

### Paso 1: Test Directo
1. Abre `quick-test.html` en el navegador
2. Abre DevTools (F12) → Console
3. Click "Test Hold Creation"
4. Verifica los logs:
   ```
   Sending data: {showId: 38, seatIds: [1,2], ...}
   JSON string: {"showId":38,"seatIds":[1,2],...}
   Response status: 200 o 201
   ```

### Paso 2: Test con Framework
1. Abre `test-api.html`
2. Click "Test Health" → Debe mostrar eventos
3. Click "Create Hold" → Debe crear hold exitosamente
4. Verifica que los logs muestren JSON correcto

### Paso 3: Test en la App
1. Ve a un evento → Selecciona show
2. Abre DevTools → Console
3. Selecciona asientos y continúa
4. Verifica logs:
   ```
   🚀 POST request to: /api/holds
   📦 Data: {showId: 38, seatIds: [1,2], ...}
   📄 JSON Body: {"showId":38,"seatIds":[1,2],...}
   🌐 Request URL: http://localhost:3000/api/holds
   📋 Request headers: {"Content-Type":"application/json",...}
   ```

## 🔧 **Si el Problema Persiste**

### Opción 1: Verificar Backend
El backend puede tener un problema con el parser de JSON. Verifica que esté usando:
```javascript
app.use(express.json({ limit: '10mb' }));
```

### Opción 2: Test con curl
```bash
curl -X POST http://localhost:3000/api/holds \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: hold-test-123" \
  -d '{"showId":38,"seatIds":[1,2],"customerEmail":"test@test.com","customerName":"Test"}'
```

### Opción 3: Verificar CORS
El problema puede estar en la configuración de CORS del backend.

## 📋 **Checklist de Verificación**

- [ ] Backend responde a GET /api/events
- [ ] quick-test.html funciona correctamente
- [ ] test-api.html crea holds exitosamente
- [ ] Logs muestran JSON sin caracteres escapados
- [ ] Content-Type es "application/json"
- [ ] No hay errores de CORS

## 🎯 **Resultado Esperado**

Después del fix, deberías ver en los logs del backend:
```
[Holds] POST /api/holds requested {
  body: { showId: 38, seatIds: [1,2], customerEmail: "test@test.com", customerName: "Test" },
  ip: '::1',
  time: '2025-11-11T18:xx:xx.xxxZ'
}
[Holds] Hold created successfully { holdId: 123, expiresAt: "...", totalCents: 5000 }
```

En lugar de:
```
[DB Error] POST /api/holds: {
  error: "Expected property name or '}' in JSON at position 1",
  body: '{\\"',
  type: 'entity.parse.failed'
}
```

---

**Próximo paso:** Ejecuta los tests y comparte los resultados de la consola.
