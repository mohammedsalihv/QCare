const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const patientSurveySchema = new mongoose.Schema({
  surveyToken: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  facilityId: String,
  submittedAt: Date,
  overallRating: { type: Number, min: 1, max: 5 },
  cleanlinessRating: { type: Number, min: 1, max: 5 },
  staffCommunicationRating: { type: Number, min: 1, max: 5 },
  waitingTimeRating: { type: Number, min: 1, max: 5 },
  wouldRecommend: Boolean,
  comments: String,
  department: String,
  visitType: {
    type: String,
    enum: ['outpatient', 'inpatient', 'emergency']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PatientSurvey', patientSurveySchema);
