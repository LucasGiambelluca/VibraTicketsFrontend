# 🎟️ Sistema de Códigos de Descuento - Guía Completa

## 📋 Estado de Implementación

✅ **COMPLETADO** - Sistema de descuentos totalmente funcional

## 🚀 Cómo Usar el Sistema

### Para Administradores

#### 1. Acceder al Panel de Descuentos
- Ingresar a: `/admin/discount-codes`
- O desde el menú lateral: **"Códigos de Descuento"** 🏷️

#### 2. Crear un Nuevo Código

1. Click en **"Crear Código"** (botón morado arriba a la derecha)
2. Completar el formulario:
   - **Código**: VERANO2024 (solo mayúsculas y números)
   - **Descripción**: "Descuento de verano"
   - **Tipo**: Porcentaje (20%) o Monto Fijo ($1000)
   - **Límites**: Usos totales, por usuario, compra mínima
   - **Vigencia**: Fechas de inicio y fin (opcional)
3. Click en **"Crear Código"**

#### 3. Ver Estadísticas
- Click en el ícono 📊 de cualquier código
- Verás:
  - Total de usos
  - Usuarios únicos
  - Total descontado
  - Gráficos de uso por tiempo
  - Órdenes recientes

#### 4. Ejemplos de Códigos

| Código | Tipo | Valor | Límites | Uso |
|--------|------|-------|---------|-----|
| WELCOME20 | % | 20% | 1 por usuario | Nuevos clientes |
| VERANO1000 | $ | $1000 | Compra mín $5000 | Temporada verano |
| FLASH50 | % | 50% | Máx $10000, 48hs | Ofertas flash |
| VIP30 | % | 30% | Sin límites | Clientes VIP |

### Para Clientes

#### 1. Aplicar un Código en el Checkout

1. En la página de checkout, buscar la sección **"Código de Descuento"**
2. Ingresar el código (ej: VERANO2024)
3. Click en **"Aplicar"**
4. Ver el descuento aplicado:
   - Subtotal: $10,000
   - Descuento (20%): -$2,000
   - **Total: $8,000** ✨

#### 2. Quitar un Descuento
- Si cambias de opinión, click en **"Quitar descuento"**
- El precio vuelve al original

## 🔧 Configuración del Backend

### Endpoints Necesarios

```javascript
// Admin endpoints
GET    /api/admin/discount-codes         // Listar códigos
POST   /api/admin/discount-codes         // Crear código
PUT    /api/admin/discount-codes/:id     // Actualizar
DELETE /api/admin/discount-codes/:id     // Desactivar
GET    /api/admin/discount-codes/:id/statistics  // Estadísticas

// Public endpoints  
POST   /api/discount-codes/validate      // Validar código
POST   /api/orders/:id/apply-discount    // Aplicar a orden
```

### Estructura de la Base de Datos

```sql
CREATE TABLE discount_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  description VARCHAR(255),
  discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT'),
  discount_value DECIMAL(10,2),
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2),
  usage_limit INT,
  usage_limit_per_user INT DEFAULT 1,
  usage_count INT DEFAULT 0,
  valid_from DATETIME,
  valid_until DATETIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE discount_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  discount_code_id INT,
  user_id INT,
  order_id INT,
  discount_amount DECIMAL(10,2),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## 📱 Componentes del Sistema

### Frontend Components

```
src/
├── services/
│   └── discountService.js          # API service
├── pages/
│   ├── admin/
│   │   └── DiscountCodes.jsx       # Admin panel
│   └── Checkout.jsx                # Modified with discounts
├── components/
│   ├── admin/
│   │   ├── DiscountCodeForm.jsx    # Create/edit form
│   │   └── DiscountStatistics.jsx  # Statistics panel
│   ├── DiscountCode.jsx            # Checkout component
│   └── MercadoPagoButton.jsx       # Modified for discounts
```

## 🎨 Diseño y UX

### Colores del Tema
- **Principal**: Gradiente morado `#667eea → #764ba2`
- **Éxito**: Verde `#52c41a` (descuento aplicado)
- **Error**: Rojo `#ff4d4f` (código inválido)
- **Info**: Azul `#1890ff` (estadísticas)

### Experiencia de Usuario
1. **Input intuitivo**: Campo único para el código
2. **Validación inmediata**: Feedback instantáneo
3. **Cálculo transparente**: Muestra el ahorro claramente
4. **Fácil remoción**: Un click para quitar el descuento

## 🧪 Testing

### Casos de Prueba

#### Admin
1. ✅ Crear código "TEST20" con 20% de descuento
2. ✅ Ver que aparece en la lista
3. ✅ Editar y cambiar a 25%
4. ✅ Ver estadísticas (inicialmente vacías)
5. ✅ Desactivar el código

#### Cliente
1. ✅ Ir al checkout con productos
2. ✅ Ingresar código "TEST20"
3. ✅ Ver descuento aplicado (20% menos)
4. ✅ Completar la compra
5. ✅ Verificar que el descuento se aplicó en el pago

### Validaciones
- ❌ Código expirado → "Este código ha expirado"
- ❌ Código usado → "Ya usaste este código"
- ❌ Compra mínima no alcanzada → "Compra mínima: $5000"
- ❌ Código inexistente → "Código inválido"

## 📊 Métricas y KPIs

### Dashboard de Estadísticas Muestra:
- **Tasa de conversión**: Órdenes con descuento vs total
- **Descuento promedio**: Monto promedio descontado
- **Códigos más usados**: Top 5 códigos populares
- **Revenue impact**: Impacto en ingresos

## 🚨 Troubleshooting

### Problema: El código no se aplica
**Solución**: Verificar en el admin:
- ¿Está activo?
- ¿Está vigente?
- ¿Se alcanza la compra mínima?
- ¿El usuario ya lo usó?

### Problema: No aparece el componente en checkout
**Solución**: Verificar que se importó `DiscountCode` en `Checkout.jsx`

### Problema: El descuento no llega a MercadoPago
**Solución**: Verificar que `MercadoPagoButton` recibe props:
- `discountCode={appliedDiscount?.code}`
- `discountAmount={discountAmount}`

## 🎉 Próximos Pasos

### Mejoras Sugeridas
1. **Notificaciones por email** cuando se usa un código
2. **Códigos automáticos** para cumpleaños
3. **Integración con CRM** para segmentación
4. **A/B Testing** de descuentos
5. **Reportes automáticos** semanales

## 📞 Soporte

Si necesitas ayuda con el sistema de descuentos:
1. Revisar esta guía
2. Verificar los logs del servidor
3. Contactar al equipo de desarrollo

---

**Sistema desarrollado por**: VibraTickets Team
**Versión**: 1.0.0
**Última actualización**: Noviembre 2024
