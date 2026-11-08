const mongoose = require('mongoose');

const clinicalPrivilegeSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
  applicationType: { type: String, enum: ['new', 'renewal', 'extension'], default: 'new' },
  reason: { type: String, maxlength: 4000 },
  requestedStartDate: Date,
  assignedApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supportingDocuments: [{ name: String, mimeType: String, size: Number, data: { type: Buffer, select: false } }],
  privilegeType: {
    type: String,
    enum: ['core', 'special', 'emergency'],
    default: 'core'
  },
  procedures: [{
    name: String,
    requested: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    level: { type: String, enum: ['direct-supervision', 'indirect-supervision', 'independent'], default: 'independent' },
    comments: String
  }],
  issuedDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  requestedBy: {type:mongoose.Schema.Types.ObjectId,ref:'User'},
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Medical Director
  approvalDate: Date,
  reviewedBy: {type:mongoose.Schema.Types.ObjectId,ref:'User'}, reviewedAt: Date,
  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'rejected', 'approved', 'expired', 'suspended'],
    default: 'draft'
  },
  attachments: [String], // Signed Privilege Form
  reviewNotes: String
}, {
  timestamps: true,
  optimisticConcurrency: true
});

module.exports = mongoose.model('ClinicalPrivilege', clinicalPrivilegeSchema);
