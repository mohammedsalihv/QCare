const mongoose = require('mongoose');

const highAlertMedicationSchema = new mongoose.Schema({
  medicationName: { type: String, required: true },
  genericName: String,
  category: {
    type: String,
    enum: ['anticoagulant', 'insulin', 'concentrated-electrolyte', 'chemotherapy', 'opioid', 'neuromuscular-blocker', 'other'],
    required: true
  },
  requiresDoubleCheck: { type: Boolean, default: true },
  storageRequirements: String,
  specialPrecautions: String,
  warningLabel: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('HighAlertMedication', highAlertMedicationSchema);
