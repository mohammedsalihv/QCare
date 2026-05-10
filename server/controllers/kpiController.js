const KPIIndicator = require('../models/KPIIndicator');
const AuditLog = require('../models/AuditLog');
const ExcelJS = require('exceljs');

// @desc    Create new indicator
// @route   POST /api/kpi
// @access  Private (QualityManager only)
exports.createIndicator = async (req, res) => {
  try {
    const kpi = new KPIIndicator({
      ...req.body,
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
    const { period, year, status, category } = req.query;
    let query = {};

    if (period) query.reportingPeriod = period;
    if (year) query.reportingYear = parseInt(year);
    if (status) query.status = status;
    if (category) query.category = category;

    const kpis = await KPIIndicator.find(query)
      .populate('createdBy', 'employeeName')
      .sort({ createdAt: -1 });
    res.json(kpis);
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

    const kpis = await KPIIndicator.find(query);

    const total = kpis.length;
    const onTrack = kpis.filter(k => k.status === 'on-track').length;
    const atRisk = kpis.filter(k => k.status === 'at-risk').length;
    const breached = kpis.filter(k => k.status === 'breached').length;

    const avgAchievement = total > 0 
      ? (kpis.reduce((acc, k) => acc + (k.calculatedValue / k.target * 100), 0) / total).toFixed(2)
      : 0;

    // Quarterly trend (last 4 quarters)
    // For simplicity, we aggregate by reportingPeriod and reportingYear
    const trend = await KPIIndicator.aggregate([
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
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    res.json(kpi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update indicator
// @route   PUT /api/kpi/:id
// @access  Private (QualityManager only)
exports.updateIndicator = async (req, res) => {
  try {
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    Object.assign(kpi, req.body);
    kpi.updatedBy = req.user._id;
    const updatedKpi = await kpi.save();
    res.json(updatedKpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit to DOH
// @route   POST /api/kpi/:id/submit
// @access  Private (QualityManager only)
exports.submitToDOH = async (req, res) => {
  try {
    const kpi = await KPIIndicator.findById(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });

    kpi.submittedToDOH = true;
    kpi.submissionDate = new Date();
    await kpi.save();

    // Log to AuditLog
    await AuditLog.create({
      action: 'SUBMIT_TO_DOH',
      module: 'KPI',
      details: { indicatorCode: kpi.indicatorCode, indicatorName: kpi.indicatorName },
      performedBy: req.user._id
    });

    res.json({ message: 'Submitted to DOH successfully', kpi });
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
      { header: 'Actual %', key: 'calculatedValue', width: 15 },
      { header: 'Target %', key: 'target', width: 15 },
      { header: 'Variance', key: 'variance', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
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
        target: kpi.target,
        variance: kpi.variance,
        status: kpi.status,
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