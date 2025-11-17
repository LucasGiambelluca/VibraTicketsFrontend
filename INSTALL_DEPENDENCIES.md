# Instalación de Dependencias

Para instalar todas las dependencias necesarias para el proyecto, ejecuta los siguientes comandos:

## Dependencias principales
```bash
npm install gsap@^3.12.2
npm install html2canvas@^1.4.1
npm install jspdf@^2.5.1
npm install three@^0.158.0
```

## O instalar todas de una vez
```bash
npm install gsap html2canvas jspdf three
```

## Verificar instalación
Después de instalar, verifica que las dependencias estén en package.json:

```json
{
  "dependencies": {
    "gsap": "^3.12.2",
    "html2canvas": "^1.4.1", 
    "jspdf": "^2.5.1",
    "three": "^0.158.0"
  }
}
```

## Comandos para desarrollo
```bash
# Instalar todas las dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## Notas importantes
- GSAP: Para animaciones avanzadas
- html2canvas: Para capturar elementos DOM como imagen
- jsPDF: Para generar PDFs de tickets
- Three.js: Para efectos 3D en la cola virtual

Si encuentras errores de importación, asegúrate de que todas las dependencias estén instaladas correctamente.
