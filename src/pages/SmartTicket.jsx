import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Row, Col, Button, QRCode, Space, Divider, message, Spin, Alert, Grid, Collapse } from 'antd';
import { DownloadOutlined, ShareAltOutlined, EnvironmentOutlined, CalendarOutlined, ClockCircleOutlined, PrinterOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { testPaymentsApi } from '../services/apiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logo from '../assets/VibraTicketLogo2.png';
import { getEventImageUrl } from '../utils/imageUtils';

const { Title, Text } = Typography;

export default function SmartTicket() {
  const { ticketId } = useParams();
  const ticketRef = useRef(null);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const screens = Grid.useBreakpoint();

  // Cargar datos del ticket
  useEffect(() => {
    const loadTicket = async () => {
      try {
        setLoading(true);
        // Estrategia 1: Intentar obtener ticket específico
        try {
          const response = await testPaymentsApi.getTicketDetail(ticketId);
          const ticket = response?.data?.ticket || response?.ticket || response;
          setTicketData(ticket);
          return;
        } catch (detailError) {
          }
        
        // Estrategia 2: Obtener todos los tickets y filtrar
        const response = await testPaymentsApi.getMyTickets();
        const allTickets = response?.data?.tickets || response?.tickets || [];
        const ticket = allTickets.find(t => 
          t.ticket_number === ticketId || 
          String(t.id) === String(ticketId)
        );
        
        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }
        
        setTicketData(ticket);
      } catch (err) {
        console.error('❌ Error al cargar ticket:', err);
        setError(err.message || 'Error al cargar el ticket');
        message.error('No se pudo cargar el ticket');
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  // Animaciones GSAP
  useEffect(() => {
    if (!ticketData) return;

    gsap.fromTo('.ticket-card', 
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    );

    gsap.fromTo('.ticket-info', 
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, delay: 0.3, stagger: 0.1, ease: "power2.out" }
    );

    gsap.fromTo('.qr-section', 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.5, ease: "power2.out" }
    );
  }, [ticketData]);

  // Formatear datos del ticket
  const getFormattedData = () => {
    if (!ticketData) return null;

    // Extraer datos del show
    const showDate = ticketData.show?.startsAt || ticketData.starts_at || ticketData.show_starts_at;
    const formattedDate = showDate ? format(new Date(showDate), "EEEE d 'de' MMMM", { locale: es }) : 'Fecha por confirmar';
    const formattedTime = showDate ? format(new Date(showDate), 'HH:mm', { locale: es }) + ' HS' : '';
    
    // Extraer datos del evento
    const eventData = ticketData.event || {};
    const eventName = eventData.name || ticketData.event_name || ticketData.eventName || 'Evento';
    const venue = eventData.venue || ticketData.venue || ticketData.venue_name || 'Venue por confirmar';
    
    // Extraer datos del asiento
    const seatData = ticketData.seat || {};
    const section = seatData.sector || ticketData.sector || ticketData.section || 'General';
    const row = seatData.rowLabel || ticketData.row_label || ticketData.rowLabel || null;
    const seat = seatData.seatNumber || ticketData.seat_number || ticketData.seatNumber || 'Sin asiento';
    
    // Precio
    const totalAmount = ticketData.totalAmount || ticketData.total_cents || ticketData.total_amount_cents;
    const price = totalAmount ? `$${(totalAmount / 100).toLocaleString('es-AR')}` : 'Precio no disponible';

    const formatted = {
      event: eventName,
      date: formattedDate,
      time: formattedTime,
      venue: venue,
      section: section,
      row: row,
      seat: seat,
      price: price,
      orderNumber: `ORD-${ticketData.orderId || ticketData.order_id || 'N/A'}`,
      ticketNumber: ticketData.ticketNumber || ticketData.ticket_number || ticketId,
      qrCode: ticketData.qrPayload ? JSON.stringify(ticketData.qrPayload) : (ticketData.qr_code || ticketData.qrCode || JSON.stringify({ 
        ticketNumber: ticketData.ticketNumber || ticketData.ticket_number, 
        orderId: ticketData.orderId || ticketData.order_id,
        eventName: eventName,
        sector: section,
        seatNumber: seat
      })),
      status: ticketData.status || 'ISSUED',
      availability_status: ticketData.availability_status || 'available' // Default to available if not present
    };

    return formatted;
  };

  const formattedTicket = getFormattedData();

  const downloadTicketPDF = async () => {
    try {
      message.loading('Generando PDF...', 0);
      
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`ticket-${formattedTicket.event}-${formattedTicket.ticketNumber}.pdf`);
      message.destroy();
      message.success('¡Ticket descargado exitosamente!');
    } catch (error) {
      message.destroy();
      message.error('Error al generar el PDF');
      console.error('Error:', error);
    }
  };

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket - ${formattedTicket.event}`,
          text: `Mi ticket para ${formattedTicket.event}`,
          url: window.location.href,
        });
      } catch (error) {
        }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href);
      message.success('¡Enlace copiado al portapapeles!');
    }
  };

  const printTicket = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" tip="Cargando ticket..." />
      </div>
    );
  }

  // Error state
  if (error || !ticketData) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        padding: '24px'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Alert
            message="Error"
            description={error || 'No se pudo cargar el ticket'}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Link to="/mis-entradas">
            <Button type="primary">← Volver a Mis Entradas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header con Logo */}
        <div style={{ textAlign: 'center', marginBottom: screens.xs ? 16 : 32 }}>
          <img
            src={logo}
            alt="VibraTicket"
            style={{
              height: screens.xs ? 40 : 60,
              width: 'auto',
              marginBottom: 16,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
            }}
          />
          <Link to="/mis-entradas">
            <Button type="link" style={{ fontSize: '1rem' }}>
              ← Volver a Mis Entradas
            </Button>
          </Link>
        </div>

        {/* Ticket Card */}
        <Card 
          ref={ticketRef}
          className="ticket-card"
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: 'none'
          }}
        >
          {/* Hero Banner con Imagen del Evento */}
          <div style={{
            height: 220,
            background: `linear-gradient(rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.9)), url(${
              ticketData.event ? getEventImageUrl(ticketData.event) : ''
            }) center/cover no-repeat`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 32px',
            color: 'white',
            position: 'relative'
          }}>
            <img
              src={logo}
              alt="VibraTicket"
              style={{
                height: 40,
                width: 'auto',
                marginBottom: 16,
                filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                opacity: 0.9
              }}
            />
            <Title level={1} style={{ 
              color: 'white', 
              fontSize: screens.xs ? '1.5rem' : '2.2rem', 
              fontWeight: 800,
              margin: 0,
              textAlign: 'center',
              textShadow: '0 4px 12px rgba(0,0,0,0.3)',
              lineHeight: 1.2
            }}>
              {formattedTicket.event}
            </Title>
          </div>

          <div style={{ padding: '32px' }}>
            <Row gutter={[32, 32]}>
              {/* Información del Evento */}
              <Col xs={24} md={14}>
                <div className="ticket-info">
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                    <Title level={4} style={{ marginBottom: 16 }}>
                      Datos del Evento
                    </Title>
                    
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Space>
                          <CalendarOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                          <div>
                            <Text strong>Fecha</Text>
                            <br />
                            <Text>{formattedTicket.date}</Text>
                          </div>
                        </Space>
                      </Col>
                      
                      <Col span={24}>
                        <Space>
                          <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                          <div>
                            <Text strong>Hora</Text>
                            <br />
                            <Text>{formattedTicket.time}</Text>
                          </div>
                        </Space>
                      </Col>
                      
                      <Col span={24}>
                        <Space>
                          <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                          <div>
                            <Text strong>Lugar</Text>
                            <br />
                            <Text>{formattedTicket.venue}</Text>
                          </div>
                        </Space>
                      </Col>
                    </Row>
                  </div>

                  <Divider />

                  <div>
                    <Title level={4} style={{ marginBottom: 16 }}>
                      Datos del Ticket
                    </Title>
                    
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text strong>Sección:</Text>
                        <br />
                        <Text>{formattedTicket.section}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>{formattedTicket.row ? 'Fila:' : 'Número:'}</Text>
                        <br />
                        <Text>{formattedTicket.row || formattedTicket.seat}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>Estado:</Text>
                        <br />
                        <Text style={{ 
                          color: formattedTicket.status === 'ISSUED' ? '#52c41a' : 
                                 formattedTicket.status === 'SCANNED' ? '#1890ff' : '#ff4d4f',
                          fontWeight: 600 
                        }}>
                          {formattedTicket.status === 'ISSUED' ? 'Activo' : 
                           formattedTicket.status === 'SCANNED' ? 'Usado' : 'Cancelado'}
                        </Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>Precio:</Text>
                        <br />
                        <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                          {formattedTicket.price}
                        </Text>
                      </Col>
                    </Row>
                  </div>
                  </Space>
                </div>
              </Col>

              {/* QR Code y Acciones */}
              <Col xs={24} md={10}>
                <div className="qr-section" style={{ textAlign: 'center' }}>
                  <Title level={4} style={{ marginBottom: 24 }}>
                    Smart Ticket
                  </Title>
                  
                  {formattedTicket.status === 'ISSUED' && formattedTicket.availability_status === 'pending' ? (
                     <div style={{
                      background: '#f6ffed',
                      padding: '32px 24px',
                      borderRadius: 16,
                      marginBottom: 24,
                      border: '1px dashed #b7eb8f',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ 
                        background: '#52c41a', 
                        borderRadius: '50%', 
                        width: 80, height: 80, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16,
                        boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
                      }}>
                        <SafetyCertificateOutlined style={{ fontSize: 40, color: 'white' }} />
                      </div>
                      <Title level={4} style={{ color: '#389e0d', marginBottom: 8 }}>
                        ¡Lugar Asegurado!
                      </Title>
                      <Text type="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
                        Por seguridad, tu código QR estará disponible <strong>24hs antes del evento</strong>.
                      </Text>
                      <div style={{ background: 'rgba(82, 196, 26, 0.1)', padding: '8px 16px', borderRadius: 8 }}>
                         <Text style={{ color: '#389e0d', fontSize: 12 }}>
                           <LockOutlined style={{ marginRight: 4 }} />
                           Tu entrada está 100% confirmada
                         </Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: '#f8f9fa',
                      padding: 24,
                      borderRadius: 16,
                      marginBottom: 24
                    }}>
                      <QRCode
                        value={formattedTicket.qrCode}
                        size={180}
                        style={{ marginBottom: 16 }}
                      />
                      <Text type="secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
                        Ticket: {formattedTicket.ticketNumber}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                        Orden: {formattedTicket.orderNumber}
                      </Text>
                    </div>
                  )}

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      size="large"
                      block
                      onClick={downloadTicketPDF}
                      disabled={formattedTicket.availability_status === 'pending'}
                      style={{
                        background: formattedTicket.availability_status === 'pending' ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 48
                      }}
                    >
                      {formattedTicket.availability_status === 'pending' ? 'Descarga disponible 24hs antes' : 'Descargar PDF'}
                    </Button>
                    
                    <Button
                      icon={<ShareAltOutlined />}
                      size="large"
                      block
                      onClick={shareTicket}
                      style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 48
                      }}
                    >
                      Compartir
                    </Button>

                    <Button
                      icon={<PrinterOutlined />}
                      size="large"
                      block
                      onClick={printTicket}
                      disabled={formattedTicket.availability_status === 'pending'}
                      style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 48,
                        borderColor: '#1890ff',
                        color: '#1890ff'
                      }}
                    >
                      Imprimir
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Información Adicional */}
        <Card style={{ 
          marginTop: 24, 
          borderRadius: 16,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          padding: 0
        }} bodyStyle={{ padding: screens.xs ? '12px' : '24px' }}>
          {screens.xs ? (
            <Collapse ghost items={[{
              key: '1',
              label: <span style={{ fontWeight: 600 }}>Información Importante</span>,
              children: (
                <Space direction="vertical">
                  <Text>• Llegá con tiempo suficiente. Las puertas abren 2 horas antes del show.</Text>
                  <Text>• Presentá este ticket junto con tu DNI en el acceso.</Text>
                  <Text>• No se permite el reingreso al evento.</Text>
                  <Text>• Prohibido el ingreso de bebidas, comidas y elementos punzocortantes.</Text>
                </Space>
              )
            }]} />
          ) : (
            <>
              <Title level={5}>Información Importante</Title>
              <Space direction="vertical">
                <Text>• Llegá con tiempo suficiente. Las puertas abren 2 horas antes del show.</Text>
                <Text>• Presentá este ticket junto con tu DNI en el acceso.</Text>
                <Text>• No se permite el reingreso al evento.</Text>
                <Text>• Prohibido el ingreso de bebidas, comidas y elementos punzocortantes.</Text>
              </Space>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
