// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ──────────────────────────────────────────────
//  POST /api/admin/login
//  Admin login — returns JWT token
// ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Check against .env credentials (simple hardcoded approach)
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin@ke2025';

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful. Swagata! 🎬',
      token,
      admin: { username, role: 'admin' },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
//  GET /api/admin/verify
//  Verify token validity
// ──────────────────────────────────────────────
const { protect } = require('../middleware/authMiddleware');

router.get('/verify', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    admin: req.admin,
  });
});

module.exports = router;
