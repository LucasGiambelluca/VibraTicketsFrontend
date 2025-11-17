import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patrones de fragmentos rotos a eliminar
const brokenPatterns = [
  /\s*\);\s*$/gm,  // ); sueltos al final de línea
  /^\s*\);\s*$/gm, // ); sueltos en línea completa
  /^\s*'\);\s*$/gm, // '); sueltos
  /^\s*:\s*',\s*\w+\);\s*$/gm, // :', variable); sueltos
  /^\s*\.\.\.`\);\s*$/gm, // ...`); sueltos
  /^\s*:',\s*\w+.*$/gm, // :', variable sueltos
];

const filesToFix = [
  'src/services/apiService.js',
  'src/hooks/useEventsWithShows.js',
  'src/pages/Checkout.jsx',
  'src/pages/SmartTicket.jsx',
  'src/pages/admin/AdminDashboard.jsx',
  'src/pages/PaymentSuccess.jsx',
  'src/pages/PaymentPending.jsx',
  'src/pages/ShowDetail.jsx',
  'src/pages/Queue.jsx',
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Eliminar líneas que solo contienen fragmentos rotos
    const lines = content.split('\n');
    const fixedLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // Eliminar líneas que son solo fragmentos rotos
      if (
        trimmed === ');' ||
        trimmed === '\');' ||
        trimmed.match(/^['\)]+;?\s*$/) ||
        trimmed.match(/^:\s*',\s*\w+\)?;?\s*$/) ||
        trimmed.match(/^\.\.\.`\)?;?\s*$/)
      ) {
        return false;
      }
      
      return true;
    });
    
    content = fixedLines.join('\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath} - Reparado`);
      totalFixed++;
    } else {
      console.log(`ℹ️  ${filePath} - Sin cambios necesarios`);
    }
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
  }
});

console.log(`\n✨ Reparación completada: ${totalFixed} archivos arreglados`);
