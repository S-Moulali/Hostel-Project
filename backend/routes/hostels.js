const express = require('express');
const Hostel = require('../models/Hostel');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all hostels with optional filters (location, priceMin, priceMax)
router.get('/', async (req, res) => {
  try {
    const { location, priceMin, priceMax } = req.query;
    let filter = {};
    if (location) filter.location = new RegExp(location, 'i');
    if (priceMin || priceMax) filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);

    const hostels = await Hostel.find(filter).populate('owner', 'username userType');
    res.json(hostels);
  } catch (err) {
    console.error('Get hostels error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hostel by ID
router.get('/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('owner', 'username userType');
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    res.json(hostel);
  } catch (err) {
    console.error('Get hostel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new hostel - only owners
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userType, userId } = req.user;
    if (userType !== 'owner') return res.status(403).json({ message: 'Only owners can add hostels' });

    const { name, location, price, amenities, photos, availability, contactNumber } = req.body;
    const hostel = new Hostel({
      owner: userId,
      name,
      location,
      price,
      amenities,
      photos,
      availability,
      contactNumber
    });
    await hostel.save();
    res.status(201).json(hostel);
  } catch (err) {
    console.error('Create hostel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update hostel - only owner owns it
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    if (userType !== 'owner') return res.status(403).json({ message: 'Only owners can update hostels' });

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    if (hostel.owner.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

    Object.assign(hostel, req.body);
    await hostel.save();
    res.json(hostel);
  } catch (err) {
    console.error('Update hostel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete hostel - only owner owns it
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    if (userType !== 'owner') return res.status(403).json({ message: 'Only owners can delete hostels' });

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    if (hostel.owner.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

    await hostel.delete();
    res.json({ message: 'Hostel deleted' });
  } catch (err) {
    console.error('Delete hostel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
