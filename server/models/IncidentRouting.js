const mongoose = require('mongoose');
const person = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
const schema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'default' },
  fallback: person,
  departments: [{ department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, owner: person, keywords: [String] }],
  branches: [{ branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }, owner: person }],
  updatedBy: person,
}, { timestamps: true, optimisticConcurrency: true });
module.exports = mongoose.model('IncidentRouting', schema);
