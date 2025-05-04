const express = require('express');
const Hostel = require('../models/Hostel');
const authMiddleware = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Get all hostels with optional filters (location fields and price range)
router.get('/', async (req, res) => {
  try {
    const { priceMin, priceMax, city, state, zipcode } = req.query;
    let filter = {};

    // Filtering on nested location fields with case-insensitive regex for city and state
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (state) filter['location.state'] = new RegExp(state, 'i');
    if (zipcode) filter['location.zipcode'] = zipcode;

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

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

// Create new hostel - only owners allowed
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userType, userId } = req.user;
    if (userType !== 'owner') return res.status(403).json({ message: 'Only owners can add hostels' });

    const { name, location, price, amenities, photos, availability, contactNumber } = req.body;
    const hostel = new Hostel({
      owner: userId,
      name,
      location, // structured location object
      price,
      amenities,
      photos, // array of { url, public_id }
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

    // Compare existing and new photos to find removed images
    const existingPhotos = hostel.photos || [];
    const newPhotos = req.body.photos || [];

    const removedPhotos = existingPhotos.filter(ep => !newPhotos.some(np => np.public_id === ep.public_id));

    // Delete removed photos from Cloudinary
    for (const photo of removedPhotos) {
      try {
        await cloudinary.uploader.destroy(photo.public_id);
      } catch (error) {
        console.error('Failed to delete photo from Cloudinary', error);
      }
    }

    // Update fields
    hostel.name = req.body.name || hostel.name;
    hostel.location = req.body.location || hostel.location;
    hostel.price = req.body.price || hostel.price;
    hostel.amenities = req.body.amenities || hostel.amenities;
    hostel.photos = newPhotos;
    hostel.availability = typeof req.body.availability === 'boolean' ? req.body.availability : hostel.availability;
    hostel.contactNumber = req.body.contactNumber || hostel.contactNumber;

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

    // Delete all photos from Cloudinary
    if (hostel.photos && hostel.photos.length > 0) {
      for (const photo of hostel.photos) {
        try {
          await cloudinary.uploader.destroy(photo.public_id);
        } catch (error) {
          console.error('Failed to delete photo from Cloudinary', error);
        }
      }
    }

    await hostel.deleteOne();
    res.json({ message: 'Hostel deleted successfully' });
  } catch (err) {
    console.error('Delete hostel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
