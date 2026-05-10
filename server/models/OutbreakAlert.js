const mongoose = require('mongoose');

const outbreakAlertSchema = new mongoose.Schema({
  alertRef: { type: String, unique: true },
  alertDate: { type: Date, default: Date.now },
  infectionType: { type: String, required: true },
  suspectedSource: String,
  affectedWard: { type: String, required: true },
  initialCaseCount: { type: Number, default: 1 },
  currentCaseCount: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['suspected', 'confirmed', 'contained', 'closed'],
    default: 'suspected'
  },
  notifiedToDOH: { type: Boolean, default: false },
  notificationDate: Date,
  investigationTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timeline: [{
    date: { type: Date, default: Date.now },
    event: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  containmentMeasures: [String],
  closureDate: Date,
  closureSummary: String,
  linkedIncidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Incident' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

outbreakAlertSchema.pre('save', async function(next) {
  if (!this.alertRef) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      }
    });
    this.alertRef = `OB-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OutbreakAlert', outbreakAlertSchema);
