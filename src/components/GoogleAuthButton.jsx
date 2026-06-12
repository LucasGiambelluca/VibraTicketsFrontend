import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/apiService';

/**
 * Componente para autenticación con Google
 * Usa @react-oauth/google para el flujo de OAuth
 */
const GoogleAuthButton = ({ onSuccess, onError, style, text = "Continuar con Google" }) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Verificar que existe el Client ID
  if (!clientId) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID no está configurado en .env');
    return null;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Enviar el token al backend; la sesión queda en cookie httpOnly
      // (mismo flujo que el login con contraseña — nada en localStorage)
      const response = await authApi.googleLogin({
        token: credentialResponse.credential
      });

      const user = response?.data?.user || response?.user;
      if (!user) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Actualizar estado global
      if (setUser) {
        setUser(user);
      }

      message.success(`¡Bienvenido ${user.name || user.email}!`);

      // Callback personalizado o navegación por defecto
      if (onSuccess) {
        onSuccess(user);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Error en autenticación con Google:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al autenticar con Google';
      
      message.error(errorMessage);
      
      if (onError) {
        onError(error);
      }
    }
  };

  const handleGoogleError = (error) => {
    console.error('❌ Error en Google OAuth:', error);
    message.error('Error al iniciar sesión con Google');
    
    if (onError) {
      onError(error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        text={text}
        shape="rectangular"
        size="large"
        width="100%"
        logo_alignment="left"
        theme="outline"
        locale="es"
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthButton;
