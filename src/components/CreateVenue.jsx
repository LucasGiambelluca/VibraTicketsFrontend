import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, message, Space, Row, Col, Divider } from 'antd';
import { venuesApi } from '../services/apiService';

const { TextArea } = Input;

export default function CreateVenue({ onVenueCreated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Preparar datos del venue según el backend
      const venueData = {
        name: values.name,
        address: values.address,
        city: values.city,
        max_capacity: values.maxCapacity, // Backend espera max_capacity con guión bajo
        state: values.state || '',
        country: values.country || 'Argentina',
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        phone: values.phone || '',
        email: values.email || '',
        description: values.description || ''
      };

      // Llamar a la API
      const response = await venuesApi.createVenue(venueData);
      
      message.success('Venue creado exitosamente');
      
      // Resetear formulario
      form.resetFields();
      
      // Callback para notificar al padre
      if (onVenueCreated) {
        onVenueCreated(response.data || response);
      }
    } catch (error) {
      console.error('❌ Error al crear venue:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear el venue';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      <div style={{ 
        background: '#f0f5ff', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 16,
        border: '1px solid #d6e4ff'
      }}>
        <span style={{ fontSize: 13 }}>
          💡 <strong>Tip:</strong> Un venue es el lugar físico donde se realizan los eventos (teatro, estadio, club, etc.)
        </span>
      </div>

      <Divider orientation="left">Información Básica</Divider>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="🏟️ Nombre del Venue"
            name="name"
            rules={[
              { required: true, message: 'Ingresá el nombre del venue' },
              { min: 3, message: 'Mínimo 3 caracteres' }
            ]}
          >
            <Input 
              placeholder="Ej: Teatro Colón, Luna Park, Movistar Arena" 
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="📍 Dirección"
            name="address"
            rules={[{ required: true, message: 'Ingresá la dirección' }]}
          >
            <Input placeholder="Ej: Av. Corrientes 1234" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="🏙️ Ciudad"
            name="city"
            rules={[{ required: true, message: 'Ingresá la ciudad' }]}
          >
            <Input placeholder="Ej: Buenos Aires, Rosario, Córdoba" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Provincia/Estado"
            name="state"
          >
            <Input placeholder="Ej: CABA, Santa Fe" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="País"
            name="country"
            initialValue="Argentina"
          >
            <Input placeholder="Argentina" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="👥 Capacidad Máxima"
            name="maxCapacity"
            rules={[
              { required: true, message: 'Ingresá la capacidad' },
              { type: 'number', min: 1, message: 'Debe ser mayor a 0' }
            ]}
          >
            <InputNumber 
              placeholder="1000" 
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Contacto (Opcional)</Divider>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="📞 Teléfono"
            name="phone"
          >
            <Input placeholder="+54 11 1234-5678" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="📧 Email"
            name="email"
            rules={[{ type: 'email', message: 'Email inválido' }]}
          >
            <Input placeholder="contacto@venue.com" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Ubicación GPS (Opcional)</Divider>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Latitud"
            name="latitude"
            rules={[{ type: 'number', min: -90, max: 90, message: 'Latitud inválida' }]}
          >
            <InputNumber 
              placeholder="-34.603722" 
              style={{ width: '100%' }}
              step={0.000001}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Longitud"
            name="longitude"
            rules={[{ type: 'number', min: -180, max: 180, message: 'Longitud inválida' }]}
          >
            <InputNumber 
              placeholder="-58.381592" 
              style={{ width: '100%' }}
              step={0.000001}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="Descripción"
        name="description"
      >
        <TextArea 
          rows={3} 
          placeholder="Descripción del venue, características especiales, etc."
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => form.resetFields()}>
            Limpiar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              fontWeight: 600
            }}
          >
            Crear Venue
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
