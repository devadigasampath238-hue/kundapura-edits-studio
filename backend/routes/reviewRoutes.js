// backend/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Video = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');

// ──────────────────────────────────────────────
//  GET /api/reviews/:videoId
//  Public — get all approved reviews for a video
// ──────────────────────────────────────────────
router.get('/:videoId', async (req, res) => {
  try {
    const reviews = await Review.find({
      videoId: req.params.videoId,
      isApproved: true,
    }).sort({ createdAt: -1 }).lean();

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.json({
      success: true,
      count: reviews.length,
      avgRating: parseFloat(avgRating),
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// ──────────────────────────────────────────────
//  GET /api/reviews  (Admin only)
//  Admin — get ALL reviews across all videos
// ──────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('videoId', 'title category')
      .lean();

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// ──────────────────────────────────────────────
//  POST /api/reviews
//  Public — submit a review for a video
// ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { videoId, name, rating, comment } = req.body;

    // Validation
    if (!videoId || !name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'All fields (videoId, name, rating, comment) are required',
      });
    }

    // Check video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Basic spam check: no more than 3 reviews per name per video
    const existingCount = await Review.countDocuments({ videoId, name: name.trim() });
    if (existingCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'You have already submitted too many reviews for this video',
      });
    }

    const review = await Review.create({
      videoId,
      name: name.trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted! Dhanyavada! ⭐',
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit review' });
  }
});

// ──────────────────────────────────────────────
//  DELETE /api/reviews/:id
//  Admin — delete a review
// ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ──────────────────────────────────────────────
//  PATCH /api/reviews/:id/approve
//  Admin — toggle review approval
// ──────────────────────────────────────────────
router.patch('/:id/approve', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.isApproved = !review.isApproved;
    await review.save();

    res.json({ success: true, message: `Review ${review.isApproved ? 'approved' : 'hidden'}`, review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
