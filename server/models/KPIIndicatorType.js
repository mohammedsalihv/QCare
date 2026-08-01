const mongoose = require('mongoose');

const kpiIndicatorTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Indicator type is required'],
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

module.exports = mongoose.model('KPIIndicatorType', kpiIndicatorTypeSchema);
