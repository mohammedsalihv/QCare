const mongoose = require('mongoose');

const credentialingRecordSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentType: {
    type: String,
    enum: ['BLS', 'ACLS', 'PALS', 'NRP', 'Malpractice-Insurance', 'Dataflow-Report', 'Degree-Verification', 'Police-Clearance'],
    required: true
  },
  documentNumber: String,
  issuedDate: Date,
  expiryDate: Date,
  issuingAuthority: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  attachmentUrl: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('CredentialingRecord', credentialingRecordSchema);
