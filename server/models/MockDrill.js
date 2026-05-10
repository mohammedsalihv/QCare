const mongoose = require('mongoose');

const mockDrillSchema = new mongoose.Schema({
  drillType: {
    type: String,
    enum: ['Code Red (Fire)', 'Code Blue (Cardiac)', 'Code Pink (Abduction)', 'Code Yellow (Disaster)', 'Code Black (Threat)', 'Evacuation'],
    required: true
  },
  drillDate: { type: Date, default: Date.now },
  location: String,
  shift: { type: String, enum: ['morning', 'afternoon', 'night'] },
  responseTimeSeconds: Number,
  participantsCount: Number,
  scenario: String,
  strengths: [String],
  weaknesses: [String],
  improvementActions: [{
    action: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deadline: Date,
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
  }],
  overallRating: { type: Number, min: 1, max: 5 },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['completed', 'reviewed', 'action-pending'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MockDrill', mockDrillSchema);
