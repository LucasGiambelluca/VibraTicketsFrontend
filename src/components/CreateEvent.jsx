import React, { useState, useEffect } from 'react';
import { eventsApi, venuesApi, eventImagesApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import EventImageUpload from './EventImageUpload';

const CreateEvent = ({ onEventCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'MUSIC',
    location: '',
    startsAt: '',
    endsAt: '',
    venue: '',
    venue_id: '',
    status: 'PUBLISHED'
  });
  // Deprecated: antigua imagen única
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Nuevo sistema de 4 imágenes
  const [eventImages, setEventImages] = useState({
    cover_square: null,
    cover_horizontal: null,
    banner_main: null,
    banner_alt: null
  });
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar venues
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const response = await venuesApi.getVenues({ limit: 100, sortBy: 'name', sortOrder: 'ASC' });
        if (response && response.venues) {
          setVenues(response.venues);
        } else if (response && Array.isArray(response)) {
          console.log('✅ Venues cargados como array:', response.length);
          setVenues(response);
        } else {
          setVenues([]);
        }
      } catch (err) {
        console.error('❌ Error loading venues:', err.message);
        setVenues([]);
      }
    };
    loadVenues();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no válido. Solo se permiten: JPEG, JPG, PNG, GIF, WEBP');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        setError('La imagen es demasiado grande. Máximo 5MB permitido.');
        return;
      }
      
      console.log('📸 Archivo seleccionado:', {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        type: file.type
      });
      
      setError(null); // Limpiar errores previos
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.name.trim()) {
      setError('El nombre del evento es requerido');
      return;
    }
    
    if (!formData.startsAt) {
      setError('La fecha y hora de inicio es requerida');
      return;
    }
    
    if (!formData.endsAt) {
      setError('La fecha y hora de fin es requerida');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('La ubicación es requerida');
      return;
    }
    
    if (!formData.venue_id && !formData.venue.trim()) {
      setError('Debes seleccionar un venue o escribir uno manualmente');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const submitData = new FormData();
      
      // Campos obligatorios
      submitData.append('name', formData.name.trim());
      submitData.append('category', formData.category);
      submitData.append('location', formData.location.trim());
      submitData.append('status', formData.status);
      
      // Descripción (opcional)
      if (formData.description && formData.description.trim()) {
        submitData.append('description', formData.description.trim());
      }
      
      // Fechas (convertir a ISO)
      const startDate = new Date(formData.startsAt);
      const endDate = new Date(formData.endsAt);
      submitData.append('startsAt', startDate.toISOString());
      submitData.append('endsAt', endDate.toISOString());
      
      console.log('📅 Fechas configuradas:', {
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString()
      });
      
      // 🚨 CRITICAL: Organizer ID (usuario que crea el evento)
      if (!user) {
        const errorMsg = '❌ ERROR: No hay usuario autenticado. Por favor, inicia sesión nuevamente.';
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      if (!user.id) {
        const errorMsg = '❌ ERROR: El usuario no tiene ID. Datos del usuario: ' + JSON.stringify(user);
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      // BIGINT: Mantener como string para evitar pérdida de precisión
      // En JavaScript, números mayores a Number.MAX_SAFE_INTEGER pierden precisión
      const organizerId = String(user.id);
      console.log('👤 Organizer ID:', organizerId, '(tipo:', typeof organizerId, ')');
      
      // Enviar en MÚLTIPLES formatos por compatibilidad con backend
      submitData.append('organizer_id', organizerId);
      submitData.append('organizerId', organizerId);
      submitData.append('created_by', organizerId);
      submitData.append('createdBy', organizerId);
      
      // 🚨 CRITICAL: Venue (ID y Nombre)
      if (formData.venue_id) {
        // Si seleccionó un venue existente
        const selectedVenue = venues.find(v => String(v.id) === String(formData.venue_id));
        
        submitData.append('venue_id', formData.venue_id);
        submitData.append('venueId', formData.venue_id); // Backend puede esperar camelCase
        
        if (selectedVenue) {
          submitData.append('venue', selectedVenue.name); // Nombre del venue
          console.log('🏟️ Venue seleccionado:', selectedVenue.name);
        } else {
          console.log('⚠️ Venue ID no encontrado en la lista');
        }
      } else if (formData.venue.trim()) {
        // Si escribió manualmente el nombre del venue
        submitData.append('venue', formData.venue.trim());
        console.log('🏟️ Venue manual:', formData.venue.trim());
      }
      
      // Imagen (opcional)
      if (image) {
        submitData.append('image', image);
        console.log('🖼️ Imagen adjunta:', image.name);
      }

      console.log('📦 Enviando datos al backend...');
      
      // Log de FormData para debugging
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)}KB)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const result = await eventsApi.createEvent(submitData);
      
      // 🚨 IMPORTANTE: Show auto-creado
      // 📸 Subir las 4 imágenes del nuevo sistema si existen
      const eventId = result.eventId || result.id;
      const hasNewImages = Object.values(eventImages).some(img => img !== null);
      
      if (eventId && hasNewImages) {
        try {
          const imagesFormData = new FormData();
          let uploadCount = 0;
          
          if (eventImages.cover_square) {
            imagesFormData.append('cover_square', eventImages.cover_square);
            uploadCount++;
          }
          if (eventImages.cover_horizontal) {
            imagesFormData.append('cover_horizontal', eventImages.cover_horizontal);
            uploadCount++;
          }
          if (eventImages.banner_main) {
            imagesFormData.append('banner_main', eventImages.banner_main);
            uploadCount++;
          }
          if (eventImages.banner_alt) {
            imagesFormData.append('banner_alt', eventImages.banner_alt);
            uploadCount++;
          }
          
          await eventImagesApi.uploadEventImages(eventId, imagesFormData);
          alert(`Evento creado con ${uploadCount} imágenes optimizadas`);
        } catch (imgError) {
          console.error('❌ Error subiendo imágenes:', imgError);
          alert('Evento creado, pero hubo un error al subir algunas imágenes. Puedes editarlas después.');
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'MUSIC',
        location: '',
        startsAt: '',
        endsAt: '',
        venue: '',
        venue_id: '',
        status: 'PUBLISHED'
      });
      removeImage();
      
      // Limpiar nuevas imágenes
      setEventImages({
        cover_square: null,
        cover_horizontal: null,
        banner_main: null,
        banner_alt: null
      });
      setShowImageUploader(false);
      
      // Notificar al componente padre para refrescar la lista
      if (onEventCreated) {
        onEventCreated({
          ...result,
          showId: result.showId // ✅ Pasar showId al padre
        });
      }
      
      // 🎉 Mostrar mensaje de éxito con opción de crear secciones
      const successMessage = `Evento "${result.name || formData.name}" creado exitosamente${result.image_url ? ' con imagen' : ''}!\n\n` +
        `✅ Event ID: ${result.eventId}\n` +
        `✅ Show ID: ${result.showId} (auto-creado)\n\n` +
        `¿Deseas asignar secciones al show ahora?`;
      
      if (result.showId && confirm(successMessage)) {
        // El padre debería manejar esto
        if (onEventCreated) {
          onEventCreated({
            ...result,
            showId: result.showId,
            shouldCreateSections: true // Flag para que el padre abra modal de secciones
          });
        }
      } else {
        alert(`Evento creado exitosamente. Puedes asignar secciones más tarde desde el panel de Shows.`);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      const errorMessage = err.message || 'Error desconocido al crear el evento';
      
      // Mostrar información detallada del error
      let detailedError = `Error al crear evento: ${errorMessage}`;
      
      if (err.url) {
        detailedError += `\nURL: ${err.url}`;
      }
      
      if (err.method) {
        detailedError += `\nMétodo: ${err.method}`;
      }
      
      // Si es un error de backend no disponible, mostrar mensaje específico
      if (errorMessage.includes('Backend no disponible') || errorMessage.includes('fetch')) {
        detailedError = `🚨 BACKEND NO DISPONIBLE

El servidor backend no está corriendo en http://localhost:3000

Para solucionarlo:
1. Abre una terminal en la carpeta del backend
2. Ejecuta: npm start (o el comando correspondiente)
3. Verifica que aparezca "Server running on port 3000"
4. Vuelve a intentar crear el evento

Error técnico: ${errorMessage}`;
      }
      
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const formStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  const formGroupStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.2s'
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
        Crear Nuevo Evento
      </h2>
      
      {error && (
        <div style={{
          color: '#dc3545',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          whiteSpace: 'pre-line',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {error}
        </div>
      )}
      
      <div style={formGroupStyle}>
        <label htmlFor="name" style={labelStyle}>Nombre del Evento *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          style={inputStyle}
        />
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="description" style={labelStyle}>Descripción</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          style={inputStyle}
        />
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="category" style={labelStyle}>Categoría *</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          style={inputStyle}
        >
          <option value="MUSIC">🎵 Música</option>
          <option value="SPORTS">⚽ Deportes</option>
          <option value="THEATER">🎭 Teatro</option>
          <option value="CONFERENCE">🎙️ Conferencia</option>
          <option value="OTHER">📌 Otro</option>
        </select>
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="location" style={labelStyle}>Ubicación *</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="Ej: Buenos Aires, Argentina"
          required
          style={inputStyle}
        />
      </div>

      <div style={formGroupStyle}>
        <label style={labelStyle}>📸 Imágenes del Evento (Nuevo Sistema)</label>
        <button
          type="button"
          onClick={() => setShowImageUploader(!showImageUploader)}
          style={{
            ...inputStyle,
            background: showImageUploader ? '#e8f4fd' : '#f9fafb',
            border: '2px dashed ' + (showImageUploader ? '#1890ff' : '#d1d5db'),
            padding: '16px',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#1890ff',
            transition: 'all 0.3s ease'
          }}
        >
          {showImageUploader ? '▼ Ocultar Gestor de Imágenes' : '▶ Mostrar Gestor de Imágenes (4 tipos)'}
        </button>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: '1.5' }}>
          🌐 Nuevo sistema de imágenes múltiples:<br />
          • Carátula Cuadrada (300x300px) - Para listados<br />
          • Carátula Horizontal (626x300px) - Para tarjetas<br />
          • Banner Principal (1620x720px) - Hero del evento<br />
          • Banner Alternativo (1620x700px) - Secciones<br />
          Las imágenes se optimizarán automáticamente al subirlas.
        </div>
        
        {showImageUploader && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
            <EventImageUpload 
              eventId={null}
              onChange={(images) => {
                setEventImages(images);
              }}
              showExisting={false}
              allowUpload={false}
            />
          </div>
        )}
      </div>

      {/* DEPRECADO: Mantener temporalmente por compatibilidad */}
      <div style={{ ...formGroupStyle, opacity: 0.5, pointerEvents: 'none', display: 'none' }}>
        <label htmlFor="image" style={labelStyle}>[DEPRECADO] Imagen del Evento (Sistema Antiguo)</label>
        <input
          type="file"
          id="image"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageChange}
          style={inputStyle}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Formatos permitidos: JPEG, JPG, PNG, GIF, WEBP (máximo 5MB)
        </div>
        {imagePreview && (
          <div style={{ marginTop: '12px' }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ maxWidth: '300px', borderRadius: '6px' }} 
            />
            <button 
              type="button" 
              onClick={removeImage}
              style={{
                display: 'block',
                marginTop: '8px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Quitar imagen
            </button>
          </div>
        )}
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="startsAt" style={labelStyle}>Fecha y Hora de Inicio *</label>
        <input
          type="datetime-local"
          id="startsAt"
          name="startsAt"
          value={formData.startsAt}
          onChange={handleInputChange}
          required
          style={inputStyle}
        />
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="endsAt" style={labelStyle}>Fecha y Hora de Fin *</label>
        <input
          type="datetime-local"
          id="endsAt"
          name="endsAt"
          value={formData.endsAt}
          onChange={handleInputChange}
          required
          style={inputStyle}
        />
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="venue_id" style={labelStyle}>Venue</label>
        <select
          id="venue_id"
          name="venue_id"
          value={formData.venue_id}
          onChange={handleInputChange}
          style={inputStyle}
        >
          <option value="">Seleccionar venue existente...</option>
          {venues.map(venue => (
            <option key={venue.id} value={venue.id}>
              {venue.name} - {venue.city} (Cap: {venue.max_capacity})
            </option>
          ))}
        </select>
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="venue" style={labelStyle}>O escribir venue manualmente</label>
        <input
          type="text"
          id="venue"
          name="venue"
          value={formData.venue}
          onChange={handleInputChange}
          placeholder="Nombre del venue"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          type="submit" 
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            flex: 1
          }}
        >
          {loading ? 'Creando...' : 'Crear Evento'}
        </button>
        
        <button 
          type="button"
          onClick={async () => {
            try {
              setLoading(true);
              setError(null);
              
              // Crear evento de prueba
              const testData = new FormData();
              testData.append('name', 'Evento de Prueba ' + new Date().getTime());
              
              const testDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const testIsoDate = testDate.toISOString();
              testData.append('startsAt', testIsoDate);
              
              testData.append('description', 'Este es un evento de prueba');
              testData.append('venue', 'Venue de Prueba');
              
              const result = await eventsApi.createEvent(testData);
              if (onEventCreated) {
                onEventCreated(result);
              }
              
              alert('Evento de prueba creado exitosamente');
            } catch (err) {
              console.error('Error en prueba:', err);
              const errorMessage = err.message || 'Error desconocido en prueba';
              
              let detailedError = `Error en prueba: ${errorMessage}`;
              
              if (err.url) {
                detailedError += `\nURL: ${err.url}`;
              }
              
              if (errorMessage.includes('Backend no disponible') || errorMessage.includes('fetch')) {
                detailedError = `🚨 PRUEBA FALLIDA - BACKEND NO DISPONIBLE

El servidor backend no está corriendo en http://localhost:3000

Para solucionarlo:
1. Abre una terminal en la carpeta del backend
2. Ejecuta: npm start (o el comando correspondiente)  
3. Verifica que aparezca "Server running on port 3000"
4. Vuelve a hacer la prueba

Error técnico: ${errorMessage}`;
              }
              
              setError(detailedError);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          style={{
            ...buttonStyle,
            background: '#28a745',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            width: 'auto',
            minWidth: '120px'
          }}
        >
          Prueba
        </button>
      </div>
    </form>
  );
};

export default CreateEvent;
