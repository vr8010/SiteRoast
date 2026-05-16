const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  aadhaar: { type: String, unique: true },
  village: String,
  phone: String,
  familyDetails: String,
  workExperience: Number, // years
  role: { type: String, enum: ['worker', 'contractor', 'farmer'], default: 'worker' },
  campLocation: String,
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
