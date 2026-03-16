-- Migration: Create cart_orders and cart_order_items
-- This supports the new multi-item shopping cart checkout flow.

USE brcprint_db;

CREATE TABLE IF NOT EXISTS cart_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_token VARCHAR(36) UNIQUE NOT NULL,
  client_id INT NULL,
  status ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending_payment',

  -- Price Breakdown
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  coupon_id INT NULL,
  delivery_method ENUM('shipping', 'pickup') DEFAULT 'shipping',

  -- Shipping Address Snapshot
  client_name VARCHAR(255),
  client_document VARCHAR(50),
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  client_zipcode VARCHAR(20),
  client_address VARCHAR(255),
  client_number VARCHAR(20),
  client_complement VARCHAR(100),
  client_neighborhood VARCHAR(100),
  client_city VARCHAR(100),
  client_state VARCHAR(20),

  -- Shipping Service Details (Melhor Envios)
  shipping_service VARCHAR(100),
  shipping_service_id INT,
  melhorenvio_order_id VARCHAR(255),
  shipping_tracking_code VARCHAR(255),

  -- Payment Details (MercadoPago)
  mp_preference_id VARCHAR(255),
  mp_payment_id BIGINT,
  mp_status VARCHAR(50),

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  type ENUM('digital', 'ready_stock', 'custom_pod') NOT NULL,
  catalog_item_id INT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  color VARCHAR(100),
  stl_file_url TEXT,
  extras JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES cart_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE SET NULL
);
