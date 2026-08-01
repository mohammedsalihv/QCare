const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Medical Equipment', 'Consumables', 'Pharmaceuticals', 'IT & Software', 'Facilities'], required: true },
  contactPerson: String,
  email: String,
  phone: String,
  rating: { type: Number, min: 1, max: 5, default: 4 },
  status: { type: String, enum: ['Approved', 'Under Evaluation', 'Blacklisted'], default: 'Under Evaluation' },
  lastAuditDate: Date,
  nextAuditDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
