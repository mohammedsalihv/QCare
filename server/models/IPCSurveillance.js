const mongoose = require('mongoose');

const ipcSurveillanceSchema = new mongoose.Schema({
  reportingMonth: { type: Number, min: 1, max: 12, required: true },
  reportingYear: { type: Number, required: true },
  infectionType: {
    type: String,
    enum: ['HAI', 'SSI', 'CAUTI', 'CLABSI', 'VAP', 'CDiff', 'MRSA', 'VRE', 'COVID', 'Other'],
    required: true
  },
  ward: { type: String, required: true },
  casesCount: { type: Number, default: 0 },
  patientDays: { type: Number, required: true },
  rate: { type: Number },
  nationalBenchmark: { type: Number },
  varianceFromBenchmark: { type: Number },
  trend: {
    type: String,
    enum: ['improving', 'stable', 'worsening']
  },
  investigationRequired: { type: Boolean, default: false },
  investigationSummary: String,
  notifiedToIPCCommittee: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

ipcSurveillanceSchema.pre('save', function(next) {
  if (this.casesCount !== undefined && this.patientDays > 0) {
    this.rate = parseFloat(((this.casesCount / this.patientDays) * 1000).toFixed(3));
    if (this.nationalBenchmark) {
      this.varianceFromBenchmark = parseFloat((this.rate - this.nationalBenchmark).toFixed(3));
    }
  }
  next();
});

module.exports = mongoose.model('IPCSurveillance', ipcSurveillanceSchema);
