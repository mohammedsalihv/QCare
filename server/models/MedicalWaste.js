const mongoose = require('mongoose');

const medicalWasteSchema = new mongoose.Schema({
  wasteRef: { type: String, unique: true },
  wasteDate: { type: Date, default: Date.now },
  shift: String,
  ward: { type: String, required: true },
  wasteType: {
    type: String,
    enum: ['sharps', 'pharmaceutical', 'cytotoxic', 'chemical', 'infectious', 'pathological', 'radioactive', 'general-clinical'],
    required: true
  },
  quantityKg: { type: Number, required: true },
  containerType: String,
  disposalMethod: String,
  disposalVendor: String,
  vendorLicenseNumber: String,
  manifestNumber: { type: String, unique: true },
  collectionDateTime: Date,
  disposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  witnessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  DOHCompliant: { type: Boolean, default: true },
  complianceNotes: String,
  attachments: [String]
}, {
  timestamps: true
});

medicalWasteSchema.pre('save', async function(next) {
  if (!this.wasteRef) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      }
    });
    this.wasteRef = `WASTE-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
  if (!this.manifestNumber) {
    this.manifestNumber = `MAN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('MedicalWaste', medicalWasteSchema);
