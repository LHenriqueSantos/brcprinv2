-- ============================================================
-- BRCPrint – Sistema de Precificação de Impressão 3D
-- Script de Inicialização Consolidado (v3.0)
-- ============================================================

CREATE DATABASE IF NOT EXISTS brcprint_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE brcprint_db;

-- ------------------------------------------------------------
-- Configurações globais do negócio (single-row)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_config (
  id INT PRIMARY KEY DEFAULT 1,
  -- Core pricing
  energy_kwh_price DECIMAL(10,4) NOT NULL DEFAULT 0.7500,
  labor_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  default_profit_margin_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  default_loss_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  spare_parts_reserve_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  packaging_cost DECIMAL(10,2) DEFAULT 0.00,
  default_tax_pct DECIMAL(5,2) DEFAULT 0.00,
  language_default VARCHAR(10) DEFAULT 'pt',
  currency_code VARCHAR(10) DEFAULT 'BRL',
  currency_symbol VARCHAR(10) DEFAULT 'R$',
  -- SMTP
  smtp_host VARCHAR(255) DEFAULT NULL,
  smtp_port INT DEFAULT 587,
  smtp_user VARCHAR(255) DEFAULT NULL,
  smtp_pass VARCHAR(255) DEFAULT NULL,
  sender_email VARCHAR(255) DEFAULT NULL,
  -- Feature flags
  enable_3d_viewer TINYINT(1) DEFAULT 1,
  enable_timeline TINYINT(1) DEFAULT 1,
  enable_chat TINYINT(1) DEFAULT 1,
  enable_stripe TINYINT(1) DEFAULT 0,
  stripe_public_key TEXT DEFAULT NULL,
  stripe_secret_key TEXT DEFAULT NULL,
  enable_auto_quoting TINYINT(1) DEFAULT 0,
  enable_whatsapp TINYINT(1) DEFAULT 0,
  whatsapp_api_url VARCHAR(500) DEFAULT NULL,
  whatsapp_instance_id VARCHAR(255) DEFAULT NULL,
  whatsapp_api_token TEXT DEFAULT NULL,
  -- Shipping
  company_zipcode VARCHAR(20) DEFAULT NULL,
  packaging_length DECIMAL(8,2) DEFAULT 0,
  packaging_width DECIMAL(8,2) DEFAULT 0,
  packaging_height DECIMAL(8,2) DEFAULT 0,
  shipping_api_provider VARCHAR(50) DEFAULT NULL,
  shipping_api_token TEXT DEFAULT NULL,
  -- Mercado Pago
  enable_mercadopago TINYINT(1) DEFAULT 0,
  mp_access_token TEXT DEFAULT NULL,
  mp_public_key TEXT DEFAULT NULL,
  -- Cashback
  enable_cashback TINYINT(1) DEFAULT 0,
  cashback_pct DECIMAL(5,2) DEFAULT 0,
  -- Business Details
  company_address VARCHAR(255) DEFAULT NULL,
  company_number VARCHAR(20) DEFAULT NULL,
  company_complement VARCHAR(100) DEFAULT NULL,
  company_neighborhood VARCHAR(100) DEFAULT NULL,
  company_city VARCHAR(100) DEFAULT NULL,
  company_state VARCHAR(2) DEFAULT NULL,
  -- API / Webhooks
  api_key VARCHAR(255) DEFAULT NULL,
  webhook_url VARCHAR(500) DEFAULT NULL,
  -- Multicolor
  enable_multicolor TINYINT(1) DEFAULT 0,
  multicolor_markup_pct DECIMAL(5,2) DEFAULT 0,
  multicolor_waste_g DECIMAL(8,2) DEFAULT 0,
  multicolor_hours_added DECIMAL(6,2) DEFAULT 0,
  -- Energy tariff
  energy_flag VARCHAR(20) DEFAULT 'green',
  energy_peak_price DECIMAL(10,4) DEFAULT 0,
  energy_off_peak_price DECIMAL(10,4) DEFAULT 0,
  energy_peak_start TIME DEFAULT '18:00:00',
  energy_peak_end TIME DEFAULT '21:00:00',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Impressoras
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS printers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  type VARCHAR(50) DEFAULT 'FDM',
  power_watts DECIMAL(8,2) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  lifespan_hours INT NOT NULL DEFAULT 2000,
  maintenance_reserve_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  maintenance_alert_threshold INT DEFAULT 200,
  current_hours_printed FLOAT DEFAULT 0,
  last_maintenance_hours FLOAT DEFAULT 0,
  api_type ENUM('octoprint', 'moonraker', 'none') DEFAULT 'none',
  ip_address VARCHAR(255) DEFAULT NULL,
  api_key VARCHAR(255) DEFAULT NULL,
  is_online TINYINT DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Filamentos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  color VARCHAR(50),
  cost_per_kg DECIMAL(10,2) NOT NULL,
  density_g_cm3 DECIMAL(6,4) NOT NULL DEFAULT 1.2400,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Clientes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_type ENUM('individual', 'company') NOT NULL DEFAULT 'individual',
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150),
  document VARCHAR(30),
  email VARCHAR(150),
  phone VARCHAR(30),
  password_hash VARCHAR(255),
  discount_margin_pct DECIMAL(5,2) DEFAULT 0,
  zipcode VARCHAR(20),
  address VARCHAR(255),
  address_number VARCHAR(20),
  address_comp VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(10),
  referred_by INT NULL,
  notes TEXT,
  credit_balance DECIMAL(10,2) DEFAULT 0,
  available_hours_balance DECIMAL(8,2) DEFAULT 0,
  available_grams_balance DECIMAL(10,2) DEFAULT 0,
  subscription_status ENUM('inactive','active','suspended') DEFAULT 'inactive',
  subscription_plan_id INT NULL,
  auth_provider VARCHAR(50),
  auth_provider_id VARCHAR(255),
  total_cashback_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Cotações
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_token VARCHAR(36) UNIQUE,
  title VARCHAR(200),
  client_id INT NULL,
  printer_id INT NOT NULL,
  filament_id INT NOT NULL,

  -- Requisitos Técnicos
  print_time_hours DECIMAL(8,2) NOT NULL,
  filament_used_g DECIMAL(10,2) NOT NULL,
  setup_time_hours DECIMAL(6,2) NOT NULL DEFAULT 0.50,
  post_process_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 1,

  -- Snapshot das Configurações
  energy_kwh_price DECIMAL(10,4) NOT NULL,
  labor_hourly_rate DECIMAL(10,2) NOT NULL,
  profit_margin_pct DECIMAL(5,2) NOT NULL,
  loss_pct DECIMAL(5,2) NOT NULL,
  spare_parts_pct DECIMAL(5,2) NOT NULL,
  printer_power_watts DECIMAL(8,2) NOT NULL,
  printer_purchase_price DECIMAL(10,2) NOT NULL,
  printer_lifespan_hours INT NOT NULL,
  printer_maintenance_pct DECIMAL(5,2) NOT NULL,
  filament_cost_per_kg DECIMAL(10,2) NOT NULL,

  -- Custos Calculados
  cost_filament DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_energy DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_depreciation DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_maintenance DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_labor DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_losses DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_spare_parts DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_total_production DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit_value DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Preços Finais
  final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Extras e Impostos
  extras JSON,
  extras_total DECIMAL(10,2) DEFAULT 0,
  tax_pct_applied DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,

  -- Descontos e Cupons
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_code VARCHAR(100),
  coupon_id INT NULL,

  -- Frete e Endereço (Snapshot)
  shipping_service VARCHAR(100),
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  client_name VARCHAR(150),
  client_email VARCHAR(150),
  client_phone VARCHAR(30),
  client_zipcode VARCHAR(20),
  client_address VARCHAR(255),
  client_address_number VARCHAR(20),
  client_address_comp VARCHAR(100),
  client_neighborhood VARCHAR(100),
  client_city VARCHAR(100),
  client_state VARCHAR(10),
  client_document VARCHAR(30),

  -- Mídia e Showroom
  file_url TEXT,
  file_urls JSON,
  reference_images JSON,
  result_photo_url TEXT,
  show_in_showroom TINYINT(1) DEFAULT 0,

  -- Status e Pagamento
  status ENUM('quoted', 'pending', 'approved', 'in_production', 'delivered', 'rejected', 'cancelled', 'counter_offer', 'awaiting_payment') DEFAULT 'quoted',
  payment_method VARCHAR(50),
  mp_payment_id BIGINT,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  is_paid TINYINT(1) DEFAULT 0,
  paid_at TIMESTAMP NULL,
  credits_used DECIMAL(10,2) DEFAULT 0,

  -- Contra-proposta do cliente
  counter_offer_price DECIMAL(10,2) DEFAULT NULL,
  counter_offer_notes TEXT DEFAULT NULL,

  -- Produção e Nesting
  platter_id INT NULL,
  filament_lot_id INT NULL,
  gcode_url VARCHAR(500) DEFAULT NULL,

  -- Impressão e Montagem
  infill_percentage INT DEFAULT 20,
  items JSON DEFAULT NULL,
  is_multicolor TINYINT(1) DEFAULT 0,

  -- Outros
  scheduled_start DATETIME DEFAULT NULL,
  scheduled_end DATETIME DEFAULT NULL,
  project_id INT NULL,
  notes TEXT,
  valid_days INT NOT NULL DEFAULT 30,
  responded_at TIMESTAMP NULL,
  extras_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (printer_id) REFERENCES printers(id),
  FOREIGN KEY (filament_id) REFERENCES filaments(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Produção / Nesting (Platters)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    printer_id INT DEFAULT NULL,
    status ENUM('pending', 'in_production', 'delivered') DEFAULT 'pending',
    start_time DATETIME DEFAULT NULL,
    end_time DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE SET NULL
);

ALTER TABLE quotes ADD CONSTRAINT fk_quotes_platter FOREIGN KEY (platter_id) REFERENCES platters(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- Rastreabilidade (Lotes de Filamento)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filament_lots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filament_id INT NOT NULL,
  lot_number VARCHAR(100) NOT NULL,
  initial_weight_g DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  current_weight_g DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  cost_per_kg DECIMAL(10,2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filament_id) REFERENCES filaments(id)
);

ALTER TABLE quotes ADD CONSTRAINT fk_quotes_filament_lot FOREIGN KEY (filament_lot_id) REFERENCES filament_lots(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- Avaliações (Reviews)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  client_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Manutenção de Impressoras
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `printer_maintenance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `printer_id` int(11) NOT NULL,
  `maintenance_type` varchar(255) NOT NULL,
  `description` text,
  `cost` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `printer_id` (`printer_id`),
  CONSTRAINT `fk_maintenance_printer` FOREIGN KEY (`printer_id`) REFERENCES `printers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `maintenance_consumables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `maintenance_log_id` int NOT NULL,
  `consumable_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `maintenance_log_id` (`maintenance_log_id`),
  KEY `consumable_id` (`consumable_id`),
  CONSTRAINT `fk_maint_log` FOREIGN KEY (`maintenance_log_id`) REFERENCES `printer_maintenance_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maint_consumable` FOREIGN KEY (`consumable_id`) REFERENCES `consumables` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Financeiro (Despesas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT 'Geral',
  `due_date` date NOT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `type` enum('fixed','variable') DEFAULT 'fixed',
  `payment_date` date DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Mensagens em Cotações
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quote_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  sender_type ENUM('admin', 'client') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Consumíveis e BOM
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consumables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_type VARCHAR(20) NOT NULL,
  lot_number VARCHAR(100),
  roll_number VARCHAR(100),
  purchase_date DATE,
  cost_per_unit DECIMAL(10,2) NOT NULL,
  stock_current DECIMAL(10,2) DEFAULT 0,
  stock_min_warning DECIMAL(10,2) DEFAULT 0,
  total_purchased DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_bom (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    consumable_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Solicitações de Cotação (Portal)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quote_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  client_id INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_urls JSON,
  material_preference VARCHAR(100),
  color_preference VARCHAR(100),
  infill_percentage INT DEFAULT 20,
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  status ENUM('pending', 'quoted', 'rejected') DEFAULT 'pending',
  quote_id INT NULL,
  coupon_id INT NULL,
  items JSON,
  client_zipcode VARCHAR(20),
  client_address VARCHAR(255),
  client_address_number VARCHAR(20),
  client_address_comp VARCHAR(100),
  client_neighborhood VARCHAR(100),
  client_city VARCHAR(100),
  client_state VARCHAR(20),
  client_document VARCHAR(50),
  client_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Projetos (Agrupamentos de cotações)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client_id INT NULL,
  public_token VARCHAR(36) UNIQUE DEFAULT (UUID()),
  status ENUM('pending', 'approved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Outras Tabelas do Ecossistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url VARCHAR(500),
  stl_file_url VARCHAR(500) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  filament_id INT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role ENUM('admin','vendedor','operador') NOT NULL DEFAULT 'operador',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    value DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usage_limit INT DEFAULT NULL,
    times_used INT DEFAULT 0,
    expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  referral_code VARCHAR(100) NOT NULL UNIQUE,
  commission_rate_pct DECIMAL(5,2) DEFAULT 0,
  pix_key VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upsell_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    charge_type ENUM('fixed', 'labor_hours') NOT NULL DEFAULT 'fixed',
    charge_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    per_unit BOOLEAN NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packaging_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  length_cm DECIMAL(8,2) NOT NULL,
  width_cm DECIMAL(8,2) NOT NULL,
  height_cm DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0.00,
  max_weight_kg DECIMAL(8,2) DEFAULT 30.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Planos de Assinatura B2B
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  hours_included DECIMAL(8,2) DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  filament_type VARCHAR(50) DEFAULT NULL,
  b2b_filament_cost DECIMAL(10,2) DEFAULT NULL,
  grams_included DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Transações de Horas (B2B)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hour_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  transaction_type ENUM('credit','debit') NOT NULL,
  hours_amount DECIMAL(8,2) NOT NULL,
  grams_amount DECIMAL(10,2) DEFAULT 0,
  description VARCHAR(255),
  quote_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Consumíveis por Cotação
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quote_consumables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  consumable_id INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL DEFAULT 1,
  cost_recorded DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- Comissões de Afiliados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  affiliate_id INT NOT NULL,
  quote_id INT NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('pending','available','paid','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Dados Iniciais
-- ------------------------------------------------------------
INSERT INTO business_config (id, energy_kwh_price, labor_hourly_rate, default_profit_margin_pct, default_loss_pct, spare_parts_reserve_pct)
VALUES (1, 0.9600, 9.62, 100.00, 15.00, 13.00)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO printers (name, model, power_watts, purchase_price, lifespan_hours, maintenance_reserve_pct) VALUES
('Ender 3 V2', 'Creality Ender 3 V2', 220.00, 1200.00, 2000, 5.00),
('Bambu Lab A1', 'Bambu Lab A1', 350.00, 3500.00, 3000, 5.00),
('Prusa MK4', 'Prusa Research MK4', 200.00, 5000.00, 4000, 4.00)
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO filaments (name, brand, type, color, cost_per_kg, density_g_cm3) VALUES
('PLA Branco', 'Genérico', 'PLA', 'Branco', 80.00, 1.2400),
('PLA Preto', 'Genérico', 'PLA', 'Preto', 80.00, 1.2400),
('PETG Transparente', 'Genérico', 'PETG', 'Transparente', 95.00, 1.2700),
('ABS Cinza', 'Genérico', 'ABS', 'Cinza', 85.00, 1.0500),
('TPU 95A Preto', 'Genérico', 'TPU', 'Preto', 130.00, 1.2100)
ON DUPLICATE KEY UPDATE name = name;
