import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Spin } from 'antd';
import { eventsApi } from '../services/apiService';

const { Title, Text } = Typography;

// Componente que llama directamente a la API sin hook
export default function EventsListDirect() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await eventsApi.getPublicEvents({
          page: 1,
          limit: 6,
          sortBy: 'next_show_date',
          sortOrder: 'ASC'
        });
        
        if (response && response.events) {
          setEvents(response.events);
          }
      } catch (err) {
        console.error('❌ EventsListDirect: Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Cargando eventos directamente...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="danger">Error: {error}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>🎯 Eventos (API Directa) - {events.length} encontrados</Title>
      <Row gutter={[16, 16]}>
        {events.map((event) => (
          <Col xs={24} sm={12} lg={8} key={event.id}>
            <Card
              title={event.name}
              extra={<Text type="secondary">ID: {event.id}</Text>}
            >
              <p><strong>Venue:</strong> {event.venue_name || event.venue || 'Sin venue'}</p>
              <p><strong>Ciudad:</strong> {event.venue_city || 'Sin ciudad'}</p>
              <p><strong>Fecha:</strong> {event.next_show_date ? new Date(event.next_show_date).toLocaleDateString() : 'Sin fecha'}</p>
              <p><strong>Shows:</strong> {event.show_count || 0}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
