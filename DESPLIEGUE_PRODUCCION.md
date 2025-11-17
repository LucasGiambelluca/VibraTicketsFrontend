# 🚀 Guía de Despliegue a Producción - VibraTicket

## ✅ Preparación Completada

### 1. Limpieza de Console Logs
- ✅ **568 console.log eliminados** de 50 archivos
- ✅ Solo se mantuvieron `console.error` para errores críticos
- ✅ Código optimizado para producción

### 2. Variables de Entorno

**Archivo `.env.production` creado:**
```env
VITE_API_URL=https://tu-backend-url.com
VITE_APP_NAME=VibraTicket
VITE_APP_VERSION=1.0.0
VITE_GROQ_API_KEY=gsk_tu_api_key_de_groq_aqui
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key_aqui
VITE_RECAPTCHA_SITE_KEY=tu_recaptcha_site_key_aqui
```

⚠️ **IMPORTANTE:** Antes de desplegar, actualiza:
- `VITE_API_URL` con la URL real de tu backend en producción
- Verifica que las API keys sean las correctas para producción

---

## 📦 Build de Producción

### Comando para generar el build:
```bash
pnpm build
```

Esto generará la carpeta `dist/` con todos los archivos optimizados.

---

## 🌐 Opciones de Despliegue

### Opción 1: Netlify (Recomendado)

**Pasos:**
1. Instalar Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login en Netlify:
   ```bash
   netlify login
   ```

3. Desplegar:
   ```bash
   netlify deploy --prod
   ```

4. Seleccionar la carpeta `dist` cuando te lo pida

**Configuración en Netlify:**
- Build command: `pnpm build`
- Publish directory: `dist`
- Variables de entorno: Agregar todas las de `.env.production`

**Archivo `netlify.toml` (ya incluido):**
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Opción 2: Vercel

**Pasos:**
1. Instalar Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login en Vercel:
   ```bash
   vercel login
   ```

3. Desplegar:
   ```bash
   vercel --prod
   ```

**Configuración en Vercel:**
- Framework Preset: Vite
- Build Command: `pnpm build`
- Output Directory: `dist`
- Variables de entorno: Agregar todas las de `.env.production`

---

### Opción 3: GitHub Pages

**Pasos:**
1. Actualizar `vite.config.js` con la base correcta:
   ```javascript
   export default defineConfig({
     base: '/nombre-del-repo/',
     // ...resto de la config
   })
   ```

2. Instalar gh-pages:
   ```bash
   pnpm add -D gh-pages
   ```

3. Agregar scripts en `package.json`:
   ```json
   "scripts": {
     "predeploy": "pnpm build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Desplegar:
   ```bash
   pnpm deploy
   ```

---

### Opción 4: Servidor Propio (VPS, AWS, etc.)

**Pasos:**
1. Generar build:
   ```bash
   pnpm build
   ```

2. Subir carpeta `dist/` al servidor

3. Configurar Nginx:
   ```nginx
   server {
     listen 80;
     server_name tu-dominio.com;
     root /var/www/vibraticket/dist;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     # Caché para assets estáticos
     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

4. Reiniciar Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

---

## 🔧 Configuración Post-Despliegue

### 1. Actualizar Backend URLs
Asegúrate de que el backend acepte requests desde tu dominio de producción:
- Configurar CORS en el backend
- Agregar dominio a la whitelist

### 2. Verificar MercadoPago
- Actualizar URLs de callback en MercadoPago:
  - Success: `https://tu-dominio.com/payment/success`
  - Failure: `https://tu-dominio.com/payment/failure`
  - Pending: `https://tu-dominio.com/payment/pending`

### 3. Configurar Webhook de MercadoPago
- URL del webhook: `https://tu-backend.com/api/payments/webhook`
- Eventos a escuchar: `payment`, `merchant_order`

### 4. SSL/HTTPS
- Asegúrate de que tu sitio use HTTPS
- Netlify y Vercel lo configuran automáticamente
- Para servidor propio, usa Let's Encrypt:
  ```bash
  sudo certbot --nginx -d tu-dominio.com
  ```

---

## 📊 Verificación Post-Despliegue

### Checklist:
- [ ] Sitio carga correctamente
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Se pueden ver eventos
- [ ] Se pueden comprar tickets
- [ ] Pago con MercadoPago funciona
- [ ] Chatbot responde
- [ ] Google Maps carga
- [ ] Imágenes se muestran correctamente
- [ ] Panel admin accesible
- [ ] No hay errores en la consola del navegador

### Herramientas de Testing:
```bash
# Lighthouse (Performance, SEO, Accessibility)
npx lighthouse https://tu-dominio.com --view

# Test de carga
ab -n 1000 -c 10 https://tu-dominio.com/
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Verificar que `VITE_API_URL` apunte al backend correcto
- Verificar CORS en el backend

### Error: 404 en rutas
- Verificar que el servidor esté configurado para SPA (redirect a index.html)
- En Netlify: archivo `_redirects` o `netlify.toml`

### Imágenes no cargan
- Verificar que las URLs de imágenes sean absolutas
- Verificar permisos de CORS en el servidor de imágenes

### MercadoPago no funciona
- Verificar que las credenciales sean de producción (no TEST)
- Verificar URLs de callback
- Verificar webhook configurado

---

## 📈 Monitoreo

### Herramientas Recomendadas:
- **Sentry**: Monitoreo de errores
- **Google Analytics**: Análisis de usuarios
- **Hotjar**: Mapas de calor y grabaciones
- **Uptime Robot**: Monitoreo de disponibilidad

---

## 🔄 Actualizaciones Futuras

### Flujo de actualización:
1. Hacer cambios en desarrollo
2. Probar localmente
3. Commit y push a Git
4. Ejecutar build:
   ```bash
   pnpm build
   ```
5. Desplegar:
   ```bash
   netlify deploy --prod
   # o
   vercel --prod
   ```

---

## 📝 Notas Importantes

1. **Nunca commitear `.env` al repositorio**
2. **Usar variables de entorno en la plataforma de hosting**
3. **Mantener backups regulares**
4. **Monitorear logs de errores**
5. **Actualizar dependencias regularmente**

---

## 🎉 ¡Listo para Producción!

Tu aplicación VibraTicket está lista para ser desplegada. Todos los console.log han sido eliminados y el código está optimizado.

**Próximos pasos:**
1. Actualizar `.env.production` con URLs reales
2. Ejecutar `pnpm build`
3. Elegir plataforma de hosting
4. Desplegar
5. Verificar funcionamiento
6. ¡Celebrar! 🎊
