import React, { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Spin } from 'antd';
import { discountService } from '../services/discountService';

const { Title, Text, Paragraph } = Typography;

/**
 * Página de prueba para verificar el sistema de descuentos
 * Navegar a: /test-discount
 */
export default function TestDiscount() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testCreateCode = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const testData = {
        code: `TEST${Date.now()}`, // Código único
        description: 'Código de prueba generado automáticamente',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        applicableTo: 'ALL',
        minimumPurchase: 0,
        usageLimitPerUser: 1
      };

      console.log('🧪 INICIANDO TEST DE CREACIÓN DE CÓDIGO');
      console.log('Datos de prueba:', testData);

      const response = await discountService.createCode(testData);
      
      setResult({
        success: true,
        message: '✅ Código creado exitosamente',
        data: response
      });
    } catch (err) {
      console.error('❌ Error en test:', err);
      
      setError({
        status: err.response?.status || 'N/A',
        message: err.response?.data?.error || err.response?.data?.message || err.message,
        fullError: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testListCodes = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🧪 INICIANDO TEST DE LISTADO DE CÓDIGOS');
      
      const response = await discountService.listCodes({ page: 1, limit: 5 });
      
      setResult({
        success: true,
        message: `✅ Se encontraron ${response.codes.length} códigos`,
        data: response
      });
    } catch (err) {
      console.error('❌ Error en test:', err);
      
      setError({
        status: err.response?.status || 'N/A',
        message: err.response?.data?.error || err.response?.data?.message || err.message,
        fullError: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2}>🧪 Test de Sistema de Descuentos</Title>
        <Paragraph>
          Esta página te ayuda a verificar si el backend de códigos de descuento está funcionando correctamente.
        </Paragraph>

        <Alert
          message="Instrucciones"
          description={
            <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li>Abrí la consola del navegador (F12)</li>
              <li>Hacé clic en alguno de los botones de prueba</li>
              <li>Mirá los resultados abajo y en la consola</li>
              <li>Si hay error, compartí el mensaje completo</li>
            </ol>
          }
          type="info"
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Test 1: Crear Código de Descuento">
            <Paragraph>
              Intenta crear un código de prueba llamando al endpoint:
              <br />
              <code>POST /api/admin/discount-codes</code>
            </Paragraph>
            <Button 
              type="primary" 
              onClick={testCreateCode} 
              loading={loading}
              size="large"
            >
              Crear Código de Prueba
            </Button>
          </Card>

          <Card title="Test 2: Listar Códigos">
            <Paragraph>
              Intenta obtener la lista de códigos existentes:
              <br />
              <code>GET /api/admin/discount-codes</code>
            </Paragraph>
            <Button 
              onClick={testListCodes} 
              loading={loading}
              size="large"
            >
              Listar Códigos
            </Button>
          </Card>

          {loading && (
            <Card>
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>Ejecutando prueba...</Text>
                </div>
              </div>
            </Card>
          )}

          {result && (
            <Alert
              message={result.message}
              description={
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  <pre style={{ maxHeight: 300, overflow: 'auto' }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              }
              type="success"
              showIcon
            />
          )}

          {error && (
            <Alert
              message={`❌ Error ${error.status}`}
              description={
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Mensaje:</strong> {error.message}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    <strong>Detalles:</strong>
                    <pre style={{ maxHeight: 300, overflow: 'auto', marginTop: 8 }}>
                      {JSON.stringify(error.fullError, null, 2)}
                    </pre>
                  </div>
                  <div style={{ marginTop: 12, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
                    <strong>💡 Posibles soluciones:</strong>
                    <ul style={{ paddingLeft: 20, marginBottom: 0, marginTop: 8 }}>
                      {error.status === 401 && <li>Iniciá sesión nuevamente como ADMIN</li>}
                      {error.status === 403 && <li>Tu usuario no tiene permisos de ADMIN</li>}
                      {error.status === 404 && <li>El endpoint no existe en el backend. Verificá que el backend tenga implementado POST /api/admin/discount-codes</li>}
                      {error.status === 409 && <li>El código ya existe. El test crea códigos únicos, así que este error es raro</li>}
                      {error.status === 500 && <li>Error interno del servidor. Revisá los logs del backend</li>}
                      {error.status === 'N/A' && <li>No se pudo conectar con el backend. ¿Está corriendo en http://localhost:4000?</li>}
                    </ul>
                  </div>
                </div>
              }
              type="error"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
