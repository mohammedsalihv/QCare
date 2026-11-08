const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  moduleKey: { type: String, index: true },
  source: String,
  requestId: { type: String, index: true },
  actorName: String,
  actorEmployeeId: String,
  actorRole: String,
  method: String,
  path: String,
  outcome: String,
  statusCode: Number,
  durationMs: Number,
  recordId: String,
  userAgent: String,
  browser: String,
  operatingSystem: String,
  deviceType: String,
  ipSource: String,
  peerIpAddress: String,
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true
  },
  pageName: {
    type: String
  },
  activity: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

auditLogSchema.index({ moduleKey: 1, timestamp: -1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);
