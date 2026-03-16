-- Sistema de Cupons Promocionais (Fase 23)

CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    value DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usage_limit INT DEFAULT NULL, -- NULL means unlimited
    times_used INT DEFAULT 0,
    expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE quote_requests ADD COLUMN coupon_id INT DEFAULT NULL;
ALTER TABLE quote_requests ADD CONSTRAINT fk_qr_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

ALTER TABLE quotes ADD COLUMN coupon_id INT DEFAULT NULL;
ALTER TABLE quotes ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE quotes ADD CONSTRAINT fk_q_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;
