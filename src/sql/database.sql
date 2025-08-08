-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- CORE TABLES
-- ========================

CREATE TABLE restaurants (
    restaurant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address JSONB NOT NULL, -- {street, city, state, zip, country}
    contact_info JSONB NOT NULL, -- {phone, email, website}
    operating_hours JSONB NOT NULL, -- {"monday": ["09:00-23:00"], ...}
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    service_charge DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff (
    staff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'chef', 'waiter', 'cashier')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dining_zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE (restaurant_id, name)
);

CREATE TABLE dining_tables (
    table_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES dining_zones(zone_id) ON DELETE CASCADE,
    table_number VARCHAR(10) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'occupied', 'reserved', 'out_of_service')),
    position_x INT,
    position_y INT,
    UNIQUE (zone_id, table_number)
);
--*****************
-- MENU SYSTEM
--*****************
CREATE TABLE menu_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    UNIQUE (restaurant_id, name)
);

CREATE TABLE menu_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES menu_categories(category_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    cost DECIMAL(10,2) NOT NULL, -- For COGS calculation
    preparation_time INT NOT NULL CHECK (preparation_time > 0), -- in minutes
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifiers (
    modifier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    min_selections INT DEFAULT 1,
    max_selections INT DEFAULT 1,
    UNIQUE (restaurant_id, name)
);

CREATE TABLE modifier_options (
    option_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_id UUID REFERENCES modifiers(modifier_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    additional_price DECIMAL(10,2) DEFAULT 0.00,
    UNIQUE (modifier_id, name)
);

CREATE TABLE menu_item_modifiers (
    item_id UUID REFERENCES menu_items(item_id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES modifiers(modifier_id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, modifier_id)
);

-- ========================
-- INVENTORY MANAGEMENT
-- ========================

CREATE TABLE inventory_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    UNIQUE (restaurant_id, name)
);

CREATE TABLE inventory_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES inventory_categories(category_id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- kg, liter, piece, etc.
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    alert_threshold DECIMAL(10,2) NOT NULL DEFAULT 5.0,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier_info JSONB,
    barcode VARCHAR(50),
    last_restocked TIMESTAMPTZ,
    UNIQUE (restaurant_id, name)
);

CREATE TABLE menu_item_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES menu_items(item_id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(item_id) ON DELETE RESTRICT,
    quantity_required DECIMAL(8,2) NOT NULL CHECK (quantity_required > 0),
    notes TEXT,
    UNIQUE (menu_item_id, inventory_item_id)
);

-- ========================
-- ORDER MANAGEMENT
-- ========================

CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    table_id UUID REFERENCES dining_tables(table_id) ON DELETE SET NULL, -- NULL for takeout and delivery
    staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
    order_type VARCHAR(20) NOT NULL 
        CHECK (order_type IN ('dine-in', 'takeout', 'delivery')),
    status VARCHAR(20) NOT NULL DEFAULT 'received'
        CHECK (status IN ('received', 'preparing', 'ready', 'served', 'completed', 'canceled')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
    customer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(item_id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    item_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'canceled')),
    completed_at TIMESTAMPTZ
);

CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(order_item_id) ON DELETE CASCADE,
    modifier_option_id UUID REFERENCES modifier_options(option_id) ON DELETE SET NULL,
    name VARCHAR(50) NOT NULL, -- Denormalized for historical accuracy
    additional_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

-- ========================
-- RESERVATIONS
-- ========================

CREATE TABLE reservations (
    reservation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    table_id UUID REFERENCES dining_tables(table_id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100),
    party_size INT NOT NULL CHECK (party_size > 0),
    reservation_time TIMESTAMPTZ NOT NULL,
    duration INT NOT NULL DEFAULT 90, -- in minutes
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'canceled', 'no-show', 'completed')),
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- PAYMENT SYSTEM
-- ========================

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL
        CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'mobile_payment', 'voucher')),
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID REFERENCES staff(staff_id) ON DELETE SET NULL
);

-- ========================
-- AUDIT LOGGING
-- ========================

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- "create_order", "update_inventory", etc.
    entity_type VARCHAR(50) NOT NULL, -- "order", "menu_item", etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- REPORTING VIEWS
-- ========================

CREATE VIEW daily_sales_summary AS
SELECT
    DATE(created_at) AS sale_date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS gross_sales,
    SUM(subtotal) AS net_sales,
    SUM(tax_amount) AS total_tax,
    SUM(service_charge) AS total_service_charge,
    SUM(discount_amount) AS total_discounts
FROM orders
WHERE status = 'completed'
GROUP BY sale_date
ORDER BY sale_date DESC;

CREATE VIEW inventory_alerts AS
SELECT
    i.name AS item,
    i.current_stock,
    i.alert_threshold,
    i.unit,
    ic.name AS category,
    i.last_restocked
FROM inventory_items i
JOIN inventory_categories ic ON i.category_id = ic.category_id
WHERE i.current_stock <= i.alert_threshold;

-- ========================
-- BUSINESS LOGIC FUNCTIONS
-- ========================

-- Auto-update inventory when orders are completed
CREATE OR REPLACE FUNCTION update_inventory_on_order_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        UPDATE inventory_items AS inv
        SET current_stock = current_stock - req.quantity_used
        FROM (
            SELECT 
                mi.inventory_item_id,
                SUM(oi.quantity * mi.quantity_required) AS quantity_used
            FROM order_items oi
            JOIN menu_item_ingredients mi ON oi.menu_item_id = mi.menu_item_id
            WHERE oi.order_id = NEW.order_id
            GROUP BY mi.inventory_item_id
        ) AS req
        WHERE inv.item_id = req.inventory_item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_order_completion();

-- Calculate order totals automatically
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax_rate DECIMAL(5,2);
    v_service_charge DECIMAL(5,2);
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    INTO v_subtotal
    FROM order_items oi
    WHERE oi.order_id = NEW.order_id
    AND oi.status <> 'canceled';

    -- Get restaurant fees
    SELECT tax_rate, service_charge
    INTO v_tax_rate, v_service_charge
    FROM restaurants
    WHERE restaurant_id = NEW.restaurant_id;

    -- Update order totals
    NEW.subtotal = v_subtotal;
    NEW.tax_amount = ROUND(v_subtotal * v_tax_rate / 100, 2);
    NEW.service_charge = ROUND(v_subtotal * v_service_charge / 100, 2);
    NEW.total_amount = NEW.subtotal + NEW.tax_amount + NEW.service_charge - NEW.discount_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_totals
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_totals();

-- ========================
-- INDEXES FOR PERFORMANCE
-- ========================

CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
-- need to check what is wrong with this indexing errors
CREATE INDEX idx_reservations_time ON reservations(reservation_time);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_inventory_restaurant ON inventory_items(restaurant_id);
CREATE INDEX idx_inventory_stock ON inventory_items(current_stock);