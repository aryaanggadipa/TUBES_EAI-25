-- Membuat database jika belum ada
CREATE DATABASE IF NOT EXISTS product_catalog_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS production_request_db;
CREATE DATABASE IF NOT EXISTS stock_db;
CREATE DATABASE IF NOT EXISTS auth_db;

-- Menggunakan database product_catalog_db
USE product_catalog_db;
DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(100),
    base_price DECIMAL(10, 2) NOT NULL,
    default_image_url VARCHAR(255)
);
INSERT INTO products (product_name, description, category_id, base_price, default_image_url) VALUES
('Kaos Polos Hitam', 'Kaos katun combed 30s, nyaman dipakai.', 'KAOS', 75000.00, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1974&auto=format&fit=crop'),
('Celana Chinos Wanita', 'Celana panjang chinos slim-fit berwarna coklat.', 'CELANA', 150000.00, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1974&auto=format&fit=crop'),
('Sepatu Sneakers Merah', 'Sepatu sneakers berwarna merah, cocok untuk segala kondisi.', 'SEPATU', 1500000.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop');

-- Menggunakan database order_db
USE order_db;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerEmail VARCHAR(255) NOT NULL,
    orderDate DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    totalPrice DECIMAL(10, 2) NOT NULL,
    shippingAddress TEXT NOT NULL,
    paymentMethod VARCHAR(100) NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Menggunakan database production_request_db
USE production_request_db;
DROP TABLE IF EXISTS production_requests;
CREATE TABLE IF NOT EXISTS production_requests (
    id VARCHAR(255) PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    due_date DATE NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menggunakan database stock_db
USE stock_db;
DROP TABLE IF EXISTS stock;
CREATE TABLE IF NOT EXISTS stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNIQUE NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO stock (product_id, quantity, reorder_point) VALUES (1, 50, 10), (2, 30, 5);

-- Menggunakan database auth_db
USE auth_db;
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(25),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

