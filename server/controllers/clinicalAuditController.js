const ClinicalAudit = require('../models/ClinicalAudit');
const AuditTemplate = require('../models/AuditTemplate');
const AuditSchedule = require('../models/AuditSchedule');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');

// --- Templates ---

exports.createTemplate = async (req, res) => {
  try {
    const template = new AuditTemplate({ ...req.body, createdBy: req.user._id });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await AuditTemplate.find({ isActive: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Audits ---

exports.scheduleAudit = async (req, res) => {
  try {
    const audit = new ClinicalAudit(req.body);
    await audit.save();
    res.status(201).json(audit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAudits = async (req, res) => {
  try {
    const { department, status, pillar } = req.query;
    let query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (pillar) query.governancePillar = pillar;

    const audits = await ClinicalAudit.find(query)
      .populate('auditor', 'employeeName employeeId')
      .populate('templateId', 'templateName')
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
      .populate('improvementActions.owner', 'employeeName email');
    if (!audit) return res.status(404).json({ message: 'Audit not found' });
    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startAudit = async (req, res) => {
  try {
    const audit = await ClinicalAudit.findByIdAndUpdate(req.params.id, { 
      status: 'in-progress',
      conductedDate: new Date()
    }, { new: true });
    res.json(audit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFindings = async (req, res) => {
  try {
    const { findings } = req.body;
    const audit = await ClinicalAudit.findById(req.params.id);
    if (!audit) return res.status(404).json({ message: 'Audit not found' });

    // Auto-calculate score
    let totalScore = 0;
    let nonCompliant = 0;
    let partial = 0;
    
    findings.forEach(f => {
      if (f.complianceStatus === 'compliant') totalScore += 100;
      else if (f.complianceStatus === 'partial') {
        totalScore += 50;
        partial++;
      } else {
        nonCompliant++;
      }
    });

    const avgScore = findings.length > 0 ? (totalScore / findings.length).toFixed(2) : 0;

    audit.findings = findings;
    audit.overallScore = avgScore;
    audit.nonCompliantCount = nonCompliant;
    audit.partialCount = partial;
    
    await audit.save();
    res.json(audit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeAudit = async (req, res) => {
  try {
    const audit = await ClinicalAudit.findById(req.params.id);
    if (!audit) return res.status(404).json({ message: 'Audit not found' });

    audit.status = 'completed';
    await audit.save();

    // Trigger notifications for action owners
    if (audit.improvementActions && audit.improvementActions.length > 0) {
      for (const action of audit.improvementActions) {
        await Notification.create({
          type: 'system_alert',
          message: `New improvement action assigned to you from Audit: ${audit.auditTitle}. Due: ${new Date(action.dueDate).toLocaleDateString()}`,
          user: 'Audit System',
          userId: req.user._id,
          recipientId: action.owner,
          actionLink: '/dashboard/audit/actions'
        });
      }
    }

    res.json({ message: 'Audit finalized and notifications sent', audit });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const overdue = await ClinicalAudit.find({ status: 'scheduled', scheduledDate: { $lt: new Date() } });
    const counts = await ClinicalAudit.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Avg score by pillar (last 12 months)
    const pillarStats = await ClinicalAudit.aggregate([
      { $match: { status: 'completed', createdAt: { $gt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: "$governancePillar", avgScore: { $avg: "$overallScore" } } }
    ]);

    res.json({ counts, overdue, pillarStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generatePDFReport = async (req, res) => {
  try {
    const audit = await ClinicalAudit.findById(req.params.id).populate('auditor').populate('templateId');
    if (!audit) return res.status(404).json({ message: 'Audit not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AuditReport_${audit.auditTitle}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('CLINICAL AUDIT REPORT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Title: ${audit.auditTitle}`);
    doc.text(`Department: ${audit.department}`);
    doc.text(`Auditor: ${audit.auditor?.employeeName}`);
    doc.text(`Standard: ${audit.standard}`);
    doc.text(`Overall Score: ${audit.overallScore}%`);
    doc.moveDown();

    doc.text('Findings Summary:', { underline: true });
    audit.findings.forEach((f, index) => {
      doc.text(`${index + 1}. Criterion: ${f.criterionId} - Status: ${f.complianceStatus.toUpperCase()}`);
      doc.fontSize(10).text(`Evidence: ${f.evidence || 'N/A'}`, { indent: 20 });
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
