# 🎫 ShowDetail - Selección de Localidades

**Fecha**: 2025-10-27  
**Versión**: 1.3.1  
**Estado**: ✅ Completado

---

## 📋 RESUMEN

Se actualizó completamente el componente `ShowDetail` para mostrar las localidades/secciones disponibles del show, permitiendo al usuario seleccionar una antes de continuar con la compra.

---

## 🎯 PROBLEMA RESUELTO

**Antes**: ShowDetail era un componente básico que solo mostraba "Show #X" y un botón genérico de comprar.

**Ahora**: ShowDetail muestra:
- ✅ Información completa del show (fecha, hora, venue)
- ✅ Lista de todas las localidades/secciones disponibles
- ✅ Precio de cada localidad
- ✅ Disponibilidad en tiempo real
- ✅ Selección interactiva de localidad
- ✅ Barra fija inferior con botón de continuar

---

## 🔧 CAMBIOS IMPLEMENTADOS

### 1. **Carga de Datos del Backend**

```javascript
// Cargar show
const showResponse = await showsApi.getShow(showId);

// Cargar evento asociado
const eventResponse = await eventsApi.getEvent(eventId);

// Cargar secciones del show
const sectionsResponse = await showsApi.getShowSections(showId);
```

### 2. **Hero Section**

**Características**:
- Imagen de fondo (del evento o placeholder)
- Breadcrumbs de navegación
- Nombre del evento
- Fecha y hora del show (formato español)
- Venue y ciudad

**Código**:
```javascript
<div style={{ 
  background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${event?.image_url})`,
  backgroundSize: 'cover'
}}>
  <Breadcrumb items={[
    { title: 'Inicio' },
    { title: event?.name },
    { title: 'Seleccionar Localidad' }
  ]} />
  <Title>{event?.name}</Title>
  <Space>
    <CalendarOutlined />
    {format(showDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
  </Space>
</div>
```

### 3. **Grilla de Localidades**

**Cards de Secciones**:
- Nombre de la sección (ej: "Platea", "Pullman", "Campo")
- Tag de tipo: 🪑 Numerada o 🎫 General
- Precio destacado
- Capacidad total
- Entradas disponibles
- Tag de estado (DISPONIBLE/POCAS/AGOTADO)

**Estados visuales**:
- **Disponible**: Fondo blanco, cursor pointer, hoverable
- **Seleccionada**: Borde azul, fondo azul claro, tag "Seleccionada"
- **Agotada**: Fondo gris, cursor not-allowed, no clickeable

**Código**:
```javascript
<Card
  hoverable={isAvailable}
  onClick={() => handleSelectSection(section)}
  style={{
    border: isSelected ? '2px solid #667eea' : '1px solid #f0f0f0',
    background: isSoldOut ? '#fafafa' : isSelected ? '#f0f5ff' : 'white',
    cursor: isAvailable ? 'pointer' : 'not-allowed'
  }}
>
  <Title level={4}>{section.name}</Title>
  <Tag color={section.kind === 'SEATED' ? 'purple' : 'cyan'}>
    {section.kind === 'SEATED' ? '🪑 Numerada' : '🎫 General'}
  </Tag>
  
  <div>
    <Text strong>Precio:</Text>
    <Text>${(section.price_cents / 100).toLocaleString()}</Text>
  </div>
  
  <div>
    <Text>Disponibles:</Text>
    <Text>{section.available_seats}</Text>
    <Tag color={isSoldOut ? 'red' : hasLowSeats ? 'orange' : 'green'}>
      {isSoldOut ? 'AGOTADO' : hasLowSeats ? 'POCAS' : 'DISPONIBLE'}
    </Tag>
  </div>
</Card>
```

### 4. **Barra Fija Inferior**

**Características**:
- Posición fija en la parte inferior
- Muestra la sección seleccionada y su precio
- Botón "Continuar" grande y destacado
- Disabled si no hay sección seleccionada

**Código**:
```javascript
<div style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'white',
  padding: '16px 24px',
  boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
  zIndex: 1000
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div>
      {selectedSection ? (
        <>
          <Text strong>{selectedSection.name}</Text>
          <Text>${(selectedSection.price_cents / 100).toLocaleString()}</Text>
        </>
      ) : (
        <Text type="secondary">Seleccioná una localidad para continuar</Text>
      )}
    </div>
    <Button
      type="primary"
      size="large"
      icon={<ShoppingCartOutlined />}
      onClick={handleBuyTickets}
      disabled={!selectedSection}
    >
      Continuar
    </Button>
  </div>
</div>
```

### 5. **Validaciones**

```javascript
const handleSelectSection = (section) => {
  if (section.available_seats === 0) {
    message.warning('Esta sección está agotada');
    return;
  }
  setSelectedSection(section);
};

const handleBuyTickets = () => {
  if (!selectedSection) {
    message.warning('Por favor, seleccioná una localidad');
    return;
  }
  
  navigate(`/seats/${showId}`, { 
    state: { 
      section: selectedSection,
      show: show,
      event: event
    } 
  });
};
```

---

## 📊 ESTRUCTURA DE DATOS

### Show (desde backend):
```json
{
  "id": 1,
  "eventId": 1,
  "event_id": 1,
  "startsAt": "2025-12-15T21:00:00.000Z",
  "starts_at": "2025-12-15T21:00:00.000Z",
  "venue_name": "Movistar Arena",
  "venue_city": "Buenos Aires",
  "available_seats": 150,
  "total_capacity": 200
}
```

### Section (desde backend):
```json
{
  "id": 1,
  "show_id": 1,
  "name": "Platea",
  "kind": "SEATED",
  "capacity": 100,
  "available_seats": 75,
  "sold_seats": 25,
  "price_cents": 1500000,
  "created_at": "2025-10-27T...",
  "updated_at": "2025-10-27T..."
}
```

---

## 🎨 DISEÑO Y UX

### Hero Section
- Altura: 300px
- Imagen de fondo con overlay oscuro
- Breadcrumbs para navegación
- Título del evento (2.5rem)
- Iconos para fecha, hora y ubicación

### Grilla de Localidades
**Responsive**:
- 📱 Móvil (xs): 1 columna (24/24)
- 📱 Tablet (sm): 2 columnas (12/24)
- 💻 Desktop (lg): 3 columnas (8/24)

**Card de Sección**:
- Border radius: 12px
- Padding interno
- Hover effect (si disponible)
- Transición suave (0.3s)
- Sombra elevada al seleccionar

### Estados de Disponibilidad
| Estado | Color Tag | Condición |
|--------|-----------|-----------|
| DISPONIBLE | Verde | available_seats > 20 |
| POCAS | Naranja | 1 ≤ available_seats ≤ 19 |
| AGOTADO | Rojo | available_seats = 0 |

### Barra Inferior
- Altura: auto (padding 16px)
- Fondo blanco
- Sombra superior
- z-index: 1000 (siempre visible)
- Botón grande (height: 48px)
- Gradient morado cuando habilitado

---

## 🔄 FLUJO COMPLETO

```
1. Usuario en EventDetail
   ↓ Click "Comprar" en un show
   
2. ShowDetail carga:
   - GET /api/shows/:showId
   - GET /api/events/:eventId
   - GET /api/shows/:showId/sections
   ↓
   
3. Usuario ve:
   - Hero con info del show
   - Grilla de localidades disponibles
   - Precios y disponibilidad
   ↓
   
4. Usuario selecciona localidad
   - Click en card de sección
   - Card se marca como seleccionada
   - Barra inferior muestra precio
   ↓
   
5. Usuario click "Continuar"
   - Validación: debe haber sección seleccionada
   - Navegación a /seats/:showId
   - State: { section, show, event }
   ↓
   
6. SeatSelection o Checkout
```

---

## 🧪 TESTING

### Test 1: Ver Localidades
```bash
1. Ir a un evento con shows
2. Click "Comprar" en un show
3. Verificar navegación a /shows/:showId
4. Verificar que se muestran:
   - Hero con fecha y hora
   - Grilla de localidades
   - Precios
   - Disponibilidad
```

### Test 2: Seleccionar Localidad
```bash
1. En ShowDetail, click en una localidad disponible
2. Verificar:
   - Card se marca con borde azul
   - Fondo cambia a azul claro
   - Tag "Seleccionada" aparece
   - Barra inferior muestra nombre y precio
   - Botón "Continuar" se habilita
```

### Test 3: Localidad Agotada
```bash
1. Click en localidad con available_seats = 0
2. Verificar:
   - Mensaje: "Esta sección está agotada"
   - Card no se selecciona
   - Cursor: not-allowed
   - Fondo gris
```

### Test 4: Continuar sin Selección
```bash
1. No seleccionar ninguna localidad
2. Click "Continuar"
3. Verificar mensaje: "Por favor, seleccioná una localidad"
```

### Test 5: Navegación
```bash
1. Click "Volver al evento"
2. Verificar navegación a /events/:eventId
3. Breadcrumbs funcionan correctamente
```

### Test 6: Responsive
```bash
1. Móvil: 1 columna
2. Tablet: 2 columnas
3. Desktop: 3 columnas
4. Barra inferior responsive
```

---

## 📝 ARCHIVOS MODIFICADOS

### Modificados:
1. ✅ `src/pages/ShowDetail.jsx` (351 líneas)
   - Carga datos del backend
   - Hero section completo
   - Grilla de localidades
   - Selección interactiva
   - Barra fija inferior
   - Estados de loading y error
   - Validaciones

---

## 🔗 ENDPOINTS UTILIZADOS

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/shows/:showId` | GET | Obtener datos del show |
| `/api/events/:eventId` | GET | Obtener datos del evento |
| `/api/shows/:showId/sections` | GET | Obtener secciones/localidades |

---

## ⚠️ NOTAS IMPORTANTES

### 1. Tipos de Localidades

**SEATED (Numerada)**:
- Tiene asientos específicos
- Tag morado: 🪑 Numerada
- Requiere selección de asiento en siguiente paso

**GA (General)**:
- Sin asientos asignados
- Tag cyan: 🎫 General
- Solo requiere cantidad en siguiente paso

### 2. Precios

Los precios vienen en centavos:
```javascript
const price = section.price_cents / 100; // Convertir a pesos
```

### 3. Navegación con State

Al continuar, se pasa información al siguiente componente:
```javascript
navigate(`/seats/${showId}`, { 
  state: { 
    section: selectedSection,
    show: show,
    event: event
  } 
});
```

### 4. Empty State

Si no hay secciones:
```javascript
{sections.length === 0 && (
  <div>
    <Text>No hay localidades disponibles para este show</Text>
  </div>
)}
```

---

## 🚀 PRÓXIMOS PASOS

### Mejoras Futuras:

1. **Filtros de Localidades**
   - Por precio
   - Por tipo (Numerada/General)
   - Por disponibilidad

2. **Ordenamiento**
   - Por precio (menor a mayor)
   - Por disponibilidad
   - Por nombre

3. **Mapa del Venue**
   - Mostrar plano del lugar
   - Ubicación de cada sección
   - Vista interactiva

4. **Comparación**
   - Comparar precios entre secciones
   - Destacar mejor relación precio/ubicación

5. **Favoritos**
   - Marcar secciones favoritas
   - Recordar preferencias del usuario

6. **Cantidad de Entradas**
   - Selector de cantidad antes de continuar
   - Validar disponibilidad según cantidad

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] ShowDetail carga datos del backend
- [x] Hero section con info del show
- [x] Grilla de localidades responsive
- [x] Cards clickeables y seleccionables
- [x] Estados visuales (disponible/seleccionada/agotada)
- [x] Precios convertidos de centavos
- [x] Disponibilidad en tiempo real
- [x] Tags de estado (DISPONIBLE/POCAS/AGOTADO)
- [x] Barra fija inferior
- [x] Botón "Continuar" con validación
- [x] Navegación con state
- [x] Loading states
- [x] Error handling
- [x] Empty state
- [x] Breadcrumbs
- [x] Botón "Volver"
- [x] Responsive design
- [x] Documentación creada

---

## 📊 COMPARACIÓN

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Información** | "Show #X" | Hero completo con fecha, hora, venue |
| **Localidades** | ❌ No mostraba | ✅ Grilla completa |
| **Selección** | ❌ No había | ✅ Interactiva con feedback visual |
| **Precios** | ❌ No mostraba | ✅ Precio por localidad |
| **Disponibilidad** | ❌ No mostraba | ✅ En tiempo real con tags |
| **Navegación** | Genérica | ✅ Con breadcrumbs y state |
| **UX** | Básica | ✅ Moderna con barra fija |
| **Responsive** | No | ✅ Sí (1-3 columnas) |

---

## 🎯 RESULTADO FINAL

✅ **Usuario puede**:
- Ver todas las localidades disponibles
- Comparar precios entre secciones
- Ver disponibilidad en tiempo real
- Seleccionar la localidad deseada
- Continuar al siguiente paso con la información necesaria

✅ **Sistema muestra**:
- Datos reales del backend
- Estados claros de disponibilidad
- Feedback visual de selección
- Validaciones antes de continuar
- Diseño moderno y responsive

---

**🎉 SELECCIÓN DE LOCALIDADES COMPLETADA Y FUNCIONAL**

Última actualización: 2025-10-27  
Estado: ✅ Completado y Listo para Producción
