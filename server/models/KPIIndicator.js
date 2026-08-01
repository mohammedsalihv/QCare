const mongoose = require('mongoose');

const kpiIndicatorSchema = new mongoose.Schema({
  indicatorCode: {
    type: String,
    required: [true, 'Indicator code is required'],
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
    required: [true, 'Category is required']
  },
  mainCategory: {
    type: String,
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  owner: {
    type: String,
    trim: true
  },
  reportingFrequency: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  rationale: {
    type: String,
    trim: true
  },
  criteria: {
    type: String,
    trim: true
  },
  numeratorDesc: {
    type: String,
    trim: true
  },
  denominatorDesc: {
    type: String,
    trim: true
  },
  sampleSize: {
    type: String,
    default: 'All'
  },
  unit: {
    type: String,
    default: '%'
  },
  reportingPeriod: {
    type: String,
    required: [true, 'Reporting period is required']
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
  validationStatus: {
    type: String,
    enum: ['Draft', 'Pending Validation', 'Pending Approval', 'Approved'],
    default: 'Draft'
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
    ref: 'Facility'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index to support periodic submissions of the same KPI
kpiIndicatorSchema.index({ indicatorCode: 1, reportingPeriod: 1, reportingYear: 1 }, { unique: true });

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

