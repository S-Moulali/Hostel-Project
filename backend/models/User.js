const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  userType: { type: String, enum: ['owner', 'student'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
