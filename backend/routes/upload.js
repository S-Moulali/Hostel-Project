const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary with your credentials or from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostel_connect', // folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const parser = multer({ storage: storage });

// Endpoint to upload images
router.post('/images', parser.array('images', 5), (req, res) => {
  // The uploaded files info will be in req.files
  if (!req.files) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const imageUrls = req.files.map(file => file.path);
  res.json({ imageUrls });
  console.log({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  });
});

module.exports = router;