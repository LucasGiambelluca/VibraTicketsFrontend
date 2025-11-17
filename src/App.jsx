import React, { useState, useEffect } from "react";
import { Layout } from "antd";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
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
import EventDetail from "./pages/EventDetail";
import ShowDetail from "./pages/ShowDetail";
import Queue from "./pages/Queue";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import CheckoutNew from "./pages/CheckoutNew";
import OrderSuccess from "./pages/OrderSuccess";
import MisEntradas from "./pages/MisEntradas";
import SmartTicket from "./pages/SmartTicket";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DatosContacto from "./pages/DatosContacto";
import DatosLugar from "./pages/DatosLugar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Soporte from "./pages/Soporte";
import SoporteTickets from "./pages/SoporteTickets";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPanel from "./pages/admin/AdminUsersPanel";
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
    <AuthProvider>
      <Layout style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        display: "flex",
        flexDirection: "column"
      }}>
        <HeaderNav />
        <Content style={{ 
          padding: '0', 
          flex: 1,
          background: "transparent"
        }}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventsCatalog />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/shows/:showId" element={<ShowDetail />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/soporte" element={<Soporte />} />
            
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
            
            {/* Rutas de Admin - Solo ADMIN y ORGANIZER */}
            <Route 
              path="/admin" 
              element={
                <OrganizerRoute>
                  <AdminDashboard />
                </OrganizerRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <AdminUsersPanel />
                </AdminRoute>
              } 
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Content>
        <Footer />
        <ChatbotButton />
      </Layout>
    </AuthProvider>
  );
}
