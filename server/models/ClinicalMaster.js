const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  kind: { type: String, required: true, enum: ['specialties', 'procedure-categories', 'procedures', 'physician-profiles'] },
  name: { type: String, trim: true },
  code: { type: String, trim: true },
  department: String,
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalMaster' },
  req: String,
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gender: String,
  specialty: String,
  qualification: String,
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
  licenseType: String,
  licenseNumber: String,
  expiryDate: Date,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ kind: 1, staffId: 1 }, { unique: true, partialFilterExpression: { kind: 'physician-profiles' } });
schema.index({ kind: 1, name: 1 }, { unique: true, partialFilterExpression: { name: { $type: 'string' } } });
module.exports = mongoose.model('ClinicalMaster', schema);
