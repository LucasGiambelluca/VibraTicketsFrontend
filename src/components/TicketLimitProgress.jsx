import React from 'react';
import { Progress, Typography, Space } from 'antd';
import { StopOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Barra de progreso que muestra cuántos boletos ha comprado el usuario
 * del límite permitido por evento
 * 
 * @param {object} availability - Datos de disponibilidad del evento
 */
export default function TicketLimitProgress({ availability }) {
  if (!availability) return null;

  const purchased = availability.purchased?.byUser || 0;
  const max = availability.maxPerEvent || 5;
  const percentage = (purchased / max) * 100;

  // Determinar color según el porcentaje
  let strokeColor = '#52c41a'; // Verde
  if (percentage >= 80) {
    strokeColor = '#f5222d'; // Rojo
  } else if (percentage >= 60) {
    strokeColor = '#faad14'; // Naranja
  }

  return (
    <div style={{ 
      padding: 16, 
      background: '#fafafa', 
      borderRadius: 8,
      marginBottom: 16 
    }}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Boletos Comprados</Text>
          <Text strong>{purchased} / {max}</Text>
        </div>
        
        <Progress
          percent={percentage}
          strokeColor={strokeColor}
          showInfo={false}
          strokeWidth={10}
        />
        
        {purchased >= max && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            color: '#f5222d',
            marginTop: 8 
          }}>
            <StopOutlined />
            <Text type="danger" strong>
              Has alcanzado el límite para este evento
            </Text>
          </div>
        )}
        
        {purchased > 0 && purchased < max && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Te quedan {max - purchased} boleto{max - purchased !== 1 ? 's' : ''} disponible{max - purchased !== 1 ? 's' : ''}
          </Text>
        )}
      </Space>
    </div>
  );
}
