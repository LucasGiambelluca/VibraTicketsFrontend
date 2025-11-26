import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Button, Table, Space, Form, Input, Modal, Card, Select, DatePicker, Upload, message, Tag, Row, Col, Statistic, Avatar, Spin, Divider } from 'antd';
import { 
  DashboardOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  UserOutlined,
  LogoutOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  BarChartOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import CreateEvent from '../../components/CreateEvent';
import CreateVenue from '../../components/CreateVenue';
import VenueMap from '../../components/VenueMap';
import MercadoPagoConfig from '../../components/MercadoPagoConfig';
import EventImageUpload from '../../components/EventImageUpload';
import EventStyleEditor from '../../components/EventStyleEditor';
import AdminBanners from './AdminBanners';
import ReportsPanel from './ReportsPanel';
import AdminUsersPanel from './AdminUsersPanel';
import ManageOrders from './ManageOrders';
import { getImageUrl } from '../../utils/imageUtils';
import { useEvents } from '../../hooks/useEvents';
import { showsApi, eventsApi, eventStylesApi } from '../../services/apiService';
import { useVenues } from '../../hooks/useVenues';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Sider, Content, Header } = Layout;
const { Option } = Select;

export default function AdminDashboard() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Debug: Mostrar rol del usuario
  useEffect(() => {
    }, [user]);

  const dashboardEvents = useEvents({ limit: 5 });

  const handleLogout = () => {
    logout();
    message.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'events',
      icon: <CalendarOutlined />,
      label: 'Eventos',
    },
    {
      key: 'shows',
      icon: <TeamOutlined />,
      label: 'Shows',
    },
    {
      key: 'venues',
      icon: <EnvironmentOutlined />,
      label: 'Venues',
    },
    {
      key: 'banners',
      icon: <PictureOutlined />,
      label: 'Banners',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reportes',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Usuarios',
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Órdenes',
    },
    {
      key: 'health',
      icon: <HeartOutlined />,
      label: 'Estado del Sistema',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    {
      key: 'mercadopago',
      icon: <SettingOutlined />,
      label: 'MercadoPago',
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardContent eventsData={dashboardEvents} />;
      case 'events':
        return <EventsAdmin />;
      case 'shows':
        return <ShowsAdmin />;
      case 'venues':
        return <VenuesAdmin />;
      case 'banners':
        return <AdminBanners />;
      case 'reports':
        return <ReportsPanel />;
      case 'users':
        return <AdminUsersPanel />;
      case 'orders':
        return <ManageOrders />;
      case 'health':
        return <HealthContent />;
      case 'settings':
        return <SettingsAdmin />;
      case 'mercadopago':
        return <MercadoPagoConfig />;
      default:
        return <DashboardContent eventsData={dashboardEvents} />;
    }
  };

  // Handlers de crear show están dentro de EventsAdmin

  // NOTE: handlers de asignación se definen dentro de EventsAdmin

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Sidebar */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {!collapsed ? (
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Admin Panel
            </Title>
          ) : (
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              AP
            </Title>
          )}
        </div>
        
        <Menu
          theme="dark"
          selectedKeys={[selectedMenu]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => setSelectedMenu(key)}
          style={{ 
            background: 'transparent',
            border: 'none'
          }}
        />
        
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 16, 
          right: 16 
        }}>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            style={{ color: 'white', width: '100%' }}
            onClick={handleLogout}
          >
            {!collapsed && 'Cerrar Sesión'}
          </Button>
        </div>
      </Sider>

      {/* Main Content */}
      <Layout>
        <Header style={{ 
          background: 'white', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ margin: 0, textTransform: 'capitalize' }}>
            {selectedMenu === 'dashboard' ? 'Panel de Control' : selectedMenu}
          </Title>
          <Space>
            <Avatar icon={<UserOutlined />} />
            <Text strong>Administrador</Text>
          </Space>
        </Header>
        
        <Content style={{ margin: '24px', background: 'transparent' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

// Dashboard Content
function DashboardContent({ eventsData }) {
  const { events, loading: eventsLoading } = eventsData;
  
  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Eventos"
              value={events.length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CalendarOutlined />}
              loading={eventsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tickets Vendidos"
              value={1128}
              valueStyle={{ color: '#cf1322' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos"
              value={2840000}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Usuarios Activos"
              value={93}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Eventos Recientes" loading={eventsLoading}>
        {events.length > 0 ? (
          <div>
            {events.slice(0, 3).map(event => (
              <div key={event.id} style={{ 
                padding: '12px 0', 
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <Text strong>{event.name}</Text>
                  <br />
                  <Text type="secondary">
                    {event.venue_name ? `${event.venue_name} - ${event.venue_city}` : event.venue}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary">
                    {event.next_show_date ? 
                      format(new Date(event.next_show_date), 'dd MMM yyyy', { locale: es }) : 
                      'Sin fecha'
                    }
                  </Text>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">No hay eventos disponibles</Text>
        )}
      </Card>
    </div>
  );
}

// Events Admin
function EventsAdmin() {
  const [open, setOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventShows, setEventShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [showSections, setShowSections] = useState([]);
  const [form] = Form.useForm();
  // Editar y Ver Evento
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  // Modal de Gestión de Imágenes y Estilos
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [selectedEventForImages, setSelectedEventForImages] = useState(null);
  const [eventStyles, setEventStyles] = useState({});
  const [savingStyles, setSavingStyles] = useState(false);
  // Venues para seleccionar uno opcional al crear show
  const venuesHook = useVenues({ limit: 100, sortBy: 'name' });
  
  // Usar el hook useEvents para obtener datos reales
  const { events, loading, error, deleteEvent, refetch } = useEvents({
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Hook de Google Maps
  const { isLoaded: mapsLoaded } = useGoogleMaps();
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setViewModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    editForm.setFieldsValue({
      name: event.name,
      description: event.description,
      status: event.status || 'PUBLISHED'
    });
    setEditModalOpen(true);
  };

  const handleUpdateEvent = async (values) => {
    try {
      await eventsApi.updateEvent(selectedEvent.id, values);
      
      message.success('Evento actualizado correctamente');
      setEditModalOpen(false);
      editForm.resetFields();
      setSelectedEvent(null);
      
      // Refrescar lista
      await refetch();
    } catch (error) {
      message.error('Error al actualizar el evento');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmado = window.confirm(
      '¿Estás seguro de eliminar este evento?\n\n' +
      'Esta acción no se puede deshacer.\n' +
      'Todos los shows y tickets asociados podrían verse afectados.\n\n' +
      '⚠️ Requiere rol ADMIN'
    );
    
    if (!confirmado) return;
    
    try {
      await deleteEvent(eventId);
      message.success('Evento eliminado correctamente');
      await refetch();
    } catch (error) {
      
      let errorMsg = 'Error al eliminar el evento';
      
      if (error.response?.status === 403) {
        errorMsg = `No tienes permisos para eliminar eventos. Solo ADMIN puede eliminar.`;
      } else if (error.response?.status === 409) {
        errorMsg = 'No se puede eliminar el evento porque tiene shows o tickets asociados.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg, 5);
    }
  };

  // Handler para gestionar imágenes y estilos del evento
  const handleManageImages = (event) => {
    setSelectedEventForImages(event);
    // Cargar estilos actuales del evento
    setEventStyles({
      description: event.description || '',
      primary_color: event.primary_color || '#4F46E5',
      secondary_color: event.secondary_color || '#818CF8',
      text_color: event.text_color || '#1F2937',
      font_family: event.font_family || 'inherit'
    });
    setImagesModalOpen(true);
  };

  // Handler para guardar estilos personalizados
  const handleSaveStyles = async () => {
    if (!selectedEventForImages) return;
    
    try {
      setSavingStyles(true);
      
      // Usar el endpoint específico de estilos
      await eventStylesApi.updateEventStyles(selectedEventForImages.id, {
        description: eventStyles.description,
        primary_color: eventStyles.primary_color,
        secondary_color: eventStyles.secondary_color,
        text_color: eventStyles.text_color,
        font_family: eventStyles.font_family
      });
      
      message.success('🎨 Estilos actualizados correctamente');
      
      // Refrescar lista de eventos
      await refetch();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al actualizar estilos del evento';
      message.error(errorMsg);
    } finally {
      setSavingStyles(false);
    }
  };

  // La tabla usa columnas generadas cuando se renderiza, para que existan los handlers
  const buildColumns = () => [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80
    },
    { 
      title: 'Imagen', 
      dataIndex: 'image_url', 
      key: 'image_url',
      width: 100,
      render: (image_url) => (
        <Avatar 
          src={image_url ? getImageUrl(image_url, 'Evento') : undefined} 
          size={64} 
          shape="square"
          style={{ backgroundColor: '#f0f0f0' }}
        >
          {!image_url && '📅'}
        </Avatar>
    ),
    },
    { 
      title: 'Evento', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>
            {record.description || 'Sin descripción'}
          </Text>
        </div>
    ),
    },
    { 
      title: 'Venue', 
      key: 'venue',
      render: (_, record) => (
        <div>
          <Text>{record.venue_name || record.venue || 'Sin venue'}</Text>
          {record.venue_city && (
            <>
              <br />
              <Text type="secondary">{record.venue_city}</Text>
            </>
          )}
        </div>
    ),
    },
    { 
      title: 'Fecha', 
      dataIndex: 'next_show_date', 
      key: 'next_show_date',
      render: (date) => {
        if (!date) return 'Sin fecha';
        try {
          return format(new Date(date), 'dd MMM yyyy', { locale: es });
        } catch {
          return 'Fecha inválida';
        }
      }
    },
    { 
      title: 'Shows', 
      dataIndex: 'show_count', 
      key: 'show_count',
      render: (count) => (
        <Tag color="blue">
          {count || 0} shows
        </Tag>
    ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewEvent(record)}
              title="Ver detalles"
            />
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              type="primary"
              onClick={() => handleEditEvent(record)}
              title="Editar evento"
            />
            <Button 
              icon={<UploadOutlined />} 
              size="small" 
              style={{ background: '#52c41a', borderColor: '#52c41a', color: 'white' }}
              onClick={() => handleManageImages(record)}
              title="Gestionar imágenes"
            >
              📸
            </Button>
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={() => handleDeleteEvent(record.id)}
              title="Eliminar evento"
            />
          </Space>
          <Space style={{ width: '100%' }}>
            <Button 
              size="small" 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.info('Función de crear show en desarrollo')}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Nuevo Show
            </Button>
            <Button 
              size="small"
              onClick={() => handleAssignTickets(record)}
            >
              Asignar Entradas
            </Button>
          </Space>
        </Space>
      ),
    },
  ];
  
  // Abrir modal de asignación de entradas
  const handleAssignTickets = async (eventRecord) => {
    try {
      setSelectedEvent(eventRecord);
      setAssignOpen(true);
      setAssignLoading(true);
      setEventShows([]);
      setSelectedShowId(null);
      form.resetFields();

      // Cargar shows del evento (contrato nuevo)
      const shows = await showsApi.listShows({ eventId: Number(eventRecord.id) });
      const list = Array.isArray(shows) ? shows : (shows?.shows || []);
      setEventShows(list);
      if (list.length > 0) setSelectedShowId(list[0].id);
    } catch (e) {
      message.error('No se pudieron cargar los shows del evento');
    } finally {
      setAssignLoading(false);
    }
  };

  // Cargar secciones al cambiar de show seleccionado cuando el modal está abierto
  useEffect(() => {
    const loadSections = async () => {
      if (!assignOpen || !selectedShowId) return;
      try {
        const res = await showsApi.getShowSections(selectedShowId);
        const list = Array.isArray(res) ? res : (res?.sections || []);
        setShowSections(list);
      } catch (e) {
        setShowSections([]);
      }
    };
    loadSections();
  }, [assignOpen, selectedShowId]);

  // Guardar secciones
  const submitAssignTickets = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedShowId) {
        message.warning('Seleccioná un show');
        return;
      }

      const sections = values.sections || [];
      if (sections.length === 0) {
        message.warning('Agregá al menos una sección');
        return;
      }

      // ✅ VALIDACIÓN 1: Nombres vacíos o solo espacios
      const emptyNames = sections.filter(s => !s.name || s.name.trim() === '');
      if (emptyNames.length > 0) {
        message.error('Todas las secciones deben tener un nombre');
        return;
      }

      // ✅ VALIDACIÓN 2: Precios negativos
      const negativePrice = sections.find(s => Number(s.price) < 0);
      if (negativePrice) {
        message.error(`El precio de "${negativePrice.name}" no puede ser negativo`);
        return;
      }

      // ✅ VALIDACIÓN 3: Capacidad inválida
      const invalidCapacity = sections.find(s => Number(s.capacity) <= 0);
      if (invalidCapacity) {
        message.error(`La capacidad de "${invalidCapacity.name}" debe ser mayor a 0`);
        return;
      }

      // ✅ VALIDACIÓN 4: Nombres duplicados en el formulario
      const sectionNames = sections.map(s => s.name.trim().toLowerCase());
      const duplicatesInForm = sectionNames.filter((name, index) => sectionNames.indexOf(name) !== index);
      if (duplicatesInForm.length > 0) {
        const duplicateOriginal = sections.find(s => s.name.trim().toLowerCase() === duplicatesInForm[0]);
        message.error(`Ya existe una sección llamada "${duplicateOriginal.name}" en el formulario. Por favor usá nombres únicos.`);
        return;
      }

      // ✅ VALIDACIÓN 5: Nombres duplicados con secciones existentes
      const existingNames = showSections.map(s => s.name.toLowerCase());
      const duplicateWithExisting = sections.find(s => existingNames.includes(s.name.trim().toLowerCase()));
      if (duplicateWithExisting) {
        message.error({
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>Ya existe una sección llamada <strong>"{duplicateWithExisting.name}"</strong> en este show.</div>
              <div style={{ fontSize: 12, color: '#666' }}>Secciones existentes: {showSections.map(s => s.name).join(', ')}</div>
            </div>
          ),
          duration: 5
        });
        return;
      }

      setAssignLoading(true);
      
      
      let createdCount = 0;
      const errors = [];
      
      for (const section of sections) {
        const sectionData = {
          name: section.name.trim(), // ✅ Trim de espacios
          kind: section.kind || 'GA',
          capacity: Number(section.capacity),
          priceCents: Math.round(Number(section.price) * 100)
        };
        
        try {
          await showsApi.createSection(selectedShowId, sectionData);
          createdCount++;
          } catch (err) {
          
          // ✅ Manejo de errores específicos del backend
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
          const errorCode = err.response?.data?.code;
          
          if (errorCode === 'DuplicateSectionName') {
            errors.push(`"${section.name}": Ya existe en este show`);
          } else if (errorCode === 'VenueCapacityExceeded') {
            errors.push(`"${section.name}": Excede la capacidad del venue`);
          } else {
            errors.push(`"${section.name}": ${errorMsg}`);
          }
        }
      }

      // ✅ Mostrar resultado
      if (createdCount > 0) {
        message.success(`${createdCount} sección(es) creada(s) correctamente`);
      }
      
      if (errors.length > 0) {
        message.error({
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>Errores al crear algunas secciones:</div>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: 12, marginLeft: 8 }}>• {err}</div>
              ))}
            </div>
          ),
          duration: 8
        });
      }
      
      // Solo cerrar modal si todas se crearon exitosamente
      if (errors.length === 0) {
        setAssignOpen(false);
        form.resetFields();
      }
      
      // Refrescar secciones del show actual
      if (selectedShowId) {
        const res = await showsApi.getShowSections(selectedShowId);
        const list = Array.isArray(res) ? res : (res?.sections || []);
        setShowSections(list);
        }
      
      // Refrescar lista de eventos
      refetch();
    } catch (e) {
      if (e?.errorFields) return; // validation errors
      const errorMsg = e.response?.data?.message || e.message || 'Error al asignar entradas';
      message.error(errorMsg);
    } finally {
      setAssignLoading(false);
    }
  };
  
  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4}>Gestión de Eventos</Title>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setOpen(true)}>
            Nuevo Evento
          </Button>
          <Button>Exportar</Button>
        </Space>
      </div>
      
      <Table 
        rowKey="id" 
        columns={buildColumns()} 
        dataSource={events}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} eventos`
        }}
      />
      
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px',
          marginTop: '16px'
        }}>
          <Text type="danger">
            Error al cargar eventos: {error}
          </Text>
          <br />
          <Button 
            type="link" 
            onClick={refetch}
            style={{ marginTop: '8px' }}
          >
            Reintentar
          </Button>
        </div>
      )}
      
      <Modal 
        title="Crear Nuevo Evento" 
        open={open} 
        onCancel={() => setOpen(false)} 
        footer={null}
        width={700}
        centered
      >
        <CreateEvent 
          onEventCreated={(event) => {
            setOpen(false);
            
            // Si el usuario quiere crear secciones, abrir modal de secciones
            if (event.shouldCreateSections && event.showId) {
              // Buscar el show recién creado
              setTimeout(() => {
                refetch();
                // Aquí deberías abrir el modal de secciones
                // Por ahora solo mostramos mensaje
                message.success(`Evento creado. Ahora puedes asignar secciones al Show ID ${event.showId}`);
              }, 500);
            } else {
              setSuccessModalOpen(true);
            }
            
            // Recargar la lista de eventos
            setTimeout(() => {
              refetch();
            }, 500);
          }}
        />
      </Modal>

      {/* Modal de Éxito */}
      <Modal
        open={successModalOpen}
        onCancel={() => setSuccessModalOpen(false)}
        footer={null}
        centered
        closable={false}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 16,
            animation: 'bounce 1s ease-in-out'
          }}>
            🎉
          </div>
          <Title level={3} style={{ marginBottom: 16 }}>
            ¡Evento creado con éxito!
          </Title>
          <Button 
            type="primary"
            onClick={() => setSuccessModalOpen(false)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              height: 40,
              minWidth: 120
            }}
          >
            ¡Gracias!
          </Button>
        </div>
      </Modal>

      {/* Modal Asignar Entradas */}
      <Modal
        title={selectedEvent ? `Asignar Entradas • ${selectedEvent.name}` : 'Asignar Entradas'}
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={submitAssignTickets}
        okText="Guardar"
        confirmLoading={assignLoading}
        width={720}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {eventShows.length === 0 && !assignLoading && (
            <div style={{ 
              background: '#fff7e6', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #ffd591',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>!</div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Este evento no tiene shows creados
              </Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Primero debes crear un show para poder asignar entradas
              </Text>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setAssignOpen(false);
                  message.info('Función de crear show en desarrollo');
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Crear Show Ahora
              </Button>
            </div>
          )}
          
          {eventShows.length > 0 && (
            <div>
              <Text strong>Show</Text>
              <Select 
                value={selectedShowId}
                onChange={setSelectedShowId}
                loading={assignLoading}
                style={{ width: '100%' }}
                placeholder="Seleccioná un show"
              >
                {eventShows.map(s => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.eventName ? `${s.eventName} • ` : ''}{(s.startsAt || s.starts_at) ? new Date(s.startsAt || s.starts_at).toLocaleString() : 'Sin fecha'}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          {/* Alerta de secciones existentes */}
          {selectedShowId && showSections.length > 0 && (
            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 8,
              padding: 12,
              marginTop: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
                <span style={{ fontSize: 18 }}>!</span>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    Secciones existentes en este show:
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {showSections.map(s => (
                      <Tag key={s.id} color="orange">
                        {s.name}
                      </Tag>
                    ))}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                    💡 Recordá que no podés usar nombres duplicados. Cada sección debe tener un nombre único.
                  </Text>
                </div>
              </div>
            </div>
          )}

          <Form form={form} layout="vertical">
            <Form.List name="sections">
              {(fields, { add, remove }) => (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <Title level={5} style={{ margin: 0 }}>Nuevas Secciones</Title>
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                      Agregar Sección
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <Text type="secondary">No hay secciones nuevas. Agregá una.</Text>
                  )}

                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginTop: 12 }}>
                      <Row gutter={12}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="Nombre de la sección"
                            rules={[{ required: true, message: 'Ingresá un nombre' }]}
                          >
                            <Input placeholder="Campo, Platea, VIP" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'kind']}
                            label="Tipo"
                            initialValue="GA"
                            rules={[{ required: true, message: 'Seleccioná tipo' }]}
                          >
                            <Select options={[{value:'GA',label:'Campo (GA)'},{value:'SEATED',label:'Butacas (SEATED)'}]} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'price']}
                            label="Precio ($)"
                            rules={[{ required: true, message: 'Ingresá un precio' }]}
                          >
                            <Input type="number" min={0} step={1} placeholder="15000" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'capacity']}
                            label="Capacidad"
                            rules={[{ required: true, message: 'Ingresá capacidad' }]}
                          >
                            <Input type="number" min={1} step={1} placeholder="100" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'end' }}>
                          <Button danger onClick={() => remove(name)}>Quitar</Button>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </>
              )}
            </Form.List>
          </Form>

          {/* Tabla de secciones actuales del show */}
          <Card size="small" title="Secciones del Show seleccionado">
            {selectedShowId ? (
              showSections.length > 0 ? (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Nombre', dataIndex: 'name', key: 'name' },
                    { title: 'Tipo', dataIndex: 'kind', key: 'kind' },
                    { title: 'Capacidad', dataIndex: 'capacity', key: 'capacity' },
                    { title: 'Precio ($)', key: 'price', render: (_, r) => (r.price_cents ? (r.price_cents/100).toLocaleString() : '-') },
                    { title: 'Disponibles', dataIndex: 'available_seats', key: 'available_seats' },
                    { title: 'Vendidos', dataIndex: 'sold_seats', key: 'sold_seats' },
                  ]}
                  dataSource={showSections}
                />
              ) : (
                <Text type="secondary">No hay secciones cargadas para este show.</Text>
              )
            ) : (
              <Text type="secondary">Seleccioná un show para ver sus secciones.</Text>
            )}
          </Card>
        </Space>
      </Modal>


      {/* Modal de Edición de Evento */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#667eea' }} />
            <span>Editar Evento</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
          setSelectedEvent(null);
        }}
        footer={null}
        width={700}
        centered
        destroyOnClose
      >
        {editModalOpen && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateEvent}
          >
            <Form.Item
              label="Nombre del Evento"
              name="name"
              rules={[{ required: true, message: 'Ingrese el nombre del evento' }]}
            >
              <Input placeholder="Nombre del evento" />
            </Form.Item>

            <Form.Item
              label="Descripción"
              name="description"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Descripción del evento"
              />
            </Form.Item>

            <Form.Item
              label="Estado"
              name="status"
              rules={[{ required: true, message: 'Seleccione el estado' }]}
            >
              <Select placeholder="Seleccionar estado">
                <Option value="DRAFT">Borrador</Option>
                <Option value="PUBLISHED">Publicado</Option>
                <Option value="CANCELLED">Cancelado</Option>
                <Option value="COMPLETED">Completado</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setEditModalOpen(false);
                  editForm.resetFields();
                  setSelectedEvent(null);
                }}>
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Guardar Cambios
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal de Visualización de Evento */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#667eea' }} />
            <span>Detalles del Evento</span>
          </div>
        }
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setSelectedEvent(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalOpen(false);
            setSelectedEvent(null);
          }}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setViewModalOpen(false);
              handleEditEvent(selectedEvent);
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Editar
          </Button>
        ]}
        width={900}
        centered
      >
        {selectedEvent && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Nombre</Text>
                      <Title level={4} style={{ margin: '4px 0' }}>{selectedEvent.name}</Title>
                    </div>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    {selectedEvent.image_url && (
                      <>
                        <div>
                          <Text type="secondary">Imagen</Text>
                          <div style={{ marginTop: 8 }}>
                            <img 
                              src={getImageUrl(selectedEvent.image_url, selectedEvent.name)}
                              alt={selectedEvent.name}
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: 300, 
                                borderRadius: 8,
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                      </>
                    )}

                    <div>
                      <Text type="secondary">Descripción</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text>{selectedEvent.description || 'Sin descripción'}</Text>
                      </div>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">Venue</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{selectedEvent.venue_name || 'Sin venue'}</Text>
                          {selectedEvent.venue_city && (
                            <>
                              <br />
                              <Text type="secondary">{selectedEvent.venue_city}</Text>
                            </>
                          )}
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Próxima Función</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text>
                            {selectedEvent.next_show_date 
                              ? format(new Date(selectedEvent.next_show_date), "dd 'de' MMMM 'de' yyyy", { locale: es })
                              : 'Sin fecha'}
                          </Text>
                        </div>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={16}>
                      <Col span={8}>
                        <Text type="secondary">Shows</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                            {selectedEvent.show_count || 0} shows
                          </Tag>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary">Estado</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={selectedEvent.status === 'PUBLISHED' ? 'green' : 'default'}>
                            {selectedEvent.status || 'PUBLISHED'}
                          </Tag>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary">ID</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text code>{selectedEvent.id}</Text>
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>

              {/* Mapa de Google Maps si tiene venue con coordenadas */}
              {mapsLoaded && selectedEvent.venue_name && (selectedEvent.venue_latitude || selectedEvent.venue_longitude) && (
                <Col span={24}>
                  <VenueMap 
                    venue={{
                      name: selectedEvent.venue_name,
                      address: selectedEvent.venue_address || `${selectedEvent.venue_name}, ${selectedEvent.venue_city || 'Argentina'}`,
                      latitude: selectedEvent.venue_latitude,
                      longitude: selectedEvent.venue_longitude
                    }}
                    height={300}
                    showDirections={true}
                  />
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Modal de Gestión de Imágenes */}
      <Modal
        title={
          <Space>
            <UploadOutlined style={{ color: '#52c41a' }} />
            <span>📸 Gestionar Imágenes del Evento</span>
          </Space>
        }
        open={imagesModalOpen}
        onCancel={() => {
          setImagesModalOpen(false);
          setSelectedEventForImages(null);
        }}
        footer={[
          <Button 
            key="save-styles"
            type="primary"
            onClick={handleSaveStyles}
            loading={savingStyles}
            style={{ marginRight: 'auto' }}
          >
            💾 Guardar Estilos
          </Button>,
          <Button 
            key="close" 
            onClick={() => {
              setImagesModalOpen(false);
              setSelectedEventForImages(null);
              setEventStyles({});
              // Refrescar lista de eventos para mostrar las nuevas imágenes
              refetch();
            }}
          >
            Cerrar
          </Button>
        ]}
        width={1200}
        centered
      >
        {selectedEventForImages && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 8 }}>
              <Text strong style={{ fontSize: '1.1rem' }}>
                {selectedEventForImages.name}
              </Text>
              <br />
              <Text type="secondary">
                ID: {selectedEventForImages.id} | Evento: {selectedEventForImages.venue_name || 'Sin venue'}
              </Text>
            </div>
            
            {/* Editor de Imágenes */}
            <EventImageUpload 
              eventId={selectedEventForImages.id}
              showExisting={true}
              allowUpload={true}
            />
            
            <Divider style={{ margin: '32px 0' }} />
            
            {/* Editor de Estilos Visuales */}
            <EventStyleEditor
              initialStyles={eventStyles}
              onChange={(newStyles) => setEventStyles(newStyles)}
              showPreview={true}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
}

// Shows Admin
function ShowsAdmin() {
  const [shows, setShows] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showSections, setShowSections] = useState([]);
  const [form] = Form.useForm();
  
  // Estados para editar venue
  const [editVenueOpen, setEditVenueOpen] = useState(false);
  const [editVenueLoading, setEditVenueLoading] = useState(false);
  const [editVenueForm] = Form.useForm();
  
  // Estados para editar y ver show
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  
  // Estados para editar sección
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [editSectionLoading, setEditSectionLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editSectionForm] = Form.useForm();
  
  // Cargar venues para el selector
  const { venues, loading: venuesLoading, refetch: refetchVenues } = useVenues({ 
    limit: 100, 
    sortBy: 'name', 
    sortOrder: 'ASC' 
  });

  // Hook de Google Maps
  const { isLoaded: mapsLoaded } = useGoogleMaps();

  // Debug: Log venues cuando cambien
  useEffect(() => {
    }, [venues, venuesLoading]);

  const loadAllShows = async () => {
    try {
      setLoading(true);
      setError(null);
      // Cargar todos los shows y eventos para hacer el join
      const [showsResponse, eventsResponse] = await Promise.all([
        showsApi.listShows({}),
        eventsApi.getEvents({ limit: 100 })
      ]);
      
      const showsList = Array.isArray(showsResponse) 
        ? showsResponse 
        : (showsResponse?.shows || showsResponse?.data || []);
      
      const eventsList = Array.isArray(eventsResponse)
        ? eventsResponse
        : (eventsResponse?.events || eventsResponse?.data || []);
      
      // Enriquecer shows con información del evento y calcular asientos disponibles
      const enrichedShowsPromises = showsList.map(async (show) => {
        const event = eventsList.find(e => e.id === (show.eventId || show.event_id));
        
        // Cargar secciones del show para calcular asientos disponibles
        let availableSeats = 0;
        try {
          const sectionsResponse = await showsApi.getShowSections(show.id);
          const sections = Array.isArray(sectionsResponse) 
            ? sectionsResponse 
            : (sectionsResponse?.sections || []);
          
          // Sumar los asientos disponibles de todas las secciones
          availableSeats = sections.reduce((sum, section) => {
            return sum + (section.available_seats || 0);
          }, 0);
        } catch (err) {
          // Si falla, dejar en 0
          availableSeats = 0;
        }
        
        return {
          ...show,
          event_name: event?.name || `Evento #${show.eventId || show.event_id}`,
          venue_name: event?.venue_name || show.venue_name || 'Sin venue',
          venue_city: event?.venue_city || show.venue_city,
          venue_id: event?.venue_id || event?.venueId || show.venue_id || show.venueId,
          available_seats: availableSeats
        };
      });
      
      // Esperar a que todos los shows se enriquezcan con sus secciones
      const enrichedShows = await Promise.all(enrichedShowsPromises);
      
      setShows(enrichedShows);
      setEvents(eventsList);
    } catch (err) {
      setError(err.message || 'Error al cargar shows');
      message.error('Error al cargar shows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllShows();
  }, []);

  // Handlers de Ver, Editar y Eliminar
  const handleViewShow = (show) => {
    setSelectedShow(show);
    setViewModalOpen(true);
  };

  const handleEditShow = (show) => {
    setSelectedShow(show);
    
    // Convertir la fecha a objeto dayjs para el DatePicker de Ant Design v5
    let startsAtValue = null;
    if (show.starts_at || show.startsAt) {
      try {
        const dateStr = show.starts_at || show.startsAt;
        startsAtValue = dayjs(dateStr);
      } catch (e) {
      }
    }
    
    editForm.setFieldsValue({
      startsAt: startsAtValue,
      status: show.status || 'PUBLISHED',
      venueId: show.venue_id
    });
    setEditModalOpen(true);
  };

  const handleUpdateShow = async (values) => {
    try {
      const updateData = {
        status: values.status
      };

      // Solo incluir startsAt si cambió
      if (values.startsAt) {
        // Convertir a ISO string - compatible con Date y dayjs
        const dateValue = values.startsAt.toDate ? values.startsAt.toDate() : values.startsAt;
        updateData.startsAt = dateValue instanceof Date ? dateValue.toISOString() : new Date(dateValue).toISOString();
      }

      // Solo incluir venueId si cambió
      if (values.venueId) {
        updateData.venueId = Number(values.venueId);
      }

      await showsApi.updateShow(selectedShow.id, updateData);
      
      message.success('Show actualizado correctamente');
      setEditModalOpen(false);
      editForm.resetFields();
      setSelectedShow(null);
      
      // Refrescar lista
      await loadAllShows();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error al actualizar el show';
      message.error(errorMsg);
    }
  };

  const handleDeleteShow = async (showId) => {
    // Usar window.confirm como fallback
    const confirmado = window.confirm(
      '¿Estás seguro de eliminar este show?\n\n' +
      'Esta acción no se puede deshacer.\n' +
      'No se puede eliminar si hay tickets vendidos.\n\n' +
      '⚠️ Requiere rol ADMIN'
    );
    
    if (!confirmado) {
      return;
    }
    
    try {
      
      const response = await showsApi.deleteShow(showId);
      message.success('Show eliminado correctamente');
      await loadAllShows();
    } catch (error) {
      
      let errorMsg = 'Error al eliminar el show';
      
      if (error.response?.status === 403) {
        errorMsg = `No tienes permisos para eliminar shows. Solo ADMIN puede eliminar.`;
      } else if (error.response?.status === 409) {
        errorMsg = 'No se puede eliminar el show porque tiene tickets vendidos.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg, 5);
    }
  };

  const openAssignSections = async (show) => {
    setSelectedShow(show);
    setAssignOpen(true);
    form.resetFields();
    
    // Cargar secciones existentes del show
    try {
      const res = await showsApi.getShowSections(show.id);
      const list = Array.isArray(res) ? res : (res?.sections || []);
      setShowSections(list);
      } catch (err) {
      setShowSections([]);
    }
  };

  const submitAssignSections = async () => {
    try {
      const values = await form.validateFields();
      const sections = values.sections || [];
      
      if (sections.length === 0) {
        message.warning('Agregá al menos una sección');
        return;
      }

      // Validar capacidad total
      const totalCapacity = sections.reduce((sum, s) => sum + Number(s.capacity || 0), 0);
      const venueCapacity = selectedShow.venue_capacity || selectedShow.max_capacity;
      
      if (venueCapacity && totalCapacity > venueCapacity) {
        message.error(
          `La capacidad total de las secciones (${totalCapacity.toLocaleString()}) excede la capacidad del venue (${venueCapacity.toLocaleString()}). Por favor, reducí la capacidad de las secciones.`
        );
        return;
      }
      
      if (!venueCapacity) {
        }

      setAssignLoading(true);
      
      let createdCount = 0;
      for (const section of sections) {
        const sectionData = {
          name: section.name,
          kind: section.kind || 'GA',
          capacity: Number(section.capacity),
          priceCents: Math.round(Number(section.price) * 100)
        };
        
        try {
          await showsApi.createSection(selectedShow.id, sectionData);
          createdCount++;
          } catch (err) {
          
          // Manejo específico de errores
          let errorMessage = err.message || 'Error desconocido';
          
          if (errorMessage.includes('VenueCapacityExceeded')) {
            errorMessage = `La capacidad total de las secciones excede la capacidad máxima del venue (${venueCapacity?.toLocaleString() || 'N/A'})`;
          } else if (errorMessage.includes('DuplicateSectionName')) {
            errorMessage = `Ya existe una sección con el nombre "${section.name}"`;
          } else if (errorMessage.includes('InvalidCapacity')) {
            errorMessage = `La capacidad de la sección "${section.name}" no es válida`;
          }
          
          throw new Error(errorMessage);
        }
      }

      message.success(`${createdCount} sección(es) creada(s) correctamente`);
      setAssignOpen(false);
      form.resetFields();
      
      // Refrescar secciones
      const res = await showsApi.getShowSections(selectedShow.id);
      const list = Array.isArray(res) ? res : (res?.sections || []);
      setShowSections(list);
      
      // Refrescar lista de shows
      loadAllShows();
    } catch (e) {
      console.error('❌ Error al asignar secciones:', e);
      if (e?.errorFields) return;
      const errorMsg = e.response?.data?.message || e.message || 'Error al asignar secciones';
      message.error(errorMsg);
    } finally {
      setAssignLoading(false);
    }
  };

  const openEditVenue = async (show) => {
    setSelectedShow(show);
    setEditVenueOpen(true);
    
    // Refrescar venues para asegurar que estén cargados
    await refetchVenues();
    // Buscar el evento para obtener el venue_id actual
    const event = events.find(e => e.id === (show.eventId || show.event_id));
    
    editVenueForm.setFieldsValue({
      venue_id: event?.venue_id || event?.venueId || null
    });
  };

  const submitEditVenue = async () => {
    try {
      const values = await editVenueForm.validateFields();
      
      if (!values.venue_id) {
        message.warning('Seleccioná un venue');
        return;
      }

      setEditVenueLoading(true);
      
      // Buscar el evento asociado al show
      const event = events.find(e => e.id === (selectedShow.eventId || selectedShow.event_id));
      
      if (!event) {
        message.error('No se encontró el evento asociado al show');
        return;
      }

      // Actualizar el evento con el nuevo venue_id
      await eventsApi.updateEvent(event.id, {
        venue_id: Number(values.venue_id)
      });

      message.success('Venue actualizado correctamente');
      setEditVenueOpen(false);
      editVenueForm.resetFields();
      
      // Refrescar lista de shows
      loadAllShows();
    } catch (e) {
      if (e?.errorFields) return;
      const errorMsg = e.response?.data?.message || e.message || 'Error al actualizar venue';
      message.error(errorMsg);
    } finally {
      setEditVenueLoading(false);
    }
  };

  // Handler para editar sección
  const handleEditSection = (section) => {
    setSelectedSection(section);
    editSectionForm.setFieldsValue({
      name: section.name,
      kind: section.kind,
      capacity: section.capacity,
      price: section.price_cents / 100 // Convertir de centavos a pesos
    });
    setEditSectionOpen(true);
  };

  const submitEditSection = async () => {
    try {
      const values = await editSectionForm.validateFields();
      setEditSectionLoading(true);
      
      const sectionData = {
        name: values.name,
        kind: values.kind,
        capacity: Number(values.capacity),
        priceCents: Math.round(Number(values.price) * 100)
      };
      
      await showsApi.updateSection(selectedShow.id, selectedSection.id, sectionData);
      
      message.success('Sección actualizada correctamente');
      setEditSectionOpen(false);
      editSectionForm.resetFields();
      setSelectedSection(null);
      
      // Refrescar secciones
      const res = await showsApi.getShowSections(selectedShow.id);
      const list = Array.isArray(res) ? res : (res?.sections || []);
      setShowSections(list);
      
      // Refrescar lista de shows
      loadAllShows();
    } catch (e) {
      if (e?.errorFields) return;
      const errorMsg = e.response?.data?.message || e.message || 'Error al actualizar sección';
      message.error(errorMsg);
    } finally {
      setEditSectionLoading(false);
    }
  };

  // Handler para eliminar sección
  const handleDeleteSection = async (section) => {
    const confirmado = window.confirm(
      `¿Estás seguro de eliminar la sección "${section.name}"?\n\n` +
      'Esta acción no se puede deshacer.\n' +
      'Los asientos asociados serán eliminados.\n\n' +
      '⚠️ Requiere rol ADMIN'
    );
    if (!confirmado) return;
    
    try {
      await showsApi.deleteSection(selectedShow.id, section.id);
      
      message.success('Sección eliminada correctamente');
      
      // Refrescar secciones
      const res = await showsApi.getShowSections(selectedShow.id);
      const list = Array.isArray(res) ? res : (res?.sections || []);
      setShowSections(list);
      
      // Refrescar lista de shows
      loadAllShows();
    } catch (error) {
      
      let errorMsg = 'Error al eliminar la sección';
      
      if (error.response?.status === 403) {
        errorMsg = 'No tienes permisos para eliminar secciones. Solo ADMIN puede eliminar.';
      } else if (error.response?.status === 409) {
        errorMsg = 'No se puede eliminar la sección porque tiene tickets vendidos.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg, 5);
    }
  };

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80 
    },
    { 
      title: 'Evento', 
      dataIndex: 'event_name', 
      key: 'event_name',
      render: (text, record) => text || `Evento #${record.eventId || record.event_id || 'N/A'}`
    },
    { 
      title: 'Fecha', 
      key: 'date',
      render: (_, record) => {
        const date = record.startsAt || record.starts_at;
        if (!date) return 'Sin fecha';
        try {
          return format(new Date(date), 'dd MMM yyyy', { locale: es });
        } catch {
          return 'Fecha inválida';
        }
      }
    },
    { 
      title: 'Hora', 
      key: 'time',
      render: (_, record) => {
        const date = record.startsAt || record.starts_at;
        if (!date) return 'Sin hora';
        try {
          return format(new Date(date), 'HH:mm', { locale: es });
        } catch {
          return 'Hora inválida';
        }
      }
    },
    { 
      title: 'Venue', 
      key: 'venue',
      render: (_, record) => {
        if (!record.venue_name) {
          return <Tag color="red">Sin venue</Tag>;
        }
        return (
          <div>
            <Text strong>{record.venue_name}</Text>
            {record.venue_city && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                  📍 {record.venue_city}
                </Text>
              </>
            )}
          </div>
        );
      }
    },
    { 
      title: 'Disponibles', 
      dataIndex: 'available_seats', 
      key: 'available_seats',
      render: (seats) => (
        <Tag color={seats > 50 ? 'green' : seats > 0 ? 'orange' : 'red'}>
          {seats || 0} entradas
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 400,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewShow(record)}
              title="Ver detalles"
            />
            <Button 
              icon={<EditOutlined />} 
              size="small"
              type="primary"
              onClick={() => handleEditShow(record)}
              title="Editar show"
            />
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={() => handleDeleteShow(record.id)}
              title="Eliminar show"
            />
          </Space>
          <Space style={{ width: '100%' }}>
            <Button 
              icon={<EnvironmentOutlined />} 
              size="small"
              onClick={() => openEditVenue(record)}
              title="Cambiar venue"
            >
              Venue
            </Button>
            <Button 
              icon={<PlusOutlined />} 
              size="small" 
              type="primary"
              onClick={() => openAssignSections(record)}
              title="Asignar secciones"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              Secciones
            </Button>
          </Space>
        </Space>
      ),
    },
  ];
  
  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4}>Gestión de Shows</Title>
        <Space>
          <Button 
            icon={<PlusOutlined />} 
            type="primary"
            onClick={() => message.info('Crear shows desde la sección de Eventos')}
          >
            Nuevo Show
          </Button>
          <Button onClick={loadAllShows}>Refrescar</Button>
        </Space>
      </div>
      
      {error && (
        <div style={{ 
          marginBottom: 16,
          padding: '12px',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px'
        }}>
          <Text type="danger">Error: {error}</Text>
        </div>
      )}
      
      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={shows}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} shows`
        }}
      />

      {/* Modal Asignar Secciones */}
      <Modal
        title={selectedShow ? `Asignar Secciones • ${selectedShow.event_name}` : 'Asignar Secciones'}
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={submitAssignSections}
        okText="Guardar"
        confirmLoading={assignLoading}
        width={720}
      >
        {selectedShow && (
          <>
            <div style={{ 
              background: '#f0f5ff', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 16,
              border: '1px solid #d6e4ff'
            }}>
              <Text style={{ fontSize: 13 }}>
                <strong>Show:</strong> {selectedShow.event_name}
                <br />
                <strong>Fecha:</strong> {selectedShow.startsAt ? format(new Date(selectedShow.startsAt), "dd 'de' MMMM 'de' yyyy HH:mm", { locale: es }) : 'N/A'}
                <br />
                <strong>Venue:</strong> {selectedShow.venue_name}
                {(selectedShow.venue_capacity || selectedShow.max_capacity) && (
                  <>
                    <br />
                    <strong>Capacidad máxima del venue:</strong> {(selectedShow.venue_capacity || selectedShow.max_capacity).toLocaleString()} personas
                  </>
                )}
              </Text>
            </div>

            {/* Indicador de capacidad */}
            <Form.Item noStyle shouldUpdate>
              {() => {
                const sections = form.getFieldValue('sections') || [];
                const totalCapacity = sections.reduce((sum, s) => sum + Number(s?.capacity || 0), 0);
                const venueCapacity = selectedShow.venue_capacity || selectedShow.max_capacity || 0;
                const percentage = venueCapacity > 0 ? (totalCapacity / venueCapacity) * 100 : 0;
                const isOverCapacity = venueCapacity > 0 && totalCapacity > venueCapacity;

                // Indicador visual basado en isOverCapacity (no se actualiza estado acá)

                return totalCapacity > 0 ? (
                  <div style={{ 
                    background: isOverCapacity ? '#fff2e8' : '#f6ffed', 
                    padding: 12, 
                    borderRadius: 8, 
                    marginBottom: 16,
                    border: `1px solid ${isOverCapacity ? '#ffbb96' : '#b7eb8f'}`
                  }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: isOverCapacity ? '#d4380d' : '#52c41a' }}>
                        Capacidad total: {totalCapacity.toLocaleString()} / {venueCapacity.toLocaleString()} 
                        ({percentage.toFixed(1)}%)
                      </Text>
                    </div>
                    <div style={{ 
                      background: '#fff', 
                      height: 20, 
                      borderRadius: 10, 
                      overflow: 'hidden',
                      border: '1px solid #d9d9d9'
                    }}>
                      <div style={{ 
                        width: `${Math.min(percentage, 100)}%`, 
                        height: '100%', 
                        background: isOverCapacity 
                          ? 'linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%)'
                          : 'linear-gradient(90deg, #52c41a 0%, #95de64 100%)',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    {isOverCapacity && (
                      <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        ADVERTENCIA: La capacidad excede el límite del venue. Reducí la capacidad de las secciones.
                      </Text>
                    )}
                  </div>
                ) : null;
              }}
            </Form.Item>
          </>
        )}

        {showSections.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Secciones existentes:</Text>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={showSections}
              columns={[
                { 
                  title: 'Nombre', 
                  dataIndex: 'name', 
                  key: 'name',
                  render: (text) => <Text strong>{text}</Text>
                },
                { 
                  title: 'Tipo', 
                  dataIndex: 'kind', 
                  key: 'kind',
                  width: 120,
                  render: (kind) => (
                    <Tag color={kind === 'GA' ? 'green' : 'blue'}>
                      {kind === 'GA' ? '🎫 General' : '🪑 Numerada'}
                    </Tag>
                  ),
                },
                { 
                  title: 'Precio', 
                  key: 'price',
                  width: 120,
                  render: (_, record) => (
                    <Text strong>${(record.price_cents / 100).toLocaleString()}</Text>
                  ),
                },
                { 
                  title: 'Capacidad', 
                  dataIndex: 'capacity', 
                  key: 'capacity',
                  width: 100,
                  render: (cap) => <Text>{cap.toLocaleString()}</Text>
                },
                { 
                  title: 'Disponibles', 
                  dataIndex: 'available_seats', 
                  key: 'available_seats',
                  width: 100,
                  render: (seats) => (
                    <Tag color={seats > 50 ? 'green' : seats > 0 ? 'orange' : 'red'}>
                      {seats || 0}
                    </Tag>
                  ),
                },
                {
                  title: 'Acciones',
                  key: 'actions',
                  width: 120,
                  render: (_, section) => (
                    <Space size="small">
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        type="primary"
                        onClick={() => handleEditSection(section)}
                        title="Editar sección"
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDeleteSection(section)}
                        title="Eliminar sección"
                      />
                    </Space>
                  ),
                }
              ]}
            />
          </div>
        )}

        <Form layout="vertical" form={form}>
          <Form.List name="sections">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Nombre de la sección"
                          rules={[{ required: true, message: 'Requerido' }]}
                        >
                          <Input placeholder="Ej: Platea, Campo, Pullman" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'kind']}
                          label="Tipo"
                          rules={[{ required: true, message: 'Requerido' }]}
                        >
                          <Select placeholder="Seleccionar tipo">
                            <Option value="SEATED">🪑 Numerada</Option>
                            <Option value="GA">🎫 General</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label="Precio ($)"
                          rules={[{ required: true, message: 'Requerido' }]}
                        >
                          <Input type="number" placeholder="15000" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'capacity']}
                          label="Capacidad"
                          rules={[{ required: true, message: 'Requerido' }]}
                        >
                          <Input type="number" placeholder="100" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label=" ">
                          <Button danger onClick={() => remove(name)} block>
                            Eliminar
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Agregar Sección
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Modal Editar Venue */}
      <Modal
        title={selectedShow ? `Cambiar Venue • ${selectedShow.event_name}` : 'Cambiar Venue'}
        open={editVenueOpen}
        onCancel={() => setEditVenueOpen(false)}
        onOk={submitEditVenue}
        okText="Guardar"
        confirmLoading={editVenueLoading}
        width={600}
      >
        {selectedShow && (
          <div style={{ 
            background: '#fff7e6', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid #ffd591'
          }}>
            <Text style={{ fontSize: 13 }}>
              <strong>Show:</strong> {selectedShow.event_name}
              <br />
              <strong>Fecha:</strong> {selectedShow.startsAt ? format(new Date(selectedShow.startsAt), "dd 'de' MMMM 'de' yyyy HH:mm", { locale: es }) : 'N/A'}
              <br />
              <strong>Venue actual:</strong> {selectedShow.venue_name || 'Sin venue'}
            </Text>
          </div>
        )}

        <Form layout="vertical" form={editVenueForm}>
          <Form.Item
            name="venue_id"
            label="Seleccionar nuevo venue"
            rules={[{ required: true, message: 'Seleccioná un venue' }]}
          >
            <Select
              placeholder={venuesLoading ? "Cargando venues..." : "Seleccionar venue"}
              showSearch
              loading={venuesLoading}
              disabled={venuesLoading}
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={venuesLoading ? "Cargando..." : "No hay venues disponibles"}
            >
              {venues && venues.length > 0 ? (
                venues.map(venue => (
                  <Option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.city || 'Sin ciudad'} ({venue.max_capacity?.toLocaleString()} personas)
                  </Option>
                ))
              ) : (
                !venuesLoading && (
                  <Option disabled value="">
                    No hay venues disponibles
                  </Option>
                )
              )}
            </Select>
          </Form.Item>
          
          {/* Debug info */}
          {!venuesLoading && venues.length === 0 && (
            <div style={{ 
              background: '#fff2f0', 
              padding: 12, 
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #ffccc7'
            }}>
              <Text type="danger" style={{ fontSize: 12 }}>
                ⚠️ No se encontraron venues. Asegurate de tener venues creados en la base de datos.
              </Text>
            </div>
          )}

          <div style={{ 
            background: '#e6f7ff', 
            padding: 12, 
            borderRadius: 8,
            border: '1px solid #91d5ff'
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ℹ️ <strong>Nota:</strong> Al cambiar el venue del evento, todos los shows asociados heredarán el nuevo venue.
            </Text>
          </div>
        </Form>
      </Modal>

      {/* Modal de Edición de Show */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#667eea' }} />
            <span>Editar Show</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
          setSelectedShow(null);
        }}
        footer={null}
        width={700}
        centered
        destroyOnClose
      >
        {editModalOpen && selectedShow && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateShow}
          >
            <Form.Item
              label="Fecha y Hora"
              name="startsAt"
              rules={[{ required: true, message: 'Seleccione fecha y hora' }]}
            >
              <DatePicker 
                showTime 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY HH:mm"
                placeholder="Seleccionar fecha y hora"
              />
            </Form.Item>

            <Form.Item
              label="Estado"
              name="status"
              rules={[{ required: true, message: 'Seleccione el estado' }]}
            >
              <Select placeholder="Seleccionar estado">
                <Option value="DRAFT">Borrador</Option>
                <Option value="PUBLISHED">Publicado</Option>
                <Option value="CANCELLED">Cancelado</Option>
                <Option value="COMPLETED">Completado</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Venue (Opcional)"
              name="venueId"
              tooltip="Cambiar el venue del show"
            >
              <Select 
                placeholder="Seleccionar venue"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {venues.map(v => (
                  <Option key={v.id} value={v.id}>
                    {v.name} - {v.city}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ 
              background: '#f0f5ff', 
              padding: 12, 
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #adc6ff'
            }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ℹ️ <strong>Evento:</strong> {selectedShow.event_name}
              </Text>
            </div>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setEditModalOpen(false);
                  editForm.resetFields();
                  setSelectedShow(null);
                }}>
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Guardar Cambios
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal de Visualización de Show */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#667eea' }} />
            <span>Detalles del Show</span>
          </div>
        }
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setSelectedShow(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalOpen(false);
            setSelectedShow(null);
          }}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setViewModalOpen(false);
              handleEditShow(selectedShow);
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Editar
          </Button>
        ]}
        width={900}
        centered
      >
        {selectedShow && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Evento</Text>
                      <Title level={4} style={{ margin: '4px 0' }}>{selectedShow.event_name}</Title>
                    </div>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">Fecha y Hora</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>
                            {selectedShow.starts_at 
                              ? format(new Date(selectedShow.starts_at), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
                              : 'Sin fecha'}
                          </Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Estado</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={selectedShow.status === 'PUBLISHED' ? 'green' : 'default'}>
                            {selectedShow.status || 'PUBLISHED'}
                          </Tag>
                        </div>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">Venue</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{selectedShow.venue_name || 'Sin venue'}</Text>
                          {selectedShow.venue_city && (
                            <>
                              <br />
                              <Text type="secondary">📍 {selectedShow.venue_city}</Text>
                            </>
                          )}
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Entradas Disponibles</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={selectedShow.available_seats > 50 ? 'green' : selectedShow.available_seats > 0 ? 'orange' : 'red'} style={{ fontSize: 14, padding: '4px 12px' }}>
                            {selectedShow.available_seats || 0} entradas
                          </Tag>
                        </div>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">ID del Show</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text code>{selectedShow.id}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">ID del Evento</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text code>{selectedShow.eventId || selectedShow.event_id}</Text>
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>

              {/* Mapa de Google Maps si tiene venue con coordenadas */}
              {mapsLoaded && selectedShow.venue_name && (selectedShow.venue_latitude || selectedShow.venue_longitude) && (
                <Col span={24}>
                  <VenueMap 
                    venue={{
                      name: selectedShow.venue_name,
                      address: selectedShow.venue_address || `${selectedShow.venue_name}, ${selectedShow.venue_city || 'Argentina'}`,
                      latitude: selectedShow.venue_latitude,
                      longitude: selectedShow.venue_longitude
                    }}
                    height={300}
                    showDirections={true}
                  />
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Modal Editar Sección */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#667eea' }} />
            <span>Editar Sección</span>
          </div>
        }
        open={editSectionOpen}
        onCancel={() => {
          setEditSectionOpen(false);
          editSectionForm.resetFields();
          setSelectedSection(null);
        }}
        onOk={submitEditSection}
        okText="Guardar Cambios"
        confirmLoading={editSectionLoading}
        width={600}
      >
        {selectedSection && (
          <div>
            <div style={{ 
              background: '#f0f5ff', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 16,
              border: '1px solid #d6e4ff'
            }}>
              <Text style={{ fontSize: 13 }}>
                <strong>Show:</strong> {selectedShow?.event_name}
                <br />
                <strong>Sección original:</strong> {selectedSection.name}
              </Text>
            </div>

            <Form layout="vertical" form={editSectionForm}>
              <Form.Item
                name="name"
                label="Nombre de la sección"
                rules={[{ required: true, message: 'Ingresá un nombre' }]}
              >
                <Input placeholder="Ej: Platea Alta, Campo VIP" />
              </Form.Item>

              <Form.Item
                name="kind"
                label="Tipo"
                rules={[{ required: true, message: 'Seleccioná el tipo' }]}
              >
                <Select>
                  <Option value="GA">🎫 General (sin asientos numerados)</Option>
                  <Option value="SEATED">🪑 Numerada (con asientos numerados)</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Precio ($)"
                    rules={[{ required: true, message: 'Ingresá un precio' }]}
                  >
                    <Input 
                      type="number" 
                      min={0} 
                      step={1} 
                      placeholder="15000"
                      prefix="$"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="capacity"
                    label="Capacidad"
                    rules={[{ required: true, message: 'Ingresá capacidad' }]}
                  >
                    <Input 
                      type="number" 
                      min={1} 
                      step={1} 
                      placeholder="100"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ 
                background: '#fff7e6', 
                padding: 12, 
                borderRadius: 8,
                border: '1px solid #ffd591'
              }}>
                <Text type="warning" style={{ fontSize: 12 }}>
                  ⚠️ <strong>Importante:</strong> Al cambiar la capacidad, se ajustarán los asientos disponibles. 
                  No se puede reducir por debajo de los asientos ya vendidos.
                </Text>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
}

// Venues Admin
function VenuesAdmin() {
  const [open, setOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [editForm] = Form.useForm();
  
  // Usar el hook useVenues para obtener datos reales
  const { venues, loading, error, deleteVenue, loadVenues, refetch } = useVenues({
    limit: 100,
    sortBy: 'name',
    sortOrder: 'ASC'
  });

  // Hook de Google Maps
  const { isLoaded: mapsLoaded } = useGoogleMaps();

  // Debug: Log venues cuando cambien
  useEffect(() => {
    }, [venues, loading, error]);

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80
    },
    { 
      title: 'Nombre', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>
            {record.address || 'Sin dirección'}
          </Text>
        </div>
      ),
    },
    { 
      title: 'Ciudad', 
      dataIndex: 'city', 
      key: 'city'
    },
    { 
      title: 'Capacidad', 
      dataIndex: 'max_capacity', 
      key: 'max_capacity',
      render: (capacity) => (
        <Tag color="blue">
          {capacity ? capacity.toLocaleString() : 'N/A'} personas
        </Tag>
      ),
    },
    { 
      title: 'Contacto', 
      key: 'contact',
      render: (_, record) => (
        <div>
          {record.phone && (
            <>
              <Text>📞 {record.phone}</Text>
              <br />
            </>
          )}
          {record.email && (
            <Text type="secondary">📧 {record.email}</Text>
          )}
          {!record.phone && !record.email && (
            <Text type="secondary">Sin contacto</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewVenue(record)}
          />
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            type="primary"
            onClick={() => handleEditVenue(record)}
          />
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger 
            onClick={() => handleDeleteVenue(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleViewVenue = (venue) => {
    setSelectedVenue(venue);
    setViewModalOpen(true);
  };

  const handleEditVenue = (venue) => {
    setSelectedVenue(venue);
    editForm.setFieldsValue({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      max_capacity: venue.max_capacity,
      phone: venue.phone,
      email: venue.email,
      latitude: venue.latitude,
      longitude: venue.longitude
    });
    setEditModalOpen(true);
  };

  const handleUpdateVenue = async (values) => {
    try {
      const { venuesApi } = await import('../../services/apiService');
      
      await venuesApi.updateVenue(selectedVenue.id, values);
      
      message.success('Venue actualizado correctamente');
      setEditModalOpen(false);
      editForm.resetFields();
      setSelectedVenue(null);
      
      // Refrescar lista
      await refetch();
    } catch (error) {
      message.error('Error al actualizar el venue');
    }
  };

  const handleDeleteVenue = (venueId) => {
    const { confirm } = Modal;
    confirm({
      title: '¿Estás seguro de eliminar este venue?',
      content: 'Esta acción no se puede deshacer. Todos los eventos asociados a este venue podrían verse afectados.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await deleteVenue(venueId);
          message.success('Venue eliminado correctamente');
          await refetch();
        } catch (error) {
          message.error('Error al eliminar el venue');
        }
      }
    });
  };

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4}>Gestión de Venues</Title>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setOpen(true)}>
            Nuevo Venue
          </Button>
          <Button onClick={refetch}>Refrescar</Button>
        </Space>
      </div>
      
      {error && (
        <div style={{ 
          marginBottom: 16,
          padding: '12px',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px'
        }}>
          <Text type="danger">Error: {error}</Text>
          <br />
          <Button 
            type="link" 
            onClick={refetch}
            style={{ marginTop: '8px' }}
          >
            Reintentar
          </Button>
        </div>
      )}
      
      {venues.length === 0 && !loading && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#fafafa',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            No hay venues creados. Hacé click en "Nuevo Venue" para crear uno.
          </Text>
        </div>
      )}
      
      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={venues}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} venues`
        }}
      />
      
      <Modal 
        title="Crear Nuevo Venue" 
        open={open} 
        onCancel={() => setOpen(false)} 
        footer={null}
        width={800}
        centered
      >
        <CreateVenue 
          onVenueCreated={(venue) => {
            setOpen(false);
            setSuccessModalOpen(true);
            // Recargar la lista de venues
            refetch();
          }}
        />
      </Modal>

      {/* Modal de Éxito */}
      <Modal
        open={successModalOpen}
        onCancel={() => setSuccessModalOpen(false)}
        footer={null}
        centered
        closable={false}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 16,
            animation: 'bounce 1s ease-in-out'
          }}>
            🏟️
          </div>
          <Title level={3} style={{ marginBottom: 16 }}>
            ¡Venue creado con éxito!
          </Title>
          <Button 
            type="primary"
            onClick={() => setSuccessModalOpen(false)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              height: 40,
              minWidth: 120
            }}
          >
            ¡Gracias!
          </Button>
        </div>
      </Modal>

      {/* Modal de Edición */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#667eea' }} />
            <span>Editar Venue</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
          setSelectedVenue(null);
        }}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        {editModalOpen && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateVenue}
          >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Nombre del Venue"
                name="name"
                rules={[{ required: true, message: 'Ingrese el nombre del venue' }]}
              >
                <Input placeholder="Teatro Colón" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ciudad"
                name="city"
                rules={[{ required: true, message: 'Ingrese la ciudad' }]}
              >
                <Input placeholder="Buenos Aires" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Dirección"
            name="address"
            rules={[{ required: true, message: 'Ingrese la dirección' }]}
          >
            <Input placeholder="Cerrito 628, CABA" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Capacidad Máxima"
                name="max_capacity"
                rules={[{ required: true, message: 'Ingrese la capacidad' }]}
              >
                <Input type="number" placeholder="2500" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Teléfono"
                name="phone"
              >
                <Input placeholder="+54 11 1234-5678" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Email inválido' }]}
              >
                <Input placeholder="contacto@venue.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Latitud"
                name="latitude"
                tooltip="Coordenada de latitud para Google Maps"
              >
                <Input type="number" step="0.000001" placeholder="-34.6037" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Longitud"
                name="longitude"
                tooltip="Coordenada de longitud para Google Maps"
              >
                <Input type="number" step="0.000001" placeholder="-58.3816" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setEditModalOpen(false);
                editForm.resetFields();
                setSelectedVenue(null);
              }}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Guardar Cambios
              </Button>
            </Space>
          </Form.Item>
        </Form>
        )}
      </Modal>

      {/* Modal de Visualización */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: '#667eea' }} />
            <span>Detalles del Venue</span>
          </div>
        }
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setSelectedVenue(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalOpen(false);
            setSelectedVenue(null);
          }}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setViewModalOpen(false);
              handleEditVenue(selectedVenue);
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Editar
          </Button>
        ]}
        width={900}
        centered
      >
        {selectedVenue && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Nombre</Text>
                      <Title level={4} style={{ margin: '4px 0' }}>{selectedVenue.name}</Title>
                    </div>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">Dirección</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{selectedVenue.address || 'No especificada'}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Ciudad</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{selectedVenue.city || 'No especificada'}</Text>
                        </div>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={16}>
                      <Col span={8}>
                        <Text type="secondary">Capacidad Máxima</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                            {selectedVenue.max_capacity?.toLocaleString() || 'N/A'} personas
                          </Tag>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary">Teléfono</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{selectedVenue.phone || 'No especificado'}</Text>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary">Email</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{selectedVenue.email || 'No especificado'}</Text>
                        </div>
                      </Col>
                    </Row>

                    {(selectedVenue.latitude || selectedVenue.longitude) && (
                      <>
                        <Divider style={{ margin: '8px 0' }} />
                        <Row gutter={16}>
                          <Col span={12}>
                            <Text type="secondary">Latitud</Text>
                            <div style={{ marginTop: 4 }}>
                              <Text code>{selectedVenue.latitude || 'N/A'}</Text>
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Longitud</Text>
                            <div style={{ marginTop: 4 }}>
                              <Text code>{selectedVenue.longitude || 'N/A'}</Text>
                            </div>
                          </Col>
                        </Row>
                      </>
                    )}

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">ID</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text code>{selectedVenue.id}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Creado</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text>{selectedVenue.createdAt ? new Date(selectedVenue.createdAt).toLocaleDateString('es-AR') : 'N/A'}</Text>
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>

              {/* Mapa de Google Maps */}
              {mapsLoaded && (selectedVenue.latitude || selectedVenue.longitude) && (
                <Col span={24}>
                  <VenueMap 
                    venue={{
                      name: selectedVenue.name,
                      address: selectedVenue.address || `${selectedVenue.name}, ${selectedVenue.city || 'Argentina'}`,
                      latitude: selectedVenue.latitude,
                      longitude: selectedVenue.longitude
                    }}
                    height={300}
                    showDirections={true}
                  />
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </Card>
  );
}

// Users Admin
function UsersAdmin() {
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: 'Usuario', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    { title: 'Tickets Comprados', dataIndex: 'tickets', key: 'tickets' },
    { title: 'Último Acceso', dataIndex: 'lastLogin', key: 'lastLogin' },
    { 
      title: 'Estado', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVO' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];
  
  const data = [
    { id: 1, name: 'Juan Pérez', email: 'juan@email.com', tickets: 5, lastLogin: '2024-11-01', status: 'ACTIVO' },
    { id: 2, name: 'María García', email: 'maria@email.com', tickets: 12, lastLogin: '2024-10-28', status: 'ACTIVO' },
  ];
  
  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>Gestión de Usuarios</Title>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} />
    </Card>
  );
}

// Health Content
function HealthContent() {
  return (
    <Card>
      <Title level={4}>Estado del Sistema</Title>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong>URL del Frontend: </Text>
          <Text code>http://localhost:5173</Text>
        </div>
        <div>
          <Text strong>URL del Backend: </Text>
          <Text code>{import.meta.env.VITE_API_URL || 'https://vibratickets.online'}</Text>
        </div>
        <div>
          <Text strong>Estado: </Text>
          <Text type="success">Sistema operativo</Text>
        </div>
      </Space>
    </Card>
  );
}

// Settings Admin
function SettingsAdmin() {
  return (
    <Card>
      <Title level={4}>Configuración del Sistema</Title>
      <Text>Configuraciones generales de la plataforma...</Text>
    </Card>
  );}
