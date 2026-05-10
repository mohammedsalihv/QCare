const mongoose = require('mongoose');

const kpiIndicatorSchema = new mongoose.Schema({
  indicatorCode: {
    type: String,
    required: [true, 'Indicator code is required'],
    unique: true,
    trim: true
  },
  indicatorName: {
    type: String,
    required: [true, 'Indicator name is required'],
    trim: true
  },
  indicatorName_ar: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['patient-safety', 'clinical-effectiveness', 'patient-experience', 'efficiency', 'access']
  },
  reportingPeriod: {
    type: String,
    required: [true, 'Reporting period is required'],
    enum: ['Q1', 'Q2', 'Q3', 'Q4']
  },
  reportingYear: {
    type: Number,
    required: [true, 'Reporting year is required']
  },
  numerator: {
    type: Number,
    required: [true, 'Numerator is required'],
    default: 0
  },
  denominator: {
    type: Number,
    required: [true, 'Denominator is required'],
    default: 1 // Avoid division by zero initially
  },
  calculatedValue: {
    type: Number,
    default: 0
  },
  target: {
    type: Number,
    required: [true, 'Target value is required'],
    default: 0
  },
  variance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['on-track', 'at-risk', 'breached'],
    default: 'on-track'
  },
  submittedToDOH: {
    type: Boolean,
    default: false
  },
  submissionDate: {
    type: Date
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility' // Assuming a Facility model exists or will be added
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save hook to compute calculatedValue, variance, and status
kpiIndicatorSchema.pre('save', function(next) {
  // Calculate value: (numerator / denominator) * 100
  if (this.denominator && this.denominator !== 0) {
    this.calculatedValue = parseFloat(((this.numerator / this.denominator) * 100).toFixed(2));
  } else {
    this.calculatedValue = 0;
  }

  // Calculate variance: calculatedValue - target
  this.variance = parseFloat((this.calculatedValue - this.target).toFixed(2));

  // Determine status from variance
  // Logic: Positive variance is usually good, but depends on indicator. 
  // For most KPIs, Actual >= Target is on-track.
  // Let's assume:
  // variance >= 0 => on-track
  // variance < 0 and variance >= -5 => at-risk
  // variance < -5 => breached
  // (This can be customized, but I'll use a standard logic)
  
  if (this.variance >= 0) {
    this.status = 'on-track';
  } else if (this.variance < 0 && this.variance >= -10) {
    this.status = 'at-risk';
  } else {
    this.status = 'breached';
  }

  next();
});

module.exports = mongoose.model('KPIIndicator', kpiIndicatorSchema);
