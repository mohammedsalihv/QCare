const CompetencyFramework = require('../models/CompetencyFramework');
const TrainingRecord = require('../models/TrainingRecord');
const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/users');
const ExcelJS = require('exceljs');

// --- Framework ---

exports.createFramework = async (req, res) => {
  try {
    const competency = new CompetencyFramework({ ...req.body, createdBy: req.user._id });
    await competency.save();
    res.status(201).json(competency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getFramework = async (req, res) => {
  try {
    const { role, mandatory } = req.query;
    let query = { isActive: true };
    if (role) query.applicableRoles = { $in: [role, 'All'] };
    if (mandatory) query.isMandatoryDOH = mandatory === 'true';

    const competencies = await CompetencyFramework.find(query);
    res.json(competencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Records ---

exports.logTraining = async (req, res) => {
  try {
    const record = new TrainingRecord(req.body);
    // Auto-expiry logic if not provided
    if (!record.expiryDate) {
      const competency = await CompetencyFramework.findById(record.competencyId);
      const completionDate = new Date(record.completionDate);
      if (competency.frequency === 'annual') {
        record.expiryDate = new Date(completionDate.setFullYear(completionDate.getFullYear() + 1));
      } else if (competency.frequency === 'biannual') {
        record.expiryDate = new Date(completionDate.setFullYear(completionDate.getFullYear() + 2));
      }
    }
    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const { staffId, year, type } = req.query;
    let query = {};
    if (staffId) query.staffId = staffId;
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      query.completionDate = { $gte: start, $lte: end };
    }
    if (type) query.trainingType = type;

    const records = await TrainingRecord.find(query)
      .populate('staffId', 'employeeName employeeId department')
      .populate('competencyId', 'competencyName competencyCode')
      .sort({ completionDate: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyRecord = async (req, res) => {
  try {
    const record = await TrainingRecord.findByIdAndUpdate(req.params.id, {
      verifiedByQM: true,
      verifiedAt: new Date()
    }, { new: true });
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Compliance ---

exports.getStaffCompliance = async (req, res) => {
  try {
    const { staffId } = req.params;
    const user = await User.findById(staffId);
    if (!user) return res.status(404).json({ message: 'Staff not found' });

    // 1. Get all mandatory competencies for this role
    const mandatory = await CompetencyFramework.find({
      applicableRoles: { $in: [user.role, 'All'] },
      isMandatoryDOH: true,
      isActive: true
    });

    // 2. Get last completed training for each
    const compliance = await Promise.all(mandatory.map(async (comp) => {
      const lastRecord = await TrainingRecord.findOne({
        staffId,
        competencyId: comp._id,
        passed: true
      }).sort({ completionDate: -1 });

      const isCompliant = lastRecord && (!lastRecord.expiryDate || lastRecord.expiryDate > new Date());
      
      return {
        competencyId: comp._id,
        name: comp.competencyName,
        code: comp.competencyCode,
        lastCompleted: lastRecord?.completionDate,
        expiry: lastRecord?.expiryDate,
        status: isCompliant ? 'compliant' : (lastRecord ? 'expired' : 'missing')
      };
    }));

    res.json(compliance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStaff = await User.countDocuments({ role: { $ne: 'SuperAdmin' } });
    
    // Aggregate compliance % by department
    // Simplified: Count staff with any overdue mandatory training
    const overdueRecords = await TrainingRecord.find({
      expiryDate: { $lt: new Date() },
      passed: true
    }).distinct('staffId');

    const totalOverdue = overdueRecords.length;
    const compliantCount = totalStaff - totalOverdue;

    const expiringSoon = await TrainingRecord.countDocuments({
      expiryDate: { 
        $gt: new Date(), 
        $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      }
    });

    res.json({
      totalStaff,
      compliantCount,
      totalOverdue,
      expiringSoon,
      complianceRate: totalStaff > 0 ? ((compliantCount / totalStaff) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportTrainingRegister = async (req, res) => {
  try {
    const records = await TrainingRecord.find()
      .populate('staffId', 'employeeName employeeId department')
      .populate('competencyId', 'competencyName');
      
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Training Register');

    worksheet.columns = [
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Employee ID', key: 'id', width: 15 },
      { header: 'Department', key: 'dept', width: 20 },
      { header: 'Competency', key: 'comp', width: 30 },
      { header: 'Completion Date', key: 'date', width: 15 },
      { header: 'Expiry Date', key: 'expiry', width: 15 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Verified', key: 'verified', width: 10 }
    ];

    records.forEach(r => {
      worksheet.addRow({
        name: r.staffId?.employeeName,
        id: r.staffId?.employeeId,
        dept: r.staffId?.department,
        comp: r.competencyId?.competencyName,
        date: r.completionDate.toLocaleDateString(),
        expiry: r.expiryDate?.toLocaleDateString(),
        score: r.score,
        verified: r.verifiedByQM ? 'Yes' : 'No'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=TrainingRegister.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
