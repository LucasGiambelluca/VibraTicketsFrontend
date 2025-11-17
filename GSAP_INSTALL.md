# Instalación de GSAP

El proyecto está configurado para funcionar sin GSAP por defecto. Para habilitar las animaciones avanzadas, sigue estos pasos:

## 🚀 Instalar GSAP

```bash
npm install gsap
```

## 🔧 Habilitar animaciones

### 1. En MainEvents.jsx:
Descomenta las líneas:
```javascript
// Cambiar esto:
// import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// gsap.registerPlugin(ScrollTrigger);

// Por esto:
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

### 2. En el componente EventCard:
Descomenta todo el código GSAP en el useEffect

### 3. En Queue.jsx:
Descomenta:
```javascript
import { useOptimizedAnimations } from '../hooks/useOptimizedPerformance';
```

## ✅ Verificar instalación

```bash
npm list gsap
```

Debería mostrar:
```
gsap@3.12.2
```

## 🎯 Funcionalidades con GSAP

- ✨ Animaciones de entrada con scroll
- 🎭 Efectos hover suaves
- 📱 Transiciones fluidas
- 🎪 Animaciones de progreso

## 🔄 Sin GSAP (actual)

El proyecto funciona perfectamente con:
- ✅ CSS transitions
- ✅ Ant Design animations
- ✅ Hover effects básicos
- ✅ Todas las funcionalidades principales
