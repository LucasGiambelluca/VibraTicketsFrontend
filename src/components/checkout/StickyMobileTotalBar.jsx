import React from 'react';
import { Button, Typography } from 'antd';
import { CreditCardOutlined, SafetyOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * A sticky bar at the bottom of the screen for mobile checkout.
 * Shows the total amount and a CTA button.
 */
const StickyMobileTotalBar = ({ total, onPayClick, loading, disabled }) => {
  if (total === undefined || total === null) return null;
  
  return (
    <div
      className="sticky-mobile-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          Total a pagar
        </Text>
        <Text strong style={{ fontSize: 22, color: '#1890ff' }}>
          ${total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
        </Text>
      </div>
      
      <Button
        type="primary"
        size="large"
        icon={<CreditCardOutlined />}
        onClick={onPayClick}
        loading={loading}
        disabled={disabled}
        style={{
          height: 48,
          paddingLeft: 24,
          paddingRight: 24,
          borderRadius: 12,
          fontWeight: 600,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        }}
      >
        Pagar
      </Button>
    </div>
  );
};

export default StickyMobileTotalBar;
