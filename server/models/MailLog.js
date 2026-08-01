const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
  moduleName: {
    type: String,
    required: true
  },
  pageName: {
    type: String,
    required: true
  },
  mailSubject: {
    type: String,
    required: true
  },
  fromMail: {
    type: String,
    required: true
  },
  toMail: {
    type: String,
    required: true
  },
  toMailUserName: {
    type: String,
    required: true
  },
  submittedBy: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MailLog', mailLogSchema);
