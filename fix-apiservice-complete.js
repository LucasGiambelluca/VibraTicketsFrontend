import fs from 'fs';

const filePath = 'src/services/apiService.js';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Patrones de líneas rotas a eliminar
  const brokenPatterns = [
    /^['\)]+;?\s*$/,                    // '); o );
    /^:\s*',\s*\w+.*$/,                 // :', variable
    /^\.\.\.`\)?;?\s*$/,                // ...`);
    /^para\s+\w+:',\s*\w+.*$/,          // para show:', variable
    /^en\s+su\s+lugar'\)?;?\s*$/,      // en su lugar');
    /^\+\s*'\.\.\.'\)?;?\s*$/,         // + '...');
  ];
  
  let shouldSkip = false;
  for (const pattern of brokenPatterns) {
    if (pattern.test(trimmed)) {
      shouldSkip = true;
      console.log(`❌ Eliminando línea ${i + 1}: "${trimmed}"`);
      break;
    }
  }
  
  if (!shouldSkip) {
    fixedLines.push(line);
  }
}

content = fixedLines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ apiService.js completamente reparado');
