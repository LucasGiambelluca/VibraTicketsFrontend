import React from 'react';
import { List, Typography, Space, Tag, Avatar, Card, Row, Col, Divider } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getEventImageUrl } from '../../utils/imageUtils';

const { Text, Title } = Typography;

const OrderSummary = ({ event, show, seats, holdData, subtotal, serviceCharge, discountAmount, total }) => {
  if (!event && !holdData) return null;

  // Obtener la información del evento desde holdData si no viene directamente
  const eventData = event || holdData?.event || {};
  const showData = show || holdData?.show || {};
  const seatsData = seats || holdData?.items || holdData?.seats || [];

  // Formatear fecha del show
  const formatShowDate = (date) => {
    if (!date) return 'Fecha por confirmar';
    
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Agrupar asientos por sección
  const groupSeatsBySection = (seats) => {
    const grouped = {};
    seats.forEach(seat => {
      const section = seat.section || seat.sector || 'General';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(seat);
    });
    return grouped;
  };

  const groupedSeats = groupSeatsBySection(seatsData);

  return (
    <div className="order-summary">
      {/* Información del Evento */}
      <Card 
        bordered={false}
        style={{ 
          marginBottom: 16,
          background: 'linear-gradient(135deg, #667eea05, #764ba205)',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flexShrink: 0 }}>
            <Avatar 
              src={getEventImageUrl(eventData, 'square')} 
              size={80} 
              shape="square"
              style={{ 
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={4} style={{ margin: 0, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {eventData.name || 'Evento'}
            </Title>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Text ellipsis>
                <CalendarOutlined style={{ marginRight: 8, color: '#667eea' }} />
                {formatShowDate(showData.starts_at || showData.startsAt)}
              </Text>
              <Text ellipsis>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#667eea' }} />
                {eventData.venue_name || eventData.venueName || 'Venue'} 
                {eventData.venue_city && ` - ${eventData.venue_city}`}
              </Text>
              {holdData?.customerName && (
                <Text ellipsis>
                  <UserOutlined style={{ marginRight: 8, color: '#667eea' }} />
                  {holdData.customerName}
                </Text>
              )}
            </Space>
          </div>
        </div>
      </Card>

      {/* Lista de Asientos por Sección */}
      <Card 
        title={
          <Space>
            <Text strong>Asientos Seleccionados</Text>
            <Tag color="blue">{seatsData.length} {seatsData.length === 1 ? 'entrada' : 'entradas'}</Tag>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.4)' }}
      >
        {Object.entries(groupedSeats).map(([section, sectionSeats]) => (
          <div key={section} style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#667eea', marginBottom: 8, display: 'block' }}>
              {section}
            </Text>
            <List
              size="small"
              dataSource={sectionSeats}
              renderItem={(seat) => {
                const price = seat.price || seat.price_cents || 0;
                const priceDisplay = typeof price === 'number' 
                  ? (price > 100000 ? price / 100 : price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0,00';

                return (
                  <List.Item
                    style={{ 
                      background: '#fafafa', 
                      padding: '8px 12px', 
                      marginBottom: 4,
                      borderRadius: '8px'
                    }}
                    extra={
                      <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        ${priceDisplay}
                      </Text>
                    }
                  >
                    <Space>
                      <Tag color="geekblue">
                        Fila {seat.row || seat.row_label || '-'}
                      </Tag>
                      <Text>
                        Asiento {seat.number || seat.seat_label || seat.seat_number || '-'}
                      </Text>
                      {seat.category && (
                        <Tag>{seat.category}</Tag>
                      )}
                    </Space>
                  </List.Item>
                );
              }}
            />
          </div>
        ))}

        {/* Desglose de Totales */}
        <Divider />
        
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Subtotal */}
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ fontSize: '15px' }}>Subtotal:</Text>
            </Col>
            <Col>
              <Text strong style={{ fontSize: '15px' }}>
                ${subtotal ? 
                  (typeof subtotal === 'number' ? subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00') 
                  : '0,00'}
              </Text>
            </Col>
          </Row>

          {/* Service Charge */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={4}>
                <Text style={{ fontSize: '15px' }}>Cargo por servicio:</Text>
                <Tag color="blue" style={{ fontSize: '11px' }}>15%</Tag>
              </Space>
            </Col>
            <Col>
              <Text strong style={{ fontSize: '15px' }}>
                ${serviceCharge ? 
                  (typeof serviceCharge === 'number' ? serviceCharge.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00') 
                  : '0,00'}
              </Text>
            </Col>
          </Row>

          {/* Descuento (solo si aplica) */}
          {discountAmount > 0 && (
            <Row justify="space-between" align="middle">
              <Col>
                <Text style={{ fontSize: '15px', color: '#52c41a' }}>Descuento:</Text>
              </Col>
              <Col>
                <Text strong style={{ fontSize: '15px', color: '#52c41a' }}>
                  -${discountAmount ? 
                    (typeof discountAmount === 'number' ? discountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00') 
                    : '0,00'}
                </Text>
              </Col>
            </Row>
          )}

          <Divider style={{ margin: '8px 0' }} />

          {/* Total Final */}
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong style={{ fontSize: '18px' }}>Total:</Text>
            </Col>
            <Col>
              <Title level={3} style={{ margin: 0, color: '#667eea' }}>
                ${total ? 
                  (typeof total === 'number' ? total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00') 
                  : '0,00'}
              </Title>
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default OrderSummary;
