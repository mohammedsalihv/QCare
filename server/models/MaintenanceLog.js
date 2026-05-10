const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentAsset', required: true },
  logType: {
    type: String,
    enum: ['PPM', 'calibration', 'repair', 'inspection'],
    required: true
  },
  maintenanceDate: { type: Date, default: Date.now },
  performedBy: String, // Technician name or Vendor
  vendorName: String,
  cost: Number,
  description: String,
  findings: String,
  partsReplaced: [String],
  result: {
    type: String,
    enum: ['pass', 'fail', 'conditional'],
    default: 'pass'
  },
  nextDueDate: Date,
  attachmentUrl: String, // Calibration Certificate
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['completed', 'pending-verification'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
