import React, { useState } from 'react';
import { Drawer, Button, Badge } from 'antd';
import { TagOutlined, TagsFilled } from '@ant-design/icons';
import DiscountCodeAdvanced from './DiscountCodeAdvanced';

const DiscountCodeMobile = ({ 
  orderTotal,
  eventId,
  showId,
  onDiscountApplied,
  onDiscountRemoved,
  userId,
  appliedDiscount = null
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleDiscountApplied = (discount) => {
    onDiscountApplied(discount);
    // Cerrar el drawer después de aplicar exitosamente
    setTimeout(() => {
      setDrawerVisible(false);
    }, 500);
  };

  const handleDiscountRemoved = () => {
    onDiscountRemoved();
  };

  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <>
      {/* Botón para abrir el drawer */}
      {appliedDiscount ? (
        <Button 
          type="primary"
          icon={<TagsFilled />}
          onClick={openDrawer}
          block
          style={{
            background: 'linear-gradient(135deg, #52c41a, #73d13d)',
            border: 'none',
            height: '48px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '12px',
            marginBottom: '16px'
          }}
        >
          <Badge 
            count={`-${appliedDiscount.displayValue || appliedDiscount.discount_value}`}
            style={{ 
              backgroundColor: '#fff', 
              color: '#52c41a',
              fontWeight: 'bold',
              marginLeft: '8px'
            }}
          />
          <span style={{ marginLeft: '8px' }}>
            Código aplicado: {appliedDiscount.code}
          </span>
        </Button>
      ) : (
        <Button 
          type="dashed" 
          icon={<TagOutlined />}
          onClick={openDrawer}
          block
          style={{
            height: '48px',
            fontSize: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
            borderColor: '#667eea',
            color: '#667eea'
          }}
        >
          ¿Tienes un código de descuento?
        </Button>
      )}
      
      {/* Drawer con el componente de descuento */}
      <Drawer
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#262626'
          }}>
            <TagOutlined style={{ marginRight: '8px', color: '#667eea' }} />
            Código de Descuento
          </div>
        }
        placement="bottom"
        onClose={closeDrawer}
        open={drawerVisible}
        height="auto"
        bodyStyle={{
          paddingTop: '8px'
        }}
        style={{
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}
        className="discount-mobile-drawer"
      >
        <DiscountCodeAdvanced 
          orderTotal={orderTotal}
          eventId={eventId}
          showId={showId}
          onDiscountApplied={handleDiscountApplied}
          onDiscountRemoved={handleDiscountRemoved}
          userId={userId}
        />


        {/* Botón para cerrar */}
        <Button 
          onClick={closeDrawer}
          block
          size="large"
          style={{
            marginTop: '16px',
            borderRadius: '12px',
            height: '48px'
          }}
        >
          Cerrar
        </Button>
      </Drawer>

      {/* Estilos específicos para mobile */}
      <style jsx>{`
        .discount-mobile-drawer {
          .ant-drawer-content-wrapper {
            border-top-left-radius: 16px !important;
            border-top-right-radius: 16px !important;
            overflow: hidden;
          }
          
          .ant-drawer-header {
            border-bottom: 1px solid #f0f0f0;
            padding: 16px 24px;
          }
          
          .ant-drawer-body {
            max-height: 80vh;
            overflow-y: auto;
          }
        }

        @media (max-width: 480px) {
          .discount-mobile-drawer {
            .ant-drawer-body {
              padding: 16px;
            }
          }
        }
      `}</style>
    </>
  );
};

// Versión compacta para mostrar en headers o espacios reducidos
export const DiscountCodeCompact = ({ 
  orderTotal,
  onDiscountApplied,
  appliedDiscount = null 
}) => {
  const [expanded, setExpanded] = useState(false);

  if (appliedDiscount && !expanded) {
    return (
      <div 
        onClick={() => setExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: 'linear-gradient(135deg, #f6ffed, #fff)',
          border: '1px solid #b7eb8f',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TagsFilled style={{ color: '#52c41a', fontSize: '16px' }} />
          <span style={{ fontWeight: '600', color: '#52c41a' }}>
            {appliedDiscount.code}
          </span>
        </div>
        <span style={{ 
          fontWeight: 'bold', 
          color: '#52c41a',
          fontSize: '16px'
        }}>
          -{appliedDiscount.displayValue || `$${appliedDiscount.discount_value}`}
        </span>
      </div>
    );
  }

  return (
    <Button
      type="text"
      icon={<TagOutlined />}
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: '4px 8px',
        color: '#667eea',
        fontSize: '14px'
      }}
    >
      Agregar código
    </Button>
  );
};

export default DiscountCodeMobile;
