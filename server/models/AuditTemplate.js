const mongoose = require('mongoose');

const auditTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  governancePillar: {
    type: String,
    required: true,
    enum: ['clinical-risk', 'clinical-audit', 'effectiveness-outcomes', 'training', 'staff-management', 'patient-involvement', 'information-management']
  },
  standard: {
    type: String,
    required: true,
    enum: ['DOH', 'JCI', 'internal', 'ISO']
  },
  criteria: [{
    criterionId: { type: String, required: true },
    text: { type: String, required: true },
    text_ar: { type: String },
    weight: { type: Number, default: 1 }
  }],
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

module.exports = mongoose.model('AuditTemplate', auditTemplateSchema);
