import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/services/apiService.js',
  'src/pages/Checkout.jsx',
  'src/pages/Queue.jsx',
  'src/pages/SmartTicket.jsx',
  'src/pages/PaymentSuccess.jsx',
  'src/pages/PaymentPending.jsx',
  'src/pages/ShowDetail.jsx',
  'src/pages/admin/AdminDashboard.jsx',
  'src/hooks/useEventsWithShows.js',
];

let totalRemoved = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No existe: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];
  let removed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Patrones exhaustivos de fragmentos rotos
    const isBroken = 
      trimmed === ');' ||
      trimmed === '\');' ||
      trimmed === '`;' ||
      trimmed.match(/^['\)`;]+;?\s*$/) ||
      trimmed.match(/^:\s*',\s*/) ||
      trimmed.match(/^\.\.\.`\)?;?\s*$/) ||
      trimmed.match(/^para\s+\w+:',/) ||
      trimmed.match(/^en\s+su\s+lugar'\)?;?\s*$/) ||
      trimmed.match(/^\+\s*'\.\.\.'\)?;?\s*$/) ||
      trimmed.match(/^`\s*:\s*'/) ||
      trimmed.match(/^:\s*'.*'\)?;?\s*$/);
    
    if (isBroken) {
      removed++;
      totalRemoved++;
    } else {
      fixedLines.push(line);
    }
  }
  
  if (removed > 0) {
    content = fixedLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}: ${removed} líneas eliminadas`);
  } else {
    console.log(`ℹ️  ${file}: OK`);
  }
});

console.log(`\n✨ Total: ${totalRemoved} fragmentos rotos eliminados`);
console.log('🎉 Todos los archivos reparados!');
