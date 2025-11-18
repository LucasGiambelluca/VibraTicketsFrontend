import React, { useState, useEffect } from 'react';
import { Upload, Card, Row, Col, message, Button, Typography, Alert, Tag, Space, Image, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { eventImagesApi } from '../services/apiService';
import { getImageUrl } from '../utils/imageUtils';

const { Text, Title } = Typography;

// Configuración de tipos de imágenes según especificaciones UX/UI
const IMAGE_TYPES = {
  cover_square: {
    title: 'Carátula Cuadrada',
    description: 'Para listados en grilla',
    dimensions: '300x300px',
    maxSize: 150, // KB
    icon: '🖼️',
    aspectRatio: '1:1'
  },
  cover_horizontal: {
    title: 'Carátula Horizontal',
    description: 'Para tarjetas horizontales',
    dimensions: '626x300px',
    maxSize: 200, // KB
    icon: '🎨',
    aspectRatio: '2.09:1'
  },
  banner_main: {
    title: 'Banner Principal',
    description: 'Página de detalle',
    dimensions: '1620x720px',
    maxSize: 400, // KB
    icon: '🏞️',
    aspectRatio: '2.25:1'
  },
  banner_alt: {
    title: 'Banner Alternativo',
    description: 'Secciones alternativas',
    dimensions: '1620x700px',
    maxSize: 400, // KB
    icon: '🌄',
    aspectRatio: '2.31:1'
  }
};

/**
 * Componente para subir y gestionar las 4 imágenes de un evento
 * 
 * @param {Object} props
 * @param {number} props.eventId - ID del evento (opcional, para edición)
 * @param {Function} props.onChange - Callback cuando cambian las imágenes (files)
 * @param {boolean} props.showExisting - Mostrar imágenes existentes del servidor
 * @param {boolean} props.allowUpload - Permitir subir directamente al servidor
 */
export default function EventImageUpload({ 
  eventId = null, 
  onChange = null, 
  showExisting = false,
  allowUpload = false 
}) {
  const [images, setImages] = useState({
    cover_square: null,
    cover_horizontal: null,
    banner_main: null,
    banner_alt: null
  });
  
  const [previews, setPreviews] = useState({
    cover_square: null,
    cover_horizontal: null,
    banner_main: null,
    banner_alt: null
  });

  const [existingImages, setExistingImages] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);

  // Cargar imágenes existentes si hay eventId
  useEffect(() => {
    if (eventId && showExisting) {
      loadExistingImages();
    }
  }, [eventId, showExisting]);

  const loadExistingImages = async () => {
    try {
      setLoading(true);
      const response = await eventImagesApi.getEventImages(eventId);
      setExistingImages(response || {});
    } catch (error) {
      console.error('Error cargando imágenes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar archivo antes de subirlo
  const validateFile = (file, imageType) => {
    const config = IMAGE_TYPES[imageType];
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      message.error(`Solo se permiten imágenes JPG, PNG, GIF o WebP`);
      return false;
    }
    
    // Validar tamaño (5MB máximo antes de procesamiento)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      message.error(`La imagen es demasiado grande. Máximo 5MB permitido.`);
      return false;
    }
    
    return true;
  };

  // Manejar selección de archivo
  const handleFileSelect = (file, imageType) => {
    if (!validateFile(file, imageType)) {
      return false;
    }

    const config = IMAGE_TYPES[imageType];
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPreviews = {
        ...previews,
        [imageType]: e.target.result
      };
      setPreviews(newPreviews);
      
      const newImages = {
        ...images,
        [imageType]: file
      };
      setImages(newImages);
      
      // Notificar al padre si hay callback
      if (onChange) {
        onChange(newImages);
      }
      
      message.success(
        `${config.title} seleccionada. ` +
        `El backend la redimensionará a ${config.dimensions}`
      );
    };
    reader.readAsDataURL(file);
    
    // Prevenir upload automático de antd
    return false;
  };

  // Subir imagen individual al servidor (solo si allowUpload=true y hay eventId)
  const uploadSingleToServer = async (imageType) => {
    if (!eventId) {
      message.error('No se puede subir: falta el ID del evento');
      return;
    }

    const file = images[imageType];
    if (!file) {
      message.error('Primero selecciona una imagen');
      return;
    }

    try {
      setUploadingType(imageType);
      const formData = new FormData();
      formData.append(imageType, file);
      
      await eventImagesApi.uploadSingleImage(eventId, imageType, formData);
      
      message.success(`${IMAGE_TYPES[imageType].title} subida exitosamente`);
      
      // Recargar imágenes existentes
      if (showExisting) {
        await loadExistingImages();
      }
      
      // Limpiar preview local
      setImages({ ...images, [imageType]: null });
      setPreviews({ ...previews, [imageType]: null });
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      message.error(`Error al subir ${IMAGE_TYPES[imageType].title}`);
    } finally {
      setUploadingType(null);
    }
  };

  // Eliminar imagen del servidor
  const deleteFromServer = async (imageType) => {
    if (!eventId) return;
    
    const confirmed = window.confirm(
      `¿Eliminar ${IMAGE_TYPES[imageType].title}?\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    try {
      setUploadingType(imageType);
      await eventImagesApi.deleteEventImage(eventId, imageType);
      message.success(`${IMAGE_TYPES[imageType].title} eliminada`);
      
      // Recargar imágenes
      if (showExisting) {
        await loadExistingImages();
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      message.error(`Error al eliminar ${IMAGE_TYPES[imageType].title}`);
    } finally {
      setUploadingType(null);
    }
  };

  // Limpiar preview local
  const clearLocal = (imageType) => {
    const newImages = { ...images, [imageType]: null };
    const newPreviews = { ...previews, [imageType]: null };
    setImages(newImages);
    setPreviews(newPreviews);
    
    if (onChange) {
      onChange(newImages);
    }
  };

  // Renderizar card de un tipo de imagen
  const renderImageCard = (imageType) => {
    const config = IMAGE_TYPES[imageType];
    const hasLocal = previews[imageType];
    const hasExisting = existingImages[imageType]?.url;
    const isUploading = uploadingType === imageType;

    return (
      <Card
        key={imageType}
        size="small"
        title={
          <Space>
            <span>{config.icon}</span>
            <Text strong>{config.title}</Text>
          </Space>
        }
        extra={
          <Tooltip title={`${config.dimensions} - Máx ${config.maxSize}KB`}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        }
        style={{ height: '100%' }}
      >
        <div style={{ minHeight: 200 }}>
          {/* Descripción */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              {config.description}
            </Text>
            <br />
            <Tag color="blue" style={{ marginTop: 4 }}>
              {config.dimensions}
            </Tag>
            <Tag>Máx {config.maxSize}KB</Tag>
          </div>

          {/* Preview de imagen local seleccionada */}
          {hasLocal && (
            <div style={{ marginBottom: 12 }}>
              <Image
                src={previews[imageType]}
                alt={config.title}
                style={{ 
                  width: '100%', 
                  maxHeight: 150, 
                  objectFit: 'cover',
                  borderRadius: 8
                }}
                preview={{
                  mask: <EyeOutlined />
                }}
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                {allowUpload && eventId && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => uploadSingleToServer(imageType)}
                    loading={isUploading}
                    block
                  >
                    Subir
                  </Button>
                )}
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => clearLocal(imageType)}
                  block
                >
                  Quitar
                </Button>
              </div>
            </div>
          )}

          {/* Imagen existente en el servidor */}
          {!hasLocal && hasExisting && showExisting && (
            <div style={{ marginBottom: 12 }}>
              <Image
                src={getImageUrl(existingImages[imageType].url, config.title)}
                alt={config.title}
                style={{ 
                  width: '100%', 
                  maxHeight: 150, 
                  objectFit: 'cover',
                  borderRadius: 8
                }}
                preview={{
                  mask: <EyeOutlined />
                }}
              />
              {allowUpload && eventId && (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteFromServer(imageType)}
                  loading={isUploading}
                  block
                  style={{ marginTop: 8 }}
                >
                  Eliminar del servidor
                </Button>
              )}
            </div>
          )}

          {/* Botón de upload si no hay imagen */}
          {!hasLocal && (!hasExisting || !showExisting) && (
            <Upload
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              beforeUpload={(file) => handleFileSelect(file, imageType)}
              showUploadList={false}
              maxCount={1}
            >
              <Button 
                icon={<UploadOutlined />} 
                block
                type="dashed"
              >
                Seleccionar Imagen
              </Button>
            </Upload>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>
          📸 Imágenes del Evento
        </Title>
        <Text type="secondary">
          Las imágenes se procesarán automáticamente a las dimensiones exactas. 
          Formatos permitidos: JPG, PNG, GIF, WebP.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          {renderImageCard('cover_square')}
        </Col>
        <Col xs={24} md={12}>
          {renderImageCard('cover_horizontal')}
        </Col>
        <Col xs={24} md={12}>
          {renderImageCard('banner_main')}
        </Col>
        <Col xs={24} md={12}>
          {renderImageCard('banner_alt')}
        </Col>
      </Row>
    </div>
  );
}
