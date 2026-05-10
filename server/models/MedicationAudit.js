const mongoose = require('mongoose');

const medicationAuditSchema = new mongoose.Schema({
  auditDate: { type: Date, default: Date.now },
  auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ward: { type: String, required: true },
  auditType: {
    type: String,
    enum: ['storage', 'labeling', 'high-alert', 'expiry-check', 'controlled-substance'],
    required: true
  },
  findings: [{
    item: String,
    compliant: Boolean,
    notes: String
  }],
  overallCompliance: { type: Number },
  actionRequired: String
}, {
  timestamps: true
});

medicationAuditSchema.pre('save', function(next) {
  if (this.findings && this.findings.length > 0) {
    const compliantCount = this.findings.filter(f => f.compliant).length;
    this.overallCompliance = parseFloat(((compliantCount / this.findings.length) * 100).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('MedicationAudit', medicationAuditSchema);
