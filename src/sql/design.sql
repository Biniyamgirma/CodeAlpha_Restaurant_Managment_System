CREATE TABLE restaurants (
    restaurant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address JSONB NOT NULL, 
    contact_info JSONB NOT NULL, 
    operating_hours JSONB NOT NULL, 
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
    cost DECIMAL(10,2) NOT NULL, 
    preparation_time INT NOT NULL CHECK (preparation_time > 0), 
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
    unit VARCHAR(20) NOT NULL,
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



CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    table_id UUID REFERENCES dining_tables(table_id) ON DELETE SET NULL, 
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
    name VARCHAR(50) NOT NULL,
    additional_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
);


CREATE TABLE reservations (
    reservation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    table_id UUID REFERENCES dining_tables(table_id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100),
    party_size INT NOT NULL CHECK (party_size > 0),
    reservation_time TIMESTAMPTZ NOT NULL,
    duration INT NOT NULL DEFAULT 90,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'canceled', 'no-show', 'completed')),
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



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



CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, 
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
