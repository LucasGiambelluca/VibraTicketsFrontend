# 🔒 Checklist de Seguridad - Backend VibraTickets

## Prioridad ALTA (antes de producción)

### 1. Rate Limiting
```bash
npm install express-rate-limit
```
```javascript
const rateLimit = require('express-rate-limit');

// Limitar requests generales
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100
}));

// Limitar login (más estricto)
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos cada 15 min
  message: { error: 'Demasiados intentos, espera 15 minutos' }
}));

// Limitar compras
app.use('/api/orders', rateLimit({
  windowMs: 60 * 1000,
  max: 10 // 10 compras por minuto máximo
}));
```

### 2. Helmet (Headers de seguridad)
```bash
npm install helmet
```
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. Validación de CORS estricta
```javascript
app.use(cors({
  origin: ['https://vibratickets.com', 'https://www.vibratickets.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));
```

### 4. Verificar Turnstile Token (cuando esté activo)
```javascript
const verifyTurnstile = async (token, ip) => {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    })
  });
  return (await response.json()).success;
};

// Usar en endpoints críticos
app.post('/api/auth/register', async (req, res) => {
  if (!await verifyTurnstile(req.body.captchaToken, req.ip)) {
    return res.status(400).json({ error: 'Verificación fallida' });
  }
  // ... continuar con registro
});
```

---

## Prioridad MEDIA

### 5. Validación de inputs
```bash
npm install express-validator
```
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
});
```

### 6. Logging de seguridad
```javascript
// Loggear intentos de login fallidos
app.post('/api/auth/login', (req, res) => {
  // Si falla el login:
  console.log(`[SECURITY] Login fallido: ${req.body.email} desde IP ${req.ip}`);
});
```

### 7. Bloqueo temporal de IPs sospechosas
```javascript
const blockedIPs = new Map();

const checkBlocked = (req, res, next) => {
  if (blockedIPs.has(req.ip)) {
    return res.status(429).json({ error: 'IP bloqueada temporalmente' });
  }
  next();
};
```

---

## Prioridad BAJA (mejoras futuras)

### 8. API Key interna
```javascript
const verifyApiKey = (req, res, next) => {
  if (req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'API Key inválida' });
  }
  next();
};
```

### 9. Tokens JWT con refresh
- Access token: 15 min expiración
- Refresh token: 7 días expiración
- Blacklist de tokens revocados

### 10. Monitoreo con alertas
- Configurar alertas para:
  - Más de 100 login fallidos por hora
  - Más de 50 compras del mismo usuario por día
  - Requests desde IPs en países sospechosos

---

## Variables de entorno necesarias (.env backend)
```bash
# Seguridad
TURNSTILE_SECRET_KEY=tu_secret_key
INTERNAL_API_KEY=genera_un_uuid_largo
JWT_SECRET=tu_jwt_secret_muy_largo

# CORS
FRONTEND_URL=https://vibratickets.com
```
