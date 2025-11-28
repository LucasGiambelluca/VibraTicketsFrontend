import React, { useState } from 'react';
import {
  Input, Button, Space, Tag, Card, Alert,
  Typography, Spin, Row, Col, Divider
} from 'antd';
import {
  TagsOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PercentageOutlined, DollarOutlined, LoadingOutlined
} from '@ant-design/icons';
import { discountService } from '../services/discountService';

const { Text, Title } = Typography;

const DiscountCode = ({ 
  orderTotal, 
  onDiscountApplied, 
  userId,
  disabled = false 
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [error, setError] = useState(null);

  const handleValidateCode = async () => {
    if (!code.trim()) {
      setError('Por favor, ingrese un código');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const result = await discountService.validateCode(
        code.trim(),
        orderTotal,
        userId
      );

      if (result.valid) {
        setAppliedDiscount(result.discount);
        if (onDiscountApplied) {
          onDiscountApplied(result.discount);
        }
      } else {
        setError(result.message || 'Código inválido');
        setAppliedDiscount(null);
      }
    } catch (error) {
      setError('Error al validar el código');
      setAppliedDiscount(null);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setCode('');
    setError(null);
    if (onDiscountApplied) {
      onDiscountApplied(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !validating && !appliedDiscount) {
      handleValidateCode();
    }
  };

  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.discount_type === 'PERCENTAGE') {
      const amount = (orderTotal * appliedDiscount.discount_value) / 100;
      // Aplicar el tope máximo si existe
      if (appliedDiscount.maximum_discount && amount > appliedDiscount.maximum_discount) {
        return appliedDiscount.maximum_discount;
      }
      return amount;
    } else {
      // FIXED_AMOUNT
      return Math.min(appliedDiscount.discount_value, orderTotal);
    }
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = orderTotal - discountAmount;

  return (
    <Card
      style={{ 
        borderRadius: '12px',
        border: '1px solid #f0f0f0',
        marginBottom: '16px'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Space align="center" style={{ marginBottom: '12px' }}>
            <TagsOutlined style={{ fontSize: '20px', color: '#667eea' }} />
            <Title level={5} style={{ margin: 0 }}>
              Código de Descuento
            </Title>
          </Space>

          {!appliedDiscount ? (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size="large"
                placeholder="Ingresá tu código"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={disabled || validating}
                style={{
                  textTransform: 'uppercase',
                  borderRadius: '8px 0 0 8px'
                }}
                prefix={<TagsOutlined style={{ color: '#999' }} />}
              />
              <Button
                type="primary"
                size="large"
                onClick={handleValidateCode}
                loading={validating}
                disabled={disabled || !code.trim()}
                style={{
                  borderRadius: '0 8px 8px 0',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  minWidth: '120px'
                }}
              >
                {validating ? 'Validando...' : 'Aplicar'}
              </Button>
            </Space.Compact>
          ) : (
            <Alert
              message={
                <Space>
                  <CheckCircleOutlined />
                  Código aplicado exitosamente
                </Space>
              }
              description={
                <div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Tag color="success" style={{ fontSize: '14px' }}>
                        {appliedDiscount.code}
                      </Tag>
                      <Text type="secondary">
                        {appliedDiscount.description}
                      </Text>
                    </div>
                    <Button 
                      type="link" 
                      danger 
                      onClick={handleRemoveDiscount}
                      style={{ padding: 0 }}
                    >
                      Quitar descuento
                    </Button>
                  </Space>
                </div>
              }
              type="success"
              showIcon={false}
              style={{ borderRadius: '8px' }}
            />
          )}

          {error && !appliedDiscount && (
            <Alert
              message={error}
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              style={{ 
                marginTop: '12px',
                borderRadius: '8px' 
              }}
              closable
              onClose={() => setError(null)}
            />
          )}
        </div>

        {appliedDiscount && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ 
              background: '#f7f7f7', 
              padding: '16px',
              borderRadius: '8px'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Row justify="space-between">
                  <Col>
                    <Text type="secondary">Subtotal:</Text>
                  </Col>
                  <Col>
                    <Text>${orderTotal.toLocaleString('es-AR')}</Text>
                  </Col>
                </Row>

                <Row justify="space-between">
                  <Col>
                    <Space>
                      {appliedDiscount.discount_type === 'PERCENTAGE' ? (
                        <>
                          <PercentageOutlined style={{ color: '#52c41a' }} />
                          <Text type="success">
                            Descuento ({appliedDiscount.discount_value}%):
                          </Text>
                        </>
                      ) : (
                        <>
                          <DollarOutlined style={{ color: '#52c41a' }} />
                          <Text type="success">
                            Descuento:
                          </Text>
                        </>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Text type="success" strong>
                      -${discountAmount.toLocaleString('es-AR')}
                    </Text>
                  </Col>
                </Row>

                {appliedDiscount.maximum_discount && 
                 appliedDiscount.discount_type === 'PERCENTAGE' &&
                 discountAmount === appliedDiscount.maximum_discount && (
                  <Row>
                    <Col span={24}>
                      <Alert
                        message={`Descuento máximo aplicado: $${appliedDiscount.maximum_discount.toLocaleString('es-AR')}`}
                        type="info"
                        showIcon={false}
                        style={{ 
                          padding: '4px 12px',
                          fontSize: '12px'
                        }}
                      />
                    </Col>
                  </Row>
                )}

                <Divider style={{ margin: '8px 0' }} />

                <Row justify="space-between">
                  <Col>
                    <Text strong style={{ fontSize: '16px' }}>
                      Total a pagar:
                    </Text>
                  </Col>
                  <Col>
                    <Text 
                      strong 
                      style={{ 
                        fontSize: '20px',
                        color: '#667eea'
                      }}
                    >
                      ${finalTotal.toLocaleString('es-AR')}
                    </Text>
                  </Col>
                </Row>

                <Row>
                  <Col span={24}>
                    <Tag 
                      color="green" 
                      style={{ 
                        width: '100%', 
                        textAlign: 'center',
                        padding: '4px',
                        marginTop: '8px'
                      }}
                    >
                      ¡Ahorraste ${discountAmount.toLocaleString('es-AR')}!
                    </Tag>
                  </Col>
                </Row>
              </Space>
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default DiscountCode;
