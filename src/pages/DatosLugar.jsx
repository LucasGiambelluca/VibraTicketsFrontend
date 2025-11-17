import React from 'react';
import { Card, Typography, Form, Input, Button, Row, Col, Select, Space, Divider } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, GlobalOutlined, CarOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function DatosLugar() {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    // TODO: Enviar datos al backend
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '24px 32px',
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <Title level={2} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            CONFIGURAR EVENTOS - DATOS DEL LUGAR
          </Title>
          <Title level={3} style={{ marginBottom: 8 }}>
            Datos del Lugar
          </Title>
        </div>

        {/* Formulario Principal */}
        <Card style={{ 
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          marginBottom: 24
        }}>
          <Title level={4} style={{ marginBottom: 24 }}>
            Formulario Locación
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Nombre del lugar"
                  name="venueName"
                  rules={[{ required: true, message: 'Ingrese el nombre del lugar' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined />}
                    placeholder="Ej: Estadio River Plate"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Dirección del lugar"
                  name="venueAddress"
                  rules={[{ required: true, message: 'Ingrese la dirección' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined />}
                    placeholder="Av. Pres. Figueroa Alcorta 7597"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Ciudad"
                  name="city"
                  rules={[{ required: true, message: 'Ingrese la ciudad' }]}
                >
                  <Input 
                    placeholder="Buenos Aires"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Provincia/Estado"
                  name="state"
                  rules={[{ required: true, message: 'Seleccione la provincia' }]}
                >
                  <Select size="large" placeholder="Seleccionar">
                    <Option value="CABA">CABA</Option>
                    <Option value="BA">Buenos Aires</Option>
                    <Option value="CB">Córdoba</Option>
                    <Option value="SF">Santa Fe</Option>
                    <Option value="MZ">Mendoza</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Código Postal"
                  name="zipCode"
                  rules={[{ required: true, message: 'Ingrese el código postal' }]}
                >
                  <Input 
                    placeholder="1428"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              Tipos de Entradas
            </Title>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Tipo de Entrada 1"
                  name="ticketType1"
                >
                  <Input placeholder="Ej: Platea" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Tipo de Entrada 2"
                  name="ticketType2"
                >
                  <Input placeholder="Ej: Pullman" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Tipo de Entrada 3"
                  name="ticketType3"
                >
                  <Input placeholder="Ej: VIP" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Tipo de Entrada 4"
                  name="ticketType4"
                >
                  <Input placeholder="Ej: General" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Tipo de Entrada 5"
                  name="ticketType5"
                >
                  <Input placeholder="Ej: Campo" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Tipo de Entrada 6"
                  name="ticketType6"
                >
                  <Input placeholder="Ej: Palcos" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              Precios de Cada Entrada
            </Title>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Precio de Entrada 1"
                  name="price1"
                >
                  <Input prefix="$" placeholder="25000" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Precio de Entrada 2"
                  name="price2"
                >
                  <Input prefix="$" placeholder="35000" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Precio de Entrada 3"
                  name="price3"
                >
                  <Input prefix="$" placeholder="50000" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Precio de Entrada 4"
                  name="price4"
                >
                  <Input prefix="$" placeholder="20000" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Precio de Entrada 5"
                  name="price5"
                >
                  <Input prefix="$" placeholder="30000" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Precio de Entrada 6"
                  name="price6"
                >
                  <Input prefix="$" placeholder="80000" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              Asientos Plano del Evento (Layout)
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Capacidad Total"
                  name="totalCapacity"
                  rules={[{ required: true, message: 'Ingrese la capacidad total' }]}
                >
                  <Input 
                    prefix={<TeamOutlined />}
                    placeholder="70000"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tipo de Layout"
                  name="layoutType"
                  rules={[{ required: true, message: 'Seleccione el tipo de layout' }]}
                >
                  <Select size="large" placeholder="Seleccionar">
                    <Option value="stadium">Estadio</Option>
                    <Option value="theater">Teatro</Option>
                    <Option value="arena">Arena</Option>
                    <Option value="outdoor">Al aire libre</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Descripción del Layout"
              name="layoutDescription"
            >
              <TextArea 
                rows={4}
                placeholder="Describe la distribución de asientos, secciones especiales, accesos, etc."
              />
            </Form.Item>

            <Form.Item
              label="Información Adicional"
              name="additionalInfo"
            >
              <TextArea 
                rows={3}
                placeholder="Información sobre estacionamiento, transporte público, restricciones, etc."
              />
            </Form.Item>

            {/* Botones */}
            <div style={{ 
              marginTop: 32, 
              display: 'flex', 
              gap: 16, 
              justifyContent: 'center' 
            }}>
              <Button 
                size="large" 
                style={{ 
                  minWidth: 120,
                  borderRadius: 8
                }}
              >
                Cancelar
              </Button>
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
                Guardar
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
