import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, message, Alert, Divider, Typography, Grid } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLoginModal } from '../contexts/LoginModalContext';
import GoogleAuthButton from './GoogleAuthButton';
import FacebookAuthButton from './FacebookAuthButton';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

/**
 * Modal de Login que aparece como overlay sin redirigir
 * Mantiene al usuario en la página actual
 */
export default function LoginModal() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const { isLoginModalVisible, closeLoginModal, handleLoginSuccess } = useLoginModal();
  const screens = Grid.useBreakpoint();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await login({
        email: values.email,
        password: values.password
      });
      
      // Verificar que el usuario se haya logueado correctamente
      if (!user || !user.email) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      message.success(`¡Bienvenido ${user.name || user.email}!`);
      
      // Limpiar formulario
      form.resetFields();
      
      // Callback de éxito (ejecuta callback y cierra modal)
      handleLoginSuccess(user);
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Extraer mensaje de error de forma segura
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      try {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (e) {
        console.error('❌ Error al procesar mensaje de error:', e);
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      
      // NO cerrar el modal en caso de error
      // El usuario puede intentar nuevamente
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError(null);
    closeLoginModal();
  };

  const handleOAuthSuccess = (user) => {
    // El OAuth ya maneja el mensaje de éxito
    handleLoginSuccess(user);
  };

  // En móvil, usar pantalla completa en lugar de modal popup
  const isMobile = screens.xs;

  // Estilos para pantalla completa en móvil
  const mobileFullScreenStyles = {
    wrapper: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: '#fff',
      overflowY: 'auto',
      display: isLoginModalVisible ? 'flex' : 'none',
      flexDirection: 'column'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid #f0f0f0',
      position: 'sticky',
      top: 0,
      background: '#fff',
      zIndex: 10
    },
    backButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0 12px 0 0',
      color: '#333'
    },
    content: {
      flex: 1,
      padding: '24px 20px 40px',
      maxWidth: '100%'
    }
  };

  // Renderizado para móvil - pantalla completa
  if (isMobile && isLoginModalVisible) {
    return (
      <div style={mobileFullScreenStyles.wrapper}>
        {/* Header con botón de volver */}
        <div style={mobileFullScreenStyles.header}>
          <button 
            onClick={handleCancel} 
            style={mobileFullScreenStyles.backButton}
            aria-label="Volver"
          >
            ←
          </button>
          <Title level={4} style={{ margin: 0, flex: 1 }}>Iniciar Sesión</Title>
        </div>

        {/* Contenido del formulario */}
        <div style={mobileFullScreenStyles.content}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img 
              src={logo} 
              alt="VibraTicket" 
              style={{ 
                height: 50,
                width: 'auto',
                marginBottom: 16
              }} 
            />
            <Text style={{ color: '#666', fontSize: '14px', display: 'block' }}>
              Ingresá a tu cuenta para continuar
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            {error && (
              <Alert
                message="Error de autenticación"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Por favor ingresá tu email' },
                { type: 'email', message: 'Email inválido' }
              ]}
            >
              <Input 
                placeholder="tu@email.com"
                style={{ 
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: '16px'
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333' }}>Contraseña</span>}
              name="password"
              rules={[{ required: true, message: 'Por favor ingresá tu contraseña' }]}
            >
              <Input.Password 
                placeholder="Ingresá tu contraseña"
                style={{ 
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: '16px'
                }}
              />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Link 
                to="/forgot-password" 
                onClick={handleCancel}
                style={{ color: '#1890ff', fontSize: '14px' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  background: '#1890ff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 500,
                  height: 48,
                  fontSize: 16
                }}
              >
                Iniciar Sesión
              </Button>
            </Form.Item>

            <Divider style={{ margin: '20px 0 16px 0' }}>
              <Text style={{ color: '#999', fontSize: '13px' }}>O ingresá con</Text>
            </Divider>

            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <GoogleAuthButton 
                text="Continuar con Google"
                onSuccess={handleOAuthSuccess}
                onError={(error) => {
                  console.error('❌ Error en login con Google:', error);
                }}
              />
              
              <FacebookAuthButton 
                text="Continuar con Facebook"
                onSuccess={handleOAuthSuccess}
                onError={(error) => {
                  console.error('❌ Error en login con Facebook:', error);
                }}
              />
            </Space>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                ¿No tenés cuenta?{' '}
                <Link 
                  to="/register" 
                  onClick={handleCancel}
                  style={{ color: '#1890ff', fontWeight: 500 }}
                >
                  Registrate
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    );
  }

  // Renderizado para desktop - modal popup
  return (
    <Modal
      open={isLoginModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={440}
      centered
      destroyOnClose
      styles={{
        body: { padding: '32px 24px' }
      }}
      style={{
        maxWidth: '100%',
        borderRadius: 12
      }}
    >
      {/* Logo y Título */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img 
          src={logo} 
          alt="VibraTicket" 
          style={{ 
            height: 50,
            width: 'auto',
            marginBottom: 24
          }} 
        />
        <Title level={2} style={{ 
          marginBottom: 8,
          fontWeight: 600,
          color: '#1a1a1a'
        }}>
          Iniciar Sesión
        </Title>
        <Text style={{ color: '#666', fontSize: '14px' }}>
          Ingresá a tu cuenta para continuar
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
      >
        {error && (
          <Alert
            message="Error de autenticación"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          label={<span style={{ fontWeight: 500, color: '#333' }}>Email</span>}
          name="email"
          rules={[
            { required: true, message: 'Por favor ingresá tu email' },
            { type: 'email', message: 'Email inválido' }
          ]}
        >
          <Input 
            placeholder="tu@email.com"
            style={{ 
              borderRadius: 8,
              padding: '10px 12px'
            }}
          />
        </Form.Item>

        <Form.Item
          label={<span style={{ fontWeight: 500, color: '#333' }}>Contraseña</span>}
          name="password"
          rules={[{ required: true, message: 'Por favor ingresá tu contraseña' }]}
        >
          <Input.Password 
            placeholder="Ingresá tu contraseña"
            style={{ 
              borderRadius: 8,
              padding: '10px 12px'
            }}
          />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <Link 
            to="/forgot-password" 
            onClick={handleCancel}
            style={{ color: '#1890ff', fontSize: '14px' }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              background: '#1890ff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              height: 44,
              fontSize: 15
            }}
          >
            Iniciar Sesión
          </Button>
        </Form.Item>

        {/* Divider para métodos alternativos */}
        <Divider style={{ margin: '20px 0 16px 0' }}>
          <Text style={{ color: '#999', fontSize: '13px' }}>O ingresá con</Text>
        </Divider>

        {/* Botones de OAuth - Google y Facebook */}
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <GoogleAuthButton 
            text="Continuar con Google"
            onSuccess={handleOAuthSuccess}
            onError={(error) => {
              console.error('❌ Error en login con Google:', error);
            }}
          />
          
          <FacebookAuthButton 
            text="Continuar con Facebook"
            onSuccess={handleOAuthSuccess}
            onError={(error) => {
              console.error('❌ Error en login con Facebook:', error);
            }}
          />
        </Space>

        {/* Links de registro y admin */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            ¿No tenés cuenta?{' '}
            <Link 
              to="/register" 
              onClick={handleCancel}
              style={{ color: '#1890ff', fontWeight: 500 }}
            >
              Registrate
            </Link>
          </Text>
        </div>
        

      </Form>
    </Modal>
  );
}
