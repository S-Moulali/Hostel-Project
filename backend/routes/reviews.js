const express = require('express');
const Review = require('../models/Review');
const Hostel = require('../models/Hostel');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get reviews for a hostel
router.get('/hostel/:hostelId', async (req, res) => {
  try {
    const reviews = await Review.find({ hostel: req.params.hostelId })
      .populate('student', 'username userType')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add review - only students
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    if (userType !== 'student') return res.status(403).json({ message: 'Only students can add reviews' });

    const { hostel: hostelId, rating, comment } = req.body;
    if (!hostelId || !rating) {
      return res.status(400).json({ message: 'Hostel ID and rating required' });
    }
    const hostelExists = await Hostel.findById(hostelId);
    if (!hostelExists) return res.status(404).json({ message: 'Hostel not found' });

    // Optional: Prevent multiple reviews from same student for the same hostel
    const existingReview = await Review.findOne({ hostel: hostelId, student: userId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this hostel' });
    }

    const review = new Review({
      hostel: hostelId,
      student: userId,
      rating,
      comment
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
