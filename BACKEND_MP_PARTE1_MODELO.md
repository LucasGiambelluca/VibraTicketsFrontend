# Backend Mercado Pago - Parte 1: Modelo de Datos

## Tabla `payment_providers`

### Migración SQL

```sql
-- Crear tabla payment_providers
CREATE TABLE IF NOT EXISTS payment_providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  public_key VARCHAR(255),
  access_token VARCHAR(255) NOT NULL,
  notification_url VARCHAR(255) NOT NULL,
  success_url VARCHAR(255) NOT NULL,
  failure_url VARCHAR(255) NOT NULL,
  pending_url VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_active (active)
);

-- Insertar configuración de prueba de Mercado Pago
INSERT INTO payment_providers (
  name, 
  public_key,
  access_token, 
  notification_url, 
  success_url, 
  failure_url, 
  pending_url,
  active
) VALUES (
  'mercado_pago',
  'TEST-cd8c0ed6-9f60-4d85-aded-f92655e8b5db',
  'TEST-REEMPLAZAR-CON-TU-ACCESS-TOKEN',
  'https://tu-dominio.com/api/mercadopago/webhook',
  'https://tu-dominio.com/payment/success',
  'https://tu-dominio.com/payment/failure',
  'https://tu-dominio.com/payment/pending',
  TRUE
) ON DUPLICATE KEY UPDATE 
  public_key = VALUES(public_key),
  access_token = VALUES(access_token);
```

### Modelo ORM (Sequelize)

```javascript
// models/PaymentProvider.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentProvider = sequelize.define('PaymentProvider', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  public_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  access_token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  notification_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  success_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  failure_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  pending_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'payment_providers',
  timestamps: true,
  underscored: true
});

module.exports = PaymentProvider;
```

## Tablas Auxiliares

### Tabla `payment_preferences` (para tracking)

```sql
CREATE TABLE IF NOT EXISTS payment_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  preference_id VARCHAR(255) NOT NULL UNIQUE,
  hold_id INT NOT NULL,
  user_id INT NOT NULL,
  amount_cents INT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  init_point TEXT,
  sandbox_init_point TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hold_id (hold_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (hold_id) REFERENCES holds(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tabla `payment_notifications` (auditoría de webhooks)

```sql
CREATE TABLE IF NOT EXISTS payment_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(255) NOT NULL,
  hold_id INT,
  status VARCHAR(50),
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_id (payment_id),
  INDEX idx_hold_id (hold_id)
);
```
