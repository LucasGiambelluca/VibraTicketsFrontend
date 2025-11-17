#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎫 Configurando Ticketera Frontend...\n');

// Verificar si package.json existe
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json no encontrado');
  process.exit(1);
}

// Leer package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Dependencias requeridas
const requiredDeps = {
  'gsap': '^3.12.2',
  'html2canvas': '^1.4.1',
  'jspdf': '^2.5.1',
  'three': '^0.158.0'
};

// Verificar dependencias faltantes
const missingDeps = [];
for (const [dep, version] of Object.entries(requiredDeps)) {
  if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
    missingDeps.push(`${dep}@${version}`);
  }
}

if (missingDeps.length > 0) {
  console.log('📦 Instalando dependencias faltantes...');
  console.log(`   ${missingDeps.join(', ')}\n`);
  
  try {
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas correctamente\n');
  } catch (error) {
    console.error('❌ Error instalando dependencias:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Todas las dependencias están instaladas\n');
}

// Verificar estructura de carpetas
const requiredDirs = [
  'src/components',
  'src/pages',
  'src/hooks',
  'src/services',
  'src/utils',
  'public'
];

console.log('📁 Verificando estructura de carpetas...');
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`   ✅ Creada carpeta: ${dir}`);
  }
}

// Crear archivo .env si no existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Configuración de desarrollo
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Ticketera
VITE_APP_VERSION=1.0.0
`;
  fs.writeFileSync(envPath, envContent);
  console.log('   ✅ Creado archivo .env');
}

console.log('\n🚀 ¡Configuración completada!');
console.log('\nComandos disponibles:');
console.log('   npm run dev     - Iniciar servidor de desarrollo');
console.log('   npm run build   - Construir para producción');
console.log('   npm run preview - Vista previa de producción');

console.log('\n🎯 Para iniciar el proyecto:');
console.log('   npm run dev');
