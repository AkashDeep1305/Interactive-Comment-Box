-- Table

CREATE DATABASE IF NOT EXISTS messagebox 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE messagebox;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
