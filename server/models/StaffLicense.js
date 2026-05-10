const mongoose = require('mongoose');

const staffLicenseSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  DOHPQRNumber: {
    type: String,
    trim: true
  },
  specialty: {
    type: String,
    required: true
  },
  licenseType: {
    type: String,
    required: true,
    enum: ['DOH', 'DHA', 'MOHAP']
  },
  issuedDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expiring-soon', 'expired'],
    default: 'active'
  },
  lastVerifiedDate: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

staffLicenseSchema.pre('save', function(next) {
  const today = new Date();
  const diffDays = Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    this.status = 'expired';
  } else if (diffDays <= 90) {
    this.status = 'expiring-soon';
  } else {
    this.status = 'active';
  }
  next();
});

module.exports = mongoose.model('StaffLicense', staffLicenseSchema);
