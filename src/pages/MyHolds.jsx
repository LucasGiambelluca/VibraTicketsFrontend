import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Switch,
  Empty,
  Spin,
  message,
  Tag,
  Progress,
  Modal,
  Space,
  Statistic
} from 'antd';
import {
  ClockCircleOutlined,
  ShoppingCartOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usersApi, holdsApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import './MyHolds.css';

const MyHolds = () => {
  const { confirm } = Modal;
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [holds, setHolds] = useState([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [countdowns, setCountdowns] = useState({});

  // Cargar holds al montar
  useEffect(() => {
    if (isAuthenticated()) {
      loadHolds();
    } else {
      message.warning('Debes iniciar sesión para ver tus reservas');
      navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holds]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (activeOnly) {
        loadHolds(false); // Silent refresh
      }
    }, 10000);

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  // ============================================
  // FUNCIONES
  // ============================================
  
  const loadHolds = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await usersApi.getMyHolds({ active: activeOnly });
      
      if (response.success) {
        setHolds(response.data.holds);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
      if (showLoading) {
        message.error('Error al cargar reservas');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updateCountdowns = () => {
    const newCountdowns = {};
    
    holds.forEach(hold => {
      if (hold.status === 'ACTIVE') {
        const now = new Date();
        const expires = new Date(hold.expires_at);
        const diff = expires - now;
        
        if (diff <= 0) {
          newCountdowns[hold.hold_id] = { expired: true };
          // Marcar como expirado y recargar
          setTimeout(() => loadHolds(false), 1000);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          const percentage = (diff / (15 * 60 * 1000)) * 100; // 15 min TTL
          
          newCountdowns[hold.hold_id] = {
            expired: false,
            minutes,
            seconds,
            percentage,
            text: `${minutes}:${seconds.toString().padStart(2, '0')}`
          };
        }
      }
    });
    
    setCountdowns(newCountdowns);
  };

  const handleContinuePurchase = (holdId) => {
    navigate(`/checkout/${holdId}`);
  };

  const handleCancelHold = async (holdId) => {
    confirm({
      title: '¿Cancelar reserva?',
      icon: <ExclamationCircleOutlined />,
      content: 'Los asientos reservados estarán disponibles para otros usuarios.',
      okText: 'Sí, cancelar',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await holdsApi.cancelHold(holdId);
          message.success('Reserva cancelada exitosamente');
          loadHolds();
        } catch (error) {
          message.error('Error al cancelar reserva');
        }
      }
    });
  };

  const handleRetryHold = (hold) => {
    // Redirigir al show para hacer nueva reserva
    navigate(`/shows/${hold.show_id}`);
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(cents / 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage > 60) return '#52c41a';
    if (percentage > 30) return '#faad14';
    return '#ff4d4f';
  };

  // ============================================
  // RENDERS
  // ============================================
  
  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Cargando reservas..." />
      </div>
    );
  }

  return (
    <div className="my-holds-page">
      {/* Header */}
      <Card className="holds-header">
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              <ClockCircleOutlined style={{ marginRight: 12 }} />
              Mis Reservas
            </h1>
          </Col>
          <Col>
            <Space size="middle">
              <span style={{ marginRight: 8 }}>Solo activas:</span>
              <Switch
                checked={activeOnly}
                onChange={setActiveOnly}
                checkedChildren="SÍ"
                unCheckedChildren="NO"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadHolds()}
                loading={loading}
              >
                Actualizar
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => navigate('/')}
              >
                Explorar Eventos
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas */}
      {holds.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total de Reservas"
                value={holds.length}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Reservas Activas"
                value={holds.filter(h => h.status === 'ACTIVE').length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Reservado"
                value={formatCurrency(
                  holds
                    .filter(h => h.status === 'ACTIVE')
                    .reduce((sum, h) => sum + h.total_cents, 0)
                )}
                prefix="💰"
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Lista de Reservas */}
      {holds.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              activeOnly 
                ? 'No tienes reservas activas' 
                : 'Aún no has hecho ninguna reserva'
            }
          >
            <Button type="primary" onClick={() => navigate('/')}>
              Explorar Eventos
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {holds.map(hold => {
            const countdown = countdowns[hold.hold_id];
            const isActive = hold.status === 'ACTIVE';
            const isExpired = countdown?.expired || hold.status === 'EXPIRED';

            return (
              <Col key={hold.hold_id} xs={24} sm={24} md={12} lg={8}>
                <Card
                  className={`hold-card ${isActive ? 'active' : 'expired'}`}
                  hoverable
                >
                  {/* Header */}
                  <div className="hold-card-header">
                    <h3>🎸 {hold.event_name}</h3>
                    <Tag color={isActive ? 'green' : 'red'}>
                      {isActive ? 'ACTIVA' : 'EXPIRADA'}
                    </Tag>
                  </div>

                  {/* Info */}
                  <div className="hold-card-body">
                    <p>
                      <strong>📍 Venue:</strong> {hold.venue || 'N/A'}
                    </p>
                    <p>
                      <strong>📅 Fecha:</strong>{' '}
                      {new Date(hold.show_starts_at).toLocaleDateString('es-AR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p>
                      <strong>🕐 Hora:</strong>{' '}
                      {new Date(hold.show_starts_at).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Countdown para reservas activas */}
                    {isActive && countdown && !countdown.expired && (
                      <div className="countdown-section">
                        <div className="countdown-timer">
                          <ClockCircleOutlined style={{ fontSize: 20, marginRight: 8 }} />
                          <span className="countdown-text">{countdown.text}</span>
                        </div>
                        <Progress
                          percent={countdown.percentage}
                          strokeColor={getProgressColor(countdown.percentage)}
                          showInfo={false}
                          strokeWidth={12}
                        />
                        <p className="countdown-label">
                          {countdown.percentage > 50
                            ? 'Tiempo restante'
                            : countdown.percentage > 25
                            ? '⚠️ Apresúrate!'
                            : '🚨 Poco tiempo!'}
                        </p>
                      </div>
                    )}

                    {/* Info de asientos */}
                    <div className="seats-info">
                      <p><strong>💺 Asientos:</strong> {hold.seat_count}</p>
                      {hold.seats && hold.seats.length > 0 && (
                        <div className="seats-list">
                          {hold.seats.slice(0, 3).map(seat => (
                            <Tag key={seat.seat_id}>
                              {seat.sector} - {seat.seat_number}
                            </Tag>
                          ))}
                          {hold.seats.length > 3 && (
                            <Tag>+{hold.seats.length - 3} más</Tag>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="total-section">
                      <h4>Total: {formatCurrency(hold.total_cents)}</h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="hold-card-actions">
                    {isActive && !isExpired ? (
                      <>
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          block
                          onClick={() => handleContinuePurchase(hold.hold_id)}
                          size="large"
                        >
                          Continuar Compra
                        </Button>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          block
                          onClick={() => handleCancelHold(hold.hold_id)}
                          style={{ marginTop: 8 }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="expired-message">
                          <ExclamationCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                          <p>Esta reserva ha expirado</p>
                        </div>
                        <Button
                          type="primary"
                          block
                          onClick={() => handleRetryHold(hold)}
                        >
                          Intentar Nuevamente
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default MyHolds;
