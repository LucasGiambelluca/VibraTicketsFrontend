import React, { useState, useEffect } from "react";
import { Layout, ConfigProvider } from "antd";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import { RegisterModalProvider } from "./contexts/RegisterModalContext";
import { useQueueCleanup } from "./hooks/useQueueCleanup";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import ProtectedRoute, { OrganizerRoute, AdminRoute } from "./components/ProtectedRoute";
import ChatbotButton from "./components/ChatbotButton";
import HeaderNav from "./components/HeaderNav";
import Footer from "./components/Footer";
import MaintenancePage from "./components/MaintenancePage";
import MaintenanceLogin from "./components/MaintenanceLogin";
import { healthApi } from "./services/apiService";
import Home from "./pages/Home";
import HomeSimple from "./pages/HomeSimple";
import EventsCatalog from "./pages/EventsCatalog";
import EventsTicketBahia from "./pages/EventsTicketBahia";
import EventsHybrid from "./pages/EventsHybrid";
import EventDetail from "./pages/EventDetail";
import ShowDetail from "./pages/ShowDetail";
import Queue from "./pages/Queue";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import CheckoutNew from "./pages/CheckoutNew";
import OrderSuccess from "./pages/OrderSuccess";
import MisEntradas from "./pages/MisEntradas";
import MisOrdenes from "./pages/MisOrdenes";
import SmartTicket from "./pages/SmartTicket";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DatosContacto from "./pages/DatosContacto";
import DatosLugar from "./pages/DatosLugar";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import CustomerLogin from "./pages/CustomerLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Soporte from "./pages/Soporte";
import SoporteTickets from "./pages/SoporteTickets";
// Admin pages removed - Decoupled to ticketera-admin
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import AdminUsersPanel from "./pages/admin/AdminUsersPanel";
// import ManageOrders from "./pages/admin/ManageOrders";
// import DiscountCodes from "./pages/admin/DiscountCodes";
// import FinancialReports from "./pages/admin/FinancialReports";
import TestDiscount from "./pages/TestDiscount";
import MyHolds from "./pages/MyHolds";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentPending from "./pages/PaymentPending";
import NotFound from "./pages/NotFound";

const { Content } = Layout;

export default function App() {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [isMaintenanceAuthenticated, setIsMaintenanceAuthenticated] = useState(
    () => localStorage.getItem('maintenance_auth') === 'true'
  );

  // Limpiar tokens de cola expirados
  useQueueCleanup();

  useEffect(() => {
    checkBackendHealth();
    
    // Verificar cada 30 segundos si el backend sigue caído
    const interval = setInterval(() => {
      if (isBackendDown) {
        checkBackendHealth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isBackendDown]);

  const checkBackendHealth = async () => {
    try {
      setCheckingHealth(true);
      await healthApi.check();
      setIsBackendDown(false);
      } catch (error) {
      console.error('❌ Backend no disponible:', error);
      setIsBackendDown(true);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleMaintenanceAuthenticated = () => {
    setIsMaintenanceAuthenticated(true);
  };

  // 1. Verificar primero autenticación de mantenimiento (si está activado)
  const isMaintenanceModeEnabled = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  
  if (isMaintenanceModeEnabled && !isMaintenanceAuthenticated) {
    return <MaintenanceLogin onAuthenticated={handleMaintenanceAuthenticated} />;
  }

  // 2. Si el backend está caído, mostrar página de mantenimiento
  if (isBackendDown) {
    return <MaintenancePage />;
  }

  // 3. Mostrar la app completa
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#000000', // Negro premium
          fontFamily: 'Inter, sans-serif',
          borderRadius: 8,
          colorText: '#1f1f1f',
          colorBgBase: '#ffffff',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 44, // Botones más altos
            boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)', // Sombra sutil
            fontWeight: 600,
            colorPrimary: '#000000',
            algorithm: true, // Habilitar algoritmos derivados
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 10px 40px -10px rgba(0,0,0,0.08)', // Sombra moderna
          },
          Input: {
            controlHeight: 44,
            borderRadius: 8,
            activeBorderColor: '#000000',
            hoverBorderColor: '#404040',
          },
          Select: {
            controlHeight: 44,
            borderRadius: 8,
          },
          Modal: {
            borderRadiusLG: 16,
            contentBg: '#ffffff',
            headerBg: '#ffffff',
          },
          Tag: {
            borderRadiusSM: 6,
          }
        }
      }}
    >
    <ErrorBoundary>
      <AuthProvider>
        <LoginModalProvider>
          <RegisterModalProvider>
            <Layout style={{ 
            minHeight: "100vh", 
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            display: "flex",
            flexDirection: "column"
          }}>
            <HeaderNav />
        <Content style={{ 
          padding: '80px 0 0 0', 
          flex: 1,
          background: "transparent"
        }}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventsHybrid />} />
            <Route path="/events-original" element={<EventsCatalog />} />
            <Route path="/events-tb" element={<EventsTicketBahia />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/shows/:showId" element={<ShowDetail />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Rutas de autenticación */}
            <Route path="/login" element={<Login />} /> {/* Ruta heredada - redirecciona a customerlogin */}
            <Route path="/adminlogin" element={<AdminLogin />} />
            <Route path="/customerlogin" element={<CustomerLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/soporte" element={<Soporte />} />
            
            {/* Ruta de prueba para debugging */}
            <Route path="/test-discount" element={<TestDiscount />} />
            
            {/* Rutas de respuesta de Mercado Pago - Públicas pero verifican estado */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            <Route path="/payment/pending" element={<PaymentPending />} />
            
            {/* Rutas protegidas - Requieren autenticación */}
            <Route 
              path="/queue/:showId" 
              element={
                <ProtectedRoute>
                  <Queue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seats/:showId" 
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/:orderId" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/success" 
              element={
                <PaymentSuccess />
              } 
            />
            <Route 
              path="/checkout/:holdId" 
              element={
                <ProtectedRoute>
                  <CheckoutNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/order-success/:orderId" 
              element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mis-entradas" 
              element={
                <ProtectedRoute>
                  <MisEntradas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mis-reservas" 
              element={
                <ProtectedRoute>
                  <MyHolds />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mis-ordenes" 
              element={
                <ProtectedRoute>
                  <MisOrdenes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ticket/:ticketId" 
              element={
                <ProtectedRoute>
                  <SmartTicket />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/datos-contacto" 
              element={
                <ProtectedRoute>
                  <DatosContacto />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/datos-lugar" 
              element={
                <ProtectedRoute>
                  <DatosLugar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/soporte/tickets" 
              element={
                <ProtectedRoute>
                  <SoporteTickets />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas de Admin - MOVIDAS A TICKETERA-ADMIN */}
            {/* 
              Las rutas de administración han sido desacopladas.
              Para acceder al panel de administración, utilice la aplicación ticketera-admin.
            */}
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Content>
        <Footer />
        <ChatbotButton />
        <LoginModal />
        <RegisterModal />
      </Layout>
        </RegisterModalProvider>
      </LoginModalProvider>
      </AuthProvider>
    </ErrorBoundary>
    </ConfigProvider>
  );
}
