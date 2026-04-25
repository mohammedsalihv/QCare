const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Clinical', 'Operational', 'Financial', 'Strategic', 'Compliance', 'Environmental']
  },
  department: {
    type: String,
    required: true
  },
  probability: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // 1: Rare, 5: Almost Certain
  },
  impact: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // 1: Insignificant, 5: Catastrophic
  },
  score: {
    type: Number,
    required: true // probability * impact
  },
  mitigationStrategy: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Identified', 'Mitigated', 'Transferred', 'Accepted', 'Closed'],
    default: 'Identified'
  },
  reviewDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Risk', riskSchema);
