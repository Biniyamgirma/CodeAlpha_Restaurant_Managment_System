-- Core Entities
CREATE TABLE tables (
    table_id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) UNIQUE NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning'))
);

CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL 
        CHECK (category IN ('appetizer', 'main', 'dessert', 'beverage')),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    preparation_time INT NOT NULL CHECK (preparation_time > 0)  -- in minutes
);

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    ingredient_name VARCHAR(100) UNIQUE NOT NULL,
    unit VARCHAR(20) NOT NULL,  -- kg, liter, piece, etc.
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    alert_threshold DECIMAL(10,2) NOT NULL DEFAULT 5.0,
    last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationships
CREATE TABLE menu_item_ingredients (
    id SERIAL PRIMARY KEY,
    menu_item_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
    inventory_id INT NOT NULL REFERENCES inventory(inventory_id) ON DELETE RESTRICT,
    quantity_required DECIMAL(8,2) NOT NULL CHECK (quantity_required > 0)
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(table_id),
    customer_name VARCHAR(100) NOT NULL,
    contact_info VARCHAR(100) NOT NULL,
    party_size INT NOT NULL CHECK (party_size > 0),
    reservation_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'canceled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    table_id INT REFERENCES tables(table_id),  -- NULL for takeout
    order_type VARCHAR(20) NOT NULL 
        CHECK (order_type IN ('dine-in', 'takeout', 'delivery')),
    status VARCHAR(20) NOT NULL DEFAULT 'received'
        CHECK (status IN ('received', 'preparing', 'ready', 'served', 'completed', 'canceled')),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    order_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_time TIMESTAMP,
    special_requests TEXT
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(item_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    special_requests TEXT,
    item_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (item_status IN ('pending', 'preparing', 'ready', 'served'))
);