import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

// Hook para optimizar animaciones y rendimiento
export const useOptimizedPerformance = () => {
  const animationFrameRef = useRef();
  const observerRef = useRef();

  // Throttle para eventos de scroll/resize
  const useThrottle = (callback, delay) => {
    const lastRun = useRef(Date.now());
    
    return useCallback((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }, [callback, delay]);
  };

  // Debounce para inputs y búsquedas
  const useDebounce = (callback, delay) => {
    const timeoutRef = useRef();
    
    return useCallback((...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
  };

  // Intersection Observer para lazy loading
  const useIntersectionObserver = (callback, options = {}) => {
    useEffect(() => {
      observerRef.current = new IntersectionObserver(callback, {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      });

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [callback]);

    return observerRef.current;
  };

  // Optimización de imágenes
  const optimizeImage = useCallback((src, width = 500, height = 300) => {
    if (src.includes('unsplash.com')) {
      return `${src}&w=${width}&h=${height}&fit=crop&auto=format&q=80`;
    }
    return src;
  }, []);

  // Preload de imágenes críticas
  const preloadImages = useCallback((imageUrls) => {
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Cleanup de animaciones GSAP
  const cleanupAnimations = useCallback(() => {
    gsap.killTweensOf("*");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Memoización inteligente para listas grandes
  const useMemoizedList = (list, dependencies = []) => {
    return useMemo(() => list, dependencies);
  };

  // Virtual scrolling para listas grandes
  const useVirtualScrolling = (items, itemHeight = 100, containerHeight = 400) => {
    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(Math.ceil(containerHeight / itemHeight));

    const handleScroll = useThrottle((scrollTop) => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      const newEndIndex = Math.min(
        newStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
      );
      
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }, 16);

    const visibleItems = useMemo(() => 
      items.slice(startIndex, endIndex), 
      [items, startIndex, endIndex]
    );

    return {
      visibleItems,
      startIndex,
      endIndex,
      handleScroll,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  };

  return {
    useThrottle,
    useDebounce,
    useIntersectionObserver,
    optimizeImage,
    preloadImages,
    cleanupAnimations,
    useMemoizedList,
    useVirtualScrolling
  };
};

// Hook para gestión de estado global optimizada
export const useOptimizedState = (initialState) => {
  const stateRef = useRef(initialState);
  const listenersRef = useRef(new Set());

  const getState = useCallback(() => stateRef.current, []);

  const setState = useCallback((newState) => {
    const prevState = stateRef.current;
    stateRef.current = typeof newState === 'function' 
      ? newState(prevState) 
      : { ...prevState, ...newState };

    // Notificar solo a listeners activos
    listenersRef.current.forEach(listener => {
      if (typeof listener === 'function') {
        listener(stateRef.current, prevState);
      }
    });
  }, []);

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener);
    
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return { getState, setState, subscribe };
};

// Hook para cache inteligente
export const useSmartCache = (maxSize = 50) => {
  const cacheRef = useRef(new Map());
  const accessOrderRef = useRef([]);

  const get = useCallback((key) => {
    const value = cacheRef.current.get(key);
    if (value !== undefined) {
      // Mover al final (más reciente)
      const index = accessOrderRef.current.indexOf(key);
      if (index > -1) {
        accessOrderRef.current.splice(index, 1);
      }
      accessOrderRef.current.push(key);
    }
    return value;
  }, []);

  const set = useCallback((key, value) => {
    // Si excede el tamaño máximo, eliminar el menos usado
    if (cacheRef.current.size >= maxSize && !cacheRef.current.has(key)) {
      const oldestKey = accessOrderRef.current.shift();
      cacheRef.current.delete(oldestKey);
    }

    cacheRef.current.set(key, value);
    
    // Actualizar orden de acceso
    const index = accessOrderRef.current.indexOf(key);
    if (index > -1) {
      accessOrderRef.current.splice(index, 1);
    }
    accessOrderRef.current.push(key);
  }, [maxSize]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    accessOrderRef.current.length = 0;
  }, []);

  const has = useCallback((key) => {
    return cacheRef.current.has(key);
  }, []);

  return { get, set, clear, has, size: () => cacheRef.current.size };
};

// Hook para animaciones optimizadas
export const useOptimizedAnimations = () => {
  const timelineRef = useRef();

  const createTimeline = useCallback((options = {}) => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    timelineRef.current = gsap.timeline({
      paused: true,
      ...options
    });
    
    return timelineRef.current;
  }, []);

  const animateIn = useCallback((elements, options = {}) => {
    return gsap.fromTo(elements, 
      { 
        opacity: 0, 
        y: 30,
        scale: 0.9,
        ...options.from 
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        ...options.to 
      }
    );
  }, []);

  const animateOut = useCallback((elements, options = {}) => {
    return gsap.to(elements, {
      opacity: 0,
      y: -30,
      scale: 0.9,
      duration: 0.4,
      ease: "power2.in",
      ...options
    });
  }, []);

  const morphAnimation = useCallback((element, options = {}) => {
    const tl = gsap.timeline();
    
    tl.to(element, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out"
    })
    .to(element, {
      scale: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.5)",
      ...options
    });

    return tl;
  }, []);

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return {
    createTimeline,
    animateIn,
    animateOut,
    morphAnimation,
    timeline: timelineRef.current
  };
};
