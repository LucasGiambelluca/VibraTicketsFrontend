import React, { useState } from "react";
import { Layout, Menu, Drawer, Button, Grid, Dropdown, Avatar, message } from "antd";
import { MenuOutlined, UserOutlined, LogoutOutlined, LoginOutlined, CreditCardOutlined, DownOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../src/hooks/useAuth";
import logo from "../src/assets/rsticketsLogo.png";

const { Header } = Layout;
const { useBreakpoint } = Grid;

export default function HeaderNav() {
  const [open, setOpen] = useState(false);
  const screens = useBreakpoint();
  const { user, logout, isAuthenticated, isAdmin, isOrganizer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) {
      logout();
      message.success('Sesión cerrada correctamente');
      navigate('/');
    }
  };

  const showAdminPanel = isAdmin || isOrganizer;
  const userIsAuthenticated = isAuthenticated;

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Mi Perfil', onClick: () => navigate('/profile') },
    { key: 'tickets', icon: <CreditCardOutlined />, label: 'Mis Entradas', onClick: () => navigate('/mis-entradas') },
    ...(showAdminPanel ? [{ key: 'admin', icon: <UserOutlined />, label: 'Panel Admin', onClick: () => navigate('/admin') }] : []),
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', onClick: handleLogout, danger: true }
  ];

  const menuItems = [
    { key: "1", label: <Link to="/">Inicio</Link> },
    { key: "2", label: <Link to="/events">Eventos</Link> },
    { key: "3", label: <Link to="/help">Ayuda</Link> },
  ];

  return (
    <Header style={{
      position: 'fixed',
      zIndex: 1000,
      width: '100%',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E5E7EB',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={logo} alt="RS Tickets" style={{ height: 32 }} />
        <span style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937" }}>RS Tickets</span>
      </Link>

      {screens.md ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu mode="horizontal" items={menuItems} style={{ background: 'transparent', border: 'none', fontWeight: 500 }} />
          {userIsAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" style={{ display: 'flex', alignItems: 'center', height: 40 }}>
                <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
                {user?.name?.split(' ')[0] || 'Usuario'}
                <DownOutlined style={{ marginLeft: 4 }} />
              </Button>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')} style={{ borderRadius: 8 }}>
              Iniciar Sesión
            </Button>
          )}
        </div>
      ) : (
        <>
          <Button type="text" icon={<MenuOutlined style={{ fontSize: 20 }} />} onClick={() => setOpen(true)} />
          <Drawer title="Menú" placement="right" onClose={() => setOpen(false)} open={open}>
            {userIsAuthenticated ? (
              <Menu mode="vertical" items={[...menuItems, { type: 'divider' }, ...userMenuItems]} />
            ) : (
              <>
                <Menu mode="vertical" items={menuItems} />
                <Button type="primary" block onClick={() => { setOpen(false); navigate('/login'); }} style={{ marginTop: 16 }}>
                  Iniciar Sesión
                </Button>
              </>
            )}
          </Drawer>
        </>
      )}
    </Header>
  );
}
