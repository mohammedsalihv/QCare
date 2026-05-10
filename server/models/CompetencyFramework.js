const mongoose = require('mongoose');

const competencyFrameworkSchema = new mongoose.Schema({
  competencyName: {
    type: String,
    required: [true, 'Competency name is required'],
    trim: true
  },
  competencyName_ar: {
    type: String
  },
  competencyCode: {
    type: String,
    unique: true,
    required: true
  },
  applicableRoles: [{
    type: String,
    enum: ['Physician', 'Nurse', 'Pharmacist', 'Technician', 'Admin', 'All']
  }],
  assessmentMethod: {
    type: String,
    required: true,
    enum: ['direct-observation', 'written-test', 'simulation', 'portfolio', '360-feedback']
  },
  assessedByRole: {
    type: String,
    enum: ['SeniorClinician', 'ExternalAssessor', 'QualityManager']
  },
  frequency: {
    type: String,
    required: true,
    enum: ['on-hire', 'annual', 'biannual', 'triggered-by-incident']
  },
  isMandatoryDOH: {
    type: Boolean,
    default: false
  },
  passingScore: {
    type: Number,
    default: 80
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CompetencyFramework', competencyFrameworkSchema);
