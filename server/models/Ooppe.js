const mongoose = require('mongoose');

const ooppeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  licenseNumber: { type: String, required: true, trim: true },
  licenseExpiry: { type: Date, required: true },
  certifications: [{ type: String }],
  status: { type: String, enum: ['active', 'expiring', 'expired'], default: 'active' },
  lastReminderSent: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Ooppe', ooppeSchema);
