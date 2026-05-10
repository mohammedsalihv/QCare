const mongoose = require('mongoose');

const equipmentAssetSchema = new mongoose.Schema({
  assetId: { type: String, unique: true }, // e.g., BIO-MED-001
  equipmentName: { type: String, required: true },
  model: String,
  serialNumber: { type: String, required: true },
  manufacturer: String,
  department: { type: String, required: true },
  ward: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  criticality: {
    type: String,
    enum: ['life-saving', 'critical', 'non-critical'],
    default: 'non-critical'
  },
  lastCalibrationDate: Date,
  calibrationFrequencyMonths: { type: Number, default: 12 },
  nextCalibrationDate: Date,
  lastPPMDate: Date,
  ppmFrequencyMonths: { type: Number, default: 6 },
  nextPPMDate: Date,
  status: {
    type: String,
    enum: ['active', 'under-repair', 'decommissioned', 'out-of-calibration', 'missing'],
    default: 'active'
  },
  supplierInfo: {
    name: String,
    contact: String
  },
  attachments: [String], // User manuals, calibration certificates
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

equipmentAssetSchema.pre('save', function(next) {
  if (this.lastCalibrationDate && this.calibrationFrequencyMonths) {
    const nextDate = new Date(this.lastCalibrationDate);
    nextDate.setMonth(nextDate.getMonth() + this.calibrationFrequencyMonths);
    this.nextCalibrationDate = nextDate;
  }
  if (this.lastPPMDate && this.ppmFrequencyMonths) {
    const nextDate = new Date(this.lastPPMDate);
    nextDate.setMonth(nextDate.getMonth() + this.ppmFrequencyMonths);
    this.nextPPMDate = nextDate;
  }
  next();
});

module.exports = mongoose.model('EquipmentAsset', equipmentAssetSchema);
