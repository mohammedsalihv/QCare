const mongoose = require('mongoose');

const kpiSelectionCriteriaSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: [true, 'Criteria name is required'],
    unique: true,
    trim: true
  },
  addedBy: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KPISelectionCriteria', kpiSelectionCriteriaSchema);
