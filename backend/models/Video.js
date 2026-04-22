// backend/models/Video.js

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['wedding', 'reels', 'youtube', 'ads'],
        message: 'Category must be wedding, reels, youtube, or ads',
      },
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: populate reviews count
videoSchema.virtual('reviewCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'videoId',
  count: true,
});

// Index for faster queries
videoSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
