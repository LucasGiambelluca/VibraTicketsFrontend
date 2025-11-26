import React from 'react';
import { Result, Button } from 'antd';

/**
 * Error Boundary para capturar errores de renderizado en React
 * Evita que toda la aplicación se rompa cuando hay un error
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar la UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Registrar el error en la consola
    console.error('❌ Error capturado por ErrorBoundary:', error, errorInfo);
    
    // Guardar información del error en el estado
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    // Resetear el estado y recargar
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback cuando hay un error
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '24px'
        }}>
          <Result
            status="error"
            title="¡Ups! Algo salió mal"
            subTitle="Lo sentimos, ocurrió un error inesperado. Por favor, recargá la página."
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReset}>
                Recargar Página
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                Ir al Inicio
              </Button>
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ 
                textAlign: 'left', 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '8px',
                marginTop: '24px',
                maxWidth: '600px',
                margin: '24px auto 0'
              }}>
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                    Detalles del Error (solo en desarrollo)
                  </summary>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                    <br /><br />
                    <strong>Stack:</strong>
                    <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
