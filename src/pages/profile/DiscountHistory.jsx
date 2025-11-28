import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Typography, Empty, 
  Statistic, Row, Col, Timeline, Spin,
  Button, DatePicker, Space, message
} from 'antd';
import { 
  TagsOutlined, SaveOutlined, 
  ShoppingOutlined, CalendarOutlined,
  TrophyOutlined, PercentageOutlined,
  DollarOutlined, HistoryOutlined
} from '@ant-design/icons';
import { discountService } from '../../services/discountService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DiscountHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [statistics, setStatistics] = useState({
    totalSaved: 0,
    totalUses: 0,
    averageSaving: 0,
    bestDiscount: null
  });

  useEffect(() => {
    loadHistory();
  }, [dateRange]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const data = await discountService.getUserHistory(params);
      
      if (data && data.history) {
        setHistory(data.history);
        
        // Calcular estadísticas
        const totalSaved = data.history.reduce((sum, item) => 
          sum + (item.discount_amount || 0), 0
        );
        
        const bestDiscount = data.history.reduce((best, item) => 
          (!best || item.discount_amount > best.discount_amount) ? item : best, null
        );

        setStatistics({
          totalSaved,
          totalUses: data.history.length,
          averageSaving: data.history.length > 0 
            ? totalSaved / data.history.length 
            : 0,
          bestDiscount
        });
      } else {
        setHistory([]);
        setStatistics({
          totalSaved: 0,
          totalUses: 0,
          averageSaving: 0,
          bestDiscount: null
        });
      }
    } catch (error) {
      console.error('Error loading discount history:', error);
      message.error('Error al cargar el historial de descuentos');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleExport = () => {
    // Implementar exportación a CSV
    message.info('Función de exportación próximamente disponible');
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'code',
      key: 'code',
      render: (code) => (
        <Tag color="blue" style={{ fontSize: '13px' }}>
          <TagsOutlined /> {code}
        </Tag>
      )
    },
    {
      title: 'Evento',
      dataIndex: 'event_name',
      key: 'event_name',
      ellipsis: true,
      render: (name) => (
        <Text strong>{name || 'Evento'}</Text>
      )
    },
    {
      title: 'Fecha de Uso',
      dataIndex: 'used_at',
      key: 'used_at',
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#667eea' }} />
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </Space>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'discount_type',
      key: 'discount_type',
      render: (type) => (
        <Tag color={type === 'PERCENTAGE' ? 'green' : 'gold'}>
          {type === 'PERCENTAGE' ? (
            <><PercentageOutlined /> Porcentaje</>
          ) : (
            <><DollarOutlined /> Monto Fijo</>
          )}
        </Tag>
      )
    },
    {
      title: 'Descuento',
      dataIndex: 'discount_amount',
      key: 'discount_amount',
      render: (amount, record) => (
        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
          -{record.discount_type === 'PERCENTAGE' && record.discount_value
            ? `${record.discount_value}% `
            : ''
          }
          (${(amount || 0).toLocaleString('es-AR')})
        </Text>
      )
    },
    {
      title: 'Total Original',
      dataIndex: 'order_total_before',
      key: 'order_total_before',
      render: (amount) => (
        <Text style={{ textDecoration: 'line-through', color: '#999' }}>
          ${(amount || 0).toLocaleString('es-AR')}
        </Text>
      )
    },
    {
      title: 'Total Final',
      dataIndex: 'order_total_after',
      key: 'order_total_after',
      render: (amount) => (
        <Text strong style={{ fontSize: '16px' }}>
          ${(amount || 0).toLocaleString('es-AR')}
        </Text>
      )
    },
    {
      title: 'Orden',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (orderId) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => window.location.href = `/order/${orderId}`}
        >
          #{orderId}
        </Button>
      )
    }
  ];

  if (loading && !history.length) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 16 }}>
          Cargando historial de descuentos...
        </Text>
      </div>
    );
  }

  return (
    <div className="discount-history" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <HistoryOutlined style={{ marginRight: 12 }} />
          Mi Historial de Descuentos
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Revisa todos los descuentos que has usado en tus compras
        </Text>
      </div>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <SaveOutlined />
                  Total Ahorrado
                </Space>
              }
              value={statistics.totalSaved}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix="$"
              suffix="ARS"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <TagsOutlined />
                  Códigos Usados
                </Space>
              }
              value={statistics.totalUses}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <PercentageOutlined />
                  Ahorro Promedio
                </Space>
              }
              value={statistics.averageSaving}
              precision={0}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <TrophyOutlined />
                  Mayor Descuento
                </Space>
              }
              value={statistics.bestDiscount?.discount_amount || 0}
              precision={0}
              prefix="$"
              valueStyle={{ color: '#faad14' }}
            />
            {statistics.bestDiscount && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {statistics.bestDiscount.code}
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 24, borderRadius: '12px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space>
              <Text strong>Filtrar por fecha:</Text>
              <RangePicker
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                placeholder={['Fecha inicio', 'Fecha fin']}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button onClick={() => setDateRange(null)}>
                Limpiar filtros
              </Button>
              <Button type="primary" onClick={handleExport}>
                Exportar CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Historial */}
      <Card style={{ borderRadius: '12px' }}>
        {history.length > 0 ? (
          <>
            <Table
              dataSource={history}
              columns={columns}
              loading={loading}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} descuentos`,
                pageSizeOptions: ['5', '10', '20', '50']
              }}
              scroll={{ x: 1200 }}
            />
            
            {/* Línea de tiempo para móviles */}
            <div style={{ display: 'none' }} className="mobile-timeline">
              <Timeline style={{ marginTop: 24 }}>
                {history.map((item) => (
                  <Timeline.Item 
                    key={item.id}
                    color="green"
                    dot={<TagsOutlined style={{ fontSize: '16px' }} />}
                  >
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Tag color="blue">{item.code}</Tag>
                          <Text strong>{item.event_name}</Text>
                        </div>
                        <Text type="secondary">
                          {dayjs(item.used_at).format('DD/MM/YYYY HH:mm')}
                        </Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>Ahorraste:</Text>
                          <Text strong style={{ color: '#52c41a' }}>
                            ${(item.discount_amount || 0).toLocaleString('es-AR')}
                          </Text>
                        </div>
                      </Space>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </>
        ) : (
          <Empty
            description={
              <Space direction="vertical">
                <Text>No has usado códigos de descuento aún</Text>
                <Text type="secondary">
                  ¡Busca códigos disponibles en tus próximas compras!
                </Text>
              </Space>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          >
            <Button 
              type="primary" 
              onClick={() => window.location.href = '/events'}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none'
              }}
            >
              Ver Eventos
            </Button>
          </Empty>
        )}
      </Card>

      {/* Consejos */}
      {history.length > 0 && (
        <Card 
          style={{ 
            marginTop: 24, 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea05, #764ba205)'
          }}
        >
          <Title level={5}>
            💡 Tips para ahorrar más
          </Title>
          <ul style={{ marginBottom: 0 }}>
            <li>Suscríbete a nuestro newsletter para recibir códigos exclusivos</li>
            <li>Sigue nuestras redes sociales para ofertas flash</li>
            <li>Los códigos de primera compra suelen tener los mejores descuentos</li>
            <li>Algunos códigos son acumulables con otras promociones</li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default DiscountHistory;
