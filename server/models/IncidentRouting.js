const mongoose = require('mongoose');
const person = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
const schema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'default' },
  fallback: person,
  departments: [{ department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, keywords: [String] }],
  updatedBy: person,
}, { timestamps: true, optimisticConcurrency: true });
module.exports = mongoose.model('IncidentRouting', schema);
