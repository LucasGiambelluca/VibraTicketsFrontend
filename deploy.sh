#!/bin/bash
# VibraTickets Frontend Deployment Script
# Uso: ./deploy.sh [environment]
# Ejemplo: ./deploy.sh production

set -e

# Configuración
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/vibra/deploy-frontend.log"
ENVIRONMENT="${1:-production}"
DOMAIN="${2:-vibratickets.com}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a $LOG_FILE
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" | tee -a $LOG_FILE
}

check_error() {
    if [ $? -ne 0 ]; then
        log_error "$1"
        exit 1
    fi
}

# Crear directorio de logs si no existe
mkdir -p "$(dirname $LOG_FILE)"

echo "==========================================" | tee -a $LOG_FILE
echo "  VibraTickets Frontend - Deployment" | tee -a $LOG_FILE
echo "  Environment: $ENVIRONMENT" | tee -a $LOG_FILE
echo "  Domain: $DOMAIN" | tee -a $LOG_FILE
echo "  $(date)" | tee -a $LOG_FILE
echo "==========================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Verificar que estamos en el directorio correcto
if [ ! -f "$APP_DIR/vite.config.js" ] && [ ! -f "$APP_DIR/vite.config.ts" ]; then
    log_warn "No se encontró vite.config.js/ts. ¿Estás en el directorio correcto?"
fi

cd "$APP_DIR"

# ==========================================
# CONFIGURAR VARIABLES DE ENTORNO
# ==========================================
log_step "Configurando variables de entorno..."

# Determinar la URL de la API según el dominio
if [ "$ENVIRONMENT" = "production" ]; then
    API_URL="https://${DOMAIN}/api"
else
    API_URL="http://localhost:3000/api"
fi

if [ ! -f "$APP_DIR/.env" ]; then
    log_info "Creando archivo .env..."
    cat > "$APP_DIR/.env" << EOF
# VibraTickets Frontend Configuration
VITE_API_URL=${API_URL}
VITE_APP_NAME=VibraTickets
VITE_APP_DOMAIN=${DOMAIN}
VITE_ENVIRONMENT=${ENVIRONMENT}
EOF
    log_info "✅ Archivo .env creado con API_URL: $API_URL"
else
    # Actualizar el archivo .env existente
    log_info "Actualizando archivo .env existente..."

    # Actualizar VITE_API_URL
    if grep -q "VITE_API_URL=" "$APP_DIR/.env"; then
        sed -i "s|VITE_API_URL=.*|VITE_API_URL=${API_URL}|" "$APP_DIR/.env"
    else
        echo "VITE_API_URL=${API_URL}" >> "$APP_DIR/.env"
    fi

    # Actualizar VITE_APP_DOMAIN
    if grep -q "VITE_APP_DOMAIN=" "$APP_DIR/.env"; then
        sed -i "s|VITE_APP_DOMAIN=.*|VITE_APP_DOMAIN=${DOMAIN}|" "$APP_DIR/.env"
    else
        echo "VITE_APP_DOMAIN=${DOMAIN}" >> "$APP_DIR/.env"
    fi

    log_info "✅ Archivo .env actualizado"
fi

# Mostrar configuración
log_info "API URL configurada: $API_URL"

# ==========================================
# INSTALAR DEPENDENCIAS
# ==========================================
log_step "Instalando dependencias..."

if [ -f "pnpm-lock.yaml" ]; then
    log_info "Usando pnpm..."
    pnpm install --frozen-lockfile
elif [ -f "package-lock.json" ]; then
    log_info "Usando npm ci..."
    npm ci
else
    log_info "Usando npm install..."
    npm install
fi

check_error "Error al instalar dependencias"

# ==========================================
# BUILD
# ==========================================
log_step "Construyendo aplicación..."

# Limpiar build anterior si existe
if [ -d "dist" ]; then
    log_info "Limpiando build anterior..."
    rm -rf dist
fi

# Ejecutar build
npm run build

check_error "Error al construir la aplicación"

# Verificar que se generó el build
if [ ! -d "$APP_DIR/dist" ]; then
    log_error "No se encontró el directorio dist después del build"
    exit 1
fi

log_info "✅ Build completado en $APP_DIR/dist"

# ==========================================
# DESPLEGAR CON NGINX
# ==========================================
log_step "Configurando Nginx..."

# Verificar si Nginx está instalado
if ! command -v nginx &> /dev/null; then
    log_warn "Nginx no está instalado. Por favor instálalo primero:"
    log_info "  sudo apt update && sudo apt install -y nginx"
    exit 1
fi

# Crear configuración de Nginx
NGINX_CONFIG="/etc/nginx/sites-available/vibratickets"

sudo tee "$NGINX_CONFIG" > /dev/null << EOF
# VibraTickets - Frontend Configuration
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Logs
    access_log /var/log/nginx/vibratickets-access.log;
    error_log /var/log/nginx/vibratickets-error.log;

    # Tamaño máximo de upload
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # API - Proxy al backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Configuración CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Webhooks - MercadoPago
    location /webhooks {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    # Frontend - Archivos estáticos
    location / {
        root ${APP_DIR}/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # Cache para assets estáticos
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
            access_log off;
        }

        # No cache para index.html
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root ${APP_DIR}/dist;
    }
}
EOF

log_info "✅ Configuración de Nginx creada"

# Habilitar el sitio
if [ ! -L "/etc/nginx/sites-enabled/vibratickets" ]; then
    sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    log_info "✅ Sitio habilitado en Nginx"
fi

# Eliminar default si existe
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
    log_info "Configuración default de Nginx eliminada"
fi

# Verificar configuración
log_info "Verificando configuración de Nginx..."
sudo nginx -t

check_error "La configuración de Nginx tiene errores"

# Recargar Nginx
log_info "Recargando Nginx..."
sudo systemctl reload nginx

check_error "Error al recargar Nginx"

# Verificar que Nginx está corriendo
if systemctl is-active --quiet nginx; then
    log_info "✅ Nginx está corriendo"
else
    log_warn "Nginx no está corriendo. Iniciando..."
    sudo systemctl start nginx
fi

# ==========================================
# VERIFICACIÓN
# ==========================================
log_step "Verificando despliegue..."

# Esperar un momento
sleep 2

# Verificar que el sitio responde
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")

if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "304" ]; then
    log_info "✅ Frontend respondiendo correctamente (HTTP $NGINX_STATUS)"
else
    log_warn "⚠️ Frontend no responde como esperado (HTTP $NGINX_STATUS)"
fi

# Verificar que la API es accesible
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")

if [ "$API_STATUS" = "200" ]; then
    log_info "✅ API accesible a través de Nginx (HTTP $API_STATUS)"
else
    log_warn "⚠️ API no responde a través de Nginx (HTTP $API_STATUS)"
    log_info "Verifica que el backend esté corriendo en el puerto 3000"
fi

# ==========================================
# CONFIGURAR SSL (Certbot)
# ==========================================
log_step "Configurando SSL con Certbot..."

if command -v certbot &> /dev/null; then
    log_info "Certbot está instalado. Configurando SSL..."

    # Verificar si el certificado ya existe
    if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        log_info "Certificado SSL ya existe para ${DOMAIN}"
    else
        log_info "Obteniendo certificado SSL para ${DOMAIN}..."
        sudo certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --email admin@${DOMAIN} || {
            log_warn "No se pudo obtener el certificado SSL automáticamente"
            log_info "Puedes obtenerlo manualmente más tarde con:"
            log_info "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
        }
    fi
else
    log_warn "Certbot no está instalado. Para configurar SSL, ejecuta:"
    log_info "  sudo apt install -y certbot python3-certbot-nginx"
    log_info "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

# ==========================================
# RESUMEN
# ==========================================
echo "" | tee -a $LOG_FILE
echo "==========================================" | tee -a $LOG_FILE
echo "  Frontend desplegado exitosamente!" | tee -a $LOG_FILE
echo "==========================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "Acceso a la aplicación:" | tee -a $LOG_FILE
echo "  🌐 Sitio web: https://${DOMAIN}" | tee -a $LOG_FILE
echo "  🔌 API:      https://${DOMAIN}/api" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "Comandos útiles:" | tee -a $LOG_FILE
echo "  sudo nginx -t                    - Verificar config" | tee -a $LOG_FILE
echo "  sudo systemctl reload nginx      - Recargar Nginx" | tee -a $LOG_FILE
echo "  sudo systemctl status nginx      - Estado de Nginx" | tee -a $LOG_FILE
echo "  sudo tail -f /var/log/nginx/vibratickets-error.log - Logs de errores" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Guardar información del despliegue
echo "Last deployment: $(date)" > "$APP_DIR/.deployment-info"
echo "Domain: $DOMAIN" >> "$APP_DIR/.deployment-info"
echo "API URL: $API_URL" >> "$APP_DIR/.deployment-info"
