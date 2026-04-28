// backend/routes/videoRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');

// ──────────────────────────────────────────────
//  GET /api/videos
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const query = { isActive: true };

    if (category && category !== 'all') query.category = category;

    const skip = (page - 1) * limit;
    const total = await Video.countDocuments(query);

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      videos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ──────────────────────────────────────────────
//  POST /api/videos  ✅ FIXED (NO MULTER)
// ──────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, description, videoUrl } = req.body;

    if (!title || !category || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, category and video URL required'
      });
    }

    const video = await Video.create({
      title,
      category,
      description: description || '',
      videoUrl
    });

    res.json({
      success: true,
      message: 'Video uploaded successfully 🎬',
      video
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
});

// ──────────────────────────────────────────────
//  DELETE /api/videos/:id
// ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false });

    await video.deleteOne();

    res.json({
      success: true,
      message: 'Deleted'
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;