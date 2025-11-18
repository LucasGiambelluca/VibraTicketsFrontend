import React from 'react';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { Button, message } from 'antd';
import { FacebookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/apiService';

/**
 * Componente para autenticación con Facebook (Meta)
 * Usa @greatsumini/react-facebook-login (compatible con React 19)
 */
const FacebookAuthButton = ({ onSuccess, onError, style, text = "Continuar con Facebook" }) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Verificar que existe el App ID
  if (!appId) {
    console.error('❌ VITE_FACEBOOK_APP_ID no está configurado en .env');
    return null;
  }

  const handleFacebookResponse = async (response) => {
    // Si el usuario cancela o hay error
    if (!response.accessToken) {
      console.log('⚠️ Login con Facebook cancelado o fallido');
      
      if (response.status === 'unknown') {
        message.warning('Login con Facebook cancelado');
      }
      
      if (onError) {
        onError(new Error('Facebook login cancelled'));
      }
      return;
    }

    try {
      console.log('✅ Token de Facebook recibido');
      
      // Enviar el token al backend para validación
      const backendResponse = await authApi.facebookLogin({
        accessToken: response.accessToken,
        userID: response.userID
      });

      if (backendResponse.success || backendResponse.token) {
        const { token, user } = backendResponse;
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Actualizar estado global
        if (setUser) {
          setUser(user);
        }
        
        message.success(`¡Bienvenido ${user.name || user.email}!`);
        
        // Callback personalizado o navegación por defecto
        if (onSuccess) {
          onSuccess(user);
        } else {
          // Redirigir según el rol
          if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en autenticación con Facebook:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al autenticar con Facebook';
      
      message.error(errorMessage);
      
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <FacebookLogin
      appId={appId}
      onSuccess={handleFacebookResponse}
      onFail={(error) => {
        console.error('❌ Error en Facebook login:', error);
        message.error('Error al conectar con Facebook');
        if (onError) {
          onError(error);
        }
      }}
      fields="name,email,picture"
      render={({ onClick, logout }) => (
        <Button
          block
          size="large"
          icon={<FacebookOutlined />}
          onClick={onClick}
          style={{
            borderRadius: 8,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: '#1877f2',
            color: '#1877f2',
            ...style
          }}
        >
          {text}
        </Button>
      )}
    />
  );
};

export default FacebookAuthButton;
