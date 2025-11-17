import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Select, Button, Upload, Row, Col, Space, message, Steps } from 'antd';
import { UploadOutlined, FileTextOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

export default function SoporteTickets() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Animaciones GSAP
    gsap.fromTo('.form-container', 
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );

    gsap.fromTo('.steps-container', 
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
    );
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('¡Solicitud enviada exitosamente! Te contactaremos pronto.');
      form.resetFields();
      setCurrentStep(0);
    } catch (error) {
      message.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const problemTypes = [
    'No puedo descargar mi ticket',
    'Error en los datos del ticket',
    'Problema con el código QR',
    'No recibí el email de confirmación',
    'Quiero cambiar los datos del comprador',
    'Solicitar reembolso',
    'Problema con el pago',
    'Evento cancelado/reprogramado',
    'Otro problema'
  ];

  const priorities = [
    { value: 'low', label: 'Baja - No es urgente', color: '#52c41a' },
    { value: 'medium', label: 'Media - Necesito ayuda pronto', color: '#faad14' },
    { value: 'high', label: 'Alta - Es urgente', color: '#ff4d4f' }
  ];

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            Enviar Solicitud
          </Title>
          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
            Completa el formulario y te ayudaremos con tu problema
          </Text>
          <div style={{ marginTop: 16 }}>
            <Link to="/soporte">
              <Button type="link">← Volver al Centro de Ayuda</Button>
            </Link>
          </div>
        </div>

        {/* Steps */}
        <Card className="steps-container" style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Steps current={currentStep} size="small">
            <Step title="Información" description="Datos básicos" />
            <Step title="Problema" description="Describe tu consulta" />
            <Step title="Archivos" description="Adjunta documentos" />
            <Step title="Envío" description="Confirma y envía" />
          </Steps>
        </Card>

        {/* Formulario */}
        <Card className="form-container" style={{ 
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={() => {
              const values = form.getFieldsValue();
              if (values.email && values.problemType) setCurrentStep(1);
              if (values.description) setCurrentStep(2);
              if (values.files) setCurrentStep(3);
            }}
          >
            {/* Información Personal */}
            <div style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                Información de Contacto
              </Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Nombre completo"
                    name="fullName"
                    rules={[{ required: true, message: 'Ingrese su nombre completo' }]}
                  >
                    <Input 
                      prefix={<FileTextOutlined />}
                      placeholder="Juan Pérez"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Ingrese su email' },
                      { type: 'email', message: 'Email inválido' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />}
                      placeholder="juan@ejemplo.com"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Teléfono"
                    name="phone"
                    rules={[{ required: true, message: 'Ingrese su teléfono' }]}
                  >
                    <Input 
                      prefix={<PhoneOutlined />}
                      placeholder="+54 11 1234-5678"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Número de orden (opcional)"
                    name="orderNumber"
                  >
                    <Input 
                      placeholder="ORD-2024-001234"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Problema */}
            <div style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                Describe tu Problema
              </Title>

              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    label="Tipo de problema"
                    name="problemType"
                    rules={[{ required: true, message: 'Seleccione el tipo de problema' }]}
                  >
                    <Select 
                      placeholder="Selecciona tu problema"
                      size="large"
                    >
                      {problemTypes.map((type, index) => (
                        <Option key={index} value={type}>{type}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Prioridad"
                    name="priority"
                    rules={[{ required: true, message: 'Seleccione la prioridad' }]}
                  >
                    <Select 
                      placeholder="Prioridad"
                      size="large"
                    >
                      {priorities.map((priority) => (
                        <Option key={priority.value} value={priority.value}>
                          <span style={{ color: priority.color }}>●</span> {priority.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Descripción detallada"
                name="description"
                rules={[{ required: true, message: 'Describe tu problema' }]}
              >
                <TextArea 
                  rows={6}
                  placeholder="Describe tu problema con el mayor detalle posible. Incluye pasos que seguiste, mensajes de error, etc."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item
                label="¿Cuándo ocurrió el problema?"
                name="whenOccurred"
              >
                <Input 
                  placeholder="Ej: Hace 2 horas, ayer por la noche, etc."
                  size="large"
                />
              </Form.Item>
            </div>

            {/* Archivos */}
            <div style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                Archivos Adjuntos (Opcional)
              </Title>
              
              <Form.Item
                label="Sube capturas de pantalla o documentos que ayuden a resolver tu problema"
                name="files"
              >
                <Upload.Dragger
                  multiple
                  beforeUpload={() => false}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">
                    Haz clic o arrastra archivos aquí para subirlos
                  </p>
                  <p className="ant-upload-hint">
                    Formatos: JPG, PNG, PDF, DOC. Máximo 10MB por archivo.
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </div>

            {/* Información adicional */}
            <div style={{
              background: '#f8f9fa',
              padding: 20,
              borderRadius: 12,
              marginBottom: 24
            }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Información Importante
              </Title>
              <Space direction="vertical" size={8}>
                <Text>• Responderemos a tu consulta en un plazo máximo de 24 horas</Text>
                <Text>• Para problemas urgentes, puedes llamar al +54 11 4000-0000</Text>
                <Text>• Ten a mano tu número de orden para agilizar el proceso</Text>
                <Text>• Las capturas de pantalla nos ayudan a resolver más rápido tu problema</Text>
              </Space>
            </div>

            {/* Botones */}
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Link to="/soporte">
                  <Button size="large">
                    Cancelar
                  </Button>
                </Link>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    minWidth: 120
                  }}
                >
                  Enviar Solicitud
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        {/* Métodos de contacto alternativos */}
        <Card style={{ 
          marginTop: 24,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white'
        }}>
          <Row gutter={32} align="middle">
            <Col span={16}>
              <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                ¿Necesitas ayuda inmediata?
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                Nuestro equipo está disponible por teléfono y email
              </Text>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Space direction="vertical" size={4}>
                <Text style={{ color: 'white', fontWeight: 600 }}>
                  📞 +54 11 4000-0000
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Lun a Vie: 9:00 - 18:00
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}
