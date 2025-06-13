-- mysql/init/02-init-auth-db.sql

-- Create the auth_db database if it doesn't exist
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Switch to the auth_db database
USE auth_db;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- You might want to add other user-related fields later, e.g., name, role, etc.

-- Grant privileges to the root user for the new database (if needed, though root usually has all privileges)
-- GRANT ALL PRIVILEGES ON auth_db.* TO 'root'@'%';
-- FLUSH PRIVILEGES; -- Only if you changed grants
