import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Checkbox,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Spin,
  Alert,
  Statistic,
  Row,
  Col,
  Badge,
  Tooltip,
  Progress,
  Empty,
  Pagination,
  Switch,
  Dropdown,
  Popconfirm
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  DownOutlined
} from '@ant-design/icons';
import { adminUsersApi } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import './AdminUsersPanel.css';

const { TabPane } = Tabs;
const { Option } = Select;

const AdminUsersPanel = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState('2');
  const [loading, setLoading] = useState(false);
  
  // Estado para crear usuario
  const [createForm] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Estado para listar usuarios
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({});
  
  // Estado para modales
  const [detailsModal, setDetailsModal] = useState({ visible: false, user: null, stats: null });
  const [holdsModal, setHoldsModal] = useState({ visible: false, user: null, holds: [] });
  const [editModal, setEditModal] = useState({ visible: false, user: null });
  const [editForm] = Form.useForm();

  // Verificar que el usuario es ADMIN
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      message.error('Solo administradores pueden acceder a esta sección');
    }
  }, [user]);

  // Cargar usuarios al montar y al cambiar filtros
  useEffect(() => {
    if (activeTab === '2') {
      loadUsers();
    }
  }, [activeTab, pagination.page, filters]);

  // ============================================
  // FUNCIONES: CREAR USUARIO
  // ============================================
  
  const validatePassword = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    
    return strength;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPasswordStrength(validatePassword(pwd));
  };

  const handleCreateUser = async (values) => {
    try {
      setLoading(true);
      if (!isAdmin) {
        message.error('Solo ADMIN puede crear usuarios');
        return;
      }
      
      // Validar password
      if (validatePassword(values.password) < 100) {
        message.error('La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número');
        return;
      }

      const response = await adminUsersApi.createUser(values);
      
      if (response.success) {
        message.success(`Usuario ${values.role} creado exitosamente`);
        createForm.resetFields();
        setPasswordStrength(0);
        
        // Actualizar lista si está en Tab 2
        if (activeTab === '2') {
          loadUsers();
        }
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      message.error(error.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES: LISTAR USUARIOS
  // ============================================
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const response = await adminUsersApi.listUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      // Manejo flexible del shape de respuesta
      let usersList = [];
      let total = 0;
      let totalPages = undefined;

      if (response?.success && response?.data?.users) {
        usersList = response.data.users;
        total = response.data?.pagination?.total ?? usersList.length;
        totalPages = response.data?.pagination?.totalPages;
      } else if (Array.isArray(response)) {
        usersList = response;
        total = usersList.length;
      } else if (response?.users) {
        usersList = response.users;
        total = response?.pagination?.total ?? usersList.length;
        totalPages = response?.pagination?.totalPages;
      } else if (response?.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          usersList = data;
          total = usersList.length;
        } else if (Array.isArray(data?.users)) {
          usersList = data.users;
          total = data?.pagination?.total ?? usersList.length;
          totalPages = data?.pagination?.totalPages;
        }
      }
      
      setUsers(usersList);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages
      }));
    } catch (error) {
      console.error('Error cargando usuarios:', error.message);
      message.error(`Error al cargar usuarios: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      if (!isAdmin) {
        message.error('Solo ADMIN puede cambiar el estado de usuarios');
        return;
      }
      await adminUsersApi.updateUser(userId, { isActive: !currentStatus });
      message.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      loadUsers();
    } catch (error) {
      message.error('Error al actualizar estado del usuario');
    }
  };

  // ============================================
  // FUNCIONES: DETALLES DE USUARIO
  // ============================================
  
  const showUserDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await adminUsersApi.getUserById(userId);
      
      if (response.success) {
        setDetailsModal({
          visible: true,
          user: response.data.user,
          stats: response.data.stats
        });
      }
    } catch (error) {
      message.error('Error al cargar detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES: RESERVAS DE USUARIO
  // ============================================
  
  const showUserHolds = async (user, activeOnly = true) => {
    try {
      setLoading(true);
      const response = await adminUsersApi.getUserHolds(user.id, { active: activeOnly });
      
      if (response.success) {
        setHoldsModal({
          visible: true,
          user: user,
          holds: response.data.holds,
          activeOnly
        });
      }
    } catch (error) {
      message.error('Error al cargar reservas del usuario');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES: EDITAR USUARIO
  // ============================================
  
  const showEditModal = (user) => {
    if (!isAdmin) {
      message.error('Solo ADMIN puede editar usuarios');
      return;
    }
    setEditModal({ visible: true, user });
    editForm.setFieldsValue({
      name: user.name,
      role: user.role,
      phone: user.phone,
      country: user.country,
      isActive: (user.isActive === true) || (user.is_active === 1) || (user.is_active === true)
    });
  };

  const handleEditUser = async (values) => {
    try {
      setLoading(true);
      if (!isAdmin) {
        message.error('Solo ADMIN puede editar usuarios');
        return;
      }
      await adminUsersApi.updateUser(editModal.user.id, values);
      message.success('Usuario actualizado exitosamente');
      setEditModal({ visible: false, user: null });
      loadUsers();
    } catch (error) {
      message.error('Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // COMPONENTES: RENDERS
  // ============================================
  
  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'red',
      ORGANIZER: 'blue',
      DOOR: 'green',
      CUSTOMER: 'default'
    };
    return colors[role] || 'default';
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(cents / 100);
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Columnas de la tabla
  const onChangeRole = async (userId, role) => {
    try {
      if (!isAdmin) {
        message.error('Solo ADMIN puede cambiar roles');
        return;
      }
      await adminUsersApi.updateUser(userId, { role });
      message.success(`Rol actualizado a ${role}`);
      loadUsers();
    } catch (error) {
      message.error('No se pudo cambiar el rol');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
      if (!isAdmin) {
        message.error('Solo ADMIN puede eliminar usuarios');
        return;
      }
      
      const response = await adminUsersApi.deleteUser(userId);
      
      // Mostrar mensaje de éxito
      if (response?.success || response?.message) {
        message.success(response?.message || `Usuario "${userName}" eliminado exitosamente`);
      } else {
        message.success('Usuario eliminado exitosamente');
      }
      
      // Recargar lista de usuarios
      loadUsers();
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al eliminar usuario';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Manejar casos específicos de error
      const status = error.response?.status;
      
      if (status === 400) {
        // Errores de validación (tiene órdenes pagadas, tickets activos, etc.)
        const data = error.response?.data?.data;
        
        if (data?.paidOrdersCount) {
          const msg = `${errorMessage}\n\nTiene ${data.paidOrdersCount} orden(es) pagada(s). Por seguridad, no se puede eliminar. Puedes desactivarlo en su lugar.`;
          message.error(msg, 8);
        } else if (data?.activeTicketsCount) {
          const msg = `${errorMessage}\n\nTiene ${data.activeTicketsCount} ticket(s) activo(s).`;
          message.error(msg, 8);
        } else {
          message.error(errorMessage, 6);
        }
      } else if (status === 403) {
        message.error('No tienes permisos para eliminar usuarios. Solo ADMIN puede eliminar.');
      } else if (status === 404) {
        message.error('Usuario no encontrado');
      } else {
        message.error(errorMessage, 5);
      }
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleBadgeColor(role)}>{role}</Tag>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (ignored, record) => {
        const activeFlag = (record.isActive === true) || (record.is_active === 1) || (record.is_active === true);
        return (
          <Switch
            checked={activeFlag}
            onChange={() => handleToggleActive(record.id, activeFlag)}
            checkedChildren="Activo"
            unCheckedChildren="Inactivo"
            disabled={!isAdmin}
          />
        );
      }
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('es-AR')
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver Detalles">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => showUserDetails(record.id)}
            />
          </Tooltip>
          <Tooltip title="Ver Reservas">
            <Button
              icon={<ClockCircleOutlined />}
              size="small"
              onClick={() => showUserHolds(record)}
            />
          </Tooltip>
          <Dropdown
            disabled={!isAdmin}
            menu={{
              items: [
                { key: 'ADMIN', label: 'Hacer ADMIN' },
                { key: 'ORGANIZER', label: 'Hacer ORGANIZER' },
                { key: 'DOOR', label: 'Hacer DOOR' },
                { key: 'CUSTOMER', label: 'Hacer CUSTOMER' }
              ],
              onClick: ({ key }) => onChangeRole(record.id, key)
            }}
          >
            <Button icon={<UserSwitchOutlined />} size="small" disabled={!isAdmin}>
              Rol <DownOutlined />
            </Button>
          </Dropdown>
          <Tooltip title="Editar">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => showEditModal(record)}
              disabled={!isAdmin}
            />
          </Tooltip>
          <Popconfirm
            title={`¿Eliminar a ${record.name}?`}
            description="Esta acción no se puede deshacer. El usuario será marcado como eliminado."
            okText="Sí, eliminar"
            okType="danger"
            cancelText="Cancelar"
            onConfirm={() => handleDeleteUser(record.id, record.name)}
            disabled={!isAdmin}
          >
            <Tooltip title="Eliminar usuario">
              <Button danger icon={<DeleteOutlined />} size="small" disabled={!isAdmin} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-users-panel">
      <Card title="Gestión de Usuarios" extra={<Badge count={users.length} showZero color="blue" />}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* TAB 1: CREAR USUARIO */}
          <TabPane tab={<span><UserAddOutlined /> Crear Usuario</span>} key="1">
            {!isAdmin && (
              <Alert
                message="Permisos insuficientes"
                description="Solo ADMIN puede crear nuevos usuarios."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateUser}
              initialValues={{ country: 'ARG', isActive: true }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Email es requerido' },
                      { type: 'email', message: 'Email inválido' }
                    ]}
                  >
                    <Input prefix="📧" placeholder="usuario@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Nombre Completo"
                    name="name"
                    rules={[{ required: true, message: 'Nombre es requerido' }]}
                  >
                    <Input prefix="👤" placeholder="Juan Pérez" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Contraseña"
                    name="password"
                    rules={[
                      { required: true, message: 'Contraseña es requerida' },
                      { min: 8, message: 'Mínimo 8 caracteres' },
                      {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Debe contener mayúscula, minúscula y número'
                      }
                    ]}
                  >
                    <Input.Password
                      prefix="🔑"
                      placeholder="Mínimo 8 caracteres"
                      onChange={handlePasswordChange}
                    />
                  </Form.Item>
                  <Progress
                    percent={passwordStrength}
                    strokeColor={
                      passwordStrength < 50 ? '#ff4d4f' :
                      passwordStrength < 75 ? '#faad14' : '#52c41a'
                    }
                    showInfo={false}
                    style={{ marginTop: -16, marginBottom: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Rol"
                    name="role"
                    rules={[{ required: true, message: 'Rol es requerido' }]}
                  >
                    <Select placeholder="Seleccionar rol">
                      <Option value="CUSTOMER">Customer (Cliente)</Option>
                      <Option value="ORGANIZER">Organizer (Productor)</Option>
                      <Option value="DOOR">Door (Puerta)</Option>
                      <Option value="ADMIN">Admin (Administrador)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="DNI" name="dni">
                    <Input prefix="🆔" placeholder="12345678" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="País" name="country">
                    <Input prefix="🌍" placeholder="ARG" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Teléfono" name="phone">
                    <Input prefix="📱" placeholder="+54 9 11 1234-5678" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="isActive" valuePropName="checked">
                <Checkbox>Usuario Activo</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<UserAddOutlined />}
                  loading={loading}
                  size="large"
                  block
                  disabled={!isAdmin}
                >
                  Crear Usuario
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* TAB 2: LISTAR USUARIOS */}
          <TabPane tab={<span><SearchOutlined /> Listar Usuarios</span>} key="2">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Filtros */}
              <Card size="small">
                <Row gutter={16}>
                  <Col span={6}>
                    <Select
                      placeholder="Todos los roles"
                      allowClear
                      style={{ width: '100%' }}
                      onChange={(value) => handleFilterChange('role', value)}
                    >
                      <Option value="ADMIN">Admin</Option>
                      <Option value="ORGANIZER">Organizer</Option>
                      <Option value="DOOR">Door</Option>
                      <Option value="CUSTOMER">Customer</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      placeholder="Todos los estados"
                      allowClear
                      style={{ width: '100%' }}
                      onChange={(value) => handleFilterChange('isActive', value)}
                    >
                      <Option value="true">Activos</Option>
                      <Option value="false">Inactivos</Option>
                    </Select>
                  </Col>
                  <Col span={10}>
                    <Input
                      placeholder="Buscar por email, nombre o DNI..."
                      prefix={<SearchOutlined />}
                      allowClear
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={loadUsers}
                      loading={loading}
                    >
                      Actualizar
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Tabla */}
              <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="id"
                pagination={false}
              />

              {/* Paginación */}
              <Pagination
                current={pagination.page}
                pageSize={pagination.limit}
                total={pagination.total}
                onChange={(page) => setPagination(prev => ({ ...prev, page }))}
                showSizeChanger
                onShowSizeChange={(_, size) => setPagination(prev => ({ ...prev, limit: size, page: 1 }))}
                showTotal={(total) => `Total: ${total} usuarios`}
              />
            </Space>
          </TabPane>

          {/* TAB 3: BUSCAR USUARIO */}
          <TabPane tab={<span><SearchOutlined /> Buscar Usuario</span>} key="3">
            <Alert
              message="Búsqueda Rápida"
              description="Busca usuarios por email, nombre o DNI. Los resultados aparecen automáticamente."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Input.Search
              placeholder="Buscar usuario..."
              prefix={<SearchOutlined />}
              size="large"
              allowClear
              onSearch={(value) => handleFilterChange('search', value)}
              enterButton="Buscar"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* MODAL: DETALLES DE USUARIO */}
      <Modal
        title="Detalles del Usuario"
        open={detailsModal.visible}
        onCancel={() => setDetailsModal({ visible: false, user: null, stats: null })}
        footer={[
          <Button key="holds" onClick={() => {
            setDetailsModal({ visible: false, user: null, stats: null });
            showUserHolds(detailsModal.user);
          }}>
            Ver Reservas
          </Button>,
          <Button key="close" type="primary" onClick={() => setDetailsModal({ visible: false, user: null, stats: null })}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        {detailsModal.user && detailsModal.stats && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <p><strong>Email:</strong> {detailsModal.user.email}</p>
              <p><strong>Nombre:</strong> {detailsModal.user.name}</p>
              <p><strong>Rol:</strong> <Tag color={getRoleBadgeColor(detailsModal.user.role)}>{detailsModal.user.role}</Tag></p>
              <p><strong>DNI:</strong> {detailsModal.user.dni || 'N/A'}</p>
              <p><strong>País:</strong> {detailsModal.user.country || 'N/A'}</p>
              <p><strong>Teléfono:</strong> {detailsModal.user.phone || 'N/A'}</p>
            </Card>
            
            <Card title="Estadísticas" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Total de Órdenes" value={detailsModal.stats.total_orders} />
                </Col>
                <Col span={12}>
                  <Statistic title="Órdenes Pagadas" value={detailsModal.stats.paid_orders} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Gastado"
                    value={formatCurrency(detailsModal.stats.total_spent_cents)}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Reservas Activas"
                    value={detailsModal.stats.active_holds}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Space>
        )}
      </Modal>

      {/* MODAL: RESERVAS DE USUARIO */}
      <Modal
        title={holdsModal.user ? `Reservas de ${holdsModal.user.name}` : 'Reservas'}
        open={holdsModal.visible}
        onCancel={() => setHoldsModal({ visible: false, user: null, holds: [] })}
        footer={null}
        width={900}
      >
        {holdsModal.holds.length === 0 ? (
          <Empty description="No hay reservas" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {holdsModal.holds.map(hold => (
              <Card key={hold.hold_id} size="small">
                <Row gutter={16}>
                  <Col span={16}>
                    <h4>🎸 {hold.event_name}</h4>
                    <p>📅 {new Date(hold.show_starts_at).toLocaleString('es-AR')}</p>
                    <p>💺 {hold.seat_count} asientos</p>
                    <p><strong>Total:</strong> {formatCurrency(hold.total_cents)}</p>
                  </Col>
                  <Col span={8} style={{ textAlign: 'right' }}>
                    <Tag color={hold.status === 'ACTIVE' ? 'green' : 'red'}>
                      {hold.status}
                    </Tag>
                    {hold.status === 'ACTIVE' && (
                      <p>⏰ Expira en: {getTimeRemaining(hold.expires_at)}</p>
                    )}
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </Modal>

      {/* MODAL: EDITAR USUARIO */}
      <Modal
        title="Editar Usuario"
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false, user: null })}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditUser}
        >
          <Form.Item label="Nombre" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="Rol" name="role">
            <Select disabled={!isAdmin}>
              <Option value="CUSTOMER">Customer</Option>
              <Option value="ORGANIZER">Organizer</Option>
              <Option value="DOOR">Door</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Teléfono" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="País" name="country">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Usuario Activo</Checkbox>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setEditModal({ visible: false, user: null })}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Guardar Cambios
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsersPanel;
