const mongoose = require('mongoose');

const trainingPlanSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planYear: {
    type: Number,
    required: true
  },
  competencies: [{
    competencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompetencyFramework' },
    plannedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('TrainingPlan', trainingPlanSchema);
