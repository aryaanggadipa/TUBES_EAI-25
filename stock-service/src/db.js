// stock-service/src/db.js
`src/db.js`
// Database connection setup
const mysql = require('mysql2/promise');
require('dotenv').config(); // For local development

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'rootpassword',
  database: process.env.DATABASE_NAME || 'stock_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('Stock Service: Successfully connected to MySQL database.');
    connection.release();
  })
  .catch(err => {
    console.error('Stock Service: Error connecting to MySQL database:', err);
    process.exit(1); 
  });

module.exports = pool;