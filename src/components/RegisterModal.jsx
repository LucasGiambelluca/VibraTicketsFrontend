import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, message, Alert, Typography, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRegisterModal } from '../contexts/RegisterModalContext';
import logo from '../assets/VibraTicketLogo2.png';

const { Title, Text } = Typography;

/**
 * Modal de Registro que aparece como overlay sin redirigir
 * Mantiene al usuario en la página actual
 */
export default function RegisterModal() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const { isRegisterModalVisible, closeRegisterModal, handleRegisterSuccess } = useRegisterModal();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = {
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`,
        phone: values.phone,
        role: 'CUSTOMER'
      };
      
      const user = await register(userData);
      
      message.success(`¡Cuenta creada exitosamente! Bienvenido ${user.name}`);
      
      // Limpiar formulario
      form.resetFields();
      
      // Callback de éxito (ejecuta callback y cierra modal)
      handleRegisterSuccess(user);
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al crear la cuenta. Intenta nuevamente.';
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError(null);
    closeRegisterModal();
  };

  return (
    <Modal
      open={isRegisterModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={520}
      centered
      destroyOnClose
      styles={{
        body: { padding: '32px 24px' }
      }}
      style={{
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
          Crear Cuenta
        </Title>
        <Text style={{ color: '#666', fontSize: '14px' }}>
          Registrate para comprar tus entradas
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
            message="Error al registrarse"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Nombre y Apellido */}
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333' }}>Nombre</span>}
              name="firstName"
              rules={[{ required: true, message: 'Ingresá tu nombre' }]}
            >
              <Input 
                placeholder="Juan"
                style={{ 
                  borderRadius: 8,
                  padding: '10px 12px'
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#333' }}>Apellido</span>}
              name="lastName"
              rules={[{ required: true, message: 'Ingresá tu apellido' }]}
            >
              <Input 
                placeholder="Pérez"
                style={{ 
                  borderRadius: 8,
                  padding: '10px 12px'
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Email */}
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

        {/* Teléfono - SIN ÍCONO */}
        <Form.Item
          label={<span style={{ fontWeight: 500, color: '#333' }}>Teléfono</span>}
          name="phone"
          rules={[
            { required: true, message: 'Ingresá tu teléfono' },
            { pattern: /^[0-9+\-\s()]+$/, message: 'Teléfono inválido' }
          ]}
        >
          <Input 
            placeholder="+54 11 1234-5678"
            style={{ 
              borderRadius: 8,
              padding: '10px 12px'
            }}
          />
        </Form.Item>

        {/* Contraseña */}
        <Form.Item
          label={<span style={{ fontWeight: 500, color: '#333' }}>Contraseña</span>}
          name="password"
          rules={[
            { required: true, message: 'Por favor ingresá tu contraseña' },
            { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
          ]}
        >
          <Input.Password 
            placeholder="Mínimo 6 caracteres"
            style={{ 
              borderRadius: 8,
              padding: '10px 12px'
            }}
          />
        </Form.Item>

        {/* Confirmar Contraseña */}
        <Form.Item
          label={<span style={{ fontWeight: 500, color: '#333' }}>Confirmar Contraseña</span>}
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Por favor confirmá tu contraseña' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Las contraseñas no coinciden'));
              },
            }),
          ]}
        >
          <Input.Password 
            placeholder="Repetí tu contraseña"
            style={{ 
              borderRadius: 8,
              padding: '10px 12px'
            }}
          />
        </Form.Item>

        {/* Botón de registro */}
        <Form.Item style={{ marginBottom: 16, marginTop: 24 }}>
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
            Crear Cuenta
          </Button>
        </Form.Item>

        {/* Link de login */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            ¿Ya tenés cuenta?{' '}
            <Link 
              to="/customerlogin" 
              onClick={handleCancel}
              style={{ color: '#1890ff', fontWeight: 500 }}
            >
              Iniciá sesión
            </Link>
          </Text>
        </div>
      </Form>
    </Modal>
  );
}
