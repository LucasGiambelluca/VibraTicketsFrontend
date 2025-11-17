import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/pages/admin/AdminDashboard.jsx');

console.log('📝 Leyendo AdminDashboard.jsx...');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`📊 Total de líneas: ${lines.length}`);

let fixed = 0;

// Patrón 1: Buscar líneas que terminan con "}" sin "  );" antes
// Esto indica un componente funcional que no está cerrado correctamente
for (let i = 0; i < lines.length - 1; i++) {
  const currentLine = lines[i];
  const nextLine = lines[i + 1];
  
  // Si la línea actual termina con "}" y la siguiente es "}" o empieza con "//"
  // Y NO tiene "  );" antes, agregar "  );"
  if (currentLine.trim() === '}' && 
      (nextLine.trim() === '}' || nextLine.trim().startsWith('//'))) {
    
    // Verificar si la línea anterior NO es ya "  );"
    const prevLine = i > 0 ? lines[i - 1] : '';
    if (!prevLine.includes(');')) {
      // Insertar "  );" antes del "}"
      lines[i] = currentLine.replace(/^(\s*)}$/, '$1  );\n$1}');
      fixed++;
      console.log(`✅ Línea ${i + 1}: Agregado );`);
    }
  }
}

// Escribir el archivo corregido
const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log(`\n✨ Proceso completado: ${fixed} correcciones aplicadas`);
console.log('⚠️  Nota: Revisa manualmente si hay más errores');
