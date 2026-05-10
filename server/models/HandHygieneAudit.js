const mongoose = require('mongoose');

const handHygieneAuditSchema = new mongoose.Schema({
  auditDate: { type: Date, default: Date.now },
  shift: { type: String, enum: ['morning', 'afternoon', 'night'], required: true },
  ward: { type: String, required: true },
  department: String,
  auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalOpportunities: { type: Number, required: true },
  compliantCount: { type: Number, required: true },
  complianceRate: { type: Number },
  nonCompliantObservations: [{
    moment: {
      type: String,
      enum: ['before-patient-contact', 'before-aseptic', 'after-body-fluid', 'after-patient-contact', 'after-environment']
    },
    staffRole: String,
    observation: String
  }],
  actionsTaken: String
}, {
  timestamps: true
});

handHygieneAuditSchema.pre('save', function(next) {
  if (this.totalOpportunities > 0) {
    this.complianceRate = parseFloat(((this.compliantCount / this.totalOpportunities) * 100).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('HandHygieneAudit', handHygieneAuditSchema);
