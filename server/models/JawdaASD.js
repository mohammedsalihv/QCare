const mongoose = require('mongoose');

const jawdaASDSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    trim: true
  },
  patientName: String,
  referralDate: {
    type: Date,
    required: true // Day 0 for ASD001 and ASD003
  },
  referralSource: String,
  initialAssessmentDate: Date, // Day 0 for ASD002
  diagnosticAssessmentDate: Date,
  
  // ASD002 Requirements
  isReportInEMR: {
    type: Boolean,
    default: false
  },
  isReportProvidedToParents: {
    type: Boolean,
    default: false
  },
  
  // ASD003 Requirements
  neurodevelopmentalAssessmentDate: Date,
  coexistingConditionAssessmentDate: Date,
  
  // Exclusion Flags
  parentPostponed: {
    type: Boolean,
    default: false
  },
  insuranceRejection: {
    type: Boolean,
    default: false
  },
  noShowCount: {
    type: Number,
    default: 0
  },
  underFiveAtReferral: {
    type: Boolean,
    default: false
  },
  relocated: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['Referred', 'InAssessment', 'Diagnosed', 'Closed'],
    default: 'Referred'
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes for KPI tracking
jawdaASDSchema.index({ referralDate: 1 });
jawdaASDSchema.index({ initialAssessmentDate: 1 });

module.exports = mongoose.model('JawdaASD', jawdaASDSchema);
