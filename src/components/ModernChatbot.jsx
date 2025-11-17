import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Spin, message } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const ModernChatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "¡Hola! Soy Vibra BOT, tu asistente virtual inteligente.\n\nEspecializado en VibraTicket:\n• Compra de tickets\n• Información de eventos\n• Ubicación de venues\n• Problemas de acceso\n• Consultas de pago\n\nPero también puedo ayudarte con:\n• Preguntas generales\n• Explicaciones\n• Curiosidades\n• ¡Y mucho más!\n\n¿En qué puedo ayudarte hoy?", 
      sender: 'bot', 
      time: new Date() 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Sugerencias rápidas (mezcla de VibraTicket y preguntas generales)
  const quickSuggestions = [
    { text: '¿Cómo compro un ticket?' },
    { text: '¿Qué es la cola virtual?' },
    { text: 'Problemas con el pago' },
    { text: '¿Cómo creo un evento?' },
    { text: 'Explícame algo interesante' },
    { text: 'Cuéntame un chiste' }
  ];

  // Groq API configuration
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'gsk_your_api_key_here';
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getGroqResponse = async (userMessage) => {
    try {
      const systemPrompt = `Eres Vibra BOT, un asistente virtual inteligente y versátil. Tu función principal es ayudar a los usuarios de VibraTicket (plataforma de venta de tickets), pero también puedes responder preguntas generales sobre cualquier tema.

📋 CONTEXTO DE VIBRATICKET (tu especialidad):

Funcionalidades Principales:
- Compra de tickets para eventos (música, teatro, deportes, conferencias)
- Smart Tickets con códigos QR únicos
- Sistema de cola virtual para eventos de alta demanda
- Descarga de tickets en PDF
- Gestión de entradas desde "Mis Entradas"
- Pagos seguros con MercadoPago
- Mapa interactivo de venues con Google Maps

👥 Tipos de Usuario:
- CUSTOMER: Compra tickets
- ORGANIZER: Crea y gestiona eventos
- ADMIN: Control total de la plataforma

🎭 Gestión de Eventos:
- Crear eventos con nombre, descripción, imagen
- Asignar venues (lugares) con ubicación
- Crear shows (funciones) con fecha y hora
- Definir secciones (localidades) con precios
- Estados: DRAFT, PUBLISHED, CANCELLED, COMPLETED

🎟️ Proceso de Compra:
1. Usuario busca evento
2. Selecciona show (función)
3. Entra a cola virtual (si hay alta demanda)
4. Selecciona asientos/secciones
5. Paga con MercadoPago
6. Recibe Smart Ticket con QR

TU COMPORTAMIENTO:

✅ PUEDES Y DEBES:
- Responder preguntas sobre VibraTicket con detalle
- Responder preguntas generales sobre cualquier tema (historia, ciencia, cultura, tecnología, etc.)
- Ayudar con problemas técnicos, dudas, curiosidades
- Dar explicaciones, definiciones, consejos
- Hacer cálculos, traducciones, resúmenes
- Ser conversacional y mantener el contexto de la charla
- Usar emojis para ser más amigable (sin abusar)
- Responde SIEMPRE en español (a menos que te pidan otro idioma)

🎯 PRIORIDADES:
1. Si preguntan sobre VibraTicket → Responde con información específica de la plataforma
2. Si preguntan sobre otros temas → Responde con tu conocimiento general
3. Si no estás seguro → Sé honesto y sugiere alternativas

📝 ESTILO DE RESPUESTA:
- Conciso pero completo
- Amigable y profesional
- Usa ejemplos cuando sea útil
- Divide información compleja en puntos
- Pregunta si necesitan más detalles

🚫 NO HAGAS:
- Inventar información que no tengas
- Compartir datos sensibles de usuarios
- Dar consejos médicos, legales o financieros profesionales
- Generar contenido ofensivo o inapropiado

💬 EJEMPLOS DE INTERACCIÓN:

Usuario: "¿Cómo compro un ticket?"
Tú: [Explica el proceso de VibraTicket paso a paso]

Usuario: "¿Qué es la fotosíntesis?"
Tú: [Explica el proceso biológico de forma clara]

Usuario: "¿Cuál es la capital de Francia?"
Tú: "París es la capital de Francia 🇫🇷. ¿Tienes alguna otra pregunta?"

Usuario: "Cuéntame un chiste"
Tú: [Cuenta un chiste apropiado y divertido]

Recuerda: Eres un asistente completo. Ayuda con VibraTicket cuando sea necesario, pero también sé útil en cualquier otro tema. 🎉`;

      // Construir historial de conversación (últimos 6 mensajes para contexto)
      const conversationHistory = messages
        .slice(-6)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Groq API:', error);
      
      // Fallback responses si Groq no está disponible
      const fallbackResponses = {
        'ticket': 'Para problemas con tickets:\n\n1. Ve a "Mis Entradas" en el menú\n2. Busca tu ticket\n3. Descárgalo en PDF\n4. Si no aparece, verifica tu email\n\n¿Necesitas más ayuda?',
        'pago': 'Problemas con el pago:\n\n1. Verifica fondos en tu tarjeta\n2. Intenta con otro método de pago\n3. Revisa que los datos sean correctos\n4. Contacta a MercadoPago si persiste\n\n¿Algo más?',
        'evento': 'Información de eventos:\n\n1. Ve a la página principal\n2. Usa el buscador\n3. Filtra por categoría\n4. Haz click en el evento para ver detalles\n\n¿Buscas algo específico?',
        'cola': 'Cola virtual:\n\n- Espera tu turno sin perder tu lugar\n- Mantén la pestaña abierta\n- Verás tu posición en tiempo real\n- Cuando sea tu turno, podrás comprar\n\n¿Tienes dudas?',
        'comprar': 'Para comprar tickets:\n\n1. Busca el evento\n2. Selecciona la función (show)\n3. Elige tus asientos\n4. Completa el pago\n5. Recibe tu Smart Ticket\n\n¿Necesitas ayuda con algún paso?',
        'crear': 'Para crear eventos:\n\n- Necesitas rol ORGANIZER\n- Ve al panel de administración\n- Crea el evento con todos los detalles\n- Asigna un venue\n- Crea shows (funciones)\n- Define secciones y precios\n\n¿Eres organizador?',
        'hola': '¡Hola! Soy Vibra BOT. Puedo ayudarte con VibraTicket o responder cualquier pregunta que tengas. ¿En qué puedo ayudarte?',
        'gracias': '¡De nada! Estoy aquí para ayudarte. Si tienes más preguntas, no dudes en consultarme.',
        'ayuda': '¡Claro! Puedo ayudarte con:\n\n• VibraTicket (compra, eventos, pagos)\n• Preguntas generales\n• Explicaciones\n• Información\n\n¿Qué necesitas saber?',
        'default': 'Lo siento, estoy teniendo problemas técnicos en este momento.\n\nPero puedo intentar ayudarte con respuestas básicas. ¿Podrías reformular tu pregunta o ser más específico?\n\n¡Gracias por tu paciencia!'
      };

      const lowerMessage = userMessage.toLowerCase();
      for (const [key, response] of Object.entries(fallbackResponses)) {
        if (lowerMessage.includes(key)) {
          return response;
        }
      }
      
      return fallbackResponses.default;
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    // Ocultar sugerencias después del primer mensaje del usuario
    setShowSuggestions(false);

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const botResponse = await getGroqResponse(textToSend);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        time: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo o contacta a soporte.',
        sender: 'bot',
        time: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 380,
      height: 500,
      backgroundColor: 'white',
      borderRadius: 16,
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
      border: '1px solid #e8e8e8'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
        padding: '16px 20px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RobotOutlined style={{ fontSize: 20, color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>RS BOT</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Asistente Virtual</div>
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ color: 'white', border: 'none' }}
        />
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: 8
            }}
          >
            {msg.sender === 'bot' && (
              <Avatar
                size={32}
                style={{ 
                  backgroundColor: '#00d4aa',
                  flexShrink: 0
                }}
                icon={<RobotOutlined />}
              />
            )}
            
            <div
              style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: msg.sender === 'user' ? '#007bff' : 'white',
                color: msg.sender === 'user' ? 'white' : '#333',
                fontSize: 14,
                lineHeight: 1.4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                wordWrap: 'break-word'
              }}
            >
              {msg.text}
              <div style={{
                fontSize: 11,
                opacity: 0.7,
                marginTop: 4,
                textAlign: 'right'
              }}>
                {msg.time.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>

            {msg.sender === 'user' && (
              <Avatar
                size={32}
                style={{ 
                  backgroundColor: '#007bff',
                  flexShrink: 0
                }}
                icon={<UserOutlined />}
              />
            )}
          </div>
        ))}
        
        {/* Sugerencias rápidas */}
        {showSuggestions && messages.length === 1 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ 
              fontSize: 12, 
              color: '#999', 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Preguntas frecuentes:
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 8,
              justifyContent: 'center'
            }}>
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => handleSendMessage(suggestion.text)}
                  style={{
                    borderRadius: 16,
                    fontSize: 12,
                    height: 'auto',
                    padding: '6px 12px',
                    border: '1px solid #e8e8e8',
                    backgroundColor: 'white',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>{suggestion.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              size={32}
              style={{ backgroundColor: '#00d4aa' }}
              icon={<RobotOutlined />}
            />
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Spin size="small" />
              <span style={{ marginLeft: 8, color: '#666' }}>Escribiendo...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e8e8e8',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{
              flex: 1,
              borderRadius: 20,
              border: '1px solid #d9d9d9',
              resize: 'none'
            }}
            disabled={isLoading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={isLoading}
            style={{
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#00d4aa',
              borderColor: '#00d4aa'
            }}
          />
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: 8,
          fontSize: 11,
          color: '#999'
        }}>
          powered by Groq
        </div>
      </div>
    </div>
  );
};

export default ModernChatbot;
