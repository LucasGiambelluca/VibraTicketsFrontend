import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useLoginModal } from '../contexts/LoginModalContext';
import { useRegisterModal } from '../contexts/RegisterModalContext';
import logo from '../assets/VibraTicketLogo2.png';

const { Header } = Layout;

export default function HeaderNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin, isOrganizer } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { openRegisterModal } = useRegisterModal();

  const handleLogout = () => {
    logout();
    message.success('¡Hasta pronto!');
    navigate('/');
  };

  // Menú del usuario autenticado
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/profile')
    },
    {
      key: 'tickets',
      icon: <FileTextOutlined />,
      label: 'Mis Entradas',
      onClick: () => navigate('/mis-entradas')
    }
  ];

  // Agregar opción admin si el usuario es admin u organizador
  if (isAdmin || isOrganizer) {
    userMenuItems.push({
      key: 'admin',
      icon: <DashboardOutlined />,
      label: 'Panel Admin',
      onClick: () => navigate('/admin')
    });
  }

  // Agregar divider y logout
  userMenuItems.push(
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout
    }
  );

  // Items del menú principal
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Inicio</Link>
    },
    {
      key: '/events',
      icon: <CalendarOutlined />,
      label: <Link to="/events">Eventos</Link>
    }
  ];

  if (isAuthenticated) {
    menuItems.push({
      key: '/mis-entradas',
      icon: <FileTextOutlined />,
      label: <Link to="/mis-entradas">Mis Entradas</Link>
    });
  }

  if (isAdmin || isOrganizer) {
    menuItems.push({
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Admin</Link>
    });
  }

  return (
    <Header
      style={{
        position: 'fixed',
        zIndex: 1000,
        width: '100%',
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={logo}
            alt="VibraTicket"
            style={{
              height: 50,
              width: 'auto',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        </Link>
      </div>

      {/* Menú de navegación */}
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          marginLeft: 24
        }}
      />

      {/* Botones de usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isAuthenticated ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s'
            }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                }}
              />
              <span style={{ color: 'white', fontSize: 14 }}>
                {user?.name || user?.email?.split('@')[0] || 'Usuario'}
              </span>
            </div>
          </Dropdown>
        ) : (
          <>
            <Button
              type="default"
              icon={<LoginOutlined />}
              onClick={() => openLoginModal()}
              style={{
                borderColor: 'white',
                color: 'white',
                background: 'transparent'
              }}
            >
              Ingresar
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => openRegisterModal()}
              style={{
                background: 'white',
                color: '#764ba2',
                border: 'none',
                fontWeight: 600
              }}
            >
              Registrarse
            </Button>
          </>
        )}
      </div>
    </Header>
  );
}
