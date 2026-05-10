const mongoose = require('mongoose');

const ipcChecklistSubmissionSchema = new mongoose.Schema({
  checklistType: {
    type: String,
    enum: ['isolation-precautions', 'PPE-compliance', 'environmental-cleaning', 'sterilization', 'linen-waste'],
    required: true
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ward: { type: String, required: true },
  submissionDate: { type: Date, default: Date.now },
  items: [{
    criterion: String,
    compliant: Boolean,
    notes: String
  }],
  overallCompliance: { type: Number },
  timestamps: true
}, {
  timestamps: true
});

ipcChecklistSubmissionSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    const compliantCount = this.items.filter(i => i.compliant).length;
    this.overallCompliance = parseFloat(((compliantCount / this.items.length) * 100).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('IPCChecklistSubmission', ipcChecklistSubmissionSchema);
