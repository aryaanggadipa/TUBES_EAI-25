// auth-service/src/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  const maxRetries = 10; // Increased retries
  const retryDelay = 5000; // 5 seconds delay
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`Auth Service: Attempting to connect to MySQL database (Attempt ${attempts}/${maxRetries})...`);
      const connection = await pool.getConnection();
      console.log('Auth Service: Successfully connected to MySQL database.');
      connection.release();
      return; // Connection successful, exit function
    } catch (error) {
      console.error(`Auth Service: Error connecting to MySQL database (Attempt ${attempts}/${maxRetries}):`, error.message);
      if (attempts < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Auth Service: Max retries reached. Failed to connect to MySQL database.');
        process.exit(1); // Exit after max retries
      }
    }
  }
}

module.exports = {
  pool,
  testConnection
};
