import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/services/apiService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Eliminar TODAS las líneas que contienen solo fragmentos rotos
const lines = content.split('\n');
const fixedLines = [];
let removed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Lista exhaustiva de patrones rotos
  const isBroken = 
    trimmed === ');' ||
    trimmed === '\');' ||
    trimmed === '`;' ||
    trimmed.match(/^['\)`;]+;?\s*$/) ||
    trimmed.match(/^:\s*',\s*\w+/) ||
    trimmed.match(/^\.\.\.`\)?;?\s*$/) ||
    trimmed.match(/^para\s+\w+:',/) ||
    trimmed.match(/^en\s+su\s+lugar'\)?;?\s*$/) ||
    trimmed.match(/^\+\s*'\.\.\.'\)?;?\s*$/) ||
    trimmed.match(/^`\s*:\s*''\)?;?\s*$/) ||
    trimmed.match(/^`\s*:\s*'\(autenticado\)'\)?;?\s*$/);
  
  if (isBroken) {
    console.log(`❌ Línea ${i + 1}: "${trimmed}"`);
    removed++;
  } else {
    fixedLines.push(line);
  }
}

content = fixedLines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Eliminados ${removed} fragmentos rotos`);
console.log('✨ apiService.js completamente limpio');
