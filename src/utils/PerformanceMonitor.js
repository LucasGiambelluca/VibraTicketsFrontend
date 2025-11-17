class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      memoryUsage: 0,
      renderTime: 0
    };
    
    this.observers = [];
    this.init();
  }

  init() {
    // Medir tiempo de carga de página
    this.measurePageLoad();
    
    // Observar Core Web Vitals
    this.observeWebVitals();
    
    // Monitorear memoria
    this.monitorMemory();
    
    // Observar renders largos
    this.observeLongTasks();
  }

  measurePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      });
  }

  observeWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        }
    }).observe({ entryTypes: ['first-input'] });
  }

  monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };
        
        // Advertir si el uso de memoria es alto
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          }%`);
        }
      }, 5000);
    }
  }

  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Enviar métrica si es muy larga
          if (entry.duration > 100) {
            this.reportLongTask(entry);
          }
        }
      }).observe({ entryTypes: ['longtask'] });
    }
  }

  // Medir tiempo de render de componentes
  measureComponentRender(componentName, renderFunction) {
    const startTime = performance.now();
    
    const result = renderFunction();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // Más de 1 frame (60fps)
      }ms`);
    }
    
    return result;
  }

  // Medir tiempo de API calls
  measureApiCall(url, fetchFunction) {
    const startTime = performance.now();
    
    return fetchFunction().then(response => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      }ms`);
      
      if (duration > 1000) {
        }ms`);
      }
      
      return response;
    });
  }

  // Reportar métricas a servicio de analytics
  reportMetrics() {
    const report = {
      ...this.metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Aquí enviarías las métricas a tu servicio de analytics
    return report;
  }

  reportLongTask(entry) {
    // Reportar tareas largas para optimización
    }

  // Obtener recomendaciones de optimización
  getOptimizationSuggestions() {
    const suggestions = [];
    
    if (this.metrics.firstContentfulPaint > 2000) {
      suggestions.push('Optimizar FCP: Reducir CSS/JS crítico');
    }
    
    if (this.metrics.largestContentfulPaint > 2500) {
      suggestions.push('Optimizar LCP: Optimizar imágenes principales');
    }
    
    if (this.metrics.cumulativeLayoutShift > 0.1) {
      suggestions.push('Reducir CLS: Definir dimensiones de imágenes');
    }
    
    if (this.metrics.firstInputDelay > 100) {
      suggestions.push('Mejorar FID: Reducir JavaScript en main thread');
    }
    
    return suggestions;
  }

  // Limpiar observadores
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton
const performanceMonitor = new PerformanceMonitor();

// Hook para React
export const usePerformanceMonitor = () => {
  const measureRender = (componentName, renderFn) => {
    return performanceMonitor.measureComponentRender(componentName, renderFn);
  };

  const measureApi = (url, fetchFn) => {
    return performanceMonitor.measureApiCall(url, fetchFn);
  };

  const getMetrics = () => {
    return performanceMonitor.metrics;
  };

  const getSuggestions = () => {
    return performanceMonitor.getOptimizationSuggestions();
  };

  return {
    measureRender,
    measureApi,
    getMetrics,
    getSuggestions
  };
};

export default performanceMonitor;
