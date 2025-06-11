-- Membuat database jika belum ada
CREATE DATABASE IF NOT EXISTS product_catalog_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS production_request_db;
CREATE DATABASE IF NOT EXISTS stock_db;

-- Menggunakan database product_catalog_db
USE product_catalog_db;

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(100), -- Bisa juga INT jika merujuk ke tabel kategori lain
    base_price DECIMAL(10, 2) NOT NULL,
    default_image_url VARCHAR(255)
);

-- Contoh data untuk products
INSERT INTO products (product_name, description, category_id, base_price, default_image_url) VALUES
('Kaos Polos Putih', 'Kaos katun combed 30s, nyaman dipakai.', 'KAOS', 75000.00, 'http://example.com/images/kaos_putih.jpg'),
('Kemeja Flanel Merah', 'Kemeja flanel lengan panjang motif kotak.', 'KEMEJA', 150000.00, 'http://example.com/images/flanel_merah.jpg');

-- Menggunakan database order_db
USE order_db;

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_id INT, -- Merujuk ke product_id di product_catalog_db (secara konseptual)
    quantity INT DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- Contoh status: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELED
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    -- Tidak ada foreign key langsung ke products karena beda database,
    -- integritas dijaga di level aplikasi.
);

-- ====================================================================
-- Database dan Tabel untuk Layanan Otentikasi (Auth Service)
-- ====================================================================

-- Membuat dan menggunakan database auth_db
CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- Membuat tabel users untuk menyimpan informasi pengguna
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(25),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contoh data untuk customers
INSERT INTO customers (name, email, phone, address) VALUES
('Andi Budiman', 'andi.b@example.com', '081234567890', 'Jl. Merdeka No. 10, Jakarta'),
('Siti Aminah', 'siti.a@example.com', '087654321098', 'Jl. Pahlawan No. 5, Bandung');


-- Menggunakan database production_request_db
USE production_request_db;

CREATE TABLE IF NOT EXISTS production_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    graphql_request_id VARCHAR(255) UNIQUE NOT NULL, -- Corresponds to GraphQL requestId
    customer_id VARCHAR(255) NOT NULL, -- Corresponds to GraphQL customerId
    product_id INT NOT NULL, -- Internal reference to product_catalog_db
    product_name VARCHAR(255) NOT NULL, -- Corresponds to GraphQL productName
    quantity INT NOT NULL, -- Corresponds to GraphQL quantity
    priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL, -- Corresponds to GraphQL priority
    due_date VARCHAR(255) NOT NULL, -- Corresponds to GraphQL dueDate (String)
    specifications TEXT DEFAULT NULL, -- Corresponds to GraphQL specifications
    status ENUM('received', 'planned', 'in_production', 'completed', 'cancelled') NOT NULL DEFAULT 'received', -- Corresponds to GraphQL status
    marketplace_data TEXT DEFAULT NULL, -- Corresponds to GraphQL marketplaceData
    manufacturer_batch_id VARCHAR(100), -- Kept for existing specific functionality
    manufacturer_status_ack VARCHAR(255), -- Kept for existing specific functionality, e.g., 'ACCEPTED', 'REJECTED_CAPACITY_FULL'
    last_response_from_manufacturer TIMESTAMP NULL, -- Kept for existing specific functionality
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Corresponds to GraphQL createdAt
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Corresponds to GraphQL updatedAt
);

-- Menggunakan database stock_db
USE stock_db;

CREATE TABLE IF NOT EXISTS clothing_stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE, -- Merujuk ke product_id di product_catalog_db
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock_level INT NOT NULL DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    notification_type VARCHAR(100), -- e.g., 'LOW_STOCK', 'OUT_OF_STOCK'
    message TEXT,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES clothing_stock(product_id)
);

-- Contoh data untuk clothing_stock
-- Anggap product_id 1 = Kaos Polos Putih, product_id 2 = Kemeja Flanel Merah dari product_catalog_db
INSERT INTO clothing_stock (product_id, current_stock, minimum_stock_level) VALUES
(1, 50, 10),
(2, 30, 5);

