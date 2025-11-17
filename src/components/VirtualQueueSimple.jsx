import React, { useRef, useEffect, useState } from 'react';
import { Card, Typography, Progress, Space, Button } from 'antd';

const { Title, Text } = Typography;

export default function VirtualQueueSimple({ position, totalUsers, onComplete }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 300;

    // Partículas
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    // Función de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
      gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar partículas
      particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Mover partículas
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Rebotar en los bordes
        if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;
      });

      // Dibujar círculo de progreso
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;

      // Círculo de fondo
      ctx.strokeStyle = 'rgba(118, 75, 162, 0.3)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Círculo de progreso
      const progressAngle = (progress / 100) * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, progressAngle);
      ctx.stroke();

      // Texto de progreso
      ctx.fillStyle = '#667eea';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(progress)}%`, centerX, centerY + 8);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Simular progreso de cola
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 5, 100);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onComplete && onComplete(), 1000);
        }
        
        return newProgress;
      });
    }, 200);

    // Cleanup
    return () => {
      clearInterval(progressInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onComplete, progress]);

  return (
    <Card style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Cola Virtual
          </Title>
          <Text type="secondary">
            Estás en la posición {position} de {totalUsers} usuarios
          </Text>
        </div>

        {/* Canvas 2D */}
        <canvas 
          ref={canvasRef}
          style={{ 
            borderRadius: 12,
            border: '1px solid #f0f0f0',
            maxWidth: '100%',
            height: 'auto'
          }} 
        />

        {/* Barra de progreso */}
        <div style={{ width: '100%' }}>
          <Progress 
            percent={progress} 
            strokeColor={{
              '0%': '#667eea',
              '100%': '#52c41a',
            }}
            trailColor="#f0f0f0"
            strokeWidth={8}
            format={(percent) => `${Math.round(percent)}%`}
          />
          <Text style={{ marginTop: 8, display: 'block' }}>
            Tiempo estimado: {Math.max(1, Math.ceil((100 - progress) / 10))} minutos
          </Text>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: 16,
          borderRadius: 8,
          textAlign: 'left'
        }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Mientras esperas:
          </Text>
          <Space direction="vertical" size={4}>
            <Text>• Mantén esta pestaña abierta</Text>
            <Text>• No actualices la página</Text>
            <Text>• Te notificaremos cuando sea tu turno</Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
