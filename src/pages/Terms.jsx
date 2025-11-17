import React from 'react';
import { Card, Typography, Divider, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function Terms() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea05 0%, #764ba205 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <Title level={1}>Términos y Condiciones</Title>
          <Text type="secondary">Última actualización: {new Date().toLocaleDateString('es-ES')}</Text>
        </div>

        <Card style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>

            <div>
              <Title level={3}>1. Aceptación de los Términos</Title>
              <Paragraph>
                Al acceder y utilizar Ticketera, aceptás estar sujeto a estos Términos y Condiciones, 
                todas las leyes y regulaciones aplicables, y aceptás que sos responsable del cumplimiento 
                de las leyes locales aplicables.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>2. Uso del Servicio</Title>
              <Paragraph>
                Ticketera es una plataforma de venta de entradas para eventos. Al usar nuestro servicio, te comprometés a:
              </Paragraph>
              <ul>
                <li>Proporcionar información precisa y actualizada</li>
                <li>Mantener la seguridad de tu cuenta y contraseña</li>
                <li>No utilizar el servicio para actividades ilegales o no autorizadas</li>
                <li>No revender entradas a precios superiores al valor nominal sin autorización</li>
              </ul>
            </div>

            <Divider />

            <div>
              <Title level={3}>3. Compra de Entradas</Title>
              <Paragraph>
                <Text strong>3.1 Proceso de Compra:</Text> Las entradas se venden por orden de llegada. 
                La confirmación de compra se envía por email una vez procesado el pago.
              </Paragraph>
              <Paragraph>
                <Text strong>3.2 Precios:</Text> Todos los precios están expresados en pesos argentinos (ARS) 
                e incluyen los cargos por servicio aplicables.
              </Paragraph>
              <Paragraph>
                <Text strong>3.3 Métodos de Pago:</Text> Aceptamos pagos a través de MercadoPago, 
                incluyendo tarjetas de crédito, débito y otros métodos disponibles en la plataforma.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>4. Cancelaciones y Reembolsos</Title>
              <Paragraph>
                <Text strong>4.1 Cancelación por el Usuario:</Text> Podés solicitar la cancelación de tu compra 
                hasta 48 horas antes del evento. El reembolso se procesará en un plazo de 10 días hábiles.
              </Paragraph>
              <Paragraph>
                <Text strong>4.2 Cancelación del Evento:</Text> Si un evento es cancelado, se reembolsará 
                automáticamente el valor total de las entradas.
              </Paragraph>
              <Paragraph>
                <Text strong>4.3 Reprogramación:</Text> Si un evento es reprogramado, tus entradas seguirán 
                siendo válidas para la nueva fecha. Si no podés asistir, podés solicitar un reembolso.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>5. Entradas Digitales</Title>
              <Paragraph>
                Las entradas son digitales y se entregan por email. Cada entrada contiene un código QR único 
                que debe presentarse en la entrada del evento. No compartas tu código QR ya que solo puede 
                usarse una vez.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>6. Responsabilidad</Title>
              <Paragraph>
                Ticketera actúa como intermediario entre organizadores y compradores. No somos responsables por:
              </Paragraph>
              <ul>
                <li>La calidad o contenido de los eventos</li>
                <li>Cambios en la programación decididos por los organizadores</li>
                <li>Pérdida o robo de entradas físicas o códigos QR</li>
                <li>Problemas técnicos fuera de nuestro control</li>
              </ul>
            </div>

            <Divider />

            <div>
              <Title level={3}>7. Propiedad Intelectual</Title>
              <Paragraph>
                Todo el contenido de Ticketera, incluyendo textos, gráficos, logos, íconos y software, 
                es propiedad de Ticketera o sus proveedores de contenido y está protegido por las leyes 
                de propiedad intelectual.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>8. Modificaciones</Title>
              <Paragraph>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios entrarán en vigencia inmediatamente después de su publicación en el sitio.
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={3}>9. Contacto</Title>
              <Paragraph>
                Para consultas sobre estos términos, contactanos en:
                <br />
                Email: legal@ticketera.com
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
