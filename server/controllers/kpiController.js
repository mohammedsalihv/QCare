const KPIIndicator = require('../models/KPIIndicator');
const AuditLog = require('../models/AuditLog');
const ExcelJS = require('exceljs');
const KPISelectionCriteria = require('../models/KPISelectionCriteria');
const KPIIndicatorType = require('../models/KPIIndicatorType');
const KPINotificationRule = require('../models/KPINotificationRule');
const { verifyPreview, ruleDigest, validateRule } = require('../utils/indicatorImport');
const { getPreset } = require('../utils/waitingTime');

const definitionFields = ['indicatorCode', 'indicatorName', 'indicatorName_ar', 'category', 'mainCategory', 'subCategory', 'owner', 'reportingFrequency', 'description', 'rationale', 'criteria', 'numeratorDesc', 'denominatorDesc', 'sampleSize', 'unit', 'target', 'dataSource', 'exclusions', 'reportingPeriod', 'reportingYear'];
function definitionPayload(body) {
  const payload = Object.fromEntries(definitionFields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
  if (body.calculationRule) {
    const { multiplier = 100, targetDirection = 'higher', warningTolerance = 10 } = body.calculationRule;
    if (![1, 100, 1000, 10000].includes(multiplier) || !['higher', 'lower'].includes(targetDirection) || !Number.isFinite(warningTolerance) || warningTolerance < 0) throw new Error('Choose a valid calculation, target direction and non-negative warning tolerance.');
    payload.calculationRule = { multiplier, targetDirection, warningTolerance };
  }
  if (payload.target !== undefined && (payload.target === null || String(payload.target).trim() === '' || !Number.isFinite(Number(payload.target)) || Number(payload.target) < 0)) throw new Error('Enter a non-negative target.');
  if (payload.reportingPeriod !== undefined && !['Q1', 'Q2', 'Q3', 'Q4'].includes(payload.reportingPeriod)) throw new Error('Choose a reporting quarter.');
  if (payload.reportingYear !== undefined && (!Number.isInteger(Number(payload.reportingYear)) || Number(payload.reportingYear) < 2000 || Number(payload.reportingYear) > 2100)) throw new Error('Enter a year from 2000 to 2100.');
  return payload;
}

// @desc    Create new indicator
// @route   POST /api/kpi
// @access  Private (QualityManager/SuperAdmin)
exports.createIndicator = async (req, res) => {
  try {
    if (getPreset(req.body.indicatorCode) || req.body.importRule?.preset) return res.status(400).json({ message: 'Add DOH waiting-time indicators using the guidance catalog in the indicator workspace.' });
    const payload = definitionPayload(req.body);
    if (await KPIIndicator.findOne({ indicatorCode: payload.indicatorCode })) return res.status(409).json({ message: 'This indicator code already exists. Enter period results from the data-entry screen, or use a new code.' });
    const kpi = new KPIIndicator({
      ...payload,
      validationStatus: 'Draft',
      numerator: 0,
      denominator: 0,
      createdBy: req.user._id
    });
    const savedKpi = await kpi.save();
    res.status(201).json(savedKpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all indicators with filters
// @route   GET /api/kpi
// @access  Private
exports.getIndicators = async (req, res) => {
  try {
    const { period, year, status, category, validationStatus } = req.query;
    let query = {};

    if (period) query.reportingPeriod = period;
    if (year) query.reportingYear = parseInt(year);
    if (status) query.status = status;
    if (category) query.category = category;
    if (validationStatus) query.validationStatus = validationStatus;

    const kpis = await KPIIndicator.find(query)
      .populate('createdBy', 'employeeName')
      .populate('validatedBy', 'employeeName')
      .populate('approvedBy', 'employeeName')
      .sort({ createdAt: -1 });
    res.json(kpis.map(kpi => ({ ...kpi.toObject(), waitingTimePreset: getPreset(kpi.importRule?.preset || kpi.calculationRule?.preset) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard aggregates
// @route   GET /api/kpi/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const { period, year } = req.query;
    let query = {};
    if (period) query.reportingPeriod = period;
    if (year) query.reportingYear = parseInt(year);

    // Default to approved KPIs for analytics dashboard to maintain credibility
    if (req.query.all !== 'true') {
      query.validationStatus = 'Approved';
    }

    const kpis = await KPIIndicator.find(query);

    const total = kpis.length;
    const onTrack = kpis.filter(k => k.status === 'on-track').length;
    const atRisk = kpis.filter(k => k.status === 'at-risk').length;
    const breached = kpis.filter(k => k.status === 'breached').length;

    const assessed = kpis.filter(k => k.target !== null && k.target > 0 && k.calculatedValue !== null);
    const avgAchievement = assessed.length > 0
      ? (assessed.reduce((acc, k) => acc + (k.calculationRule?.targetDirection === 'lower' ? (k.calculatedValue === 0 ? 100 : Math.min(100, k.target / k.calculatedValue * 100)) : k.calculatedValue / k.target * 100), 0) / assessed.length).toFixed(2)
      : 0;

    // Quarterly trend (last 4 quarters)
    const trend = await KPIIndicator.aggregate([
      { $match: { validationStatus: 'Approved', unit: '%', target: { $ne: null }, calculatedValue: { $ne: null } } },
      { $group: {
        _id: { year: "$reportingYear", period: "$reportingPeriod" },
        avgValue: { $avg: "$calculatedValue" },
        avgTarget: { $avg: "$target" }
      }},
      { $sort: { "_id.year": -1, "_id.period": -1 } },
      { $limit: 4 }
    ]);

    const topBreached = kpis
      .filter(k => k.status === 'breached')
      .sort((a, b) => a.variance - b.variance) // Most negative variance first
      .slice(0, 3);

    res.json({
      stats: { total, onTrack, atRisk, breached, avgAchievement },
      trend: trend.reverse(),
      topBreached
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single indicator
// @route   GET /api/kpi/:id
// @access  Private
exports.getIndicatorById = async (req, res) => {
  try {
    const kpi = await KPIIndicator.findById(req.params.id)
      .populate('createdBy', 'employeeName')
      .populate('validatedBy', 'employeeName')
      .populate('approvedBy', 'employeeName');
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    res.json(kpi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update indicator
// @route   PUT /api/kpi/:id
// @access  Private (QualityManager/SuperAdmin)
exports.updateIndicator = async (req, res) => {
  try {
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    if (kpi.importRule?.preset || kpi.calculationRule?.preset || getPreset(req.body.indicatorCode) || req.body.importRule?.preset) return res.status(400).json({ message: 'Waiting-time definitions are version controlled. Submit corrections through the source upload workflow.' });
    if (kpi.submittedToDOH || kpi.validationStatus !== 'Draft' || kpi.submittedBy) return res.status(409).json({ message: 'Reported values and definitions are locked. Use the submission workflow for corrections.' });
    Object.assign(kpi, definitionPayload(req.body));
    kpi.updatedBy = req.user._id;
    const updatedKpi = await kpi.save();
    res.json(updatedKpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit data values for validation
// @route   POST /api/kpi/submit-data
// @access  Private (all authenticated staff; review remains restricted)
exports.submitData = async (req, res) => {
  try {
    const { indicatorCode, reportingPeriod, reportingYear, importToken } = req.body;
    let { numerator, denominator } = req.body;
    let imported;
    if (importToken) {
      try { imported = verifyPreview(importToken); }
      catch { return res.status(400).json({ message: 'The import preview expired or is invalid. Analyze the file again.' }); }
      if (imported.userId !== String(req.user._id) || imported.indicatorCode !== indicatorCode || imported.reportingPeriod !== reportingPeriod || imported.reportingYear !== Number(reportingYear)) {
        return res.status(400).json({ message: 'This preview belongs to another user, indicator or period. Analyze the file again.' });
      }
      numerator = imported.summary.numerator;
      denominator = imported.summary.denominator;
    }
    if (typeof indicatorCode !== 'string' || !indicatorCode.trim() ||
        !['Q1', 'Q2', 'Q3', 'Q4'].includes(reportingPeriod) ||
        !Number.isInteger(Number(reportingYear)) || Number(reportingYear) < 2000 || Number(reportingYear) > 2100 ||
        !['number', 'string'].includes(typeof numerator) || String(numerator).trim() === '' ||
        !['number', 'string'].includes(typeof denominator) || String(denominator).trim() === '' ||
        !Number.isFinite(Number(numerator)) || Number(numerator) < 0 ||
        !Number.isFinite(Number(denominator)) || Number(denominator) <= 0) {
      return res.status(400).json({ message: 'Choose an indicator and quarter, enter a valid year, a non-negative numerator and a denominator greater than zero.' });
    }
    
    // Find the definition (Draft or original document) to clone details
    const definition = await KPIIndicator.findOne({ indicatorCode }).sort({ createdAt: 1 });
    if (!definition) {
      return res.status(404).json({ message: 'KPI definition not found' });
    }
    if (imported && imported.ruleDigest !== ruleDigest(definition)) {
      return res.status(409).json({ message: 'The indicator rule or target changed. Analyze the file again.' });
    }
    if (definition.importRule?.preset && (!imported || !imported.summary.canSubmit)) return res.status(400).json({ message: 'Waiting-time indicators require a validated source-data upload.' });
    const calculationRule = definition.importRule?.preset || definition.importRule?.outcomeColumn || definition.importRule?.numeratorColumn ? validateRule(definition.importRule) : definition.calculationRule;

    // Check if there is already a record for this period
    let record = await KPIIndicator.findOne({ indicatorCode, reportingPeriod, reportingYear });
    
    if (record) {
      if (record.submittedToDOH || ['Approved', 'Pending Approval'].includes(record.validationStatus)) {
        return res.status(409).json({ message: 'This report is already under approval or finalized. Contact the quality team for a correction.' });
      }
      const canManage = ['admin', 'superadmin', 'qualitymanager'].includes(req.user.role?.toLowerCase());
      const submitter = record.submittedBy || (record.validationStatus === 'Pending Validation' ? record.createdBy : null);
      if (!canManage && submitter && String(submitter) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Another user has submitted this indicator for this period. Contact the quality team to correct it.' });
      }
      record.numerator = parseFloat(numerator);
      record.denominator = parseFloat(denominator);
      record.validationStatus = 'Pending Validation';
      record.updatedBy = req.user._id;
      record.calculationRule = calculationRule;
      record.target = definition.target;
      record.importSummary = imported ? { ...imported.summary, importedAt: new Date() } : undefined;
      record.submittedBy = req.user._id;
      record.rejectionReason = undefined;
      const saved = await record.save();
      return res.json(saved);
    } else {
      const newSub = new KPIIndicator({
        indicatorCode: definition.indicatorCode,
        indicatorName: definition.indicatorName,
        indicatorName_ar: definition.indicatorName_ar,
        category: definition.category,
        mainCategory: definition.mainCategory,
        subCategory: definition.subCategory,
        owner: definition.owner,
        reportingFrequency: definition.reportingFrequency,
        description: definition.description,
        rationale: definition.rationale,
        criteria: definition.criteria,
        numeratorDesc: definition.numeratorDesc,
        denominatorDesc: definition.denominatorDesc,
        sampleSize: definition.sampleSize,
        dataSource: definition.dataSource,
        exclusions: definition.exclusions,
        unit: definition.unit,
        target: definition.target,
        reportingPeriod,
        reportingYear: parseInt(reportingYear),
        numerator: parseFloat(numerator),
        denominator: parseFloat(denominator),
        validationStatus: 'Pending Validation',
        calculationRule,
        importSummary: imported ? { ...imported.summary, importedAt: new Date() } : undefined,
        submittedBy: req.user._id,
        createdBy: req.user._id
      });
      const saved = await newSub.save();
      return res.status(201).json(saved);
    }
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A report already exists for this period. Refresh before submitting again.' });
    res.status(400).json({ message: error.message });
  }
};

// @desc    Validate incoming indicator report
// @route   POST /api/kpi/:id/validate
// @access  Private (QualityManager/SuperAdmin)
exports.validateIndicator = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    if (kpi.validationStatus !== 'Pending Validation' || kpi.submittedToDOH) {
      return res.status(409).json({ message: 'Only reports awaiting validation can be validated or returned.' });
    }

    if (action === 'approve') {
      kpi.validationStatus = 'Pending Approval';
      kpi.validatedBy = req.user._id;
      kpi.validatedDate = new Date();
      kpi.rejectionReason = undefined;
    } else if (action === 'reject') {
      if (typeof rejectionReason !== 'string' || !rejectionReason.trim()) return res.status(400).json({ message: 'Explain what needs correcting before returning the report.' });
      kpi.validationStatus = 'Draft';
      kpi.rejectionReason = rejectionReason || 'Validation rejected by Quality team';
    } else {
      return res.status(400).json({ message: 'Invalid validation action' });
    }

    const updated = await kpi.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve/Sign-off and publish KPI report
// @route   POST /api/kpi/:id/approve
// @access  Private (QualityManager/SuperAdmin)
exports.approveIndicator = async (req, res) => {
  try {
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    if (kpi.validationStatus !== 'Pending Approval' || kpi.submittedToDOH) {
      return res.status(409).json({ message: 'Validate the report before approving it.' });
    }

    kpi.validationStatus = 'Approved';
    kpi.approvedBy = req.user._id;
    kpi.approvedDate = new Date();
    kpi.rejectionReason = undefined;

    const updated = await kpi.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit to DOH
// @route   POST /api/kpi/:id/submit
// @access  Private (QualityManager/SuperAdmin)
exports.submitToDOH = async (req, res) => {
  try {
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    if (kpi.validationStatus !== 'Approved' || kpi.submittedToDOH) return res.status(409).json({ message: 'Only approved reports that have not been marked submitted can be recorded as submitted.' });
    kpi.submittedToDOH = true;
    kpi.submissionDate = new Date();
    await kpi.save();

    await AuditLog.create({
      action: 'SUBMIT_TO_DOH',
      module: 'KPI',
      details: { indicatorCode: kpi.indicatorCode, indicatorName: kpi.indicatorName },
      performedBy: req.user._id
    });

    res.json({ message: 'External submission recorded. No data was transmitted to DOH by this application.', kpi });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Selection Criteria Submaster CRUD
exports.getCriteria = async (req, res) => {
  try {
    const list = await KPISelectionCriteria.find().sort({ criteria: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCriteria = async (req, res) => {
  try {
    const item = new KPISelectionCriteria({
      criteria: req.body.criteria,
      addedBy: req.user.employeeName || 'Super Admin',
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    });
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCriteria = async (req, res) => {
  try {
    const item = await KPISelectionCriteria.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Criteria not found' });
    await item.deleteOne();
    res.json({ message: 'Criteria deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Indicator Types Submaster CRUD
exports.getTypes = async (req, res) => {
  try {
    const list = await KPIIndicatorType.find().sort({ type: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createType = async (req, res) => {
  try {
    const item = new KPIIndicatorType({
      type: req.body.type,
      addedBy: req.user.employeeName || 'Super Admin',
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    });
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteType = async (req, res) => {
  try {
    const item = await KPIIndicatorType.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Indicator Type not found' });
    await item.deleteOne();
    res.json({ message: 'Indicator Type deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Notification Rules CRUD
exports.getNotificationRules = async (req, res) => {
  try {
    const list = await KPINotificationRule.find().populate('addedBy', 'employeeName').sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNotificationRule = async (req, res) => {
  try {
    const item = new KPINotificationRule({
      trigger: req.body.trigger,
      sendTo: req.body.sendTo,
      template: req.body.template,
      ccQualityDirector: req.body.ccQualityDirector !== false,
      addedBy: req.user._id
    });
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteNotificationRule = async (req, res) => {
  try {
    const item = await KPINotificationRule.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Notification rule not found' });
    await item.deleteOne();
    res.json({ message: 'Notification rule deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export to Excel
// @route   GET /api/kpi/export/excel
// @access  Private
exports.exportToExcel = async (req, res) => {
  try {
    const { period, year } = req.query;
    const query = {};
    if (period) query.reportingPeriod = period;
    if (year) query.reportingYear = parseInt(year);

    const kpis = await KPIIndicator.find(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KPI Report');

    worksheet.columns = [
      { header: 'Code', key: 'indicatorCode', width: 15 },
      { header: 'Name', key: 'indicatorName', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Period', key: 'reportingPeriod', width: 10 },
      { header: 'Year', key: 'reportingYear', width: 10 },
      { header: 'Numerator', key: 'numerator', width: 15 },
      { header: 'Denominator', key: 'denominator', width: 15 },
      { header: 'Actual', key: 'calculatedValue', width: 15 },
      { header: 'Unit', key: 'unit', width: 12 },
      { header: 'Target', key: 'target', width: 15 },
      { header: 'Mean wait', key: 'waitMean', width: 15 },
      { header: 'Median wait', key: 'waitMedian', width: 15 },
      { header: 'Minimum wait', key: 'waitMin', width: 15 },
      { header: 'Maximum wait', key: 'waitMax', width: 15 },
      { header: 'Wait unit', key: 'waitUnit', width: 12 },
      { header: 'Variance', key: 'variance', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Review status', key: 'validationStatus', width: 22 },
      { header: 'Owner', key: 'owner', width: 24 },
      { header: 'Open actions', key: 'openActions', width: 15 },
      { header: 'Submitted', key: 'submittedToDOH', width: 15 }
    ];

    kpis.forEach(kpi => {
      worksheet.addRow({
        indicatorCode: kpi.indicatorCode,
        indicatorName: kpi.indicatorName,
        category: kpi.category,
        reportingPeriod: kpi.reportingPeriod,
        reportingYear: kpi.reportingYear,
        numerator: kpi.numerator,
        denominator: kpi.denominator,
        calculatedValue: kpi.calculatedValue,
        unit: kpi.unit,
        waitMean: kpi.importSummary?.waitingStatistics?.mean,
        waitMedian: kpi.importSummary?.waitingStatistics?.median,
        waitMin: kpi.importSummary?.waitingStatistics?.min,
        waitMax: kpi.importSummary?.waitingStatistics?.max,
        waitUnit: kpi.importSummary?.waitingStatistics?.unit,
        target: kpi.target,
        variance: kpi.variance,
        status: kpi.status,
        validationStatus: kpi.validationStatus,
        owner: kpi.owner,
        openActions: (kpi.improvementActions || []).filter(action => action.status !== 'Completed').length,
        submittedToDOH: kpi.submittedToDOH ? 'Yes' : 'No'
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `KPI_Report_${period || 'All'}_${year || 'All'}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Improvement actions belong to a period report; only the quality team can change them.
exports.saveImprovementAction = async (req, res) => {
  try {
    const { title, owner, dueDate, status = 'Open', notes = '' } = req.body;
    const parsedDate = typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? new Date(dueDate + 'T00:00:00Z') : null;
    if (typeof title !== 'string' || !title.trim() || title.length > 300 || typeof owner !== 'string' || !owner.trim() || owner.length > 150 || !parsedDate || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dueDate || !['Open', 'In progress', 'Completed'].includes(status) || typeof notes !== 'string' || notes.length > 3000) return res.status(400).json({ message: 'Enter an action, responsible owner, valid due date and status.' });
    if (status === 'Completed' && !notes.trim()) return res.status(400).json({ message: 'Add the outcome or evidence before completing an action.' });
    const report = await KPIIndicator.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'KPI report not found' });
    const values = { title: title.trim(), owner: owner.trim(), dueDate, status, notes: notes.trim(), updatedBy: req.user._id, updatedAt: new Date() };
    if (req.params.actionId) {
      const action = report.improvementActions.id(req.params.actionId);
      if (!action) return res.status(404).json({ message: 'Action not found' });
      Object.assign(action, values, { completedAt: status === 'Completed' ? action.completedAt || new Date() : undefined });
    } else {
      report.improvementActions.push({ ...values, createdBy: req.user._id, completedAt: status === 'Completed' ? new Date() : undefined });
    }
    // Measurement hooks skip action-only updates.
    await report.save({ validateModifiedOnly: true });
    res.status(req.params.actionId ? 200 : 201).json(report);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
