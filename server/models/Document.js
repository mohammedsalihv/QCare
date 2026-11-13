const mongoose = require('mongoose');
const content = {
  name: { type: String, required: true }, type: { type: String, required: true },
  department: { type: String, required: true }, ref: { type: String, required: true },
  description: String, generatedText: String, classification: { type: String, default: 'Restricted' },
  revisedDate: { type: Date, required: true }, nextRevDate: { type: Date, required: true },
  expiryDate: Date, changeSummary: String,
  audience: { type: String, enum: ['All staff', 'Department', 'Owner and reviewers'], default: 'Owner and reviewers' },
  allowDownload: { type: Boolean, default: false },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentFile' },
  fileName: String, fileMime: String, fileUrl: String
};
const snapshot = new mongoose.Schema({ ...content, version: String, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedAt: Date }, { _id: false });
const documentSchema = new mongoose.Schema({
  ...content,
  documentId: { type: String, required: true, unique: true },
  version: { type: String, default: '01' }, uploadDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Draft' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  draft: snapshot,
  draftState: { type: String, enum: ['Draft', 'In review', 'Changes requested', 'Approved'] },
  assignedApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  delegatedApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  delegationUntil: Date,
  notifyOnOpen: { type: Boolean, default: false },
  draftEditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedAt: Date,
  versions: [snapshot],
  history: [{ action: String, actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, actorName: String, at: Date, reason: String, version: String }]
}, { timestamps: true, optimisticConcurrency: true });
documentSchema.index({ uploadedBy: 1, status: 1 });
module.exports = mongoose.model('Document', documentSchema);
