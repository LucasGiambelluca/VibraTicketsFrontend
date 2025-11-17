import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute - Componente para proteger rutas que requieren autenticación
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si está autenticado
 * @param {string[]} props.allowedRoles - Array de roles permitidos (opcional)
 * @param {string} props.redirectTo - Ruta a la que redirigir si no está autenticado (default: '/login')
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se carga la autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Spin size="large" tip="Verificando autenticación..." />
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Si hay roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          from: location,
          error: 'No tienes permisos para acceder a esta página'
        }} 
        replace 
      />
    );
  }

  // Usuario autenticado y con permisos correctos
  return children;
}

/**
 * AdminRoute - Atajo para rutas que solo pueden acceder ADMIN
 */
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * OrganizerRoute - Atajo para rutas que pueden acceder ADMIN y ORGANIZER
 */
export function OrganizerRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * CustomerRoute - Atajo para rutas que solo pueden acceder CUSTOMER
 */
export function CustomerRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      {children}
    </ProtectedRoute>
  );
}
