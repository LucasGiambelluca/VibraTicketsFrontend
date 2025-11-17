import React, { useState, useEffect } from 'react';
import { paymentConfigApi } from '../services/apiService';
import './MercadoPagoConfig.css';

/**
 * Componente de Configuración de MercadoPago para ADMIN
 * 
 * Funcionalidades:
 * - Ver configuración actual
 * - Guardar/actualizar credenciales
 * - Activar/desactivar MercadoPago
 * - Probar conexión
 * - Eliminar credenciales
 */
const MercadoPagoConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    accessToken: '',
    publicKey: '',
    isSandbox: true,
    isActive: false,
    notificationUrl: '',
    timeout: 5000,
    maxInstallments: 12
  });

  // Cargar configuración al montar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await paymentConfigApi.getMercadoPagoConfig();
      setConfig(data);
      
      // Actualizar formulario con datos existentes
      if (data) {
        setFormData({
          accessToken: '', // Por seguridad, no mostrar el token
          publicKey: data.publicKey || '',
          isSandbox: data.isSandbox !== undefined ? data.isSandbox : true,
          isActive: data.isActive || false,
          notificationUrl: data.config?.notification_url || '',
          timeout: data.config?.timeout || 5000,
          maxInstallments: data.config?.max_installments || 12
        });
      }
    } catch (err) {
      console.error('❌ Error al cargar configuración:', err);
      
      // Si no existe configuración, no es un error
      if (err.message?.includes('404') || err.message?.includes('NotFound')) {
        setConfig(null);
      } else {
        setError(err.message || 'Error al cargar configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar accessToken
    if (!formData.accessToken || formData.accessToken.length < 10) {
      setError('El Access Token debe tener al menos 10 caracteres');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const configData = {
        accessToken: formData.accessToken,
        publicKey: formData.publicKey || undefined,
        isSandbox: formData.isSandbox,
        isActive: formData.isActive,
        config: {
          notificationUrl: formData.notificationUrl || undefined,
          timeout: parseInt(formData.timeout) || 5000,
          maxInstallments: parseInt(formData.maxInstallments) || 12
        }
      };
      
      const result = await paymentConfigApi.saveMercadoPagoConfig(configData);
      setSuccess(result.message || '✅ Configuración guardada exitosamente');
      
      // Recargar configuración
      setTimeout(() => {
        loadConfig();
        setSuccess(null);
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!config) {
      setError('Primero debes configurar las credenciales');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const newStatus = !config.isActive;
      const result = await paymentConfigApi.toggleMercadoPago(newStatus);
      setSuccess(result.message || `✅ MercadoPago ${newStatus ? 'activado' : 'desactivado'}`);
      
      // Recargar configuración
      setTimeout(() => {
        loadConfig();
        setSuccess(null);
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error al cambiar estado:', err);
      setError(err.message || 'Error al cambiar estado');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config?.hasAccessToken) {
      setError('Primero debes configurar el Access Token');
      return;
    }
    
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      
      const result = await paymentConfigApi.testMercadoPagoConnection();
      if (result.success) {
        setSuccess(`✅ ${result.message}\n\nDetalles: ${JSON.stringify(result.details, null, 2)}`);
      } else {
        setError(`❌ ${result.message}\n\nDetalles: ${result.details}`);
      }
      
    } catch (err) {
      console.error('❌ Error en prueba:', err);
      setError(err.message || 'Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar la configuración de MercadoPago?\n\nEsta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const result = await paymentConfigApi.deleteMercadoPagoConfig();
      setSuccess(result.message || '✅ Configuración eliminada');
      setConfig(null);
      
      // Resetear formulario
      setFormData({
        accessToken: '',
        publicKey: '',
        isSandbox: true,
        isActive: false,
        notificationUrl: '',
        timeout: 5000,
        maxInstallments: 12
      });
      
      setTimeout(() => setSuccess(null), 2000);
      
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
      setError(err.message || 'Error al eliminar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mp-config-container">
        <div className="mp-config-loading">
          <div className="spinner"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-config-container">
      <div className="mp-config-header">
        <h2>⚙️ Configuración de MercadoPago</h2>
        
        {config && (
          <div className="mp-status-badge">
            <span className={`status-indicator ${config.isActive ? 'active' : 'inactive'}`}>
              {config.isActive ? '✅ Activo' : '⭕ Inactivo'}
            </span>
            <span className={`mode-badge ${config.isSandbox ? 'sandbox' : 'production'}`}>
              {config.isSandbox ? '🧪 Sandbox' : '🚀 Producción'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mp-alert mp-alert-error">
          <strong>❌ Error:</strong>
          <pre>{error}</pre>
        </div>
      )}

      {success && (
        <div className="mp-alert mp-alert-success">
          <pre>{success}</pre>
        </div>
      )}

      {/* Estado Actual */}
      {config && (
        <div className="mp-current-config">
          <h3>📊 Estado Actual</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>Provider:</label>
              <span>{config.provider || 'mercadopago'}</span>
            </div>
            <div className="config-item">
              <label>Estado:</label>
              <span className={config.isActive ? 'text-success' : 'text-muted'}>
                {config.isActive ? 'Activo ✅' : 'Inactivo ⭕'}
              </span>
            </div>
            <div className="config-item">
              <label>Modo:</label>
              <span>{config.isSandbox ? 'Sandbox 🧪' : 'Producción 🚀'}</span>
            </div>
            <div className="config-item">
              <label>Access Token:</label>
              <span>{config.hasAccessToken ? 'Configurado 🔐' : 'No configurado ❌'}</span>
            </div>
            <div className="config-item">
              <label>Public Key:</label>
              <span>{config.publicKey ? config.publicKey : 'No configurado'}</span>
            </div>
            <div className="config-item">
              <label>Última actualización:</label>
              <span>{config.updatedAt ? new Date(config.updatedAt).toLocaleString('es-AR') : 'N/A'}</span>
            </div>
          </div>

          <div className="mp-actions">
            <button 
              onClick={handleToggle} 
              disabled={saving}
              className={`btn ${config.isActive ? 'btn-warning' : 'btn-success'}`}
            >
              {saving ? '⏳ Procesando...' : config.isActive ? '⏸️ Desactivar' : '▶️ Activar'}
            </button>
            
            <button 
              onClick={handleTest} 
              disabled={testing || !config.hasAccessToken}
              className="btn btn-info"
            >
              {testing ? '🧪 Probando...' : '🧪 Probar Conexión'}
            </button>
            
            <button 
              onClick={handleDelete} 
              disabled={saving}
              className="btn btn-danger"
            >
              🗑️ Eliminar Configuración
            </button>
          </div>
        </div>
      )}

      {/* Formulario de Configuración */}
      <div className="mp-config-form">
        <h3>🔧 {config ? 'Actualizar' : 'Configurar'} Credenciales</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="accessToken">
              Access Token *
              <span className="help-text">
                Obtén tu token desde el panel de MercadoPago
              </span>
            </label>
            <input
              type="password"
              id="accessToken"
              name="accessToken"
              value={formData.accessToken}
              onChange={handleInputChange}
              placeholder="TEST-1234567890-112233-abc..."
              required
              minLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="publicKey">
              Public Key
              <span className="help-text">Opcional</span>
            </label>
            <input
              type="text"
              id="publicKey"
              name="publicKey"
              value={formData.publicKey}
              onChange={handleInputChange}
              placeholder="TEST-pub-123..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isSandbox"
                  checked={formData.isSandbox}
                  onChange={handleInputChange}
                />
                🧪 Modo Sandbox (Pruebas)
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                ▶️ Activar inmediatamente
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notificationUrl">
              Notification URL (Webhook)
              <span className="help-text">URL donde MercadoPago enviará notificaciones</span>
            </label>
            <input
              type="url"
              id="notificationUrl"
              name="notificationUrl"
              value={formData.notificationUrl}
              onChange={handleInputChange}
              placeholder="https://tu-dominio.com/api/payments/webhook"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="timeout">
                Timeout (ms)
                <span className="help-text">Tiempo de espera para requests</span>
              </label>
              <input
                type="number"
                id="timeout"
                name="timeout"
                value={formData.timeout}
                onChange={handleInputChange}
                min={1000}
                max={30000}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxInstallments">
                Cuotas Máximas
                <span className="help-text">Cantidad máxima de cuotas</span>
              </label>
              <input
                type="number"
                id="maxInstallments"
                name="maxInstallments"
                value={formData.maxInstallments}
                onChange={handleInputChange}
                min={1}
                max={24}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? '💾 Guardando...' : '💾 Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>

      {/* Ayuda */}
      <div className="mp-help">
        <h3>ℹ️ Información</h3>
        <ul>
          <li>
            <strong>Access Token:</strong> Credencial privada para realizar operaciones. 
            Nunca la compartas públicamente.
          </li>
          <li>
            <strong>Public Key:</strong> Credencial pública para el frontend (opcional en este flujo).
          </li>
          <li>
            <strong>Modo Sandbox:</strong> Usa credenciales de prueba para testing. 
            No se procesan pagos reales.
          </li>
          <li>
            <strong>Modo Producción:</strong> Usa credenciales reales. Se procesan pagos reales.
          </li>
          <li>
            <strong>Notification URL:</strong> MercadoPago enviará notificaciones de pagos a esta URL.
          </li>
        </ul>
        
        <div className="mp-links">
          <a 
            href="https://www.mercadopago.com.ar/developers/panel/app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-link"
          >
            📚 Panel de Desarrolladores de MercadoPago
          </a>
        </div>
      </div>
    </div>
  );
};

export default MercadoPagoConfig;
