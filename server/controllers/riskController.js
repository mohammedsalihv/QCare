const Risk = require('../models/Risk');
const ExcelJS = require('exceljs');

exports.createRisk = async (req, res) => {
  try {
    const risk = new Risk({ ...req.body, createdBy: req.user._id });
    await risk.save();
    res.status(201).json(risk);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRisks = async (req, res) => {
  try {
    const { category, level, status, department, owner } = req.query;
    let query = {};
    if (category) query.riskCategory = category;
    if (level) query.riskLevel = level;
    if (status) query.status = status;
    if (department) query.department = department;
    if (owner) query.owner = owner;

    const risks = await Risk.find(query)
      .populate('owner', 'employeeName employeeId')
      .populate('identifiedBy', 'employeeName')
      .sort({ riskScore: -1 });
    res.json(risks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiskById = async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id)
      .populate('owner', 'employeeName employeeId department')
      .populate('identifiedBy', 'employeeName')
      .populate('linkedIncidents', 'incidentId title status')
      .populate('linkedAudits', 'auditTitle status overallScore')
      .populate('reviews.reviewedBy', 'employeeName');
    if (!risk) return res.status(404).json({ message: 'Risk not found' });
    res.json(risk);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRisk = async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) return res.status(404).json({ message: 'Risk not found' });

    Object.assign(risk, req.body);
    risk.updatedBy = req.user._id;
    await risk.save();
    res.json(risk);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.logReview = async (req, res) => {
  try {
    const { notes, updatedLikelihood, updatedImpact, reviewDate } = req.body;
    const risk = await Risk.findById(req.params.id);
    if (!risk) return res.status(404).json({ message: 'Risk not found' });

    const review = {
      reviewedBy: req.user._id,
      reviewDate: reviewDate || new Date(),
      notes,
      updatedLikelihood,
      updatedImpact,
      updatedScore: updatedLikelihood * updatedImpact
    };

    risk.reviews.push(review);
    risk.likelihood = updatedLikelihood;
    risk.impact = updatedImpact;
    // Pre-save hook will update score/level
    await risk.save();
    res.json(risk);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.closeRisk = async (req, res) => {
  try {
    const { closureReason } = req.body;
    const risk = await Risk.findByIdAndUpdate(req.params.id, {
      status: 'closed',
      acceptanceReason: closureReason // Reusing field for closure notes
    }, { new: true });
    res.json(risk);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const levels = await Risk.aggregate([
      { $group: { _id: "$riskLevel", count: { $sum: 1 } } }
    ]);
    
    const categories = await Risk.aggregate([
      { $group: { _id: "$riskCategory", count: { $sum: 1 } } }
    ]);

    const criticalRisks = await Risk.find({ riskLevel: 'critical' })
      .populate('owner', 'employeeName')
      .limit(5)
      .sort({ identifiedDate: -1 });

    const overdue = await Risk.countDocuments({ status: 'overdue' });
    
    const avgResidual = await Risk.aggregate([
      { $match: { residualScore: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$residualScore" } } }
    ]);

    res.json({ levels, categories, criticalRisks, overdue, avgResidual: avgResidual[0]?.avg || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiskMatrix = async (req, res) => {
  try {
    const risks = await Risk.find({ status: { $ne: 'closed' } });
    
    // Create 5x5 matrix
    const matrix = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 5; j++) {
        matrix.push({
          likelihood: i,
          impact: j,
          risks: risks.filter(r => r.likelihood === i && r.impact === j)
            .map(r => ({ _id: r._id, riskId: r.riskId, title: r.riskTitle, level: r.riskLevel }))
        });
      }
    }
    res.json(matrix);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportRiskRegister = async (req, res) => {
  try {
    const risks = await Risk.find().populate('owner', 'employeeName');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Risk Register');

    worksheet.columns = [
      { header: 'ID', key: 'riskId', width: 15 },
      { header: 'Title', key: 'riskTitle', width: 30 },
      { header: 'Category', key: 'riskCategory', width: 15 },
      { header: 'Likelihood', key: 'likelihood', width: 10 },
      { header: 'Impact', key: 'impact', width: 10 },
      { header: 'Inherent Score', key: 'riskScore', width: 15 },
      { header: 'Level', key: 'riskLevel', width: 10 },
      { header: 'Owner', key: 'owner', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    risks.forEach(r => {
      worksheet.addRow({
        riskId: r.riskId,
        riskTitle: r.riskTitle,
        riskCategory: r.riskCategory,
        likelihood: r.likelihood,
        impact: r.impact,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        owner: r.owner?.employeeName,
        status: r.status
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=RiskRegister.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
