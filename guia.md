Perfecto! Aquí está la guía completa para el equipo de frontend. Puedes copiarla y crear el archivo FRONTEND_INTEGRATION_GUIDE.md:

markdown
# 🎨 GUÍA DE INTEGRACIÓN FRONTEND - API TICKETERA

**Versión**: 2.1.0  
**Fecha**: 2025-10-27  
**Para**: Equipo de Desarrollo Frontend

---

## 📋 ÍNDICE

1. [Información General](#información-general)
2. [Configuración Inicial](#configuración-inicial)
3. [Autenticación](#autenticación)
4. [Endpoints Principales](#endpoints-principales)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Usuarios de Prueba](#usuarios-de-prueba)
7. [Troubleshooting](#troubleshooting)

---

## 📡 INFORMACIÓN GENERAL

### URLs de la API

#### Desarrollo Local
http://localhost:3000


#### Producción (Acceso Público)
Ngrok: https://3b720c07462d.ngrok-free.app Cloudflare: https://nursing-smart-absolute-dns.trycloudflare.com


**⚠️ Importante para Ngrok**: Agregar header `ngrok-skip-browser-warning: true` en todas las peticiones.

### Estado del Sistema
- ✅ Servidor: Operativo 24/7
- ✅ Base de Datos: MySQL conectada
- ✅ Redis: Conectado (cola virtual)
- ✅ Autenticación: JWT activa (24h validez)
- ✅ Rate Limiting: 100 requests/15min

---

## 🚀 CONFIGURACIÓN INICIAL

### 1. Variables de Entorno

Crear archivo `.env` en tu proyecto frontend:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
# O para producción:
# VITE_API_URL=[https://3b720c07462d.ngrok-free.app](https://3b720c07462d.ngrok-free.app)

VITE_API_TIMEOUT=30000
2. Configuración de Axios (Recomendado)
javascript
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
3. Verificar Conexión
javascript
// Test rápido de conexión
import api from './axios';

const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ API Status:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    return false;
  }
};
🔐 AUTENTICACIÓN
Flujo de Autenticación
1. Usuario ingresa email y password
2. Frontend → POST /api/auth/login
3. API valida credenciales
4. API → retorna token JWT + datos del usuario
5. Frontend guarda token en localStorage
6. Frontend incluye token en todas las peticiones
1. Registro de Usuario
Endpoint: POST /api/auth/register

javascript
// Request
const userData = {
  email: "usuario@ejemplo.com",
  password: "Password123",      // Min 8 chars, 1 mayúscula, 1 minúscula, 1 número
  name: "Juan Pérez",
  dni: "12345678",              // Opcional
  country: "ARG",               // Opcional (default: ARG)
  phone: "+5491123456789",      // Opcional
  role: "CUSTOMER"              // CUSTOMER, ORGANIZER, DOOR, ADMIN
};

const response = await api.post('/api/auth/register', userData);

// Response (201 Created)
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
Invalid argument: protocol error: incomplete envelope: read tcp 192.168.1.37:57945 -> 34.49.14.144:443: wsarecv: Se ha anulado una conexión establecida por el software en su equipo host..
Feedback submitted


continua donde te quedaste

Continúo desde donde me quedé:

markdown
      "name": "Juan Pérez",
      "role": "CUSTOMER",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2025-10-27T13:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Guardar token y usuario
localStorage.setItem('token', response.data.data.token);
localStorage.setItem('user', JSON.stringify(response.data.data.user));
2. Login
Endpoint: POST /api/auth/login

javascript
// Request
const credentials = {
  email: "usuario@ejemplo.com",
  password: "Password123"
};

const response = await api.post('/api/auth/login', credentials);

// Response (200 OK)
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Guardar token y usuario
localStorage.setItem('token', response.data.data.token);
localStorage.setItem('user', JSON.stringify(response.data.data.user));
3. Verificar Email Disponible
Endpoint: POST /api/auth/check-email

javascript
const response = await api.post('/api/auth/check-email', {
  email: "usuario@ejemplo.com"
});

// Response
{
  "exists": true,
  "message": "El email ya está registrado"
}
// O
{
  "exists": false,
  "message": "El email está disponible"
}
4. Logout
javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
📚 ENDPOINTS PRINCIPALES
🏠 Health Check
GET /health - Público (no requiere autenticación)

javascript
const response = await api.get('/health');

// Response
{
  "status": "ok",
  "timestamp": "2025-10-27T13:00:00.000Z",
  "services": {
    "redis": { "status": "connected" },
    "database": { "status": "connected" },
    "queue": { "status": "enabled" }
  }
}
👤 USUARIOS
GET /api/users/me
Protegido - Obtener perfil del usuario autenticado

javascript
const response = await api.get('/api/users/me');

// Response
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "role": "CUSTOMER",
  "dni": "12345678",
  "country": "ARG",
  "phone": "+5491123456789",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2025-10-27T13:00:00.000Z"
}
PUT /api/users/me
Protegido - Actualizar perfil

javascript
const response = await api.put('/api/users/me', {
  name: "Juan Carlos Pérez",
  phone: "+5491198765432"
});

// Response
{
  "message": "Perfil actualizado exitosamente",
  "user": { /* datos actualizados */ }
}
POST /api/users/me/change-password
Protegido - Cambiar contraseña

javascript
const response = await api.post('/api/users/me/change-password', {
  currentPassword: "Password123",
  newPassword: "NewPassword456"
});

// Response
{
  "message": "Contraseña actualizada exitosamente"
}
GET /api/users/me/orders
Protegido - Obtener órdenes del usuario

javascript
const response = await api.get('/api/users/me/orders');

// Response
{
  "orders": [
    {
      "id": 1,
      "showId": 5,
      "totalCents": 150000,
      "status": "PENDING",
      "createdAt": "2025-10-27T13:00:00.000Z"
    }
  ],
  "count": 1
}
🎫 EVENTOS
GET /api/events
Público - Listar eventos con paginación

javascript
const response = await api.get('/api/events', {
  params: {
    page: 1,
    limit: 20,
    search: 'concierto',
    status: 'active',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
});

// Response
{
  "events": [
    {
      "id": 1,
      "name": "Concierto Los Piojos - Ritual Tour",
      "description": "Gran regreso de Los Piojos",
      "imageUrl": null,
      "venueId": 2,
      "venueName": "Luna Park",
      "producerId": 1,
      "producerName": "Rock Productions SA",
      "status": "active",
      "createdAt": "2025-10-27T13:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
GET /api/events/search
Público - Búsqueda rápida de eventos

javascript
const response = await api.get('/api/events/search', {
  params: { q: 'rock' }
});

// Response
{
  "events": [ /* array de eventos */ ]
}
GET /api/events/:id
Público - Obtener evento específico

javascript
const response = await api.get('/api/events/1');

// Response
{
  "id": 1,
  "name": "Concierto Los Piojos",
  "description": "Gran regreso de Los Piojos",
  "startsAt": "2025-12-15T21:00:00.000Z",
  "venueId": 2,
  "venueName": "Luna Park",
  "venue": {
    "id": 2,
    "name": "Luna Park",
    "address": "Av. Eduardo Madero 470",
    "city": "Buenos Aires",
    "maxCapacity": 8500
  }
}
POST /api/events
Protegido - Crear evento (requiere rol ADMIN o ORGANIZER)

javascript
const response = await api.post('/api/events', {
  name: "Concierto de Rock",
  startsAt: "2025-12-15T21:00:00Z",
  description: "Gran concierto de rock",
  venueId: 2,
  producerId: 1
});

// Response
{
  "data": {
    "event": { /* datos del evento */ },
    "show": { /* show generado automáticamente */ }
  }
}
🎬 SHOWS
GET /api/shows
Público - Listar todos los shows

javascript
const response = await api.get('/api/shows');

// Response (Array)
[
  {
    "id": 1,
    "eventId": 1,
    "eventName": "Concierto Los Piojos",
    "startsAt": "2025-12-15T21:00:00.000Z",
    "status": "PUBLISHED",
    "venueId": 2,
    "venueName": "Luna Park"
  }
]
GET /api/shows/:id
Público - Obtener show específico

javascript
const response = await api.get('/api/shows/1');

// Response
{
  "id": 1,
  "eventId": 1,
  "eventName": "Concierto Los Piojos",
  "startsAt": "2025-12-15T21:00:00.000Z",
  "status": "PUBLISHED",
  "venueId": 2,
  "venueName": "Luna Park"
}
GET /api/shows/:id/seats
Público - Obtener asientos disponibles del show

javascript
const response = await api.get('/api/shows/1/seats');

// Response (Array)
[
  {
    "id": 1,
    "sector": "Platea",
    "rowLabel": "A",
    "seatNumber": 1,
    "status": "AVAILABLE",
    "priceCents": 150000
  }
]
🏟️ VENUES
GET /api/venues
Público - Listar venues

javascript
const response = await api.get('/api/venues', {
  params: {
    page: 1,
    limit: 20,
    search: 'luna',
    city: 'Buenos Aires'
  }
});

// Response
{
  "venues": [
    {
      "id": 2,
      "name": "Luna Park",
      "address": "Av. Eduardo Madero 470",
      "city": "Buenos Aires",
      "state": "CABA",
      "country": "Argentina",
      "maxCapacity": 8500,
      "latitude": -34.602778,
      "longitude": -58.368611,
      "phone": "+541143115100",
      "email": "info@lunapark.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
GET /api/venues/search
Público - Búsqueda rápida de venues

javascript
const response = await api.get('/api/venues/search', {
  params: { q: 'luna', limit: 10 }
});
GET /api/venues/:id
Público - Obtener venue específico

javascript
const response = await api.get('/api/venues/2');
🏢 PRODUCTORES
GET /api/producers
Público - Listar productores

javascript
const response = await api.get('/api/producers', {
  params: { page: 1, limit: 20 }
});

// Response
{
  "producers": [
    {
      "id": 1,
      "name": "Rock Productions SA",
      "contactEmail": "contacto@rockprod.com",
      "ownerUserId": 2,
      "createdAt": "2025-10-27T13:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
🛒 ÓRDENES
POST /api/orders
Protegido - Crear orden de compra

javascript
const response = await api.post('/api/orders', {
  userId: 1,
  showId: 5,
  seats: [1, 2, 3],
  email: "usuario@ejemplo.com"
});

// Response
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "userId": 1,
      "showId": 5,
      "totalCents": 450000,
      "status": "PENDING",
      "createdAt": "2025-10-27T13:00:00.000Z"
    }
  }
}
💳 PAGOS
GET /api/payments/order/:orderId/status
Protegido - Consultar estado de pago

javascript
const response = await api.get('/api/payments/order/1/status');

// Response
{
  "orderId": 1,
  "status": "PENDING",
  "paymentId": null,
  "paymentStatus": null
}
💻 EJEMPLOS DE CÓDIGO
Hook de Autenticación (React)
javascript
// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return user;
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isOrganizer: user?.role === 'ORGANIZER',
    isCustomer: user?.role === 'CUSTOMER'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
Componente de Login
javascript
// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Iniciar Sesión</h2>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Cargando...' : 'Ingresar'}
      </button>
    </form>
  );
};
Listado de Eventos
javascript
// src/components/EventList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, [page, search]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/events', {
        params: {
          page,
          limit: 12,
          search,
          status: 'active',
          sortBy: 'created_at',
          sortOrder: 'DESC'
        }
      });
      
      setEvents(response.data.events);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando eventos...</div>;

  return (
    <div className="event-list">
      <h2>Eventos Disponibles</h2>
      
      <input
        type="search"
        placeholder="Buscar eventos..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.name}</h3>
            <p>{event.description}</p>
            <p>📍 {event.venueName}</p>
            <p>🎭 {event.producerName}</p>
            <button onClick={() => navigate(`/events/${event.id}`)}>
              Ver Detalles
            </button>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page} de {pagination.totalPages}</span>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={page === pagination.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};
🧪 USUARIOS DE PRUEBA
Credenciales Disponibles
javascript
// Admin
{
  email: 'admin_e2e@ticketera.com',
  password: 'Admin123456',
  role: 'ADMIN'
}

// Organizador 1 (Rock)
{
  email: 'productor1@rockprod.com',
  password: 'Producer123',
  role: 'ORGANIZER'
}

// Organizador 2 (Teatro)
{
  email: 'productor2@teatronacional.com',
  password: 'Producer456',
  role: 'ORGANIZER'
}

// Cliente 1
{
  email: 'cliente1_e2e@test.com',
  password: 'Cliente123',
  role: 'CUSTOMER'
}

// Cliente 2
{
  email: 'cliente2_e2e@test.com',
  password: 'Cliente456',
  role: 'CUSTOMER'
}
🔧 TROUBLESHOOTING
Error: 401 Unauthorized
Causas comunes:

Token expirado (validez: 24 horas)
Token no incluido en headers
Token inválido
Solución:

javascript
// Verificar token
console.log('Token:', localStorage.getItem('token'));

// Hacer login nuevamente
await login(credentials);
Error: 403 Forbidden
Causa: El usuario no tiene permisos para ese endpoint

Solución:

javascript
// Verificar rol del usuario
const user = JSON.parse(localStorage.getItem('user'));
console.log('User role:', user.role);

// Algunos endpoints requieren ADMIN o ORGANIZER
Error: 429 Too Many Requests
Causa: Límite de rate limiting excedido (100 requests/15min)

Solución:

Implementar debouncing en búsquedas
Cachear respuestas en el frontend
Esperar 15 minutos
Error: CORS
Causa: Problema de configuración de CORS

Solución:

La API ya tiene CORS configurado para *
Si persiste, usar proxy en desarrollo:
javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
Error: Network Error
Causas:

Servidor no está corriendo
URL incorrecta
Firewall bloqueando conexión
Solución:

javascript
// Verificar health check
const response = await api.get('/health');
console.log('API Status:', response.data.status);
📞 CONTACTO Y SOPORTE
Información del Backend
Servidor Local: http://localhost:3000
Health Check: GET /health
Documentación: Ver este archivo
Datos del Sistema
Base de Datos: MySQL (conectada)
Cache: Redis (conectado)
Autenticación: JWT (24h validez)
Rate Limiting: 100 req/15min
Recursos Adicionales
FINAL_STATUS.md
 - Estado completo del sistema
CORRECTIONS_SUMMARY.md
 - Resumen de correcciones
END_TO_END_REPORT.md
 - Reporte de testing
✅ CHECKLIST DE INTEGRACIÓN
 Configurar variables de entorno
 Instalar y configurar Axios
 Implementar interceptors
 Crear hook de autenticación
 Probar login con usuarios de prueba
 Implementar listado de eventos
 Implementar detalle de evento
 Implementar búsqueda
 Probar flujo completo de compra
 Manejar errores correctamente
 Implementar loading states
 Testear con diferentes roles
¡Listo para integrar! 🚀

Última actualización: 2025-10-27
Versión API: 2.1.0
Estado: ✅ Producción Ready


---

¡Listo! Esta es la guía completa para el equipo de frontend. Incluye todo lo necesario para conectarse a la API y comenzar a desarrollar. 🎉
Feedback submitted





Code

Claude Sonnet 4.5


