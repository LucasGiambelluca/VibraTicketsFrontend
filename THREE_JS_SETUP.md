# Three.js Setup (Opcional)

El proyecto funciona perfectamente sin Three.js usando la versión Canvas 2D de la cola virtual. Si quieres habilitar los efectos 3D avanzados, sigue estos pasos:

## 🎯 Instalación de Three.js

```bash
npm install three@^0.158.0
```

## 🔧 Activar la Cola Virtual 3D

1. **Editar Queue.jsx:**
```javascript
// Cambiar esta línea:
import VirtualQueueSimple from '../components/VirtualQueueSimple';

// Por esta:
import VirtualQueue from '../components/VirtualQueue';

// Y cambiar el componente:
<VirtualQueue 
  position={position}
  totalUsers={total}
  onComplete={handleComplete}
/>
```

## 🐛 Solución de Problemas

### Error de importación de Three.js
Si encuentras errores como "Failed to resolve import 'three'":

1. **Verificar instalación:**
```bash
npm list three
```

2. **Reinstalar si es necesario:**
```bash
npm uninstall three
npm install three@^0.158.0
```

3. **Verificar en package.json:**
```json
{
  "dependencies": {
    "three": "^0.158.0"
  }
}
```

### Problemas de compatibilidad
Si Three.js no funciona en tu entorno:

1. **Usar la versión Canvas 2D** (ya configurada por defecto)
2. **Verificar soporte WebGL** en el navegador
3. **Actualizar navegador** si es necesario

## 🎨 Diferencias entre versiones

### VirtualQueueSimple (Canvas 2D)
- ✅ Compatible con todos los navegadores
- ✅ Menor uso de recursos
- ✅ Animaciones fluidas con partículas 2D
- ✅ Círculo de progreso animado

### VirtualQueue (Three.js)
- 🎯 Efectos 3D avanzados
- 🎯 Partículas flotantes en 3D
- 🎯 Geometrías animadas
- 🎯 Mayor impacto visual
- ⚠️ Requiere WebGL
- ⚠️ Mayor uso de recursos

## 🚀 Recomendación

Para la mayoría de casos de uso, **VirtualQueueSimple** es suficiente y ofrece una excelente experiencia visual sin las complicaciones de Three.js.

Solo usa **VirtualQueue** si:
- Necesitas efectos 3D específicos
- Tu audiencia tiene navegadores modernos
- Quieres el máximo impacto visual
