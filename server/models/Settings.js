const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  ldapConfigs: [{
    configName: {
      type: String,
      default: 'Primary AD'
    },
    ldapEnabled: {
      type: Boolean,
      default: false
    },
    ldapUrl: {
      type: String,
      trim: true
    },
    ldapBaseDN: {
      type: String,
      trim: true
    },
    ldapBindDN: {
      type: String,
      trim: true
    },
    ldapBindPassword: {
      type: String
    },
    ldapUserFilter: {
      type: String,
      default: '(sAMAccountName={{username}})'
    },
    ldapEmailField: {
      type: String,
      default: 'mail'
    },
    ldapNameField: {
      type: String,
      default: 'displayName'
    },
    syncBlockedUsers: {
      type: Boolean,
      default: false
    },
    // New fields for enterprise management
    scheduleFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Hourly', 'Manual'],
      default: 'Daily'
    },
    nextExecutionTime: {
      type: Date
    },
    lastExecutionDate: {
      type: Date
    },
    executionStatus: {
      type: String,
      enum: ['Idle', 'Running', 'Success', 'Failed'],
      default: 'Idle'
    },
    scheduleEnabled: {
      type: Boolean,
      default: true
    },
    serverType: {
      type: String,
      enum: ['Microsoft AD', 'OpenLDAP', 'Generic'],
      default: 'Microsoft AD'
    }
  }],
  // Security Policies
  minPasswordLength: {
    type: Number,
    default: 8
  },
  requireSpecialChar: {
    type: Boolean,
    default: true
  },
  requireNumbers: {
    type: Boolean,
    default: true
  },
  maxLoginAttempts: {
    type: Number,
    default: 5
  },
  sessionTimeout: {
    type: Number, // in minutes
    default: 60
  },
  // Global Branding
  hospitalName: {
    type: String,
    default: 'CMC Holding'
  },
  primaryColor: {
    type: String,
    default: '#b59662'
  },
  allowPublicRegistration: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
