const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String
  },
  department: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Compliment', 'Complaint', 'Suggestion'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Received', 'Under Investigation', 'Action Taken', 'Resolved', 'Closed'],
    default: 'Received'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
