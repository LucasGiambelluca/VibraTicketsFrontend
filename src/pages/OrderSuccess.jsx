import React, { useState, useEffect } from 'react';
import { Result, Button, Card, Typography, Space, Divider, Tag, message } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CheckCircleOutlined, MailOutlined, DownloadOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import { whatsappApi } from '../services/apiService';

const { Text, Title } = Typography;

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Datos de la compra desde Checkout
  const purchaseData = location.state || {
    orderData: {
      seats: [{ id: 'A10', section: 'Platea', price: 25000 }],
      showId: '101'
    },
    paymentMethod: 'credit_card'
  };

  const { orderData, paymentMethod } = purchaseData;
  const subtotal = orderData.seats?.reduce((sum, seat) => sum + seat.price, 0) || 25000;
  const serviceCharge = Math.round(subtotal * 0.15);
  const total = subtotal + serviceCharge;
  
  const [showAnimation, setShowAnimation] = useState(true);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);

  // Genera un PDF simple de los tickets y devuelve base64 (sin prefijo data:)
  const generateTicketPdfBase64 = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(20);
    doc.text(`Tickets - Orden #${orderId}`, 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Show ID: ${orderData.showId}`, 14, y);
    y += 8;
    doc.text(`Método de pago: ${paymentMethod}`, 14, y);
    y += 10;
    doc.setFontSize(14);
    doc.text('Asientos', 14, y);
    y += 8;

    doc.setFontSize(12);
    (orderData.seats || []).forEach((seat, idx) => {
      doc.text(`• ${seat.section} - ${seat.id} - $${(seat.price || 0).toLocaleString()}`, 16, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 6;
    doc.setFontSize(14);
    doc.text(`Total pagado: $${total.toLocaleString()}`, 14, y);

    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];
    return base64;
  };

  const handleDownloadTickets = () => {
    try {
      setDownloading(true);
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(20);
      doc.text(`Tickets - Orden #${orderId}`, 14, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Show ID: ${orderData.showId}`, 14, y);
      y += 8;
      doc.text(`Método de pago: ${paymentMethod}`, 14, y);
      y += 10;
      doc.setFontSize(14);
      doc.text('Asientos', 14, y);
      y += 8;

      doc.setFontSize(12);
      (orderData.seats || []).forEach((seat) => {
        doc.text(`• ${seat.section} - ${seat.id} - $${(seat.price || 0).toLocaleString()}`, 16, y);
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      y += 6;
      doc.setFontSize(14);
      doc.text(`Total pagado: $${total.toLocaleString()}`, 14, y);

      doc.save(`tickets-orden-${orderId}.pdf`);
      message.success('Descarga iniciada');
    } catch (e) {
      console.error(e);
      message.error('No se pudo generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const openWaFallback = () => {
    const url = new URL(window.location.origin + '/mis-tickets');
    const text = `¡Aquí están tus entradas!!%0AOrden #%23${orderId}%0A%0APodés descargar tus tickets desde: ${encodeURIComponent(url.toString())}`;
    const waLink = `https://wa.me/17869785842?text=${text}`;
    window.open(waLink, '_blank');
  };

  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true);
    try {
      const pdfBase64 = generateTicketPdfBase64();
      await whatsappApi.sendTicket({
        orderId,
        phone: '+17869785842',
        message: '¡Aquí están tus entradas!!',
        pdfBase64
      });
      sessionStorage.setItem(`whatsapp_sent_${orderId}`, 'true');
      message.success('Enviado por WhatsApp');
    } catch (err) {
      message.warning('No se pudo enviar automáticamente. Abriremos WhatsApp para que lo envíes manualmente.');
      openWaFallback();
    } finally {
      setSendingWhatsApp(false);
    }
  };

  useEffect(() => {
    // Activar confetti después de un breve delay
    const timer = setTimeout(() => {
      setConfettiVisible(true);
    }, 500);

    // Ocultar animación después de 3 segundos
    const hideTimer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Intento automático de envío por WhatsApp al llegar a esta pantalla (solo 1 vez por orden)
  useEffect(() => {
    const sentKey = `whatsapp_sent_${orderId}`;
    const alreadySent = sessionStorage.getItem(sentKey) === 'true';
    if (!alreadySent && !autoAttempted) {
      setAutoAttempted(true);
      // Intento silencioso; si falla, mostramos botón y fallback manual
      handleSendWhatsApp();
    }
  }, [orderId, autoAttempted]);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', position: 'relative' }}>
      {/* Animación de confetti */}
      {confettiVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
          background: 'radial-gradient(circle at center, rgba(102, 126, 234, 0.1) 0%, transparent 70%)'
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-10px',
                left: `${Math.random() * 100}%`,
                width: '10px',
                height: '10px',
                background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                borderRadius: '50%',
                animation: `confetti-fall 3s linear ${Math.random() * 2}s forwards`,
                opacity: showAnimation ? 1 : 0,
                transition: 'opacity 0.5s ease'
              }}
            />
          ))}
        </div>
      )}
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Result
          icon={<CheckCircleOutlined style={{ 
            color: '#52c41a', 
            fontSize: 72,
            animation: showAnimation ? 'success-pulse 2s ease-in-out infinite' : 'none'
          }} />}
          status="success"
          title={
            <span style={{
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem',
              fontWeight: 800
            }}>
              ¡Compra exitosa!
            </span>
          }
          subTitle={`Tu orden #${orderId} fue procesada correctamente`}
          className="slide-in-bottom"
        />

        <Card title="Detalles de la compra">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>Número de orden:</Text>
              <Text>#{orderId}</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>Show:</Text>
              <Text>#{orderData.showId}</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>Método de pago:</Text>
              <Tag color="blue">
                {paymentMethod === 'credit_card' ? 'Tarjeta de Crédito' :
                 paymentMethod === 'debit_card' ? 'Tarjeta de Débito' :
                 'MercadoPago'}
              </Tag>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>Asientos comprados:</Text>
              <div style={{ marginTop: 8 }}>
                {orderData.seats?.map((seat, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 6,
                    marginBottom: 4
                  }}>
                    <Text strong>{seat.section} - Asiento {seat.id}</Text>
                    <Text>${seat.price?.toLocaleString()}</Text>
                  </div>
                )) || (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 6
                  }}>
                    <Text strong>Platea - Asiento A10</Text>
                    <Text>$25.000</Text>
                  </div>
                )}
              </div>
            </div>
            
            <Divider />
            
            {/* Desglose de precios */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Subtotal:</Text>
                <Text>${subtotal.toLocaleString()}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Cargo por servicios (15%):</Text>
                <Text>${serviceCharge.toLocaleString()}</Text>
              </div>
            </div>
            
            <Divider />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: 20,
              fontWeight: 'bold',
              padding: '16px',
              background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
              borderRadius: 12,
              border: '2px solid #52c41a',
              boxShadow: '0 4px 12px rgba(82, 196, 26, 0.2)'
            }}>
              <Text strong>Total pagado:</Text>
              <Text strong style={{ color: '#52c41a', fontSize: 22 }}>${total.toLocaleString()}</Text>
            </div>
          </Space>
        </Card>

        <Card>
          <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
            <MailOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4}>¡Revisá tu email!</Title>
            <Text type="secondary">
              Te enviamos los tickets digitales y toda la información del evento.
              <br />
              Si no los recibís en unos minutos, revisá tu carpeta de spam.
            </Text>
          </Space>
        </Card>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </Button>
          
          <Button 
            size="large"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownloadTickets}
          >
            Descargar tickets
          </Button>
          
          <Button
            size="large"
            type="default"
            icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
            loading={sendingWhatsApp}
            onClick={handleSendWhatsApp}
          >
            Enviar por WhatsApp
          </Button>
          
          <Button 
            size="large"
            onClick={() => navigate('/mis-tickets')}
          >
            Ver mis tickets
          </Button>
        </div>
      </Space>
    </div>
  );
}
