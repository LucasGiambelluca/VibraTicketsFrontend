import React, { useState, useEffect } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';

/**
 * Componente de contador regresivo visual
 * Cambia de color según el tiempo restante
 */
export default function CountdownTimer({ initialSeconds, onExpire, onTick }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        const newValue = prev - 1;
        onTick?.(newValue);
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onExpire, onTick]);

  const getColor = () => {
    if (seconds > 40) return '#52c41a'; // Verde
    if (seconds > 20) return '#faad14'; // Amarillo
    return '#ff4d4f'; // Rojo
  };

  const getMessage = () => {
    if (seconds <= 0) return '¡Código expirado!';
    if (seconds <= 10) return '¡Date prisa!';
    if (seconds <= 20) return 'Tiempo limitado';
    return 'Tiempo suficiente';
  };

  const percentage = (seconds / initialSeconds) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.timerCircle}>
        <svg width="120" height="120" style={styles.svg}>
          {/* Círculo de fondo */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="8"
          />
          {/* Círculo de progreso */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease'
            }}
          />
        </svg>
        <div style={styles.timerContent}>
          <ClockCircleOutlined style={{ ...styles.icon, color: getColor() }} />
          <div style={{ ...styles.timerText, color: getColor() }}>
            {seconds}s
          </div>
        </div>
      </div>
      <div style={styles.message}>
        <div style={{ ...styles.statusText, color: getColor() }}>
          {getMessage()}
        </div>
        <div style={styles.helperText}>
          {seconds > 0 
            ? `El código expira en ${seconds} segundo${seconds !== 1 ? 's' : ''}`
            : 'Solicita un nuevo código para continuar'
          }
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px 0',
  },
  timerCircle: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  timerContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  icon: {
    fontSize: '24px',
  },
  timerText: {
    fontSize: '28px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  message: {
    textAlign: 'center',
  },
  statusText: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  helperText: {
    fontSize: '14px',
    color: '#8c8c8c',
  },
};
