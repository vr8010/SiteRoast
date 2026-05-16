const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  date: { type: Date, default: Date.now },
  tonsWorked: { type: Number, default: 0 },
  ratePerTon: { type: Number, default: 350 }, // ₹ per ton
  payment: { type: Number, default: 0 },      // auto-calculated
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  notes: String
}, { timestamps: true });

// Auto-calculate payment before save
attendanceSchema.pre('save', function (next) {
  this.payment = this.tonsWorked * this.ratePerTon;
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
