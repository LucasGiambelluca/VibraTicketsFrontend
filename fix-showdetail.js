import fs from 'fs';

const filePath = 'src/pages/ShowDetail.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const fixedLines = [];
let removed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Patrones específicos de fragmentos rotos
  const isBroken = 
    trimmed.match(/^\.slice\(0, 10\), '\.\.\.'\);$/) ||
    trimmed.match(/^['\)`;]+;?\s*$/) ||
    trimmed.match(/^:\s*',/) ||
    trimmed.match(/^EXCLUIDO:/) ||
    trimmed.match(/^NO disponible:/) ||
    trimmed === ');' ||
    trimmed === '});';
  
  if (isBroken) {
    console.log(`❌ Línea ${i + 1}: "${trimmed}"`);
    removed++;
  } else {
    fixedLines.push(line);
  }
}

content = fixedLines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ ShowDetail.jsx: ${removed} fragmentos eliminados`);
