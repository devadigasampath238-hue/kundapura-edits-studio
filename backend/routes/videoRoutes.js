// backend/routes/videoRoutes.js
// ✅ Supports both FILE UPLOAD (Cloudinary/local) + URL paste

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const Video   = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');

// ── Storage: Cloudinary (production) or local disk (dev) ──────────────────
let upload;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // ── Production: Cloudinary ──────────────────────────────────────────────
  const cloudinary          = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  const multer              = require('multer');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          'kundapura-edits',
      resource_type:   'video',
      allowed_formats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
  });

} else {
  // ── Development: local disk ──────────────────────────────────────────────
  const multer = require('multer');

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      cb(null, Date.now() + '-' + safe);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
    fileFilter: (req, file, cb) => {
      const ok = ['video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/x-matroska'];
      ok.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only video files allowed'));
    },
  });
}

// ── GET /api/videos  (public) ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') query.category = category;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, total, count: videos.length, videos });
  } catch (err) {
    console.error('GET /videos:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// ── GET /api/videos/:id  (public) ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/videos  (admin — supports file + URL) ───────────────────────
router.post('/', protect, upload.single('videoFile'), async (req, res) => {
  try {
    const { title, category, description, videoUrl: manualUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    // Determine final video URL
    let videoUrl = manualUrl || '';
    if (req.file) {
      // Cloudinary returns req.file.path as the CDN URL
      // Local upload returns filename
      videoUrl = req.file.path || `/uploads/${req.file.filename}`;
    }

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a file or provide a video URL' });
    }

    const video = await Video.create({
      title:       title.trim(),
      category,
      videoUrl,
      description: description?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully! Channagide! 🎬',
      video,
    });
  } catch (err) {
    console.error('POST /videos:', err);
    // Clean up local file on error
    if (req.file?.path && !req.file.path.startsWith('http')) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// ── PUT /api/videos/:id  (admin) ──────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, category, description, isActive } = req.body;
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { title, category, description, isActive },
      { new: true, runValidators: true }
    );
    if (!video) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Video updated!', video });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Update failed' });
  }
});

// ── DELETE /api/videos/:id  (admin) ──────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Not found' });

    // Delete local file if it exists
    if (video.videoUrl?.startsWith('/uploads/')) {
      const fp = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(fp)) fs.unlink(fp, () => {});
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (video.videoUrl?.includes('cloudinary.com') && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const cloudinary = require('cloudinary').v2;
        // Extract public_id from URL
        const parts    = video.videoUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder   = parts[parts.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${filename}`, { resource_type: 'video' });
      } catch (e) {
        console.log('Cloudinary delete skipped:', e.message);
      }
    }

    // Delete associated reviews
    const Review = require('../models/Review');
    await Review.deleteMany({ videoId: video._id });

    await video.deleteOne();
    res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;