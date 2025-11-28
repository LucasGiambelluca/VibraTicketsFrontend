import React, { useState } from 'react';
import {
  Form, Input, Select, InputNumber, DatePicker,
  Switch, Button, Space, Divider, Alert, Row, Col,
  Typography, Card
} from 'antd';
import {
  InfoCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
  CalendarOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title, Text } = Typography;

const DiscountCodeForm = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState(
    initialValues?.discount_type || 'PERCENTAGE'
  );
  const [applicableTo, setApplicableTo] = useState(
    initialValues?.applicable_to || 'ALL'
  );

  const handleSubmit = (values) => {
    console.log('====================');
    console.log('📦 DiscountCodeForm - handleSubmit');
    console.log('Valores RAW del formulario:', values);
    console.log('====================');
    
    // Convertir fechas a formato ISO
    if (values.validityPeriod) {
      values.validFrom = values.validityPeriod[0].toISOString();
      values.validUntil = values.validityPeriod[1].toISOString();
      delete values.validityPeriod;
      console.log('Fechas convertidas:');
      console.log('- validFrom:', values.validFrom);
      console.log('- validUntil:', values.validUntil);
    }

    // Ajustar valores nulos
    if (!values.minimumPurchase) values.minimumPurchase = 0;
    if (!values.usageLimit) values.usageLimit = null;
    if (!values.maximumDiscount) values.maximumDiscount = null;

    console.log('====================');
    console.log('Valores PROCESADOS a enviar:');
    console.log(JSON.stringify(values, null, 2));
    console.log('Llamando a onSubmit...');
    console.log('====================');
    
    onSubmit(values);
  };

  const validateCode = (_, value) => {
    if (!value) return Promise.reject('El código es requerido');
    if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
      return Promise.reject('Solo letras mayúsculas y números');
    }
    if (value.length < 3 || value.length > 20) {
      return Promise.reject('Entre 3 y 20 caracteres');
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...initialValues,
        discountType: initialValues?.discountType || 'PERCENTAGE',
        discountValue: initialValues?.discountValue,
        applicableTo: initialValues?.applicableTo || 'ALL',
        minimumPurchase: initialValues?.minimumPurchase || 0,
        maximumDiscount: initialValues?.maximumDiscount,
        usageLimit: initialValues?.usageLimit,
        usageLimitPerUser: initialValues?.usageLimitPerUser || 1,
        validityPeriod: initialValues?.validUntil ? [
          dayjs(initialValues.validFrom),
          dayjs(initialValues.validUntil)
        ] : undefined
      }}
      onFinish={handleSubmit}
    >
      {/* Información básica */}
      <Card 
        style={{ marginBottom: '16px' }}
        title={
          <Space>
            <InfoCircleOutlined />
            Información Básica
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Código del Cupón"
              rules={[{ validator: validateCode }]}
              extra="Ej: VERANO2024, BLACKFRIDAY"
            >
              <Input
                placeholder="CODIGO2024"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => {
                  const upperValue = e.target.value.toUpperCase();
                  form.setFieldValue('code', upperValue);
                }}
                disabled={!!initialValues}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="description"
              label="Descripción"
              rules={[{ required: true, message: 'Descripción requerida' }]}
            >
              <Input 
                placeholder="Descuento de verano 2024"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="internalNotes"
              label="Notas Internas (opcional)"
            >
              <TextArea
                rows={2}
                placeholder="Notas para administradores..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Configuración del Descuento */}
      <Card 
        style={{ marginBottom: '16px' }}
        title={
          <Space>
            <DollarOutlined />
            Configuración del Descuento
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="discountType"
              label="Tipo de Descuento"
              rules={[{ required: true }]}
            >
              <Select 
                onChange={setDiscountType}
                size="large"
                suffixIcon={discountType === 'PERCENTAGE' ? <PercentageOutlined /> : <DollarOutlined />}
              >
                <Option value="PERCENTAGE">
                  <Space>
                    <PercentageOutlined />
                    Porcentaje (%)
                  </Space>
                </Option>
                <Option value="FIXED_AMOUNT">
                  <Space>
                    <DollarOutlined />
                    Monto Fijo ($)
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="discountValue"
              label={discountType === 'PERCENTAGE' ? 'Porcentaje de Descuento' : 'Monto del Descuento'}
              rules={[
                { required: true, message: 'Valor requerido' },
                {
                  type: 'number',
                  min: discountType === 'PERCENTAGE' ? 1 : 100,
                  max: discountType === 'PERCENTAGE' ? 100 : 100000,
                  message: discountType === 'PERCENTAGE' 
                    ? 'Entre 1% y 100%' 
                    : 'Entre $100 y $100,000'
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                formatter={(value) => 
                  discountType === 'PERCENTAGE' 
                    ? `${value}%`
                    : `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, '').replace('%', '')}
                placeholder={discountType === 'PERCENTAGE' ? '20' : '1000'}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="applicableTo"
              label="Aplicable a"
              onChange={setApplicableTo}
            >
              <Select size="large">
                <Option value="ALL">Todos los eventos</Option>
                <Option value="SPECIFIC_EVENTS">Eventos específicos</Option>
                <Option value="SPECIFIC_SHOWS">Shows específicos</Option>
                <Option value="SPECIFIC_CATEGORIES">Categorías específicas</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {applicableTo === 'SPECIFIC_EVENTS' && (
          <Alert 
            message="Selección de eventos específicos estará disponible próximamente"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
      </Card>

      {/* Límites y Restricciones */}
      <Card 
        style={{ marginBottom: '16px' }}
        title={
          <Space>
            <ShoppingCartOutlined />
            Límites y Restricciones
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="minimumPurchase"
              label="Compra Mínima ($)"
              extra="0 = sin mínimo"
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={0}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                placeholder="5000"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="maximumDiscount"
              label="Descuento Máximo ($)"
              extra="Solo para porcentajes"
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={0}
                disabled={discountType !== 'PERCENTAGE'}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                placeholder="10000"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="usageLimit"
              label="Límite Total de Usos"
              extra="Vacío = ilimitado"
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={1}
                placeholder="100"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="usageLimitPerUser"
              label="Límite por Usuario"
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={1}
                placeholder="1"
              />
            </Form.Item>
          </Col>

          <Col span={16}>
            <Form.Item
              name="validityPeriod"
              label={
                <Space>
                  <CalendarOutlined />
                  Período de Validez
                </Space>
              }
              extra="Dejar vacío para sin expiración"
            >
              <RangePicker
                showTime
                style={{ width: '100%' }}
                size="large"
                format="DD/MM/YYYY HH:mm"
                placeholder={['Fecha inicio', 'Fecha fin']}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Ejemplos de Códigos */}
      <Alert
        message="💡 Ejemplos de Códigos de Descuento"
        description={
          <div style={{ marginTop: '8px' }}>
            <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
              <li><strong>WELCOME20</strong>: 20% de descuento para nuevos usuarios, 1 uso por persona</li>
              <li><strong>VERANO1000</strong>: $1000 de descuento, compra mínima de $5000</li>
              <li><strong>FLASH50</strong>: 50% OFF con tope de $10000, válido por 48hs</li>
              <li><strong>VIP30</strong>: 30% de descuento sin límites para clientes VIP</li>
              <li><strong>3X2TEATRO</strong>: Descuento especial para eventos de teatro</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Botones de acción */}
      <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
        <Space>
          <Button 
            type="primary" 
            htmlType="submit"
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              minWidth: '120px'
            }}
          >
            {initialValues ? 'Actualizar' : 'Crear'} Código
          </Button>
          <Button onClick={onCancel} size="large">
            Cancelar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default DiscountCodeForm;
