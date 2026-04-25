const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  auditDate: {
    type: Date,
    required: true
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  checklist: [{
    item: String,
    status: {
      type: String,
      enum: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      default: 'Not Applicable'
    },
    observations: String
  }],
  summary: {
    type: String
  },
  recommendations: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Audit', auditSchema);
