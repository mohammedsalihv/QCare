const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  version: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: Date, dueDate: Date, firstOpenedAt: Date, lastOpenedAt: Date,
  views: { type: Number, default: 0 }, downloads: { type: Number, default: 0 },
  acknowledgedAt: Date,
  helpful: { type: Boolean, default: false }
}, { timestamps: true });
schema.index({ document: 1, version: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('DocumentReading', schema);
