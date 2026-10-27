const ClinicalAudit = require('../models/ClinicalAudit');
const AuditTemplate = require('../models/AuditTemplate');
const PDFDocument = require('pdfkit');

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
    const audit = await ClinicalAudit.findById(req.params.id).populate('auditor').populate('templateId').populate('location', 'name').populate('concernedDepartments', 'name').populate('concernedPersons', 'employeeName');
    if (!audit) return res.status(404).json({ message: 'Audit not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AuditReport_${audit._id}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('CLINICAL AUDIT REPORT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Title: ${audit.auditTitle}`);
    doc.text(`Location: ${audit.location?.name || 'Not specified (legacy audit)'}`);
    doc.text(`Concerned departments: ${audit.concernedDepartments?.map(d => d.name).join(', ') || audit.department || 'Not specified'}`);
    doc.text(`Concerned persons: ${audit.concernedPersons?.map(p => p.employeeName).join(', ') || 'Not specified'}`);
    doc.text(`Auditor: ${audit.auditorName || audit.auditor?.employeeName || 'Not specified'}`);
    if (audit.sessions?.length) {
      doc.text('Audit sessions (Asia/Dubai):');
      for (const session of audit.sessions) {
        const format = date => new Date(date).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' });
        doc.text(`${format(session.startAt)} - ${format(session.endAt)}`);
      }
    }
    doc.text(`Standard: ${audit.standard}`);
    doc.text(`Status: ${audit.status}`);
    doc.text(`Overall Score: ${audit.overallScore == null ? 'N/A' : `${audit.overallScore}%`}`);
    doc.text(`Assessment coverage: ${audit.coverage ?? 0}%`);
    doc.text(`Review comment: ${audit.reviewComment || 'None'}`);
    doc.moveDown();

    doc.text('Findings Summary:', { underline: true });
    audit.findings.forEach((f, index) => {
      doc.text(`${index + 1}. Criterion: ${f.criterionId} - Status: ${f.complianceStatus.toUpperCase()}`);
      doc.fontSize(10).text(`Evidence: ${f.evidence || 'N/A'}`, { indent: 20 });
      if (f.exclusionReason) doc.text(`Exclusion reason: ${f.exclusionReason}`, { indent: 20 });
      doc.fontSize(12).moveDown(0.5);
    });

    doc.moveDown();
    doc.text('Improvement Action Plan:', { underline: true });
    audit.improvementActions.forEach((action, index) => {
      doc.text(`${index + 1}. ${action.actionText} (Owner ID: ${action.owner})`);
      doc.fontSize(10).text(`Priority: ${action.priority} | Due: ${new Date(action.dueDate).toLocaleDateString()}`, { indent: 20 });
      doc.fontSize(12).moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
