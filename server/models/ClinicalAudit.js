const mongoose = require('mongoose');

const clinicalAuditSchema = new mongoose.Schema({
  auditTitle: {
    type: String,
    required: true,
    trim: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditTemplate',
    required: true
  },
  auditType: {
    type: String,
    enum: ['planned', 'unannounced', 'follow-up'],
    required: true
  },
  governancePillar: {
    type: String,
    required: true
  },
  standard: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  conductedDate: {
    type: Date
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'overdue'],
    default: 'scheduled'
  },
  findings: [{
    criterionId: String,
    complianceStatus: {
      type: String,
      enum: ['compliant', 'partial', 'non-compliant'],
      default: 'non-compliant'
    },
    evidence: String,
    attachments: [String]
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  nonCompliantCount: {
    type: Number,
    default: 0
  },
  partialCount: {
    type: Number,
    default: 0
  },
  improvementActions: [{
    actionText: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' }
  }],
  nextAuditDate: {
    type: Date
  },
  frequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'biannual', 'annual']
  },
  linkedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ClinicalAudit', clinicalAuditSchema);
