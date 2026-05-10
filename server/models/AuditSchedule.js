const mongoose = require('mongoose');

const auditScheduleSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditTemplate',
    required: true
  },
  frequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'biannual', 'annual'],
    required: true
  },
  lastAuditDate: {
    type: Date
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  responsibleAuditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  autoReminderDays: {
    type: Number,
    default: 7
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditSchedule', auditScheduleSchema);
