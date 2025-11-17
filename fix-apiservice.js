import fs from 'fs';

const filePath = 'src/services/apiService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Arreglar fragmentos rotos específicos
const fixes = [
  // Línea 174
  {
    broken: `.toFixed(2)}MB\`,\n          type: imageFile.type\n        });\n      }`,
    fixed: ``
  },
  // Línea 180
  {
    broken: `        - Backend configurado para imágenes');`,
    fixed: ``
  },
  // Línea 190
  {
    broken: `        :', jsonData);`,
    fixed: ``
  }
];

fixes.forEach(({ broken, fixed }) => {
  content = content.replace(broken, fixed);
});

// Limpiar líneas vacías múltiples
content = content.replace(/\n\n\n+/g, '\n\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ apiService.js arreglado');
