const mongoose = require('mongoose');

const deviationSchema = new mongoose.Schema({
  deviationId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Clinical', 'Operational', 'Facility', 'Safety', 'Other'], default: 'Clinical' },
  severity: { type: String, enum: ['Minor', 'Major', 'Critical'], default: 'Minor' },
  immediateAction: String,
  status: { type: String, enum: ['Logged', 'Under Investigation', 'CAPA Linked', 'Closed'], default: 'Logged' },
  identifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Deviation', deviationSchema);
