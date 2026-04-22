// backend/routes/bookingRoutes.js

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// ──────────────────────────────────────────────
//  POST /api/bookings/session
//  Public — submit expressing session form
// ──────────────────────────────────────────────
router.post('/session', async (req, res) => {
  try {
    const { name, email, phone, projectType, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const booking = await Booking.create({
      type: 'session',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      projectType: projectType?.trim() || '',
      message: message?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Session booked! Nimma video, namma editing magic ✨ We\'ll contact you within 2 hours.',
      booking: { id: booking._id, name: booking.name, type: booking.type },
    });
  } catch (error) {
    console.error('Session booking error:', error);
    res.status(500).json({ success: false, message: error.message || 'Booking failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────
//  POST /api/bookings/counsellor
//  Public — submit counsellor application
// ──────────────────────────────────────────────
router.post('/counsellor', async (req, res) => {
  try {
    const { name, email, phone, skills, experience, portfolioLink, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const booking = await Booking.create({
      type: 'counsellor',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      skills: skills?.trim() || '',
      experience: experience?.trim() || '',
      portfolioLink: portfolioLink?.trim() || '',
      message: message?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Application received! Banni, sahakaaravaagi kaaleesa! We\'ll review and contact you soon.',
      booking: { id: booking._id, name: booking.name, type: booking.type },
    });
  } catch (error) {
    console.error('Counsellor booking error:', error);
    res.status(500).json({ success: false, message: error.message || 'Application failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────
//  GET /api/bookings
//  Admin — get all bookings (with optional filters)
// ──────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      total,
      count: bookings.length,
      pages: Math.ceil(total / parseInt(limit)),
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// ──────────────────────────────────────────────
//  PATCH /api/bookings/:id/status
//  Admin — update booking status
// ──────────────────────────────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '' },
      { new: true }
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ──────────────────────────────────────────────
//  DELETE /api/bookings/:id
//  Admin — delete booking
// ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;
