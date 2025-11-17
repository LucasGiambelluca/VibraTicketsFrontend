import React from 'react';
import { Card, Typography, Form, Input, Button, Row, Col, Select, Checkbox, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

export default function DatosContacto() {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    // TODO: Enviar datos al backend
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            HEADER
          </Title>
          <Title level={1} style={{ 
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: 8
          }}>
            dua lipa
          </Title>
          <Text style={{ fontSize: '1.2rem', color: '#666' }}>
            radical optimism tour
          </Text>
        </div>

        {/* Información del Evento */}
        <Card style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Row gutter={16}>
            <Col span={8}>
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=150&fit=crop"
                alt="Dua Lipa"
                style={{ 
                  width: '100%', 
                  height: 120, 
                  objectFit: 'cover', 
                  borderRadius: 8 
                }}
              />
            </Col>
            <Col span={16}>
              <Space direction="vertical">
                <div>
                  <Text strong>Evento:</Text>
                  <br />
                  <Text>Dua Lipa - Radical Optimism Tour</Text>
                </div>
                <div>
                  <Text strong>Fecha:</Text>
                  <br />
                  <Text>Miércoles 9 de Octubre - 21:00 HS</Text>
                </div>
                <div>
                  <Text strong>Lugar:</Text>
                  <br />
                  <Text>Estadio River Plate</Text>
                </div>
                <div>
                  <Text strong>Total:</Text>
                  <br />
                  <Text style={{ fontSize: '1.2rem', fontWeight: 600, color: '#52c41a' }}>
                    $104.000,00
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Formulario */}
        <Card style={{ 
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Title level={3} style={{ marginBottom: 24 }}>
            Datos del Contacto
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              country: 'AR',
              province: 'CABA'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Nombre"
                  name="firstName"
                  rules={[{ required: true, message: 'Ingrese su nombre' }]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    placeholder="Nombre"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Apellido"
                  name="lastName"
                  rules={[{ required: true, message: 'Ingrese su apellido' }]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    placeholder="Apellido"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
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
                    placeholder="email@ejemplo.com"
                    size="large"
                  />
                </Form.Item>
              </Col>
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
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="País"
                  name="country"
                  rules={[{ required: true, message: 'Seleccione el país' }]}
                >
                  <Select size="large" placeholder="País">
                    <Option value="AR">Argentina</Option>
                    <Option value="UY">Uruguay</Option>
                    <Option value="CL">Chile</Option>
                    <Option value="BR">Brasil</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Provincia"
                  name="province"
                  rules={[{ required: true, message: 'Seleccione la provincia' }]}
                >
                  <Select size="large" placeholder="Provincia">
                    <Option value="CABA">CABA</Option>
                    <Option value="BA">Buenos Aires</Option>
                    <Option value="CB">Córdoba</Option>
                    <Option value="SF">Santa Fe</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Ciudad"
                  name="city"
                  rules={[{ required: true, message: 'Ingrese la ciudad' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined />}
                    placeholder="Ciudad"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Dirección"
              name="address"
              rules={[{ required: true, message: 'Ingrese su dirección' }]}
            >
              <Input 
                prefix={<EnvironmentOutlined />}
                placeholder="Calle y número"
                size="large"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Código Postal"
                  name="zipCode"
                  rules={[{ required: true, message: 'Ingrese el código postal' }]}
                >
                  <Input 
                    placeholder="1234"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="DNI/Documento"
                  name="document"
                  rules={[{ required: true, message: 'Ingrese su documento' }]}
                >
                  <Input 
                    placeholder="12.345.678"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Checkboxes */}
            <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
              <Form.Item
                name="terms"
                valuePropName="checked"
                rules={[{ required: true, message: 'Debe aceptar los términos' }]}
              >
                <Checkbox>
                  Acepto los <a href="#" style={{ color: '#1890ff' }}>Términos y Condiciones</a>
                </Checkbox>
              </Form.Item>

              <Form.Item
                name="newsletter"
                valuePropName="checked"
              >
                <Checkbox>
                  Quiero recibir información sobre próximos eventos
                </Checkbox>
              </Form.Item>

              <Form.Item
                name="privacy"
                valuePropName="checked"
                rules={[{ required: true, message: 'Debe aceptar la política de privacidad' }]}
              >
                <Checkbox>
                  Acepto la <a href="#" style={{ color: '#1890ff' }}>Política de Privacidad</a>
                </Checkbox>
              </Form.Item>
            </Space>

            {/* Botones */}
            <div style={{ 
              marginTop: 32, 
              display: 'flex', 
              gap: 16, 
              justifyContent: 'flex-end' 
            }}>
              <Link to="/checkout/123">
                <Button size="large" style={{ minWidth: 120 }}>
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  minWidth: 120
                }}
              >
                Continuar
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
