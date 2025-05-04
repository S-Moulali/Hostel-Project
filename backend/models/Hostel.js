const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  amenities: [{ type: String }],
  photos: [{ type: String }],
  availability: { type: Boolean, default: true },
  contactNumber: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Hostel', HostelSchema);
