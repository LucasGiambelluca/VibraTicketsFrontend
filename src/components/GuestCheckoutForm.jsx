import React, { useState } from 'react';
import { Form, Input, Button, Card, Checkbox, Alert, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import './GuestCheckoutForm.css';

const GuestCheckoutForm = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [createAccount, setCreateAccount] = useState(false);

  const handleFinish = (values) => {
    onSubmit({
      name: values.name,
      email: values.email,
      phone: values.phone,
      createAccount: createAccount && values.password ? true : false,
      password: values.password
    });
  };

  const validateEmail = (_, value) => {
    if (!value) {
      return Promise.reject('El email es requerido');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject('Email inválido');
    }
    return Promise.resolve();
  };

  return (
    <Card className="guest-checkout-form" title="Información de Contacto">
      <Alert
        message="No necesitas registrarte para comprar"
        description="Ingresá tu email para recibir tus tickets. Opcionalmente podés crear una cuenta para futuras compras."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { validator: validateEmail }
          ]}
          extra="Recibirás tus tickets en este email"
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="tu@email.com"
            size="large"
            type="email"
          />
        </Form.Item>

        <Form.Item
          label="Nombre Completo"
          name="name"
          rules={[
            { required: true, message: 'El nombre es requerido' },
            { min: 3, message: 'Mínimo 3 caracteres' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Juan Pérez"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Teléfono (opcional)"
          name="phone"
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="+54 9 11 1234-5678"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Checkbox
            checked={createAccount}
            onChange={(e) => setCreateAccount(e.target.checked)}
          >
            Crear cuenta para futuras compras
          </Checkbox>
        </Form.Item>

        {createAccount && (
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: createAccount, message: 'La contraseña es requerida' },
              { min: 8, message: 'Mínimo 8 caracteres' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Debe contener mayúscula, minúscula y número'
              }
            ]}
            extra="Mínimo 8 caracteres con mayúscula, minúscula y número"
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Tu contraseña"
              size="large"
            />
          </Form.Item>
        )}

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            style={{
              height: 56,
              fontSize: 18,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            {createAccount ? 'Crear Cuenta y Reservar' : 'Reservar Asientos'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/login" style={{ color: '#667eea' }}>
          ¿Ya tenés cuenta? Iniciá sesión
        </a>
      </div>
    </Card>
  );
};

export default GuestCheckoutForm;
