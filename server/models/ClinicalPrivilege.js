const mongoose = require('mongoose');

const clinicalPrivilegeSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
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
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Medical Director
  approvalDate: Date,
  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'approved', 'expired', 'suspended'],
    default: 'draft'
  },
  attachments: [String], // Signed Privilege Form
  reviewNotes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ClinicalPrivilege', clinicalPrivilegeSchema);
