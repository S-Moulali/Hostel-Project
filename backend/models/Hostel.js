const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true }
});

const LocationSchema = new mongoose.Schema({
  doorNumber: { type: String, required: true },
  streetName: { type: String, required: true },
  landmark: { type: String }, // optional
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: Number, required: true } 
});

const HostelSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  name: { type: String, required: true },
  location: LocationSchema,  // nested structured location
  price: { type: Number, required: true },
  amenities: [{ type: String }],
  photos: [PhotoSchema],
  availability: { type: Boolean, default: true },
  contactNumber: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Hostel', HostelSchema);
