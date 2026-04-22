// backend/models/Review.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'Video reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [600, 'Comment cannot exceed 600 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve; admin can hide if needed
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching reviews per video
reviewSchema.index({ videoId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
