// auth-service/src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./authRoutes');

const app = express();
const port = process.env.PORT || 4005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Auth Service is running!');
});

async function startApp() {
  await db.testConnection(); // Test koneksi database sebelum server listen
  app.listen(port, () => {
    console.log(`Auth Service running on port ${port}`);
    console.log(`Auth API available at http://localhost:${port}/api/auth`);
  });
}

startApp().catch(error => {
  console.error("Failed to start Auth Service:", error);
  process.exit(1);
});
