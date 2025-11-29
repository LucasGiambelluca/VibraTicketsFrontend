import React, { useState, useEffect } from 'react';
import { 
  Input, Button, Space, Alert, Card, 
  Typography, Divider, Spin, Tag, message 
} from 'antd';
import { 
  TagOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, PercentageOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { discountService } from '../../services/discountService';

// Componente de aplicación de descuentos en checkout
// Alineado con la guía oficial de integración

const { Text, Title } = Typography;

const DiscountCodeAdvanced = ({ 
  orderTotal, 
  eventId,
  showId,
  onDiscountApplied, 
  onDiscountRemoved,
  userId
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Efecto para actualizar el descuento si cambia el total
  useEffect(() => {
    if (appliedDiscount && orderTotal !== appliedDiscount.originalTotal) {
      // Re-validar el código si el total cambió
      handleValidate(true);
    }
  }, [orderTotal]);

  const handleValidate = async (silent = false) => {
    if (!code.trim()) {
      setError('Por favor ingresa un código');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validationData = {
        code: code.toUpperCase(),
        orderTotal,
        eventId,
        showId,
      };
      
      // La nueva función validateCode devuelve directamente la data o tira un error
      const response = await discountService.validateCode(validationData);

      if (response.success && response.discount) {
        // La respuesta del backend tiene esta estructura según la guía:
        // { success: true, discount: { id, code, description, type, value, displayValue, 
        //   discountAmount, originalTotal, finalTotal, savings, savingsPercentage } }
        // IMPORTANTE: Todos los montos vienen en CENTAVOS desde el backend
        
        const discountData = {
          ...response.discount,
          code: code.toUpperCase(),
          // Convertir de centavos a pesos para el componente padre
          discountAmount: response.discount.discountAmount / 100,
          originalTotal: response.discount.originalTotal / 100,
          finalTotal: response.discount.finalTotal / 100,
          savings: response.discount.savings / 100,
          // displayValue ya viene formateado desde el backend
          displayValue: response.discount.displayValue,
          // Mantener la descripción
          description: response.discount.description,
          // Tipo del descuento (para compatibilidad)
          discountType: response.discount.type,
          discountValue: response.discount.value
        };
        
        setAppliedDiscount(discountData);
        if (onDiscountApplied) {
          onDiscountApplied(discountData);
        }
        setError(null);
        if (!silent) {
          const savingsInPesos = (response.discount.savings / 100).toFixed(2);
          message.success(`¡Código aplicado! Ahorras $${savingsInPesos}`);
        }
      } else {
        // Caso donde success = false pero no es un error HTTP
        const errorCode = response.code;
        let errorMessage = response.message || 'Código inválido o no aplicable.';
        
        // Manejar mensajes de error específicos según la guía
        switch (errorCode) {
          case 'INVALID_DISCOUNT_CODE':
            errorMessage = 'El código ingresado no es válido o ha expirado.';
            break;
          case 'MINIMUM_PURCHASE_NOT_MET':
            // El mensaje ya viene del backend con el monto mínimo
            break;
          case 'USER_USAGE_LIMIT_REACHED':
            errorMessage = 'Ya utilizaste este código anteriormente.';
            break;
          case 'CODE_USAGE_LIMIT_REACHED':
            errorMessage = 'Este código ya alcanzó su límite de usos.';
            break;
          default:
            break;
        }
        
        setError(errorMessage);
        setAppliedDiscount(null);
        if (onDiscountRemoved) onDiscountRemoved();
      }
    } catch (error) {
      // Manejar errores HTTP y de red
      let errorMessage = 'Error al validar el código';
      const errorCode = error.response?.data?.code;
      
      if (error.response?.status === 401) {
        errorMessage = 'Debes iniciar sesión para usar códigos de descuento.';
      } else if (error.response?.status === 400) {
        // Manejar errores específicos del backend
        switch (errorCode) {
          case 'INVALID_DISCOUNT_CODE':
            errorMessage = 'Código no válido o expirado.';
            break;
          case 'MinPurchaseNotMet':
          case 'MINIMUM_PURCHASE_NOT_MET':
            // El mensaje ya viene del backend con el monto mínimo (ej. "Monto mínimo de compra: $5000")
            errorMessage = error.response.data.message || 'No se alcanza el monto mínimo de compra.';
            break;
          case 'UserUsageLimitExceeded':
          case 'USER_USAGE_LIMIT_REACHED':
            errorMessage = 'Ya has utilizado este código el máximo de veces permitido.';
            break;
          case 'UsageLimitExceeded':
          case 'CODE_USAGE_LIMIT_REACHED':
            errorMessage = 'Este código ya ha alcanzado su límite de uso global.';
            break;
          case 'ExpiredCode':
            errorMessage = 'El código ha expirado.';
            break;
          case 'FutureCode':
            errorMessage = 'El código aún no está vigente.';
            break;
          default:
            errorMessage = error.response.data.message || 'Código inválido o no aplicable.';
        }
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Error de conexión. Intenta nuevamente.';
      }
      setError(errorMessage);
      setAppliedDiscount(null);
      if (onDiscountRemoved) {
        onDiscountRemoved();
      }
    } finally {
      setLoading(false);
    }
  };

  // Esta función ya no es necesaria aquí, el backend devuelve el monto calculado.
  // Se mantiene una versión simplificada para la UI por si acaso.
  const getSavings = (discount) => {
    if (!discount) return 0;
    return discount.savings || discount.discountAmount || 0;
  };

  const handleRemove = () => {
    setCode('');
    setAppliedDiscount(null);
    setError(null);
    if (onDiscountRemoved) {
      onDiscountRemoved();
    }
    message.info('Descuento removido');
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);
    if (error) setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleValidate();
    }
  };

  // Si ya hay un descuento aplicado
  if (appliedDiscount) {
    return (
      <Card 
        className="discount-applied" 
        style={{ 
          marginBottom: 16,
          borderColor: '#52c41a',
          background: '#f6ffed'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <Tag color="success" style={{ marginBottom: 4, fontSize: '14px' }}>
                  {appliedDiscount.code}
                </Tag>
                <div>
                  <Text type="secondary">{appliedDiscount.description || 'Descuento aplicado'}</Text>
                </div>
              </div>
            </Space>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <Text type="secondary">Descuento:</Text>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  -{appliedDiscount.displayValue}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ahorras: ${getSavings(appliedDiscount).toFixed(2)} ({appliedDiscount.savingsPercentage || '0'}%)
                </Text>
              </div>
              <Button 
                type="text" 
                danger 
                onClick={handleRemove}
                icon={<CloseCircleOutlined />}
              >
                Quitar
              </Button>
            </div>
          </div>
        </div>

        {appliedDiscount.maximumDiscount && 
         appliedDiscount.discountType === 'PERCENTAGE' &&
         appliedDiscount.discountAmount >= appliedDiscount.maximumDiscount && (
          <Alert
            message={`Descuento máximo aplicado: $${appliedDiscount.maximumDiscount.toLocaleString('es-AR')}`}
            type="info"
            showIcon={false}
            style={{ 
              marginTop: '12px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          />
        )}
      </Card>
    );
  }

  // Formulario para ingresar código
  return (
    <Card 
      bordered={false}
      style={{ 
        marginBottom: 16,
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.4)'
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: '16px' }}>
          <TagOutlined style={{ marginRight: '8px' }} /> 
          ¿Tienes un código de descuento?
        </Text>
      </div>
      
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Ingresa tu código"
          value={code}
          onChange={handleCodeChange}
          onKeyPress={handleKeyPress}
          disabled={loading}
          size="large"
          maxLength={20}
          style={{ textTransform: 'uppercase' }}
          prefix={<TagOutlined style={{ color: '#999' }} />}
          status={error ? 'error' : ''}
        />
        <Button 
          type="primary" 
          loading={loading}
          onClick={() => handleValidate()}
          size="large"
          // disabled={!code.trim()} // Permitir click para mostrar validación
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none'
          }}
        >
          Aplicar
        </Button>
      </Space.Compact>

      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          style={{ marginTop: 8 }}
          closable
          onClose={() => setError(null)}
        />
      )}

    </Card>
  );
};

export default DiscountCodeAdvanced;
