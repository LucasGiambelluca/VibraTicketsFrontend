import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Typography, Divider, Avatar, Row, Col, Tabs, Modal, Alert, Tooltip, Badge } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, EditOutlined, SaveOutlined, IdcardOutlined, InfoCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../services/apiService';
import { validateDNI } from '../utils/validators';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        dni: user.dni || ''
      });
    }
  }, [user, form]);

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      // Validar DNI si fue proporcionado
      if (values.dni) {
        const dniValidation = validateDNI(values.dni);
        if (!dniValidation.valid) {
          message.error(dniValidation.error);
          setLoading(false);
          return;
        }
      }

      await usersApi.updateMe({
        name: values.name,
        phone: values.phone,
        dni: values.dni
      });
      
      await refreshUser();
      message.success('Perfil actualizado correctamente');
      setEditMode(false);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      message.error(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Las contraseñas no coinciden');
      return;
    }

    console.log('=== CAMBIO DE CONTRASEÑA ===');
    console.log('Valores del formulario:', { ...values, currentPassword: '***', newPassword: '***' });

    setLoading(true);
    try {
      const payload = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      };
      console.log('Enviando payload a /api/users/me/change-password');
      
      const response = await usersApi.changePassword(payload);
      console.log('Respuesta del servidor:', response);
      
      message.success('Contraseña cambiada correctamente');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('=== ERROR CAMBIANDO CONTRASEÑA ===');
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error response:', error.response);
      
      let errorMsg = 'Error al cambiar la contraseña';
      if (error.message?.includes('fetch') || error.message?.includes('Backend no disponible')) {
        errorMsg = 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg, 5);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: { text: 'Administrador', color: '#f5222d' },
      ORGANIZER: { text: 'Organizador', color: '#1890ff' },
      CUSTOMER: { text: 'Cliente', color: '#52c41a' },
      DOOR: { text: 'Puerta', color: '#faad14' }
    };
    const badge = badges[role] || { text: role, color: '#666' };
    return (
      <span style={{ 
        background: badge.color, 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* Header del Perfil */}
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Row gutter={24} align="middle">
              <Col>
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: 32
                  }}
                />
              </Col>
              <Col flex="auto">
                <Title level={2} style={{ margin: 0 }}>
                  {user?.name || 'Usuario'}
                </Title>
                <Space size="middle" style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    <MailOutlined /> {user?.email}
                  </Text>
                  {getRoleBadge(user?.role)}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabs de Contenido */}
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Tabs defaultActiveKey="1" size="large">
              
              {/* Tab: Información Personal */}
              <TabPane tab="Información Personal" key="1">
                <div style={{ maxWidth: 600 }}>
                  {/* Advertencia si no tiene DNI */}
                  {!user?.dni && (
                    <Alert
                      message="DNI Requerido"
                      description="Debés completar tu DNI para poder comprar boletos. Máximo 5 boletos por evento."
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                      style={{ marginBottom: 24 }}
                      action={
                        !editMode && (
                          <Button size="small" type="primary" onClick={() => setEditMode(true)}>
                            Completar DNI
                          </Button>
                        )
                      }
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>Datos Personales</Title>
                    {!editMode && (
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        onClick={() => setEditMode(true)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    disabled={!editMode}
                  >
                    <Form.Item
                      label="Nombre completo"
                      name="name"
                      rules={[
                        { required: true, message: 'Ingresá tu nombre' },
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
                      label="Email"
                      name="email"
                    >
                      <Input 
                        prefix={<MailOutlined />} 
                        disabled
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Teléfono"
                      name="phone"
                      rules={[
                        { pattern: /^[0-9+\s()-]+$/, message: 'Formato de teléfono inválido' }
                      ]}
                    >
                      <Input 
                        prefix={<PhoneOutlined />} 
                        placeholder="+54 9 11 1234-5678"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          DNI{' '}
                          {!user?.dni && (
                            <Badge 
                              count="Requerido" 
                              style={{ backgroundColor: '#ff4d4f' }}
                            />
                          )}
                          {' '}
                          <Tooltip title="Documento Nacional de Identidad - Requerido para validar compras (máximo 5 boletos por evento)">
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                          </Tooltip>
                        </span>
                      }
                      name="dni"
                      rules={[
                        {
                          validator: async (_, value) => {
                            if (!value) return; // Permitir vacío para que puedan guardarlo después
                            const validation = validateDNI(value);
                            if (!validation.valid) {
                              throw new Error(validation.error);
                            }
                          }
                        }
                      ]}
                      extra={
                        user?.dni ? (
                          <span style={{ color: '#52c41a' }}>
                            <CheckCircleOutlined /> DNI verificado - Podés comprar hasta 5 boletos por evento
                          </span>
                        ) : (
                          <span style={{ color: '#ff4d4f' }}>
                            <WarningOutlined /> Completá tu DNI para poder comprar boletos
                          </span>
                        )
                      }
                    >
                      <Input 
                        prefix={<IdcardOutlined />} 
                        placeholder="12345678"
                        maxLength={8}
                        size="large"
                        onChange={(e) => {
                          // Solo permitir números
                          const value = e.target.value.replace(/\D/g, '');
                          form.setFieldsValue({ dni: value });
                        }}
                      />
                    </Form.Item>

                    {editMode && (
                      <Form.Item>
                        <Space>
                          <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            icon={<SaveOutlined />}
                            size="large"
                          >
                            Guardar Cambios
                          </Button>
                          <Button 
                            onClick={() => {
                              setEditMode(false);
                              form.resetFields();
                            }}
                            size="large"
                          >
                            Cancelar
                          </Button>
                        </Space>
                      </Form.Item>
                    )}
                  </Form>
                </div>
              </TabPane>

              {/* Tab: Seguridad */}
              <TabPane tab="Seguridad" key="2">
                <div style={{ maxWidth: 600 }}>
                  <Title level={4}>Contraseña</Title>
                  <Text type="secondary">
                    Mantené tu cuenta segura con una contraseña fuerte
                  </Text>
                  
                  <Divider />

                  <Button 
                    type="primary" 
                    icon={<LockOutlined />}
                    onClick={() => setPasswordModalVisible(true)}
                    size="large"
                  >
                    Cambiar Contraseña
                  </Button>

                  <Divider />

                  <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 8 }}>
                    <Text strong>Recomendaciones de seguridad:</Text>
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      <li>Usá al menos 8 caracteres</li>
                      <li>Incluí mayúsculas y minúsculas</li>
                      <li>Agregá números y símbolos</li>
                      <li>No uses información personal</li>
                    </ul>
                  </div>
                </div>
              </TabPane>

              {/* Tab: Actividad */}
              <TabPane tab="Actividad" key="3">
                <div style={{ maxWidth: 600 }}>
                  <Title level={4}>Información de la Cuenta</Title>
                  
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Card size="small">
                      <Text type="secondary">ID de Usuario:</Text>
                      <br />
                      <Text strong>{user?.id}</Text>
                    </Card>

                    <Card size="small">
                      <Text type="secondary">Rol:</Text>
                      <br />
                      {getRoleBadge(user?.role)}
                    </Card>

                    <Card size="small">
                      <Text type="secondary">Miembro desde:</Text>
                      <br />
                      <Text strong>
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </Text>
                    </Card>
                  </Space>
                </div>
              </TabPane>

            </Tabs>
          </Card>

        </Space>
      </div>

      {/* Modal: Cambiar Contraseña */}
      <Modal
        title="Cambiar Contraseña"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="Contraseña Actual"
            name="currentPassword"
            rules={[{ required: true, message: 'Ingresá tu contraseña actual' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Nueva Contraseña"
            name="newPassword"
            rules={[
              { required: true, message: 'Ingresá una nueva contraseña' },
              { min: 8, message: 'Mínimo 8 caracteres' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Debe contener mayúsculas, minúsculas y números'
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Confirmá tu nueva contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cambiar Contraseña
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
