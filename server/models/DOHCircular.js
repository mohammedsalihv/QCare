const mongoose = require('mongoose');

const dohCircularSchema = new mongoose.Schema({
  circularNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  title_ar: {
    type: String
  },
  issuedDate: {
    type: Date,
    required: true
  },
  applicableTo: {
    type: String,
    required: true,
    enum: ['all', 'clinical', 'admin', 'pharmacy']
  },
  attachmentUrl: {
    type: String
  },
  acknowledgmentRequired: {
    type: Boolean,
    default: false
  },
  acknowledgmentDeadline: {
    type: Date
  },
  acknowledgments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DOHCircular', dohCircularSchema);
