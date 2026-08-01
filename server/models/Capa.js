const mongoose = require('mongoose');

const capaSchema = new mongoose.Schema({
  capaId: { type: String, unique: true, required: true },
  source: { type: String, required: true }, // e.g. Deviation, Audit, Complaint
  sourceId: String, // ID reference
  description: { type: String, required: true },
  rootCause: { type: String, required: true },
  correctiveAction: { type: String, required: true },
  preventiveAction: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetDate: Date,
  status: { type: String, enum: ['Open', 'Under Review', 'Verification', 'Closed'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('Capa', capaSchema);
