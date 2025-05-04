const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const authMiddleware = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostel_connect',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const parser = multer({ storage: storage });

// Upload images route - authenticated owners only
router.post('/images', authMiddleware, (req, res, next) => {
  if (req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Only owners can upload images.' });
  }
  next();
}, parser.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const images = req.files.map(file => ({
    url: file.path,
    public_id: file.filename || file.public_id
  }));

  res.json({ images });
});

// Delete image route - authenticated owners only
router.delete('/images/:public_id', authMiddleware, async (req, res) => {
  if (req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Only owners can delete images.' });
  }

  try {
    const { public_id } = req.params;
    await cloudinary.uploader.destroy(public_id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image', error });
  }
});
module.exports = router;