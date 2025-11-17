import React, { useState } from 'react';
import { Card, Collapse, Typography, Input, Space, Button, Form, message, Row, Col, Divider } from 'antd';
import { SearchOutlined, QuestionCircleOutlined, MailOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

export default function Help() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      category: 'Compra de Entradas',
      questions: [
        {
          question: '¿Cómo compro entradas?',
          answer: 'Para comprar entradas, navegá por nuestro catálogo de eventos, seleccioná el evento que te interesa, elegí la función y la cantidad de entradas que necesitás. Luego completá el proceso de pago con MercadoPago.'
        },
        {
          question: '¿Qué métodos de pago aceptan?',
          answer: 'Aceptamos todos los métodos de pago disponibles en MercadoPago: tarjetas de crédito, débito, efectivo (Rapipago/Pago Fácil) y dinero en cuenta de MercadoPago.'
        },
        {
          question: '¿Puedo cancelar mi compra?',
          answer: 'Las compras pueden cancelarse hasta 48 horas antes del evento. Para solicitar una cancelación, contactanos a través del formulario de soporte o envianos un email a soporte@ticketera.com'
        },
        {
          question: '¿Cuánto demora en llegar mi entrada?',
          answer: 'Tu entrada digital llega inmediatamente después de confirmar el pago. Podés verla en la sección "Mis Entradas" y descargarla en formato PDF.'
        }
      ]
    },
    {
      category: 'Entradas Digitales',
      questions: [
        {
          question: '¿Cómo accedo a mis entradas?',
          answer: 'Podés ver todas tus entradas en la sección "Mis Entradas" del menú principal. Allí encontrarás el código QR y podrás descargar el PDF de cada entrada.'
        },
        {
          question: '¿Necesito imprimir mi entrada?',
          answer: 'No es necesario. Podés mostrar el código QR directamente desde tu celular en la entrada del evento. De todas formas, tenés la opción de descargar e imprimir el PDF si lo preferís.'
        },
        {
          question: '¿Puedo transferir mi entrada a otra persona?',
          answer: 'Sí, podés transferir tu entrada a través de la opción "Transferir" en el detalle de la entrada. La persona receptora recibirá un email con su nueva entrada.'
        },
        {
          question: '¿Qué pasa si pierdo mi entrada?',
          answer: 'No te preocupes, tus entradas están guardadas en tu cuenta. Simplemente ingresá a "Mis Entradas" y podrás volver a acceder a ellas.'
        }
      ]
    },
    {
      category: 'Cuenta y Seguridad',
      questions: [
        {
          question: '¿Cómo creo una cuenta?',
          answer: 'Hacé click en "Registrarse" en el menú superior, completá tus datos (nombre, email y contraseña) y listo. Recibirás un email de confirmación.'
        },
        {
          question: '¿Olvidé mi contraseña, qué hago?',
          answer: 'En la página de login, hacé click en "¿Olvidaste tu contraseña?". Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.'
        },
        {
          question: '¿Cómo cambio mis datos personales?',
          answer: 'Ingresá a tu perfil desde el menú de usuario, hacé click en "Editar" y actualizá la información que necesites. No olvides guardar los cambios.'
        },
        {
          question: '¿Es seguro comprar en Ticketera?',
          answer: 'Sí, utilizamos encriptación SSL y procesamos todos los pagos a través de MercadoPago, una plataforma segura y certificada. Nunca almacenamos datos de tarjetas de crédito.'
        }
      ]
    },
    {
      category: 'Eventos',
      questions: [
        {
          question: '¿Cómo encuentro eventos en mi ciudad?',
          answer: 'Usá los filtros en la página de eventos para seleccionar tu ciudad. También podés buscar por nombre del evento o categoría.'
        },
        {
          question: '¿Puedo recibir notificaciones de nuevos eventos?',
          answer: 'Próximamente implementaremos un sistema de notificaciones por email. Por ahora, te recomendamos seguirnos en redes sociales para estar al tanto de los nuevos eventos.'
        },
        {
          question: '¿Qué significa "Pocas entradas"?',
          answer: 'Cuando un evento muestra "Pocas entradas", significa que quedan menos de 50 lugares disponibles. Te recomendamos comprar pronto para no quedarte sin tu entrada.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleSubmitContact = async (values) => {
    setLoading(true);
    try {
      // TODO: Implementar endpoint de contacto
      message.success('Mensaje enviado correctamente. Te responderemos pronto.');
      form.resetFields();
    } catch (error) {
      message.error('Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea05 0%, #764ba205 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <QuestionCircleOutlined style={{ fontSize: 64, color: '#667eea', marginBottom: 16 }} />
          <Title level={1} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            Centro de Ayuda
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Encontrá respuestas a las preguntas más frecuentes
          </Text>
        </div>

        <Row gutter={[32, 32]}>
          
          {/* Columna Izquierda: FAQs */}
          <Col xs={24} lg={14}>
            <Card style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              
              {/* Búsqueda */}
              <Input
                size="large"
                placeholder="Buscá tu pregunta..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: 24, borderRadius: 8 }}
                allowClear
              />

              {/* FAQs */}
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Text type="secondary">No se encontraron preguntas que coincidan con tu búsqueda</Text>
                </div>
              ) : (
                filteredFaqs.map((category, idx) => (
                  <div key={idx} style={{ marginBottom: 32 }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                      {category.category}
                    </Title>
                    <Collapse 
                      bordered={false}
                      style={{ background: '#fafafa' }}
                    >
                      {category.questions.map((faq, qIdx) => (
                        <Panel 
                          header={<Text strong>{faq.question}</Text>} 
                          key={qIdx}
                        >
                          <Paragraph style={{ marginBottom: 0 }}>
                            {faq.answer}
                          </Paragraph>
                        </Panel>
                      ))}
                    </Collapse>
                  </div>
                ))
              )}

            </Card>
          </Col>

          {/* Columna Derecha: Contacto */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              
              {/* Formulario de Contacto */}
              <Card 
                title="¿No encontraste lo que buscabas?"
                style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <Paragraph type="secondary">
                  Envianos tu consulta y te responderemos a la brevedad
                </Paragraph>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmitContact}
                >
                  <Form.Item
                    name="name"
                    label="Nombre"
                    rules={[{ required: true, message: 'Ingresá tu nombre' }]}
                  >
                    <Input placeholder="Tu nombre" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Ingresá tu email' },
                      { type: 'email', message: 'Email inválido' }
                    ]}
                  >
                    <Input placeholder="tu@email.com" />
                  </Form.Item>

                  <Form.Item
                    name="subject"
                    label="Asunto"
                    rules={[{ required: true, message: 'Ingresá el asunto' }]}
                  >
                    <Input placeholder="¿En qué podemos ayudarte?" />
                  </Form.Item>

                  <Form.Item
                    name="message"
                    label="Mensaje"
                    rules={[{ required: true, message: 'Ingresá tu mensaje' }]}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Describí tu consulta..."
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block
                      loading={loading}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        height: 40,
                        fontWeight: 600
                      }}
                    >
                      Enviar Mensaje
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* Otros Canales de Contacto */}
              <Card 
                title="Otros canales de contacto"
                style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  
                  <div>
                    <Text strong><MailOutlined /> Email</Text>
                    <br />
                    <Text type="secondary">soporte@ticketera.com</Text>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <Text strong><PhoneOutlined /> Teléfono</Text>
                    <br />
                    <Text type="secondary">0800-TICKETS (842-5387)</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Lun a Vie 9:00 - 18:00 hs
                    </Text>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <Text strong><WhatsAppOutlined /> WhatsApp</Text>
                    <br />
                    <Button 
                      type="link" 
                      style={{ padding: 0, height: 'auto' }}
                      href="https://wa.me/5491112345678"
                      target="_blank"
                    >
                      +54 9 11 1234-5678
                    </Button>
                  </div>

                </Space>
              </Card>

            </Space>
          </Col>

        </Row>

      </div>
    </div>
  );
}
