// backend/server.js

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const connectDB = require('./config/db');

connectDB().catch(err => {
  console.error("MongoDB connection failed:", err.message);
});

const app = express();

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: [
    'https://kundapura-edits-studio.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ extended: true, limit: '2000mb' }));

// ── Static Files ──────────────────────────────
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// ── Request Logger ────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} — ${req.method} ${req.url}`);
    next();
  });
}

// ── API Routes ────────────────────────────────
app.use('/api/admin',    require('./routes/authRoutes'));
app.use('/api/videos',   require('./routes/videoRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// ── Health Check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KE Studio server is running 🎬',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── SPA Routes ────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

// ── 404 Handler ───────────────────────────────
app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.url}`
    });
  }
  res.status(404).sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global Error Handler ──────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB ||2000}MB`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Start Server ──────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   🎬  KUNDAPURA EDITS STUDIO SERVER      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  🌐  http://localhost:${PORT}               ║`);
  console.log(`║  🔑  Admin: http://localhost:${PORT}/admin   ║`);
  console.log(`║  📡  API:   http://localhost:${PORT}/api     ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});