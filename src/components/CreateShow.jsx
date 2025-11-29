import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, message, Space, Typography, Card } from 'antd';
import { eventsApi, showsApi } from '../services/apiService';

const { Option } = Select;
const { Text } = Typography;

export default function CreateShow({ onShowCreated, onCancel }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await eventsApi.getEvents({ limit: 100, status: 'PUBLISHED' });
      const list = Array.isArray(response) ? response : (response?.events || []);
      setEvents(list);
    } catch (error) {
      message.error('Error al cargar eventos');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEventChange = (eventId) => {
    const event = events.find(e => e.id === eventId);
    setSelectedEvent(event);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const showData = {
        eventId: values.eventId,
        startsAt: values.startsAt.toISOString()
      };
      
      await showsApi.createShow(showData);
      message.success('Show creado correctamente');
      form.resetFields();
      if (onShowCreated) onShowCreated();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al crear el show';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="eventId"
        label="Evento"
        rules={[{ required: true, message: 'Seleccioná un evento' }]}
      >
        <Select
          placeholder="Seleccionar evento"
          loading={eventsLoading}
          showSearch
          onChange={handleEventChange}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {events.map(event => (
            <Option key={event.id} value={event.id}>
              {event.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedEvent && (
        <Card size="small" style={{ marginBottom: 24, background: '#f9f9f9' }}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">Venue:</Text>
            <Text strong>{selectedEvent.venue_name || 'Sin venue asignado'}</Text>
            {selectedEvent.venue_city && <Text type="secondary">{selectedEvent.venue_city}</Text>}
          </Space>
        </Card>
      )}

      <Form.Item
        name="startsAt"
        label="Fecha y Hora del Show"
        rules={[{ required: true, message: 'Seleccioná la fecha y hora' }]}
      >
        <DatePicker 
          showTime={{ format: 'HH:mm' }}
          format="DD/MM/YYYY HH:mm" 
          style={{ width: '100%' }} 
          placeholder="Seleccionar fecha y hora"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Crear Show
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
