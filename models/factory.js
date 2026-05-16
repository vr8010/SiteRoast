const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  district: String,
  ratePerTon: Number,
  contact: String,
  lat: Number,
  lng: Number
}, { timestamps: true });

module.exports = mongoose.model('Factory', factorySchema);
