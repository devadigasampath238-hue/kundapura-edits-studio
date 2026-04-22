// backend/server.js
// ── Kundapura Edits Studio — Main Server ──────

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const connectDB = require('./config/db');

// ── Connect to MongoDB ────────────────────────
connectDB().catch(err => {
  console.error("MongoDB connection failed:", err.message);
});

const app = express();

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ──────────────────────────────
// Serve frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Serve uploaded videos
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// ── Request Logger (dev only) ─────────────────
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

// ── Razorpay Placeholder ──────────────────────
app.post('/api/payment/create-order', (req, res) => {
  // TODO: Integrate Razorpay when ready
  res.json({
    success: false,
    message: 'Payment gateway integration coming soon. Contact us directly: +91 93809 16728',
    upiId: '9380916728@okbizaxis',
  });
});

// ── SPA Fallback — serve frontend index.html ──
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

// ── 404 Handler ───────────────────────────────
app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `API route not found: ${req.url}` });
  }
  res.status(404).sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global Error Handler ──────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 200}MB`,
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
