import React, { useRef, useEffect, useState } from 'react';
import { Card, Typography, Progress, Space, Button } from 'antd';
import { 
  Scene, 
  PerspectiveCamera, 
  WebGLRenderer, 
  BufferGeometry, 
  Float32Array as ThreeFloat32Array, 
  BufferAttribute, 
  PointsMaterial, 
  Points, 
  RingGeometry, 
  MeshBasicMaterial, 
  Mesh 
} from 'three';
import { gsap } from 'gsap';

const { Title, Text } = Typography;

export default function VirtualQueue({ position, totalUsers, onComplete }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Configuración de Three.js
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(400, 300);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Crear partículas flotantes
    const particlesGeometry = new BufferGeometry();
    const particlesCount = 100;
    const posArray = new ThreeFloat32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new BufferAttribute(posArray, 3));

    const particlesMaterial = new PointsMaterial({
      size: 0.05,
      color: 0x667eea,
      transparent: true,
      opacity: 0.8
    });

    const particlesMesh = new Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Crear línea de progreso 3D
    const progressGeometry = new RingGeometry(1, 1.2, 32);
    const progressMaterial = new MeshBasicMaterial({ 
      color: 0x764ba2,
      transparent: true,
      opacity: 0.6
    });
    const progressRing = new Mesh(progressGeometry, progressMaterial);
    scene.add(progressRing);

    camera.position.z = 5;
    sceneRef.current = { scene, camera, renderer, particlesMesh, progressRing };

    // Animación
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotar partículas
      particlesMesh.rotation.y += 0.01;
      particlesMesh.rotation.x += 0.005;

      // Rotar anillo de progreso
      progressRing.rotation.z += 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Simular progreso de cola
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 5, 100);
        
        // Actualizar color del anillo según progreso
        const hue = (newProgress / 100) * 0.3; // De rojo a verde
        progressRing.material.color.setHSL(hue, 0.8, 0.5);
        
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
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onComplete]);

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

        {/* Visualización 3D */}
        <div 
          ref={mountRef} 
          style={{ 
            display: 'flex', 
            justifyContent: 'center',
            borderRadius: 12,
            overflow: 'hidden'
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
