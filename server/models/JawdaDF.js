const mongoose = require('mongoose');

const jawdaDFSchema = new mongoose.Schema({
  patientId: { 
    type: String, 
    required: true, 
    trim: true 
  },
  patientName: String,
  reportingMonth: { 
    type: Date, 
    required: true 
  }, // Typically 1st day of the month for patient-month counting
  treatmentDurationDays: { 
    type: Number, 
    default: 90 
  },
  sessionsPerWeek: { 
    type: Number, 
    enum: [1, 2, 3, 4, 5, 6], 
    default: 3 
  },
  actualSessionsInMonth: { 
    type: Number, 
    default: 12 
  },
  
  // Effectiveness Domain
  transfusionReceived: { type: Boolean, default: false },
  kt_v_value: { type: Number }, // spKt/V or stdKt/V
  emergencyVisitNoAdmission: { type: Boolean, default: false },
  hospitalAdmissionUnplanned: { type: Boolean, default: false },
  hemoglobin: { type: Number }, // g/L
  esaGiven: { type: Boolean, default: false },
  albumin: { type: Number }, // g/L
  calcium: { type: Number }, // mmol/L
  
  // Safety Domain
  positiveBloodCulture: { type: Boolean, default: false },
  bloodCultureDate: Date,
  catheterStatus: {
    hasCatheter: { type: Boolean, default: false },
    continuousDurationMonths: { type: Number, default: 0 }
  },
  
  // Transplantation
  annualTransplantAssessmentCompleted: { type: Boolean, default: false },
  referralToTransplantCenter: { type: Boolean, default: false },

  // Scope & Exclusions
  isPediatric: { type: Boolean, default: false },
  hasHemoglobinopathy: { type: Boolean, default: false },
  isTerminalLifeExpectancy: { type: Boolean, default: false },
  dialysisModality: { 
    type: String, 
    enum: ['HD', 'HHD', 'PD'], 
    default: 'HD' 
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index for quarterly summation (summing 3 months per submission)
jawdaDFSchema.index({ reportingMonth: 1, patientId: 1 });

module.exports = mongoose.model('JawdaDF', jawdaDFSchema);
