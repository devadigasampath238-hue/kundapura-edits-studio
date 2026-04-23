const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');

// ── Storage Config (Cloudinary in production, local in development) ──
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinaryConfig = require('../config/cloudinary');
  upload = cloudinaryConfig.upload;
} else {
  const multer = require('multer');
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
  upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
  });
}

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
//  Public — get single video
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
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
      return res.status(400).json({
        success: false,
        message: 'Title and category are required',
      });
    }

    // ✅ FIXED: supports both Cloudinary (req.file.path) and local (req.file.filename)
    let videoUrl = manualUrl || '';
    if (req.file) {
      videoUrl = req.file.path || `/uploads/${req.file.filename}`;
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file or provide a URL',
      });
    }

    const video = await Video.create({
      title,
      category,
      videoUrl,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully! Channagide! 🎬',
      video,
    });
  } catch (error) {
    console.error('Upload error:', error);
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

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

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
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Delete local file if exists
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (video.videoUrl && video.videoUrl.includes('cloudinary.com')) {
      try {
        const { cloudinary } = require('../config/cloudinary');
        const publicId = video.videoUrl.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(`kundapura-edits/${publicId}`, {
          resource_type: 'video',
        });
      } catch (cloudErr) {
        console.log('Cloudinary delete error (non-fatal):', cloudErr.message);
      }
    }

    // Delete associated reviews
    const Review = require('../models/Review');
    await Review.deleteMany({ videoId: video._id });

    await video.deleteOne();

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;