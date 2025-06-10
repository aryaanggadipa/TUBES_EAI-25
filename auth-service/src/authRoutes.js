// auth-service/src/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_VERY_SECRET_KEY_HERE'; // Pastikan ini sama dengan di docker-compose dan .env

// Rute Registrasi
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password diperlukan.' });
  }

  try {
    // Cek apakah email sudah ada
    const [existingUsers] = await db.pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Simpan pengguna baru dengan semua field
    const [result] = await db.pool.query(
      'INSERT INTO users (name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, phone, address]
    );
    
    res.status(201).json({ message: 'Registrasi berhasil.', userId: result.insertId });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
});

// Rute Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password diperlukan.' });
  }

  try {
    // Cari pengguna berdasarkan email
    const [users] = await db.pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah.' }); // Pesan generik
    }

    const user = users[0];

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' }); // Pesan generik
    }

    // Buat token JWT
    const tokenPayload = { userId: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token berlaku 1 jam

    res.status(200).json({ message: 'Login berhasil.', token: token, userId: user.id, email: user.email });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
});

module.exports = router;
