import React, { useState, useEffect } from 'react';
import { Button, InputNumber, Space, Typography, Alert } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { validateTicketQuantity } from '../utils/validators';

const { Text } = Typography;

/**
 * Selector de cantidad de tickets con validación de límites
 * 
 * @param {object} availability - Datos de disponibilidad del evento
 * @param {function} onQuantityChange - Callback cuando cambia la cantidad
 * @param {boolean} disabled - Si el selector está deshabilitado
 * @param {number} initialQuantity - Cantidad inicial (default: 1)
 */
export default function TicketQuantitySelector({ 
  availability, 
  onQuantityChange,
  disabled = false,
  initialQuantity = 1
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [error, setError] = useState(null);

  const maxQuantity = availability?.available || 5;
  const canPurchase = availability?.canPurchase !== false;

  useEffect(() => {
    // Validar al cambiar cantidad o disponibilidad
    const validation = validateTicketQuantity(quantity, availability);
    setError(validation.error);
    
    if (validation.valid && onQuantityChange) {
      onQuantityChange(quantity);
    }
  }, [quantity, availability, onQuantityChange]);

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleChange = (value) => {
    if (value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  if (!canPurchase) {
    return (
      <Alert
        message="No podés comprar boletos"
        description={availability?.message || 'No cumplís con los requisitos para comprar boletos'}
        type="error"
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong>Cantidad de Boletos</Text>
      </div>
      
      <Space.Compact style={{ width: '100%', maxWidth: 300 }}>
        <Button
          icon={<MinusOutlined />}
          onClick={handleDecrement}
          disabled={quantity <= 1 || disabled}
          size="large"
        />
        
        <InputNumber
          value={quantity}
          onChange={handleChange}
          min={1}
          max={maxQuantity}
          disabled={disabled}
          size="large"
          style={{ 
            width: '100%', 
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 600
          }}
        />
        
        <Button
          icon={<PlusOutlined />}
          onClick={handleIncrement}
          disabled={quantity >= maxQuantity || disabled}
          size="large"
        />
      </Space.Compact>
      
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Máximo: {maxQuantity} boleto(s)
          {availability?.purchased?.byUser > 0 && (
            <> · Ya tenés {availability.purchased.byUser}</>
          )}
        </Text>
      </div>
      
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
}
