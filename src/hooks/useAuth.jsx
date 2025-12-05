import { useState, useEffect, createContext, useContext } from 'react';
import { authApi, usersApi } from '../services/apiService';

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext(null);

// ============================================
// AUTH PROVIDER
// ============================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // INICIALIZACIÓN - Verificar sesión con el backend
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Intentar obtener el usuario actual desde el backend (usa cookie)
        const response = await usersApi.getMe();
        let userData = response.data || response;
        
        console.log('👤 initAuth response:', userData);

        // Normalizar: si viene envuelto en { user: ... }
        if (userData && userData.user) {
          userData = userData.user;
        }
        
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        // Si falla (401), no hay sesión activa
        // No es necesario loguear error si es solo que no está logueado
        if (err.response?.status !== 401) {
          console.error('❌ Error al verificar sesión:', err);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ============================================
  // LOGIN
  // ============================================
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar a la API de login
      const response = await authApi.login(credentials);
      
      // Extraer datos (el token ya está en la cookie)
      const { user: userData } = response.data || response;
      
      if (!userData) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Actualizar estado
      setUser(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      console.error('❌ Error en login:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // REGISTER
  // ============================================
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar a la API de registro
      const response = await authApi.register(userData);
      
      // Extraer datos (el token ya está en la cookie)
      const { user: newUser } = response.data || response;
      
      if (!newUser) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Actualizar estado
      setUser(newUser);
      
      return newUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al registrar usuario';
      setError(errorMessage);
      console.error('❌ Error en registro:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    try {
      // Llamar al backend para borrar la cookie
      await authApi.logout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      // Limpiar estado local independientemente del resultado
      setUser(null);
      setError(null);
      // Opcional: Redirigir o recargar si es necesario
      window.location.href = '/login';
    }
  };

  // ============================================
  // REFRESH USER - Actualizar datos del usuario
  // ============================================
  const refreshUser = async () => {
    try {
      const response = await usersApi.getMe();
      const userData = response.data || response;
      
      // Actualizar estado
      setUser(userData);
      
      return userData;
    } catch (err) {
      console.error('❌ Error al actualizar usuario:', err);
      throw err;
    }
  };

  // ============================================
  // CHECK EMAIL - Verificar si email está disponible
  // ============================================
  const checkEmail = async (email) => {
    try {
      const response = await authApi.checkEmail(email);
      return response;
    } catch (err) {
      console.error('❌ Error al verificar email:', err);
      throw err;
    }
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    // Estado
    user,
    loading,
    error,
    
    // Funciones
    login,
    register,
    logout,
    refreshUser,
    checkEmail,
    
    // Helpers
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isOrganizer: user?.role === 'ORGANIZER',
    isCustomer: user?.role === 'CUSTOMER',
    isDoor: user?.role === 'DOOR',
    
    // Datos del usuario
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name,
    userRole: user?.role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK useAuth
// ============================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// Export por defecto
export default useAuth;
