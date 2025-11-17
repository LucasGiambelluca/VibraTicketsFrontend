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
  // INICIALIZACIÓN - Cargar usuario del localStorage
  // ============================================
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          } else {
          }
      } catch (err) {
        console.error('❌ Error al cargar usuario:', err);
        // Limpiar localStorage si hay error
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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
      
      // Extraer datos según la estructura de la API
      const { user: userData, token } = response.data || response;
      
      if (!userData || !token) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
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
      
      // Extraer datos según la estructura de la API
      const { user: newUser, token } = response.data || response;
      
      if (!newUser || !token) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
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
  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar estado
    setUser(null);
    setError(null);
    
    };

  // ============================================
  // REFRESH USER - Actualizar datos del usuario
  // ============================================
  const refreshUser = async () => {
    try {
      const response = await usersApi.getMe();
      const userData = response.data || response;
      
      // Actualizar localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
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
