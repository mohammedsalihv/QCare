const mongoose = require('mongoose');
module.exports = mongoose.model('DocumentFeedback', new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  version: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  kind: { type: String, enum: ['Question', 'Suggestion', 'Outdated information'], required: true },
  message: { type: String, required: true, maxlength: 4000 },
  status: { type: String, enum: ['New', 'Under review', 'Accepted', 'Declined', 'Resolved'], default: 'New' },
  replies: [{ authorName: String, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, message: String, status: String, at: Date }]
}, { timestamps: true, optimisticConcurrency: true }));
