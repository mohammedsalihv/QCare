const mongoose = require('mongoose');

const trainingRecordSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  competencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompetencyFramework',
    required: true
  },
  trainingTitle: {
    type: String,
    required: true
  },
  trainingType: {
    type: String,
    enum: ['mandatory-DOH', 'competency-assessment', 'CPD', 'orientation', 'refresher'],
    required: true
  },
  deliveryMethod: {
    type: String,
    enum: ['in-house', 'external', 'e-learning', 'simulation', 'on-the-job'],
    required: true
  },
  provider: String,
  completionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  score: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  assessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assessmentMethod: String,
  certificateUrl: String,
  verifiedByQM: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  notes: String,
  linkedIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TrainingRecord', trainingRecordSchema);
