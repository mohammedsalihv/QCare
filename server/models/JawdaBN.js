const mongoose = require('mongoose');

const jawdaBNSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    trim: true
  },
  patientName: String,
  tbsa: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  admissionDate: {
    type: Date,
    required: true
  },
  dischargeDate: Date,
  status: {
    type: String,
    enum: ['Inpatient', 'Discharged', 'Expired', 'LAMA', 'Transferred'],
    default: 'Inpatient'
  },
  principalDiagnosisCode: {
    type: String, // ICD-10 T20-T32
    required: true
  },
  
  // Device Days Tracking
  ventilatorDays: { type: Number, default: 0 },
  centralLineDays: { type: Number, default: 0 },
  urinaryCatheterDays: { type: Number, default: 0 },
  
  // Complications / Events (N/D Tracking)
  events: {
    vae: { type: Boolean, default: false },
    unplannedIntubation: { type: Boolean, default: false },
    dvt_vte: { type: Boolean, default: false },
    aki_stage3: { type: Boolean, default: false },
    clabsi: { type: Boolean, default: false },
    cauti: { type: Boolean, default: false },
    sepsis: { type: Boolean, default: false },
    pressureInjury_stage2plus: { type: Boolean, default: false },
    mdro_bsi: {
      hasEvent: { type: Boolean, default: false },
      type: { type: String, enum: ['MRSA', 'VRE', 'CephR-Klebsiella', 'CPO', null], default: null }
    },
    unplannedReoperation_48h: { type: Boolean, default: false },
    skinGraftLoss_gt10: { type: Boolean, default: false },
    burnWoundInfection: { type: Boolean, default: false },
    donorSiteInfection: { type: Boolean, default: false }
  },
  
  // Surgical Data
  firstSurgicalExcisionDate: Date,
  hasSkinGraft: { type: Boolean, default: false },
  
  // Efficiency
  rehabPhaseDays: { type: Number, default: 0 },

  // Metadata
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes
jawdaBNSchema.index({ admissionDate: 1, tbsa: 1 });
jawdaBNSchema.index({ principalDiagnosisCode: 1 });

module.exports = mongoose.model('JawdaBN', jawdaBNSchema);
