const mongoose = require('mongoose');

const kpiNotificationRuleSchema = new mongoose.Schema({
  trigger: {
    type: String,
    required: [true, 'Trigger event is required'],
    trim: true
  },
  sendTo: {
    type: String,
    required: [true, 'Recipient is required'],
    trim: true
  },
  template: {
    type: String,
    required: [true, 'Template is required'],
    trim: true
  },
  ccQualityDirector: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KPINotificationRule', kpiNotificationRuleSchema);
