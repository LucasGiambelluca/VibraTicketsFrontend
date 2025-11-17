import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/PaymentSuccess.jsx',
  'src/pages/Queue.jsx',
  'src/pages/SmartTicket.jsx',
  'src/pages/admin/AdminDashboard.jsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No existe: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixed = 0;
  
  // Patrón 1: Reemplazar "  }\n" seguido de línea vacía y luego "  if" o "  return"
  // Esto indica que falta un ");  }" antes del siguiente bloque
  const pattern1 = /(\s+)<\/div>\n(\s+)}\n\n(\s+)(if |return )/g;
  if (content.match(pattern1)) {
    content = content.replace(pattern1, '$1</div>\n$2  );\n$2}\n\n$3$4');
    fixed++;
  }
  
  // Patrón 2: Buscar "  }\n" al final de un componente funcional (antes de otra función)
  const pattern2 = /(\s+)<\/Layout>\n(\s+)}\n\n\/\/ /g;
  if (content.match(pattern2)) {
    content = content.replace(pattern2, '$1</Layout>\n$2  );\n$2}\n\n// ');
    fixed++;
  }
  
  if (fixed > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}: ${fixed} patrones arreglados`);
  } else {
    console.log(`ℹ️  ${file}: OK (sin cambios automáticos)`);
  }
});

console.log('\n✨ Proceso completado');
console.log('⚠️  Nota: Algunos errores pueden requerir corrección manual');
