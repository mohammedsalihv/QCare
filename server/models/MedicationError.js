const mongoose = require('mongoose');

const medicationErrorSchema = new mongoose.Schema({
  errorRef: { type: String, unique: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedAt: { type: Date, default: Date.now },
  errorDate: { type: Date, required: true },
  errorTime: String,
  medicationName: { type: String, required: true },
  medicationClass: String,
  errorType: {
    type: String,
    enum: ['wrong-drug', 'wrong-dose', 'wrong-patient', 'wrong-route', 'wrong-time', 'omission', 'near-miss', 'prescribing', 'transcription', 'dispensing', 'administration'],
    required: true
  },
  stage: {
    type: String,
    enum: ['prescribing', 'dispensing', 'administration', 'monitoring'],
    required: true
  },
  patientMRN: String,
  patientHarmed: { type: Boolean, default: false },
  harmLevel: {
    type: String,
    enum: ['none', 'minimal', 'minor', 'moderate', 'serious', 'catastrophic'],
    default: 'none'
  },
  immediateActionTaken: String,
  rootCause: String,
  contributingFactors: [String],
  preventiveMeasures: String,
  reportedToIncidentSystem: { type: Boolean, default: false },
  linkedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  status: {
    type: String,
    enum: ['open', 'under-review', 'closed'],
    default: 'open'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String
}, {
  timestamps: true
});

medicationErrorSchema.pre('save', async function(next) {
  if (!this.errorRef) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      }
    });
    this.errorRef = `MERR-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MedicationError', medicationErrorSchema);
