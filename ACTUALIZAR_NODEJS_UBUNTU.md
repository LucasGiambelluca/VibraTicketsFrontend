# 🔄 Actualizar Node.js en Ubuntu Server

## ⚠️ Problema:
```
You are using Node.js 18.19.1. Vite requires Node.js version 20.19+ or 22.12+.
TypeError: crypto.hash is not a function
```

## ✅ Solución: Actualizar a Node.js 20.x LTS

### Opción 1: Usando NodeSource (RECOMENDADO)

```bash
# 1. Eliminar Node.js antiguo (opcional)
sudo apt remove nodejs npm -y

# 2. Agregar repositorio NodeSource para Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 3. Instalar Node.js 20
sudo apt install -y nodejs

# 4. Verificar versión
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x

# 5. Instalar pnpm globalmente
npm install -g pnpm

# 6. Verificar pnpm
pnpm --version
```

### Opción 2: Usando NVM (Node Version Manager)

```bash
# 1. Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. Recargar terminal
source ~/.bashrc
# O si usas zsh:
# source ~/.zshrc

# 3. Instalar Node.js 20 LTS
nvm install 20

# 4. Usar Node.js 20
nvm use 20

# 5. Establecer como versión por defecto
nvm alias default 20

# 6. Verificar
node --version  # v20.x.x
npm --version   # 10.x.x

# 7. Instalar pnpm
npm install -g pnpm
```

### Opción 3: Usando n (Node version manager)

```bash
# 1. Instalar n
sudo npm install -g n

# 2. Instalar Node.js 20 LTS
sudo n lts

# 3. Verificar
node --version
npm --version

# 4. Instalar pnpm
npm install -g pnpm
```

## 📦 Después de Actualizar Node.js

```bash
# 1. Ir al directorio del proyecto
cd ~/VibraTicketsFrontend/VibraTicketsFrontend

# 2. Limpiar instalación anterior
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml

# 3. Reinstalar dependencias con pnpm
pnpm install

# 4. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus API keys

# 5. Generar build de producción
pnpm run build

# 6. O iniciar en modo desarrollo
pnpm run dev
```

## 🚀 Para Producción (Build)

```bash
# 1. Configurar .env con VITE_MAINTENANCE_MODE
nano .env

# Ejemplo de .env para producción:
VITE_API_URL=https://vibratickets.online
VITE_APP_NAME=Vibra Tickets
VITE_APP_VERSION=1.0.0
VITE_MAINTENANCE_MODE=true  # o false para acceso libre
VITE_GROQ_API_KEY=tu_api_key_aqui
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
VITE_RECAPTCHA_SITE_KEY=tu_site_key_aqui

# 2. Build
pnpm run build

# 3. La carpeta dist/ estará lista
ls -la dist/

# 4. Servir con nginx o cualquier servidor estático
```

## 🌐 Servir con Servidor Estático

### Opción A: Usando serve (temporal)

```bash
# Instalar serve
npm install -g serve

# Servir la carpeta dist
serve -s dist -p 5173

# Acceder en: http://tu-ip:5173
```

### Opción B: Nginx (producción)

```bash
# 1. Instalar nginx
sudo apt update
sudo apt install nginx -y

# 2. Copiar build a nginx
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# 3. Configurar nginx para SPA
sudo nano /etc/nginx/sites-available/default

# Agregar dentro de server {}:
location / {
    try_files $uri $uri/ /index.html;
}

# 4. Reiniciar nginx
sudo systemctl restart nginx

# 5. Acceder en: http://tu-ip
```

## ✅ Verificación Final

```bash
# Verificar versiones
node --version    # Debe ser >= v20.19.0
npm --version     # Debe ser >= 10.0.0
pnpm --version    # Debe ser >= 8.0.0

# Verificar que el build funcionó
ls -la dist/
# Debe mostrar:
# - index.html
# - assets/
# - vite.svg
# - sw.js

# Verificar tamaño del bundle
du -sh dist/
# Debe ser aproximadamente 2-3 MB
```

## 🔍 Troubleshooting

### Error: "command not found: pnpm"
```bash
npm install -g pnpm
```

### Error: "EACCES: permission denied"
```bash
# Dar permisos al directorio npm global
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Error: "Cannot find module vite"
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build muy grande
```bash
# Verificar que dist/ no tenga node_modules
ls -la dist/
# Si tiene node_modules/, algo salió mal

# Rebuild limpio
rm -rf dist
pnpm run build
```

## 📊 Versiones Recomendadas

| Software | Versión Mínima | Versión Recomendada |
|----------|----------------|---------------------|
| Node.js  | 20.19.0        | 20.18.1 LTS         |
| npm      | 10.0.0         | 10.9.0              |
| pnpm     | 8.0.0          | 9.15.0              |

## 🎯 Resumen de Comandos Rápidos

```bash
# Actualizar Node.js (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm

# Configurar proyecto
cd ~/VibraTicketsFrontend/VibraTicketsFrontend
rm -rf node_modules
pnpm install
cp .env.example .env
nano .env

# Build
pnpm run build

# Servir (temporal)
npm install -g serve
serve -s dist -p 5173
```

---

**¡Después de actualizar Node.js, todo debería funcionar correctamente!** 🚀
