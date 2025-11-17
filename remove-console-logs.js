import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios a procesar
const directories = ['src'];

// Patrones a eliminar
const consolePatterns = [
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.warn\([^)]*\);?\s*\n?/g,
  /console\.info\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g,
  // Mantener console.error para errores críticos en producción
];

let filesProcessed = 0;
let logsRemoved = 0;

function processFile(filePath) {
  // Solo procesar archivos .js, .jsx, .ts, .tsx
  if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileLogsRemoved = 0;

    // Aplicar cada patrón
    consolePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        fileLogsRemoved += matches.length;
        content = content.replace(pattern, '');
      }
    });

    // Si se hicieron cambios, guardar el archivo
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath}: ${fileLogsRemoved} logs eliminados`);
      filesProcessed++;
      logsRemoved += fileLogsRemoved;
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorar node_modules y dist
      if (item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

console.log('🧹 Iniciando limpieza de console.log...\n');

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    processDirectory(fullPath);
  }
});

console.log(`\n✨ Limpieza completada!`);
console.log(`📁 Archivos procesados: ${filesProcessed}`);
console.log(`🗑️  Console logs eliminados: ${logsRemoved}`);
console.log(`\n⚠️  Nota: console.error se mantuvo para errores críticos en producción`);
