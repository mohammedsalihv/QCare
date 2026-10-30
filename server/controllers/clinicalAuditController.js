const ClinicalAudit = require('../models/ClinicalAudit');
const AuditTemplate = require('../models/AuditTemplate');
const clinicalAuditReport = require('../utils/clinicalAuditReport');

// --- Templates ---

exports.getTemplates = async (req, res) => {
  try {
    const templates = await AuditTemplate.find({ isActive: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Audits ---

exports.getAudits = async (req, res) => {
  try {
    const { department, status, pillar } = req.query;
    let query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (req.query.scope === 'calendar') query.status = { $in: ['scheduled', 'in-progress', 'pending-review', 'completed', 'overdue'] };
    if (pillar) query.governancePillar = pillar;

    const audits = await ClinicalAudit.find(query)
      .populate('auditor', 'employeeName employeeId')
      .populate('templateId', 'templateName criteria')
      .populate('improvementActions.owner', 'employeeName')
      .populate('location', 'name code')
      .populate('concernedDepartments', 'name')
      .populate('concernedPersons', 'employeeName employeeId')
      .sort({ scheduledDate: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuditById = async (req, res) => {
  try {
    const audit = await ClinicalAudit.findById(req.params.id)
      .populate('auditor', 'employeeName')
      .populate('templateId')
      .populate('location', 'name code')
      .populate('concernedDepartments', 'name')
      .populate('concernedPersons', 'employeeName employeeId')
      .populate('improvementActions.owner', 'employeeName email');
    if (!audit) return res.status(404).json({ message: 'Audit not found' });
    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const overdue = await ClinicalAudit.find({ status: { $in: ['scheduled', 'in-progress', 'overdue'] }, $or: [
      { scheduledUntil: { $lt: now } },
      { scheduledUntil: null, scheduledDate: { $lt: now } }
    ] });
    const counts = await ClinicalAudit.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Avg score by pillar (last 12 months)
    const pillarStats = await ClinicalAudit.aggregate([
      { $match: { status: 'completed', overallScore: { $ne: null }, createdAt: { $gt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: "$governancePillar", avgScore: { $avg: "$overallScore" } } }
    ]);

    res.json({ counts, overdue, pillarStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generatePDFReport = async (req, res) => {
  try {
    const audit = await ClinicalAudit.findById(req.params.id)
      .populate('auditor', 'employeeName').populate('templateId')
      .populate('location', 'name code').populate('concernedDepartments', 'name')
      .populate('concernedPersons', 'employeeName').populate('improvementActions.owner', 'employeeName')
      .populate('improvementActions.verifiedBy', 'employeeName').populate('submittedBy', 'employeeName')
      .populate('reviewedBy', 'employeeName').populate('history.actor', 'employeeName');
    if (!audit) return res.status(404).json({ message: 'Audit not found' });
    const pdf = await clinicalAuditReport(audit);
    const filename = clinicalAuditReport.filename(audit);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(pdf);
  } catch (error) {
    res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.name === 'CastError' ? 'Invalid audit ID.' : 'Unable to generate the audit report. Please try again.' });
  }
};
