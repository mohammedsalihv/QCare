const EquipmentAsset = require('../models/EquipmentAsset');
const MaintenanceLog = require('../models/MaintenanceLog');
const MockDrill = require('../models/MockDrill');
const AuditLog = require('../models/AuditLog');

// --- Equipment Management ---

exports.addAsset = async (req, res) => {
  try {
    const asset = new EquipmentAsset({ ...req.body, createdBy: req.user._id });
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAssets = async (req, res) => {
  try {
    const { department, status, criticality } = req.query;
    let query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (criticality) query.criticality = criticality;

    const assets = await EquipmentAsset.find(query).sort({ nextCalibrationDate: 1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logMaintenance = async (req, res) => {
  try {
    const log = new MaintenanceLog({ ...req.body, verifiedBy: req.user._id });
    await log.save();

    // Update Asset dates
    const asset = await EquipmentAsset.findById(log.assetId);
    if (asset) {
      if (log.logType === 'calibration' && log.result === 'pass') {
        asset.lastCalibrationDate = log.maintenanceDate;
      } else if (log.logType === 'PPM' && log.result === 'pass') {
        asset.lastPPMDate = log.maintenanceDate;
      } else if (log.logType === 'repair') {
        asset.status = 'active';
      }
      await asset.save();
    }

    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAssetHistory = async (req, res) => {
  try {
    const logs = await MaintenanceLog.find({ assetId: req.params.id })
      .populate('verifiedBy', 'employeeName')
      .sort({ maintenanceDate: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFMSDashboard = async (req, res) => {
  try {
    const totalAssets = await EquipmentAsset.countDocuments();
    const activeAssets = await EquipmentAsset.countDocuments({ status: 'active' });
    const calibrationDue = await EquipmentAsset.countDocuments({ 
      nextCalibrationDate: { $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      status: 'active'
    });
    
    const statusDistribution = await EquipmentAsset.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const drills = await MockDrill.find().limit(5).sort({ drillDate: -1 });

    res.json({ 
      totalAssets, 
      uptimeRate: totalAssets > 0 ? ((activeAssets / totalAssets) * 100).toFixed(1) : 0,
      calibrationDue,
      statusDistribution,
      recentDrills: drills
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Mock Drills ---

exports.logDrill = async (req, res) => {
  try {
    const drill = new MockDrill({ ...req.body, evaluatedBy: req.user._id });
    await drill.save();

    await AuditLog.create({
      action: 'MOCK_DRILL_LOGGED',
      module: 'FMS',
      details: `Mock drill of type ${drill.drillType} conducted at ${drill.location}. Rating: ${drill.overallRating}/5`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.status(201).json(drill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDrills = async (req, res) => {
  try {
    const drills = await MockDrill.find()
      .populate('evaluatedBy', 'employeeName')
      .sort({ drillDate: -1 });
    res.json(drills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
