import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Typography, Avatar, Divider, Row, Col, Form, Select, message, Spin, Badge } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, QuestionCircleOutlined, FileTextOutlined, PhoneOutlined, CloseOutlined, SearchOutlined, MessageOutlined, MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { gsap } from 'gsap';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Soporte() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?", sender: 'bot', time: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Animaciones GSAP para las cards
    gsap.fromTo('.support-card', 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
    );

    gsap.fromTo('.hero-title', 
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );
  }, []);

  const supportOptions = [
    {
      icon: '🎫',
      title: 'Problemas con tickets',
      description: 'Ayuda con compras, descargas, reembolsos y validación de entradas',
      action: 'Ver formulario',
      link: '/soporte/tickets'
    },
    {
      icon: '💳',
      title: 'Métodos de pago',
      description: 'Consultas sobre pagos, facturación y métodos de pago disponibles',
      action: 'Contactar',
      link: '/soporte/pagos'
    },
    {
      icon: '📱',
      title: 'Problemas con la web',
      description: 'Errores técnicos, problemas de acceso y funcionalidades del sitio',
      action: 'Reportar problema',
      link: '/soporte/tecnico'
    },
    {
      icon: '👥',
      title: 'Políticas de Acceso y Menores',
      description: 'Información sobre políticas de edad, acceso y acompañantes',
      action: 'Ver políticas',
      link: '/soporte/politicas'
    },
    {
      icon: '🔄',
      title: 'Actualización y cambios de entradas',
      description: 'Modificar datos, cambiar fechas y actualizar información de tickets',
      action: 'Gestionar',
      link: '/soporte/cambios'
    },
    {
      icon: '📅',
      title: 'Reagendamiento y cancelaciones de eventos',
      description: 'Información sobre eventos reprogramados, cancelados y reembolsos',
      action: 'Ver información',
      link: '/soporte/reagendamiento'
    }
  ];

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setTyping(true);

    // Simular respuesta del bot con IA
    setTimeout(() => {
      const botResponse = generateBotResponse(newMessage);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        time: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('ticket') || input.includes('entrada')) {
      return "Te puedo ayudar con problemas de tickets. ¿Necesitas descargar tu entrada, reportar un problema o hacer un cambio? También puedes usar el formulario de soporte para tickets.";
    }
    if (input.includes('pago') || input.includes('cobro')) {
      return "Para problemas de pago, puedo ayudarte con: reembolsos, métodos de pago, facturación. ¿Cuál es tu consulta específica?";
    }
    if (input.includes('evento') || input.includes('cancelado')) {
      return "Si tu evento fue cancelado o reprogramado, automáticamente recibirás un email con las opciones disponibles. ¿Necesitas más información sobre algún evento específico?";
    }
    if (input.includes('hola') || input.includes('ayuda')) {
      return "¡Hola! Estoy aquí para ayudarte. Puedo asistirte con: problemas de tickets, pagos, eventos cancelados, acceso al sitio web, y más. ¿En qué puedo ayudarte?";
    }
    
    return "Entiendo tu consulta. Para brindarte la mejor ayuda, te recomiendo usar nuestros formularios específicos de soporte o contactar directamente con nuestro equipo. ¿Hay algo más específico en lo que pueda ayudarte?";
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div className="hero-title" style={{ 
          textAlign: 'center', 
          marginBottom: 48,
          color: 'white'
        }}>
          <Title level={1} style={{ 
            color: 'white', 
            fontSize: '3rem', 
            fontWeight: 800,
            marginBottom: 16
          }}>
            ¿Necesitas ayuda?
          </Title>
          <Paragraph style={{ 
            fontSize: '1.2rem', 
            color: 'rgba(255,255,255,0.9)',
            maxWidth: 600,
            margin: '0 auto'
          }}>
            Encuentra respuestas rápidas o contacta con nuestro equipo de soporte
          </Paragraph>
          
          {/* Buscador */}
          <div style={{ 
            maxWidth: 500, 
            margin: '32px auto 0',
            position: 'relative'
          }}>
            <Input
              size="large"
              placeholder="Busca tu problema..."
              prefix={<SearchOutlined />}
              suffix={
                <Button 
                  type="primary" 
                  style={{ 
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none'
                  }}
                >
                  Buscar
                </Button>
              }
              style={{
                borderRadius: 25,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
          </div>
        </div>

        {/* Cards de Soporte */}
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          {supportOptions.map((option, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card 
                className="support-card"
                hoverable
                style={{
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { y: -5, duration: 0.3, ease: "power2.out" });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: "power2.out" });
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: 48, 
                    marginBottom: 16,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }}>
                    {option.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: 12 }}>
                    {option.title}
                  </Title>
                  <Paragraph style={{ 
                    color: '#666', 
                    marginBottom: 24,
                    minHeight: 60
                  }}>
                    {option.description}
                  </Paragraph>
                  <Button 
                    type="primary"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600
                    }}
                  >
                    {option.action}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Contacto directo */}
        <Card style={{
          borderRadius: 16,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Row gutter={32} align="middle">
            <Col xs={24} lg={16}>
              <Title level={3}>Contáctate con nosotros</Title>
              <Paragraph style={{ fontSize: '1rem', marginBottom: 24 }}>
                Si no encuentras la solución a tu problema, nuestro equipo está disponible para ayudarte
              </Paragraph>
              <Space size="large">
                <div>
                  <PhoneOutlined style={{ color: '#1890ff', fontSize: 18, marginRight: 8 }} />
                  <Text strong>+54 11 4000-0000</Text>
                </div>
                <div>
                  <MailOutlined style={{ color: '#1890ff', fontSize: 18, marginRight: 8 }} />
                  <Text strong>soporte@ticketera.com</Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} lg={8} style={{ textAlign: 'center' }}>
              <div style={{
                width: 200,
                height: 150,
                background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <Text type="secondary">IMAGEN</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Chatbot flotante */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000
      }}>
        {chatOpen ? (
          <Card style={{
            width: 350,
            height: 500,
            borderRadius: 16,
            boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header del chat */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar icon={<RobotOutlined />} style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div>
                  <Text strong style={{ color: 'white' }}>Asistente IA</Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                    En línea
                  </Text>
                </div>
              </div>
              <Button 
                type="text" 
                onClick={() => setChatOpen(false)}
                style={{ color: 'white' }}
              >
                ✕
              </Button>
            </div>

            {/* Mensajes */}
            <div style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              maxHeight: 350
            }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    background: msg.sender === 'user' ? '#1890ff' : '#f0f0f0',
                    color: msg.sender === 'user' ? 'white' : 'black',
                    padding: '8px 12px',
                    borderRadius: 12,
                    maxWidth: '80%',
                    fontSize: '0.9rem'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    background: '#f0f0f0',
                    padding: '8px 12px',
                    borderRadius: 12,
                    fontSize: '0.9rem'
                  }}>
                    Escribiendo...
                  </div>
                </div>
              )}
            </div>

            {/* Input de mensaje */}
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onPressEnter={handleSendMessage}
                placeholder="Escribe tu mensaje..."
                suffix={
                  <Button 
                    type="text" 
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    style={{ color: '#1890ff' }}
                  />
                }
              />
            </div>
          </Card>
        ) : (
          <Badge count={1} offset={[-8, 8]}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => setChatOpen(true)}
              style={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                fontSize: 20
              }}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}
