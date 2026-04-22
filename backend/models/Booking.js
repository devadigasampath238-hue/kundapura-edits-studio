// backend/models/Booking.js

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: {
        values: ['session', 'counsellor'],
        message: 'Type must be session or counsellor',
      },
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    // Session-specific fields
    projectType: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    // Counsellor-specific fields
    skills: {
      type: String,
      trim: true,
      default: '',
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    portfolioLink: {
      type: String,
      trim: true,
      default: '',
    },
    // Admin management
    status: {
      type: String,
      enum: ['new', 'reviewed', 'contacted', 'closed'],
      default: 'new',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin queries
bookingSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
