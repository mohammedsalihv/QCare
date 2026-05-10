const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintRef: {
    type: String,
    unique: true
  },
  source: {
    type: String,
    enum: ['walk-in', 'phone', 'email', 'DOH-portal', 'social-media', 'internal'],
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientContact: String,
  patientMRN: String,
  dateReceived: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['clinical-care', 'waiting-time', 'communication', 'billing', 'cleanliness', 'staff-attitude', 'privacy', 'other'],
    required: true
  },
  subcategory: String,
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: String,
  acknowledgmentDate: Date,
  acknowledgmentSentAt: Date,
  resolutionDate: Date,
  resolutionSummary: String,
  patientNotifiedAt: Date,
  patientSatisfied: Boolean,
  reopened: {
    type: Boolean,
    default: false
  },
  escalatedToDOH: {
    type: Boolean,
    default: false
  },
  escalationDate: Date,
  escalationReason: String,
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'investigating', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  linkedIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  actionsTaken: [{
    action: String,
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    takenAt: { type: Date, default: Date.now },
    notes: String
  }],
  internalNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

complaintSchema.virtual('resolutionDays').get(function() {
  if (!this.resolutionDate) return null;
  return Math.ceil((this.resolutionDate - this.dateReceived) / (1000 * 60 * 60 * 24));
});

complaintSchema.virtual('acknowledgmentDays').get(function() {
  if (!this.acknowledgmentDate) return null;
  return Math.ceil((this.acknowledgmentDate - this.dateReceived) / (1000 * 60 * 60 * 24));
});

complaintSchema.pre('save', async function(next) {
  if (!this.complaintRef) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      }
    });
    this.complaintRef = `COMP-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
