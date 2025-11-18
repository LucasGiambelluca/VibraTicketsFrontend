# 🚨 Solucionar Error CORS en EC2

## Problema Actual:
```
Access to XMLHttpRequest at 'https://vibratickets.online/api/...' 
from origin 'http://tu-ec2-ip' has been blocked by CORS policy
```

## 🎯 Soluciones (en orden de recomendación)

---

## ✅ Solución 1: Configurar CORS en el Backend (MÁS RÁPIDO)

### En el Backend (Node.js/Express):

```javascript
// backend/src/index.js o app.js

const express = require('express');
const cors = require('cors');
const app = express();

// Configurar CORS ANTES de las rutas
app.use(cors({
  origin: [
    'http://localhost:5173',              // Desarrollo local
    'http://localhost:3001',              // Desarrollo frontend alternativo
    'http://TU_EC2_IP',                   // Tu EC2 (reemplaza con IP real)
    'http://TU_EC2_IP:5173',              // Tu EC2 con puerto
    'https://TU_DOMINIO.com',             // Tu dominio de producción
    'http://vibratickets.online',         // Si el frontend también está aquí
    'https://vibratickets.online'         // Si usas HTTPS
  ],
  credentials: true,                       // Permitir cookies y auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Resto de tu código...
app.use(express.json());
// ... tus rutas
```

### Instalar cors si no lo tienes:
```bash
cd ~/tu-backend
npm install cors
# O con pnpm
pnpm add cors
```

### Reiniciar el backend:
```bash
pm2 restart backend
# O si usas otro gestor de procesos
sudo systemctl restart tu-backend
```

---

## ✅ Solución 2: Nginx Proxy Reverso (MEJOR PARA PRODUCCIÓN)

Con esta solución, frontend y backend estarán en el mismo dominio = sin problemas de CORS.

### Paso 1: Configurar Nginx

```bash
# Editar configuración de nginx
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O tu IP pública

    # Frontend - Servir archivos estáticos
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        
        # Headers para assets
        add_header Cache-Control "public, max-age=31536000" always;
    }

    # Backend API - Proxy reverso
    location /api {
        proxy_pass http://localhost:3000;  # Puerto de tu backend
        
        # Headers importantes para proxy
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (si aún son necesarios)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        # Timeout para uploads grandes
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Opcional: WebSocket support (si usas)
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Paso 2: Actualizar .env del Frontend

```bash
# En tu máquina local: ticketera-frontend/.env
nano .env
```

```bash
# Cambiar de:
# VITE_API_URL=https://vibratickets.online

# A (opción 1 - ruta relativa):
VITE_API_URL=/api

# O (opción 2 - mismo dominio):
VITE_API_URL=http://tu-dominio.com/api
```

### Paso 3: Rebuild y Deploy

```bash
# Local - generar nuevo build
pnpm run build

# Copiar a EC2 (desde tu máquina local)
scp -r dist/* ubuntu@tu-ec2-ip:~/dist-temp/

# En EC2 - copiar a nginx
sudo rm -rf /var/www/html/*
sudo cp -r ~/dist-temp/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# Reiniciar nginx
sudo nginx -t  # Verificar sintaxis
sudo systemctl restart nginx
```

---

## ✅ Solución 3: CORS Temporalmente Permisivo (SOLO DESARROLLO)

**⚠️ NO usar en producción - Inseguro**

```javascript
// Backend temporalmente permisivo
app.use(cors({
  origin: '*',  // Permite CUALQUIER origen
  credentials: false
}));
```

---

## 🔍 Verificar que Funcionó

### Test 1: Verificar CORS Headers

```bash
# Desde tu máquina local o EC2
curl -I -X OPTIONS http://tu-ec2-ip/api/events \
  -H "Origin: http://tu-ec2-ip" \
  -H "Access-Control-Request-Method: GET"

# Debe mostrar:
# Access-Control-Allow-Origin: http://tu-ec2-ip
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Test 2: Abrir Navegador

1. Abrir DevTools (F12)
2. Ir a Network tab
3. Intentar crear show o subir imagen
4. Ver request - **NO debe haber error CORS**
5. Status debe ser 200 OK (o 201 Created)

### Test 3: Console

```javascript
// En la consola del navegador (F12)
fetch('/api/events')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// No debe mostrar error CORS
```

---

## 🐛 Troubleshooting

### Error: "No 'Access-Control-Allow-Origin' header"

**Causa:** Backend no tiene CORS configurado

**Solución:** Aplicar Solución 1 (configurar CORS en backend)

### Error: "CORS policy: credentials mode is 'include'"

**Causa:** Frontend envía cookies pero backend no permite credentials

**Solución:**
```javascript
// Backend
app.use(cors({
  origin: 'http://tu-origen-exacto',
  credentials: true  // ← Importante
}));

// Frontend - apiService.js
fetch(url, {
  credentials: 'include'  // Si usas fetch
});

// O Axios
axios.defaults.withCredentials = true;
```

### Error: Nginx "502 Bad Gateway"

**Causa:** Backend no está corriendo o puerto incorrecto

**Solución:**
```bash
# Verificar backend
sudo netstat -tlnp | grep 3000
# Debe mostrar tu proceso de Node.js

# Si no aparece, iniciar backend
cd ~/tu-backend
pm2 start ecosystem.config.js
# O
node src/index.js
```

### Error: "Cannot read property of undefined"

**Causa:** La URL de la API está mal configurada

**Solución:**
```bash
# Verificar .env
cat .env | grep VITE_API_URL

# Debe ser:
# - /api (si usas proxy reverso)
# - http://tu-dominio.com/api
# - https://vibratickets.online (si backend permite CORS)

# NO debe tener trailing slash:
# ❌ VITE_API_URL=/api/
# ✅ VITE_API_URL=/api
```

---

## 📋 Checklist Completo

- [ ] Backend tiene `cors` instalado: `npm ls cors`
- [ ] Backend usa `app.use(cors({...}))` ANTES de las rutas
- [ ] Origin en CORS incluye tu EC2 IP/dominio
- [ ] Nginx configurado con proxy_pass (si usas proxy)
- [ ] `.env` tiene `VITE_API_URL` correcto
- [ ] Frontend rebuildeado: `pnpm run build`
- [ ] Nginx restarteado: `sudo systemctl restart nginx`
- [ ] Backend restarteado: `pm2 restart backend`
- [ ] DevTools Network tab muestra 200 OK (sin CORS error)

---

## 🚀 Comando Rápido (Si ya tienes CORS en backend)

```bash
# Solo necesitas cambiar el origin permitido
# Backend: agregar tu IP a la lista de origins permitidos
# Luego:

cd ~/tu-backend
pm2 restart backend

# Verificar
curl -I http://localhost:3000/api/events
```

---

## 📞 Si Nada Funciona

1. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://localhost:3000/api/events
   ```

2. **Verifica la configuración de firewall:**
   ```bash
   sudo ufw status
   # Debe permitir puerto 80 y 3000 (o el que uses)
   ```

3. **Verifica los logs:**
   ```bash
   # Nginx
   sudo tail -f /var/log/nginx/error.log
   
   # Backend
   pm2 logs backend
   ```

4. **Comparte el error específico:**
   - Screenshot de DevTools Network tab
   - Logs del backend
   - Configuración de nginx: `sudo cat /etc/nginx/sites-available/default`

---

**La solución más común es agregar tu IP de EC2 a la lista de origins permitidos en el backend.**
