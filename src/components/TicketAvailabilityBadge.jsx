import React from 'react';
import { Alert, Spin } from 'antd';
import { LockOutlined, CheckCircleOutlined, WarningOutlined, StopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTicketAvailability } from '../hooks/useTicketAvailability';

/**
 * Badge que muestra la disponibilidad de tickets para un evento
 * Indica cuántos boletos puede comprar el usuario
 * 
 * @param {number|string} eventId - ID del evento
 */
export default function TicketAvailabilityBadge({ eventId }) {
  const { availability, loading } = useTicketAvailability(eventId);

  if (loading) {
    return (
      <Alert
        message={<><Spin size="small" /> Consultando disponibilidad...</>}
        type="info"
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (!availability) {
    return null;
  }

  // No autenticado
  if (availability.requiresAuth) {
    return (
      <Alert
        message="Iniciá sesión para ver disponibilidad"
        description="Necesitás estar logueado para consultar cuántos boletos podés comprar."
        type="info"
        showIcon
        icon={<LockOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // No tiene DNI
  if (availability.reason === 'dni_required') {
    return (
      <Alert
        message="DNI Requerido"
        description={
          <>
            Debés completar tu DNI en tu perfil para poder comprar boletos.{' '}
            <Link to="/profile" style={{ fontWeight: 600 }}>
              Ir a mi perfil
            </Link>
          </>
        }
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Límite alcanzado
  if (availability.available === 0) {
    const reason = availability.limitReason;
    const message = reason === 'user_limit_reached'
      ? 'Ya compraste el máximo de boletos para este evento'
      : 'Límite de boletos alcanzado con tu DNI';
    
    return (
      <Alert
        message="Límite Alcanzado"
        description={
          <>
            {message}
            {availability.purchased?.byUser > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong>Boletos comprados:</strong> {availability.purchased.byUser}/{availability.maxPerEvent}
              </div>
            )}
          </>
        }
        type="error"
        showIcon
        icon={<StopOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Quedan pocos boletos (advertencia)
  if (availability.available > 0 && availability.available < 20) {
    return (
      <Alert
        message="¡Últimas localidades!"
        description={
          <>
            Quedan muy pocos lugares disponibles para este evento.
          </>
        }
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Disponible (más de 20) - No mostrar cantidad exacta
  return (
    <Alert
      message="Entradas disponibles"
      description={
        <>
          Límite: {availability.maxPerEvent} boletos por persona por evento.
          {availability.purchased?.byUser > 0 && (
            <> Ya compraste {availability.purchased.byUser}.</>
          )}
        </>
      }
      type="success"
      showIcon
      icon={<CheckCircleOutlined />}
      style={{ marginBottom: 16 }}
    />
  );
}
