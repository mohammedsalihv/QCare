const MedicationError = require('../models/MedicationError');
const HighAlertMedication = require('../models/HighAlertMedication');
const MedicalWaste = require('../models/MedicalWaste');
const MedicationAudit = require('../models/MedicationAudit');
const Incident = require('../models/Incident');
const PDFDocument = require('pdfkit');

// --- Medication Errors ---

exports.reportError = async (req, res) => {
  try {
    const error = new MedicationError({ ...req.body, reportedBy: req.user._id });
    await error.save();

    // Auto-create incident prompt logic is frontend, but let's handle auto-link if requested
    if (['moderate', 'serious', 'catastrophic'].includes(error.harmLevel)) {
      const incident = new Incident({
        title: `Medication Error: ${error.medicationName} (${error.errorType})`,
        description: `Medication Error Reference: ${error.errorRef}. Harm Level: ${error.harmLevel}. Summary: ${error.immediateActionTaken}`,
        category: 'Medication',
        severity: error.harmLevel === 'catastrophic' ? 'Critical' : 'High',
        status: 'Reported',
        reportedBy: req.user._id,
        dateOfIncident: error.errorDate
      });
      await incident.save();
      error.linkedIncidentId = incident._id;
      error.reportedToIncidentSystem = true;
      await error.save();
    }

    res.status(201).json(error);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getErrors = async (req, res) => {
  try {
    const { type, harmLevel, status } = req.query;
    let query = {};
    if (type) query.errorType = type;
    if (harmLevel) query.harmLevel = harmLevel;
    if (status) query.status = status;

    const errors = await MedicationError.find(query)
      .populate('reportedBy', 'employeeName')
      .sort({ createdAt: -1 });
    res.json(errors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviewError = async (req, res) => {
  try {
    const error = await MedicationError.findByIdAndUpdate(req.params.id, {
      ...req.body,
      status: 'closed',
      reviewedBy: req.user._id
    }, { new: true });
    res.json(error);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getErrorDashboard = async (req, res) => {
  try {
    const types = await MedicationError.aggregate([
      { $group: { _id: "$errorType", count: { $sum: 1 } } }
    ]);
    const harmLevels = await MedicationError.aggregate([
      { $group: { _id: "$harmLevel", count: { $sum: 1 } } }
    ]);
    const recent = await MedicationError.find().limit(5).sort({ createdAt: -1 });
    
    res.json({ types, harmLevels, recent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- High Alert Medications ---

exports.getHighAlertMeds = async (req, res) => {
  try {
    const meds = await HighAlertMedication.find({ isActive: true });
    res.json(meds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addHighAlertMed = async (req, res) => {
  try {
    const med = new HighAlertMedication({ ...req.body, addedBy: req.user._id });
    await med.save();
    res.status(201).json(med);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Medical Waste ---

exports.logWaste = async (req, res) => {
  try {
    const waste = new MedicalWaste({ ...req.body, disposedBy: req.user._id });
    await waste.save();
    res.status(201).json(waste);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getWasteLogs = async (req, res) => {
  try {
    const logs = await MedicalWaste.find()
      .populate('disposedBy', 'employeeName')
      .populate('witnessedBy', 'employeeName')
      .sort({ wasteDate: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWasteSummary = async (req, res) => {
  try {
    const summary = await MedicalWaste.aggregate([
      { 
        $group: { 
          _id: "$wasteType", 
          totalKg: { $sum: "$quantityKg" },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateWasteManifestPDF = async (req, res) => {
  try {
    const waste = await MedicalWaste.findById(req.params.id)
      .populate('disposedBy', 'employeeName')
      .populate('witnessedBy', 'employeeName');
    
    if (!waste) return res.status(404).json({ message: 'Waste record not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Manifest_${waste.wasteRef}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MEDICAL WASTE DISPOSAL MANIFEST', { align: 'center' });
    doc.fontSize(10).text('DOH Abu Dhabi Compliance Standard 2025', { align: 'center' });
    doc.moveDown();

    doc.rect(50, doc.y, 500, 100).stroke();
    doc.fontSize(12).text(`Manifest No: ${waste.manifestNumber}`, 60, doc.y + 10);
    doc.text(`Waste Reference: ${waste.wasteRef}`, 60);
    doc.text(`Date of Collection: ${new Date(waste.wasteDate).toLocaleDateString()}`, 60);
    doc.text(`Facility: QCare Clinic Abu Dhabi`, 60);
    doc.moveDown(5);

    // Details
    doc.fontSize(14).text('Waste Description', { underline: true });
    doc.fontSize(12).text(`Type: ${waste.wasteType.toUpperCase()}`);
    doc.text(`Quantity: ${waste.quantityKg} KG`);
    doc.text(`Container: ${waste.containerType}`);
    doc.text(`Ward/Department: ${waste.ward}`);
    doc.moveDown();

    // Vendor info
    doc.fontSize(14).text('Disposal Vendor Information', { underline: true });
    doc.fontSize(12).text(`Vendor: ${waste.disposalVendor}`);
    doc.text(`License: ${waste.vendorLicenseNumber}`);
    doc.moveDown();

    // Compliance
    doc.rect(50, doc.y, 500, 50).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#000').text('DOH COMPLIANCE STATEMENT:', 60, doc.y + 10);
    doc.fontSize(10).text('The facility confirms that this waste has been segregated and packaged in accordance with DOH Standard 2025.', 60);
    doc.moveDown(4);

    // Signatures
    doc.fontSize(12).text('Signatures:', { underline: true });
    doc.moveDown();
    doc.text('_______________________          _______________________', { align: 'center' });
    doc.fontSize(8).text(`Disposed By: ${waste.disposedBy?.employeeName}          Witnessed By: ${waste.witnessedBy?.employeeName}`, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Audits ---

exports.submitAudit = async (req, res) => {
  try {
    const audit = new MedicationAudit({ ...req.body, auditedBy: req.user._id });
    await audit.save();
    res.status(201).json(audit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAuditTrend = async (req, res) => {
  try {
    const trend = await MedicationAudit.aggregate([
      { 
        $group: { 
          _id: { month: { $month: "$auditDate" }, type: "$auditType" },
          avgCompliance: { $avg: "$overallCompliance" }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
