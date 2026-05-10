const mongoose = require('mongoose');

const facilityLicenseSchema = new mongoose.Schema({
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  licenseType: {
    type: String,
    required: true,
    enum: ['facility', 'pharmacy', 'laboratory', 'radiology']
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
  renewalReminderSentAt: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  facilityId: {
    type: String, // Or ObjectId if you have a Facility model
    default: 'Main Clinic'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Update status based on expiryDate
facilityLicenseSchema.pre('save', function(next) {
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

module.exports = mongoose.model('FacilityLicense', facilityLicenseSchema);
