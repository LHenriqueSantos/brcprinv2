# BRCPrint Database Schema

This document provides a comprehensive overview of the BRCPrint database structure.

## admins
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| username | varchar(100) | NO | UNI | NULL |  |
| password_hash | varchar(255) | NO |  | NULL |  |
| name | varchar(100) | YES |  | NULL |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| role | enum('admin','vendedor','operador') | NO |  | `operador` |  |

## affiliate_commissions
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| affiliate_id | int | NO | MUL | NULL |  |
| quote_id | int | NO | MUL | NULL |  |
| commission_amount | decimal(10,2) | NO |  | `0.00` |  |
| status | enum('pending','available','paid','cancelled') | YES |  | `pending` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## affiliates
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(255) | NO |  | NULL |  |
| email | varchar(255) | NO | UNI | NULL |  |
| referral_code | varchar(100) | NO | UNI | NULL |  |
| commission_rate_pct | decimal(5,2) | YES |  | `0.00` |  |
| pix_key | varchar(255) | YES |  | NULL |  |
| active | tinyint(1) | YES |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## auction_items
> **Leilão de Centavos** – cada registro é um lote leiloado em tempo real.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| title | varchar(255) | NO |  | NULL |  |
| description | text | YES |  | NULL |  |
| image_url | varchar(500) | YES |  | NULL |  |
| retail_value | decimal(10,2) | NO |  | `0.00` |  |
| current_price | decimal(10,2) | NO |  | `0.00` |  |
| end_time | datetime | NO |  | NULL |  |
| status | enum('pending','active','finished','cancelled') | NO |  | `pending` |  |
| winner_id | int | YES | MUL | NULL | FK → clients(id) |
| time_increment | int | NO |  | `15` | segundos adicionados por lance |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## bid_packages
> Pacotes de lances compráveis pelos clientes.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(255) | NO |  | NULL |  |
| bids_amount | int | NO |  | NULL | quantidade de lances no pacote |
| price | decimal(10,2) | NO |  | NULL |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## bids
> Registra cada lance individual feito em um leilão.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| auction_id | int | NO | MUL | NULL | FK → auction_items(id) CASCADE |
| client_id | int | NO | MUL | NULL | FK → clients(id) CASCADE |
| price_after_bid | decimal(10,2) | NO |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## business_config
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | `1` |  |
| energy_kwh_price | decimal(10,4) | NO |  | `0.7500` |  |
| labor_hourly_rate | decimal(10,2) | NO |  | `50.00` |  |
| default_profit_margin_pct | decimal(5,2) | NO |  | `30.00` |  |
| default_loss_pct | decimal(5,2) | NO |  | `5.00` |  |
| spare_parts_reserve_pct | decimal(5,2) | NO |  | `3.00` |  |
| packaging_cost | decimal(10,2) | YES |  | `0.00` |  |
| default_tax_pct | decimal(5,2) | YES |  | `0.00` |  |
| language_default | varchar(10) | YES |  | `pt` |  |
| updated_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| smtp_host | varchar(255) | YES |  | NULL |  |
| smtp_port | int | YES |  | `587` |  |
| smtp_user | varchar(255) | YES |  | NULL |  |
| smtp_pass | varchar(255) | YES |  | NULL |  |
| sender_email | varchar(255) | YES |  | NULL |  |
| enable_3d_viewer | tinyint(1) | YES |  | `1` |  |
| enable_timeline | tinyint(1) | YES |  | `1` |  |
| enable_chat | tinyint(1) | YES |  | `1` |  |
| enable_stripe | tinyint(1) | YES |  | `0` |  |
| stripe_public_key | text | YES |  | NULL |  |
| stripe_secret_key | text | YES |  | NULL |  |
| enable_auto_quoting | tinyint(1) | YES |  | `0` |  |
| enable_whatsapp | tinyint(1) | YES |  | `0` |  |
| whatsapp_api_url | varchar(500) | YES |  | NULL |  |
| whatsapp_instance_id | varchar(255) | YES |  | NULL |  |
| whatsapp_api_token | text | YES |  | NULL |  |
| company_zipcode | varchar(20) | YES |  | NULL |  |
| company_address | varchar(255) | YES |  | NULL |  |
| company_number | varchar(20) | YES |  | NULL |  |
| company_complement | varchar(100) | YES |  | NULL |  |
| company_neighborhood | varchar(100) | YES |  | NULL |  |
| company_city | varchar(100) | YES |  | NULL |  |
| company_state | varchar(2) | YES |  | NULL |  |
| packaging_length | decimal(8,2) | YES |  | `0.00` |  |
| packaging_width | decimal(8,2) | YES |  | `0.00` |  |
| packaging_height | decimal(8,2) | YES |  | `0.00` |  |
| shipping_api_provider | varchar(50) | YES |  | NULL |  |
| shipping_api_token | text | YES |  | NULL |  |
| currency_code | varchar(10) | YES |  | `BRL` |  |
| currency_symbol | varchar(10) | YES |  | `R$` |  |
| enable_mercadopago | tinyint(1) | YES |  | `0` |  |
| mp_access_token | text | YES |  | NULL |  |
| mp_public_key | text | YES |  | NULL |  |
| enable_cashback | tinyint(1) | YES |  | `0` |  |
| cashback_pct | decimal(5,2) | YES |  | `0.00` |  |
| api_key | varchar(255) | YES |  | NULL |  |
| webhook_url | varchar(500) | YES |  | NULL |  |
| enable_multicolor | tinyint(1) | YES |  | `0` |  |
| multicolor_markup_pct | decimal(5,2) | YES |  | `0.00` |  |
| multicolor_waste_g | decimal(8,2) | YES |  | `0.00` |  |
| multicolor_hours_added | decimal(6,2) | YES |  | `0.00` |  |
| energy_flag | varchar(20) | YES |  | `green` |  |
| energy_peak_price | decimal(10,4) | YES |  | `0.0000` |  |
| energy_off_peak_price | decimal(10,4) | YES |  | `0.0000` |  |
| energy_peak_start | time | YES |  | `18:00:00` |  |
| energy_peak_end | time | YES |  | `21:00:00` |  |
| melhorenvio_token | varchar(2000) | YES |  | NULL | Token da API Melhor Envios |
| focusnfe_token | varchar(255) | YES |  | NULL | Token da API FocusNFe |
| focusnfe_environment | enum('sandbox','production') | YES |  | `sandbox` |  |
| default_nfe_type | enum('nfse','nfe') | YES |  | `nfse` |  |

## cart_order_items
> Itens de um pedido do carrinho de compras.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| order_id | int | NO | MUL | NULL | FK → cart_orders(id) CASCADE |
| type | enum('digital','ready_stock','custom_pod') | NO |  | NULL |  |
| catalog_item_id | int | YES | MUL | NULL | FK → catalog_items(id) SET NULL |
| title | varchar(255) | NO |  | NULL |  |
| price | decimal(10,2) | NO |  | NULL |  |
| quantity | int | NO |  | `1` |  |
| color | varchar(100) | YES |  | NULL |  |
| stl_file_url | text | YES |  | NULL |  |
| extras | json | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## cart_orders
> Pedidos originados pelo carrinho de compras (catálogo, pronta entrega, POD).

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| public_token | varchar(36) | NO | UNI | NULL |  |
| client_id | int | YES | MUL | NULL | FK → clients(id) SET NULL |
| status | enum('pending_payment','paid','processing','shipped','delivered','cancelled') | YES |  | `pending_payment` |  |
| subtotal | decimal(10,2) | NO |  | `0.00` |  |
| shipping_cost | decimal(10,2) | NO |  | `0.00` |  |
| discount_value | decimal(10,2) | NO |  | `0.00` |  |
| total | decimal(10,2) | NO |  | `0.00` |  |
| coupon_id | int | YES |  | NULL | FK → coupons(id) SET NULL |
| delivery_method | enum('shipping','pickup') | YES |  | `shipping` |  |
| client_name | varchar(255) | YES |  | NULL |  |
| client_document | varchar(50) | YES |  | NULL |  |
| client_email | varchar(255) | YES |  | NULL |  |
| client_phone | varchar(50) | YES |  | NULL |  |
| client_zipcode | varchar(20) | YES |  | NULL |  |
| client_address | varchar(255) | YES |  | NULL |  |
| client_number | varchar(20) | YES |  | NULL |  |
| client_complement | varchar(100) | YES |  | NULL |  |
| client_neighborhood | varchar(100) | YES |  | NULL |  |
| client_city | varchar(100) | YES |  | NULL |  |
| client_state | varchar(20) | YES |  | NULL |  |
| shipping_service | varchar(100) | YES |  | NULL |  |
| shipping_service_id | int | YES |  | NULL |  |
| melhorenvio_order_id | varchar(255) | YES |  | NULL |  |
| shipping_tracking_code | varchar(255) | YES |  | NULL |  |
| mp_preference_id | varchar(255) | YES |  | NULL |  |
| mp_payment_id | bigint | YES |  | NULL |  |
| mp_status | varchar(50) | YES |  | NULL |  |
| notes | text | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## catalog_items
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| title | varchar(255) | NO |  | NULL |  |
| description | text | YES |  | NULL |  |
| category | varchar(100) | YES |  | NULL |  |
| image_url | varchar(500) | YES |  | NULL |  |
| image_urls | json | YES |  | NULL | Múltiplas fotos do item |
| stl_file_url | varchar(500) | NO |  | NULL |  |
| gcode_url | varchar(500) | YES |  | NULL | G-code pré-fatiado |
| auto_print_enabled | tinyint(1) | YES |  | `0` | Impressão zero-click |
| target_printer_id | int | YES | MUL | NULL | FK → printers(id) SET NULL |
| is_ready_to_ship | tinyint(1) | YES |  | `0` | Item em estoque pronta entrega |
| ready_stock_details | json | YES |  | NULL | Detalhes de estoque por variante |
| allow_custom_order | tinyint(1) | YES |  | `1` | Permite pedido personalizado |
| base_price | decimal(10,2) | NO |  | NULL |  |
| filament_id | int | YES |  | NULL |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## client_bids_balance
> Saldo de lances de cada cliente para o sistema de leilão.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| client_id | int | NO | UNI | NULL | FK → clients(id) CASCADE |
| balance | int | NO |  | `0` | Quantidade de lances disponíveis |
| updated_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## clients
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| client_type | enum('individual','company') | NO |  | `individual` |  |
| name | varchar(150) | NO |  | NULL |  |
| company | varchar(150) | YES |  | NULL |  |
| document | varchar(30) | YES |  | NULL |  |
| email | varchar(150) | YES |  | NULL |  |
| phone | varchar(30) | YES |  | NULL |  |
| password_hash | varchar(255) | YES |  | NULL |  |
| discount_margin_pct | decimal(5,2) | YES |  | `0.00` |  |
| zipcode | varchar(20) | YES |  | NULL |  |
| address | varchar(255) | YES |  | NULL |  |
| address_number | varchar(20) | YES |  | NULL |  |
| address_comp | varchar(100) | YES |  | NULL |  |
| neighborhood | varchar(100) | YES |  | NULL |  |
| city | varchar(100) | YES |  | NULL |  |
| state | varchar(10) | YES |  | NULL |  |
| referred_by | int | YES |  | NULL |  |
| notes | text | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| auth_provider | varchar(50) | YES |  | NULL |  |
| auth_provider_id | varchar(255) | YES |  | NULL |  |
| credit_balance | decimal(10,2) | YES |  | `0.00` |  |
| available_hours_balance | decimal(8,2) | YES |  | `0.00` |  |
| available_grams_balance | decimal(10,2) | YES |  | `0.00` |  |
| subscription_status | enum('inactive','active','suspended') | YES |  | `inactive` |  |
| subscription_plan_id | int | YES |  | NULL |  |
| total_cashback_earned | decimal(10,2) | YES |  | `0.00` |  |

## consumables
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO |  | NULL |  |
| category | varchar(50) | NO |  | NULL |  |
| unit_type | varchar(20) | NO |  | NULL |  |
| lot_number | varchar(100) | YES |  | NULL |  |
| roll_number | varchar(100) | YES |  | NULL |  |
| purchase_date | date | YES |  | NULL |  |
| cost_per_unit | decimal(10,2) | NO |  | NULL |  |
| stock_current | decimal(10,2) | YES |  | `0.00` |  |
| stock_min_warning | decimal(10,2) | YES |  | `0.00` |  |
| total_purchased | decimal(10,2) | YES |  | `0.00` |  |
| active | tinyint(1) | YES |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## coupons
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| code | varchar(50) | NO | UNI | NULL |  |
| type | enum('percentage','fixed') | NO |  | `percentage` |  |
| value | decimal(10,2) | NO |  | NULL |  |
| active | tinyint(1) | YES |  | `1` |  |
| usage_limit | int | YES |  | NULL |  |
| times_used | int | YES |  | `0` |  |
| expires_at | datetime | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## expenses
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| description | varchar(255) | NO |  | NULL |  |
| amount | decimal(10,2) | NO |  | NULL |  |
| category | varchar(100) | YES |  | `Geral` |  |
| due_date | date | NO |  | NULL |  |
| status | enum('pending','paid') | YES |  | `pending` |  |
| type | enum('fixed','variable') | YES |  | `fixed` |  |
| payment_date | date | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## filament_lots
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| filament_id | int | NO | MUL | NULL |  |
| lot_number | varchar(100) | NO |  | NULL |  |
| initial_weight_g | decimal(10,2) | NO |  | `1000.00` |  |
| current_weight_g | decimal(10,2) | NO |  | `1000.00` |  |
| cost_per_kg | decimal(10,2) | NO |  | NULL |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| roll_number | varchar(100) | YES |  | NULL |  |
| purchase_date | date | YES |  | NULL |  |

## filaments
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO |  | NULL |  |
| brand | varchar(100) | YES |  | NULL |  |
| type | varchar(50) | NO |  | NULL |  |
| color | varchar(50) | YES |  | NULL |  |
| cost_per_kg | decimal(10,2) | NO |  | NULL |  |
| density_g_cm3 | decimal(6,4) | NO |  | `1.2400` |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| lot_number | varchar(100) | YES |  | NULL |  |
| roll_number | varchar(100) | YES |  | NULL |  |
| purchase_date | date | YES |  | NULL |  |
| initial_weight_g | decimal(10,2) | YES |  | `1000.00` |  |
| current_weight_g | decimal(10,2) | YES |  | `1000.00` |  |
| min_stock_warning | decimal(10,2) | YES |  | `100.00` |  |
| total_purchased_g | decimal(10,2) | YES |  | `1000.00` |  |

## hour_transactions
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| client_id | int | NO | MUL | NULL |  |
| transaction_type | enum('credit','debit') | NO |  | NULL |  |
| hours_amount | decimal(8,2) | NO |  | NULL |  |
| grams_amount | decimal(10,2) | YES |  | `0.00` |  |
| description | varchar(255) | YES |  | NULL |  |
| quote_id | int | YES | MUL | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## maintenance_consumables
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| maintenance_log_id | int | NO | MUL | NULL |  |
| consumable_id | int | NO | MUL | NULL |  |
| quantity | decimal(10,2) | NO |  | NULL |  |
| unit_cost | decimal(10,2) | NO |  | NULL |  |

## packaging_sizes
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO |  | NULL |  |
| length_cm | decimal(8,2) | NO |  | NULL |  |
| width_cm | decimal(8,2) | NO |  | NULL |  |
| height_cm | decimal(8,2) | NO |  | NULL |  |
| cost | decimal(10,2) | YES |  | `0.00` |  |
| max_weight_kg | decimal(8,2) | YES |  | `30.00` |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## parametric_models
> Modelos OpenSCAD paramétricos do catálogo. O STL gerado é injetado como `quote_request` padrão.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| title | varchar(255) | NO |  | NULL |  |
| description | text | YES |  | NULL |  |
| category | varchar(100) | YES |  | NULL |  |
| image_url | varchar(500) | YES |  | NULL |  |
| scad_file_url | varchar(500) | NO |  | NULL | Arquivo .scad fonte |
| parameters_schema | json | NO |  | NULL | Schema dos campos de entrada |
| base_price | decimal(10,2) | NO |  | `0.00` |  |
| filament_id | int | YES | MUL | NULL | FK → filaments(id) SET NULL |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## password_resets
> Tokens de recuperação de senha para clientes e admins.

| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| email | varchar(150) | NO | MUL | NULL |  |
| token | varchar(64) | NO | UNI | NULL |  |
| user_type | enum('client','admin') | NO |  | NULL |  |
| expires_at | datetime | NO |  | NULL |  |
| used | tinyint(1) | YES |  | `0` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## platters
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(255) | NO |  | NULL |  |
| printer_id | int | YES | MUL | NULL |  |
| status | enum('pending','in_production','delivered') | YES |  | `pending` |  |
| start_time | datetime | YES |  | NULL |  |
| end_time | datetime | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## printer_maintenance_logs
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| printer_id | int | NO | MUL | NULL |  |
| maintenance_type | varchar(255) | NO |  | NULL |  |
| description | text | YES |  | NULL |  |
| cost | decimal(10,2) | YES |  | `0.00` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## printers
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO |  | NULL |  |
| model | varchar(100) | YES |  | NULL |  |
| type | varchar(50) | YES |  | `FDM` |  |
| power_watts | decimal(8,2) | NO |  | NULL |  |
| purchase_price | decimal(10,2) | NO |  | NULL |  |
| lifespan_hours | int | NO |  | `2000` |  |
| maintenance_reserve_pct | decimal(5,2) | NO |  | `5.00` |  |
| maintenance_alert_threshold | int | YES |  | `200` |  |
| current_hours_printed | float | YES |  | `0` |  |
| last_maintenance_hours | float | YES |  | `0` |  |
| api_type | enum('octoprint','moonraker','bambu','none') | YES |  | `none` | Suporte Bambu Lab adicionado |
| ip_address | varchar(255) | YES |  | NULL |  |
| api_key | varchar(255) | YES |  | NULL |  |
| device_serial | varchar(64) | YES |  | NULL | Número de série Bambu Lab |
| is_online | tinyint | YES |  | `0` |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## projects
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| title | varchar(255) | NO |  | NULL |  |
| client_id | int | YES | MUL | NULL |  |
| public_token | varchar(36) | YES | UNI | `uuid()` | DEFAULT_GENERATED |
| status | enum('pending','approved') | YES |  | `pending` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## quote_bom
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| quote_id | int | NO | MUL | NULL |  |
| consumable_id | int | NO | MUL | NULL |  |
| quantity | decimal(10,2) | NO |  | `1.00` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## quote_consumables
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| quote_id | int | NO | MUL | NULL |  |
| consumable_id | int | NO | MUL | NULL |  |
| quantity_used | decimal(10,2) | NO |  | `1.00` |  |
| cost_recorded | decimal(10,2) | NO |  | `0.00` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## quote_messages
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| quote_id | int | NO | MUL | NULL |  |
| sender_type | enum('admin','client') | NO |  | NULL |  |
| message | text | NO |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## quote_requests
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| title | varchar(255) | YES |  | NULL |  |
| client_id | int | NO | MUL | NULL |  |
| file_url | varchar(500) | NO |  | NULL |  |
| file_urls | json | YES |  | NULL |  |
| material_preference | varchar(100) | YES |  | NULL |  |
| color_preference | varchar(100) | YES |  | NULL |  |
| infill_percentage | int | YES |  | `20` |  |
| quantity | int | NO |  | `1` |  |
| notes | text | YES |  | NULL |  |
| status | enum('pending','quoted','rejected') | YES |  | `pending` |  |
| quote_id | int | YES | MUL | NULL |  |
| coupon_id | int | YES |  | NULL |  |
| items | json | YES |  | NULL |  |
| reference_images | json | YES |  | NULL |  |
| request_type | enum('stl','manual') | NO |  | `stl` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| client_zipcode | varchar(20) | YES |  | NULL |  |
| client_address | varchar(255) | YES |  | NULL |  |
| client_address_number | varchar(20) | YES |  | NULL |  |
| client_address_comp | varchar(100) | YES |  | NULL |  |
| client_neighborhood | varchar(100) | YES |  | NULL |  |
| client_city | varchar(100) | YES |  | NULL |  |
| client_state | varchar(20) | YES |  | NULL |  |
| client_document | varchar(50) | YES |  | NULL |  |
| client_name | varchar(255) | YES |  | NULL |  |

## quotes
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| public_token | varchar(36) | YES | UNI | NULL |  |
| title | varchar(200) | YES |  | NULL |  |
| client_id | int | YES | MUL | NULL |  |
| printer_id | int | NO | MUL | NULL |  |
| filament_id | int | NO | MUL | NULL |  |
| print_time_hours | decimal(8,2) | NO |  | NULL |  |
| filament_used_g | decimal(10,2) | NO |  | NULL |  |
| setup_time_hours | decimal(6,2) | NO |  | `0.50` |  |
| post_process_hours | decimal(6,2) | NO |  | `0.00` |  |
| quantity | int | NO |  | `1` |  |
| energy_kwh_price | decimal(10,4) | NO |  | NULL |  |
| labor_hourly_rate | decimal(10,2) | NO |  | NULL |  |
| profit_margin_pct | decimal(5,2) | NO |  | NULL |  |
| loss_pct | decimal(5,2) | NO |  | NULL |  |
| spare_parts_pct | decimal(5,2) | NO |  | NULL |  |
| printer_power_watts | decimal(8,2) | NO |  | NULL |  |
| printer_purchase_price | decimal(10,2) | NO |  | NULL |  |
| printer_lifespan_hours | int | NO |  | NULL |  |
| printer_maintenance_pct | decimal(5,2) | NO |  | NULL |  |
| filament_cost_per_kg | decimal(10,2) | NO |  | NULL |  |
| cost_filament | decimal(10,2) | NO |  | `0.00` |  |
| cost_energy | decimal(10,2) | NO |  | `0.00` |  |
| cost_depreciation | decimal(10,2) | NO |  | `0.00` |  |
| cost_maintenance | decimal(10,2) | NO |  | `0.00` |  |
| cost_labor | decimal(10,2) | NO |  | `0.00` |  |
| cost_losses | decimal(10,2) | NO |  | `0.00` |  |
| cost_spare_parts | decimal(10,2) | NO |  | `0.00` |  |
| cost_total_production | decimal(10,2) | NO |  | `0.00` |  |
| profit_value | decimal(10,2) | NO |  | `0.00` |  |
| final_price | decimal(10,2) | NO |  | `0.00` |  |
| final_price_per_unit | decimal(10,2) | NO |  | `0.00` |  |
| extras | json | YES |  | NULL |  |
| extras_total | decimal(10,2) | YES |  | `0.00` |  |
| tax_pct_applied | decimal(5,2) | YES |  | `0.00` |  |
| tax_amount | decimal(10,2) | YES |  | `0.00` |  |
| discount_value | decimal(10,2) | YES |  | `0.00` |  |
| discount_code | varchar(100) | YES |  | NULL |  |
| coupon_id | int | YES |  | NULL |  |
| shipping_service | varchar(100) | YES |  | NULL |  |
| shipping_cost | decimal(10,2) | YES |  | `0.00` |  |
| client_name | varchar(150) | YES |  | NULL |  |
| client_email | varchar(150) | YES |  | NULL |  |
| client_phone | varchar(30) | YES |  | NULL |  |
| client_zipcode | varchar(20) | YES |  | NULL |  |
| client_address | varchar(255) | YES |  | NULL |  |
| client_address_number | varchar(20) | YES |  | NULL |  |
| client_address_comp | varchar(100) | YES |  | NULL |  |
| client_neighborhood | varchar(100) | YES |  | NULL |  |
| client_city | varchar(100) | YES |  | NULL |  |
| client_state | varchar(10) | YES |  | NULL |  |
| client_document | varchar(30) | YES |  | NULL |  |
| file_url | text | YES |  | NULL |  |
| file_urls | json | YES |  | NULL |  |
| reference_images | json | YES |  | NULL |  |
| result_photo_url | text | YES |  | NULL |  |
| show_in_showroom | tinyint(1) | YES |  | `0` |  |
| status | enum('quoted','pending','approved','in_production','delivered','rejected','cancelled','counter_offer','awaiting_payment') | YES |  | `quoted` |  |
| filament_deducted | tinyint(1) | YES |  | `0` |  |
| payment_method | varchar(50) | YES |  | NULL |  |
| mp_payment_id | bigint | YES |  | NULL |  |
| pix_qr_code | text | YES |  | NULL |  |
| pix_qr_code_base64 | text | YES |  | NULL |  |
| platter_id | int | YES | MUL | NULL |  |
| filament_lot_id | int | YES | MUL | NULL |  |
| project_id | int | YES |  | NULL |  |
| notes | text | YES |  | NULL |  |
| valid_days | int | NO |  | `30` |  |
| responded_at | timestamp | YES |  | NULL |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| scheduled_start | datetime | YES |  | NULL |  |
| scheduled_end | datetime | YES |  | NULL |  |
| is_paid | tinyint(1) | YES |  | `0` |  |
| paid_at | timestamp | YES |  | NULL |  |
| credits_used | decimal(10,2) | YES |  | `0.00` |  |
| gcode_url | varchar(500) | YES |  | NULL |  |
| counter_offer_price | decimal(10,2) | YES |  | NULL |  |
| counter_offer_notes | text | YES |  | NULL |  |
| is_multicolor | tinyint(1) | YES |  | `0` |  |
| items | json | YES |  | NULL |  |
| extras_json | json | YES |  | NULL |  |
| infill_percentage | int | YES |  | `20` |  |
| request_type | enum('stl','manual') | NO |  | `stl` |  |
| nfe_status | varchar(50) | YES |  | NULL | Status da NF-e / NFS-e |
| nfe_url | varchar(500) | YES |  | NULL | URL do documento fiscal |
| melhorenvio_order_id | varchar(100) | YES |  | NULL | ID do pedido no Melhor Envios |

## reviews
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| quote_id | int | NO | MUL | NULL |  |
| client_id | int | NO | MUL | NULL |  |
| rating | int | NO |  | NULL |  |
| comment | text | YES |  | NULL |  |
| photo_url | varchar(500) | YES |  | NULL |  |
| status | enum('pending','approved','rejected') | YES |  | `pending` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| updated_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

## subscription_plans
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO |  | NULL |  |
| monthly_price | decimal(10,2) | NO |  | `0.00` |  |
| hours_included | decimal(8,2) | YES |  | `0.00` |  |
| active | tinyint(1) | YES |  | `1` |  |
| filament_type | varchar(50) | YES |  | NULL |  |
| b2b_filament_cost | decimal(10,2) | YES |  | NULL |  |
| grams_included | decimal(10,2) | YES |  | `0.00` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |

## upsell_options
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| id | int | NO | PRI | NULL | auto_increment |
| name | varchar(255) | NO |  | NULL |  |
| description | text | YES |  | NULL |  |
| charge_type | enum('fixed','labor_hours') | NO |  | `fixed` |  |
| charge_value | decimal(10,2) | NO |  | `0.00` |  |
| per_unit | tinyint(1) | NO |  | `1` |  |
| active | tinyint(1) | NO |  | `1` |  |
| created_at | timestamp | YES |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
