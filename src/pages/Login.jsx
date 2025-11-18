import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente de redirección para mantener compatibilidad con rutas antiguas
 * Redirige automáticamente a /customerlogin
 */
export default function Login() {
  return <Navigate to="/customerlogin" replace />;
}
