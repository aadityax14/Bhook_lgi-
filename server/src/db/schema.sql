-- Bhook_Lgi Multi-Vendor Marketplace PostgreSQL Database Schema
-- Student Hostel Food & Lifestyle Marketplace

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150),
    hostel VARCHAR(20) NOT NULL, -- GH1, GH3, GH4, GH11, GH12, Other
    room_number VARCHAR(20) NOT NULL,
    role VARCHAR(30) DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'OWNER_ADMIN'
    seller_id VARCHAR(50), -- set if role === 'SELLER'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sellers / Stores Table
CREATE TABLE IF NOT EXISTS sellers (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g. 'Food & Snacks', 'Handmade Gifts & Accessories'
    description TEXT,
    avatar TEXT,
    banner TEXT,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'suspended'
    whatsapp_number VARCHAR(20),
    notify_on_new_order BOOLEAN DEFAULT TRUE,
    notify_on_status_change BOOLEAN DEFAULT TRUE,
    commission_rate NUMERIC(5, 2) DEFAULT 0.05,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    seller_id VARCHAR(50) REFERENCES sellers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(20),
    sort_order INT DEFAULT 0
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    seller_id VARCHAR(50) NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    store_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_cooked BOOLEAN DEFAULT FALSE,
    allows_spice_customization BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    variants JSONB DEFAULT '[]'::jsonb, -- e.g. [{"name":"Half","price":35},{"name":"Full","price":65}]
    addons JSONB DEFAULT '[]'::jsonb,   -- e.g. [{"name":"Extra Cheese","price":15}]
    tags TEXT[] DEFAULT '{}',
    stock_quantity INT DEFAULT 10,
    stock_half_units INT,
    stock_type VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    seller_id VARCHAR(50) NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    store_id VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    hostel VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    delivery_type VARCHAR(20) DEFAULT 'room_delivery', -- 'room_delivery' or 'pickup'
    delivery_notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    packaging_fee NUMERIC(10, 2) DEFAULT 5.00,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'placed', 
    -- Food pipeline: 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    -- Craft pipeline: 'placed', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
    delivery_partner_id VARCHAR(50),
    stock_deducted BOOLEAN DEFAULT FALSE,
    eta_minutes INT DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    variant_name VARCHAR(50),
    spice_level VARCHAR(30),
    addons JSONB DEFAULT '[]'::jsonb,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC(10, 2) NOT NULL,
    item_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id VARCHAR(50) REFERENCES sellers(id) ON DELETE CASCADE,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'order_status',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for fast query retrieval
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read, created_at DESC);
