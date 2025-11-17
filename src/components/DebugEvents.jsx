import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Space, Divider } from 'antd';
import { useEvents } from '../hooks/useEvents';
import { eventsApi } from '../services/apiService';

const { Title, Text, Paragraph } = Typography;

export default function DebugEvents() {
  const [directApiResult, setDirectApiResult] = useState(null);
  const [directApiLoading, setDirectApiLoading] = useState(false);
  const [directApiError, setDirectApiError] = useState(null);

  // Usar el hook useEvents
  const hookResult = useEvents({
    status: 'active',
    limit: 6,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Función para probar la API directamente
  const testDirectApi = async () => {
    setDirectApiLoading(true);
    setDirectApiError(null);
    
    try {
      const params = {
        page: 1,
        limit: 6,
        status: 'active',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };
      
      const result = await eventsApi.getEvents(params);
      setDirectApiResult(result);
    } catch (error) {
      console.error('🧪 DebugEvents: Error en API directa:', error);
      setDirectApiError(error.message);
    } finally {
      setDirectApiLoading(false);
    }
  };

  useEffect(() => {
    }, [hookResult.events, hookResult.loading, hookResult.error]);

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', margin: '20px 0' }}>
      <Card title="🔍 Debug Events - Diagnóstico Completo" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* Resultado del Hook */}
          <div>
            <Title level={4}>📊 Resultado del Hook useEvents</Title>
            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
              <Text strong>Loading: </Text>
              <Text>{hookResult.loading ? 'true' : 'false'}</Text>
              <br />
              <Text strong>Error: </Text>
              <Text>{hookResult.error || 'null'}</Text>
              <br />
              <Text strong>Events: </Text>
              <Text>{Array.isArray(hookResult.events) ? `Array con ${hookResult.events.length} elementos` : `${typeof hookResult.events} - ${hookResult.events}`}</Text>
              <br />
              <Text strong>Eventos: </Text>
              <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(hookResult.events, null, 2)}
              </pre>
            </div>
          </div>

          <Divider />

          {/* Test API Directo */}
          <div>
            <Title level={4}>🧪 Test API Directo</Title>
            <Button 
              type="primary" 
              onClick={testDirectApi} 
              loading={directApiLoading}
              style={{ marginBottom: '10px' }}
            >
              Probar API Directamente
            </Button>
            
            {directApiResult && (
              <div style={{ background: '#f6ffed', padding: '10px', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                <Text strong>✅ Resultado API Directo:</Text>
                <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(directApiResult, null, 2)}
                </pre>
              </div>
            )}
            
            {directApiError && (
              <div style={{ background: '#fff2f0', padding: '10px', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                <Text strong>❌ Error API Directo:</Text>
                <Text>{directApiError}</Text>
              </div>
            )}
          </div>

          <Divider />

          {/* Comparación */}
          <div>
            <Title level={4}>🔄 Comparación</Title>
            <div style={{ background: '#fff7e6', padding: '10px', borderRadius: '4px' }}>
              <Text strong>Hook Events Length: </Text>
              <Text>{hookResult.events?.length || 0}</Text>
              <br />
              <Text strong>Direct API Events Length: </Text>
              <Text>{directApiResult?.events?.length || 0}</Text>
              <br />
              <Text strong>¿Coinciden?: </Text>
              <Text style={{ color: (hookResult.events?.length || 0) === (directApiResult?.events?.length || 0) ? 'green' : 'red' }}>
                {(hookResult.events?.length || 0) === (directApiResult?.events?.length || 0) ? 'SÍ' : 'NO'}
              </Text>
            </div>
          </div>

        </Space>
      </Card>
    </div>
  );
}
