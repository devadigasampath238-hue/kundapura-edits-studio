// backend/routes/videoRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');

// ── Multer Storage Config ──────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: timestamp + original name (no spaces)
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, webm, ogg, mov, avi)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 200) * 1024 * 1024,
  },
});

// ──────────────────────────────────────────────
//  GET /api/videos
//  Public — fetch all active videos
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Video.countDocuments(query);

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: videos.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      videos,
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// ──────────────────────────────────────────────
//  GET /api/videos/:id
//  Public — get single video (increments view count)
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
//  POST /api/videos
//  Admin — upload new video
// ──────────────────────────────────────────────
router.post('/', protect, upload.single('videoFile'), async (req, res) => {
  try {
    const { title, category, description, videoUrl: manualUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    // Determine video URL: uploaded file OR manual URL
    let videoUrl = manualUrl || '';
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    }

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a video file or provide a URL' });
    }

    const video = await Video.create({ title, category, videoUrl, description: description || '' });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully! Channagide! 🎬',
      video,
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Remove uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// ──────────────────────────────────────────────
//  PUT /api/videos/:id
//  Admin — edit video title/category/description
// ──────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, category, description, isActive } = req.body;

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { title, category, description, isActive },
      { new: true, runValidators: true }
    );

    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    res.json({ success: true, message: 'Video updated!', video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
});

// ──────────────────────────────────────────────
//  DELETE /api/videos/:id
//  Admin — delete video and its file
// ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    // Delete physical file if it's a local upload
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }

    // Also delete associated reviews
    const Review = require('../models/Review');
    await Review.deleteMany({ videoId: video._id });

    await video.deleteOne();

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;
