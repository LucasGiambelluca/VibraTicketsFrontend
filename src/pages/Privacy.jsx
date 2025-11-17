import React from 'react';
import { Card, Typography, Divider, Space } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function Privacy() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea05 0%, #764ba205 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <Title level={1}>Política de Privacidad</Title>
          <Text type="secondary">Última actualización: {new Date().toLocaleDateString('es-ES')}</Text>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>

            <div>
              <Title level={3}>1. Información que Recopilamos</Title>
              <Paragraph>
                En Ticketera, recopilamos la siguiente información:
              </Paragraph>
              <Paragraph>
                <Text strong>1.1 Información Personal:</Text>
                <ul>
                  <li>Nombre completo</li>
                  <li>Dirección de email</li>
                  <li>Número de teléfono</li>
                  <li>Información de pago (procesada por MercadoPago)</li>
                </ul>
              </Paragraph>
              <Paragraph>
                <Text strong>1.2 Información de Uso:</Text>
                <ul>
                  <li>Historial de compras</li>
                  <li>Preferencias de eventos</li>
                  <li>Interacciones con el sitio</li>
                  <li>Datos de navegación (cookies)</li>
                </ul>
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>2. Cómo Usamos tu Información</Title>
              <Paragraph>
                Utilizamos tu información personal para:
              </Paragraph>
              <ul>
                <li>Procesar tus compras de entradas</li>
                <li>Enviarte confirmaciones y entradas digitales</li>
                <li>Comunicarte cambios en eventos</li>
                <li>Mejorar nuestros servicios</li>
                <li>Enviarte ofertas y promociones (con tu consentimiento)</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </div>

            <Divider />

            <div>
              <Title level={3}>3. Compartir Información</Title>
              <Paragraph>
                No vendemos tu información personal. Compartimos información solo con:
              </Paragraph>
              <Paragraph>
                <Text strong>3.1 Organizadores de Eventos:</Text> Compartimos tu nombre y email con los 
                organizadores de los eventos a los que compraste entradas.
              </Paragraph>
              <Paragraph>
                <Text strong>3.2 Procesadores de Pago:</Text> MercadoPago procesa tus pagos de forma segura. 
                No almacenamos datos de tarjetas de crédito.
              </Paragraph>
              <Paragraph>
                <Text strong>3.3 Proveedores de Servicios:</Text> Empresas que nos ayudan a operar el sitio 
                (hosting, email, analytics) bajo estrictos acuerdos de confidencialidad.
              </Paragraph>
              <Paragraph>
                <Text strong>3.4 Requerimientos Legales:</Text> Cuando sea requerido por ley o para proteger 
                nuestros derechos.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>4. Seguridad de Datos</Title>
              <Paragraph>
                Implementamos medidas de seguridad para proteger tu información:
              </Paragraph>
              <ul>
                <li>Encriptación SSL/TLS para todas las transmisiones</li>
                <li>Servidores seguros y protegidos</li>
                <li>Acceso restringido a datos personales</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Autenticación de dos factores (próximamente)</li>
              </ul>
            </div>

            <Divider />

            <div>
              <Title level={3}>5. Cookies y Tecnologías Similares</Title>
              <Paragraph>
                Utilizamos cookies para:
              </Paragraph>
              <ul>
                <li>Mantener tu sesión activa</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso del sitio</li>
                <li>Personalizar tu experiencia</li>
              </ul>
              <Paragraph>
                Podés configurar tu navegador para rechazar cookies, pero esto puede afectar 
                la funcionalidad del sitio.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>6. Tus Derechos</Title>
              <Paragraph>
                Tenés derecho a:
              </Paragraph>
              <ul>
                <li><Text strong>Acceder:</Text> Solicitar una copia de tu información personal</li>
                <li><Text strong>Rectificar:</Text> Corregir información inexacta</li>
                <li><Text strong>Eliminar:</Text> Solicitar la eliminación de tu cuenta y datos</li>
                <li><Text strong>Portabilidad:</Text> Recibir tus datos en formato estructurado</li>
                <li><Text strong>Oposición:</Text> Oponerte al procesamiento de tus datos</li>
                <li><Text strong>Limitar:</Text> Restringir el procesamiento de tus datos</li>
              </ul>
              <Paragraph>
                Para ejercer estos derechos, contactanos en privacy@ticketera.com
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>7. Retención de Datos</Title>
              <Paragraph>
                Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario 
                para proporcionarte servicios. También conservamos información según lo requieran las 
                obligaciones legales, resolución de disputas y cumplimiento de acuerdos.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>8. Menores de Edad</Title>
              <Paragraph>
                Nuestro servicio no está dirigido a menores de 13 años. No recopilamos intencionalmente 
                información personal de menores de 13 años. Si descubrimos que hemos recopilado información 
                de un menor, la eliminaremos inmediatamente.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>9. Cambios en esta Política</Title>
              <Paragraph>
                Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos 
                por email o mediante un aviso destacado en nuestro sitio.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>10. Contacto</Title>
              <Paragraph>
                Para consultas sobre privacidad, contactanos en:
                <br />
                Email: privacy@ticketera.com
                <br />
                Dirección: Av. Corrientes 1234, CABA, Argentina
                <br />
                Teléfono: 0800-TICKETS (842-5387)
              </Paragraph>
            </div>

          </Space>
        </Card>

      </div>
    </div>
  );
}
