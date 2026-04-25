const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  department: { type: String, required: true },
  ref: { type: String, required: true },
  classification: { type: String, default: 'Restricted' },
  version: { type: String, default: '01' },
  revisedDate: { type: Date, required: true },
  nextRevDate: { type: Date, required: true },
  uploadDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active' },
  fileUrl: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
