const mongoose = require('mongoose');

const jawdaAOTSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    trim: true
  },
  patientName: String,
  organType: {
    type: String,
    required: true,
    enum: ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas-Kidney']
  },
  donorType: {
    type: String,
    enum: ['Living', 'Deceased', 'N/A']
  },
  transplantDate: {
    type: Date,
    required: true
  },
  waitlistRegistrationDate: Date,
  waitlistRemovalDate: Date,
  isPrimaryTransplant: {
    type: Boolean,
    default: true
  },
  isAdult: {
    type: Boolean,
    default: true
  },
  multiOrgan: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'LostToFollowUp', 'DAMA', 'Expired', 'GraftFailure'],
    default: 'Active'
  },
  deathDate: Date,
  graftFailureDate: Date,
  
  // Complications tracking
  complications: [{
    type: String, // e.g. 'Biliary', 'Severe PGD', 'Bronchial', 'Vascular'
    detectionDate: Date,
    interventionRequired: Boolean,
    description: String
  }],
  
  // Reporting Metadata
  accrualPeriod: String, // e.g. '2025-H1'
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes for KPI calculations
jawdaAOTSchema.index({ transplantDate: 1, organType: 1 });
jawdaAOTSchema.index({ waitlistRegistrationDate: 1 });

module.exports = mongoose.model('JawdaAOT', jawdaAOTSchema);
