import React from 'react';
import { Alert, Typography, Space, Button } from 'antd';
import { 
  CloseCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined, 
  IdcardOutlined, 
  StopOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

/**
 * Componente de error mejorado que maneja errores específicos
 * de DNI, límites de tickets, y otros errores de la aplicación
 * 
 * @param {object|string} error - Error a mostrar (objeto o string)
 * @param {string} type - Tipo de error ('error', 'warning', 'info')
 */
export default function ErrorMessage({ error, type = 'error' }) {
  const navigate = useNavigate();

  if (!error) return null;

  // Si es un string simple
  if (typeof error === 'string') {
    return (
      <Alert
        message={error}
        type={type}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  /**
   * Obtener detalles del error según el tipo
   */
  const getErrorDetails = (error) => {
    // Error de DNI requerido
    if (error.error === 'DNIRequired' || error.reason === 'dni_required') {
      return {
        icon: <IdcardOutlined />,
        type: 'warning',
        title: 'DNI Requerido',
        message: 'Debés completar tu DNI en tu perfil antes de comprar boletos.',
        action: {
          text: 'Ir a mi perfil',
          onClick: () => navigate('/profile')
        }
      };
    }

    // Límite de tickets excedido
    if (error.error === 'TicketLimitExceeded') {
      const limitType = error.limitType === 'dni' ? 'con tu DNI' : 'en tu cuenta';
      return {
        icon: <StopOutlined />,
        type: 'error',
        title: 'Límite Alcanzado',
        message: error.message || `Ya compraste el máximo de boletos ${limitType} para este evento.`,
        details: error.details,
        showDetails: true
      };
    }

    // Email duplicado
    if (error.error === 'EmailExists') {
      return {
        icon: <WarningOutlined />,
        type: 'error',
        title: 'Email en Uso',
        message: 'Este email ya está registrado. ¿Querés iniciar sesión?',
        action: {
          text: 'Iniciar sesión',
          onClick: () => navigate('/customerlogin')
        }
      };
    }

    // DNI duplicado
    if (error.error === 'DNIExists') {
      return {
        icon: <WarningOutlined />,
        type: 'error',
        title: 'DNI en Uso',
        message: 'Este DNI ya está registrado en otra cuenta.',
      };
    }

    // Error de autenticación
    if (error.error === 'Unauthorized' || error.status === 401) {
      return {
        icon: <InfoCircleOutlined />,
        type: 'warning',
        title: 'Sesión Expirada',
        message: 'Tu sesión ha expirado. Por favor iniciá sesión nuevamente.',
        action: {
          text: 'Iniciar sesión',
          onClick: () => navigate('/customerlogin')
        }
      };
    }

    // Error genérico
    return {
      icon: <CloseCircleOutlined />,
      type: type,
      title: 'Error',
      message: error.message || 'Ha ocurrido un error. Intentá nuevamente.'
    };
  };

  const details = getErrorDetails(error);

  return (
    <Alert
      message={details.title}
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text>{details.message}</Text>
          
          {/* Detalles adicionales del error */}
          {details.showDetails && details.details && (
            <div style={{ 
              marginTop: 8, 
              padding: 12, 
              background: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 4 
            }}>
              {details.details.eventName && (
                <div><strong>Evento:</strong> {details.details.eventName}</div>
              )}
              {details.details.alreadyPurchased !== undefined && (
                <div>
                  <strong>Ya comprados:</strong> {details.details.alreadyPurchased}/{details.details.maxAllowed}
                </div>
              )}
              {details.details.requested !== undefined && (
                <div><strong>Intentaste comprar:</strong> {details.details.requested}</div>
              )}
            </div>
          )}
          
          {/* Botón de acción */}
          {details.action && (
            <Button 
              type="primary" 
              onClick={details.action.onClick}
              style={{ marginTop: 8 }}
            >
              {details.action.text}
            </Button>
          )}
        </Space>
      }
      type={details.type}
      showIcon
      icon={details.icon}
      style={{ marginBottom: 16 }}
    />
  );
}
