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
  scheduledUntil: Date,
  sessions: [{
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true }
  }],
  conductedDate: {
    type: Date
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  auditorName: { type: String, trim: true, maxlength: 200 },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: function () { return this.isNew; } },
  concernedDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  concernedPersons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  department: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending-approval', 'schedule-rejected', 'scheduled', 'in-progress', 'pending-review', 'completed', 'overdue'],
    default: 'pending-approval'
  },
  findings: [{
    criterionId: String,
    complianceStatus: {
      type: String,
      enum: ['compliant', 'partial', 'non-compliant', 'not-assessed', 'not-applicable'],
      default: 'not-assessed'
    },
    evidence: String,
    attachments: [String],
    exclusionReason: String
  }],
  overallScore: {
    type: Number,
    default: null
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
    criterionId: String,
    rootCause: String,
    completionEvidence: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    actionText: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'pending-verification', 'completed'], default: 'open' }
  }],
  criteriaSnapshot: [{ criterionId: String, text: String, text_ar: String, weight: Number }],
  coverage: { type: Number, default: 0 },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewComment: String,
  scheduleRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduleRequestedAt: Date,
  scheduleApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduleApprovedAt: Date,
  scheduleRejectedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, scheduleRejectedAt: Date, scheduleRejectionReason: String,
  scheduleApprovalComment: String,
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  history: [{ event: String, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now }, detail: String }],
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
  timestamps: true,
  optimisticConcurrency: true
});

// Retain clinical evidence and the deletion actor, but hide deleted audits from all active workflows.
clinicalAuditSchema.pre(/^find/, function () { this.where({ deletedAt: null }); });
clinicalAuditSchema.pre('countDocuments', function () { this.where({ deletedAt: null }); });
clinicalAuditSchema.pre('aggregate', function () { this.pipeline().unshift({ $match: { deletedAt: null } }); });

module.exports = mongoose.model('ClinicalAudit', clinicalAuditSchema);
