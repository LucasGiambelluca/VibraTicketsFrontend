import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Contexto para controlar el modal de login globalmente
 * Permite abrir/cerrar el modal desde cualquier componente
 */
const LoginModalContext = createContext();

export function LoginModalProvider({ children }) {
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);

  /**
   * Abrir el modal de login
   * @param {Function} onSuccess - Callback opcional que se ejecuta después del login exitoso
   */
  const openLoginModal = useCallback((onSuccess) => {
    setIsLoginModalVisible(true);
    if (onSuccess) {
      setOnSuccessCallback(() => onSuccess);
    }
  }, []);

  /**
   * Cerrar el modal de login
   */
  const closeLoginModal = useCallback(() => {
    setIsLoginModalVisible(false);
    setOnSuccessCallback(null);
  }, []);

  /**
   * Manejar el éxito del login
   */
  const handleLoginSuccess = useCallback((user) => {
    if (onSuccessCallback) {
      onSuccessCallback(user);
    }
    closeLoginModal();
  }, [onSuccessCallback, closeLoginModal]);

  const value = {
    isLoginModalVisible,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess
  };

  return (
    <LoginModalContext.Provider value={value}>
      {children}
    </LoginModalContext.Provider>
  );
}

/**
 * Hook para usar el contexto del modal de login
 */
export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error('useLoginModal debe usarse dentro de LoginModalProvider');
  }
  return context;
}
