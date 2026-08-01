const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  changeId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  reason: { type: String, required: true },
  department: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  impactAssessment: {
    clinical: String,
    operational: String,
    financial: String
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Implemented'], 
    default: 'Pending Approval' 
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);
