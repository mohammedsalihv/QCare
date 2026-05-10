const FacilityLicense = require('../models/FacilityLicense');
const StaffLicense = require('../models/StaffLicense');
const DOHCircular = require('../models/DOHCircular');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// --- Facility Licenses ---

exports.getFacilityLicenses = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const licenses = await FacilityLicense.find(query).sort({ expiryDate: 1 });
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFacilityLicense = async (req, res) => {
  try {
    const license = new FacilityLicense({ ...req.body, createdBy: req.user._id });
    await license.save();
    res.status(201).json(license);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFacilityLicense = async (req, res) => {
  try {
    const license = await FacilityLicense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(license);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Staff Licenses ---

exports.getStaffLicenses = async (req, res) => {
  try {
    const { staffId, status, daysToExpiry } = req.query;
    const query = {};
    if (staffId) query.staffId = staffId;
    if (status) query.status = status;
    
    if (daysToExpiry) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(daysToExpiry));
      query.expiryDate = { $lte: targetDate };
    }

    const licenses = await StaffLicense.find(query)
      .populate('staffId', 'employeeName employeeId department')
      .sort({ expiryDate: 1 });
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaffLicense = async (req, res) => {
  try {
    const license = new StaffLicense(req.body);
    await license.save();
    res.status(201).json(license);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateStaffLicense = async (req, res) => {
  try {
    const license = await StaffLicense.findById(req.params.id);
    if (!license) return res.status(404).json({ message: 'License not found' });

    Object.assign(license, req.body);
    await license.save();

    await AuditLog.create({
      action: 'UPDATE_STAFF_LICENSE',
      module: 'Compliance',
      details: { licenseNumber: license.licenseNumber, staffId: license.staffId },
      performedBy: req.user._id
    });

    res.json(license);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Circulars ---

exports.getCirculars = async (req, res) => {
  try {
    // Basic filtering based on user role (clinical vs admin)
    // Assuming staff role mapping: QualityManager/SuperAdmin = admin, Staff/Nurse = clinical
    const userRole = req.user.role.toLowerCase();
    let query = {};
    if (userRole === 'staff') {
      query.applicableTo = { $in: ['all', 'clinical'] };
    }
    
    const circulars = await DOHCircular.find(query).sort({ issuedDate: -1 });
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCircular = async (req, res) => {
  try {
    const circular = new DOHCircular({ ...req.body, createdBy: req.user._id });
    await circular.save();
    res.status(201).json(circular);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.acknowledgeCircular = async (req, res) => {
  try {
    const circular = await DOHCircular.findById(req.params.id);
    if (!circular) return res.status(404).json({ message: 'Circular not found' });

    const alreadyAcknowledged = circular.acknowledgments.some(a => a.userId.toString() === req.user._id.toString());
    if (alreadyAcknowledged) return res.status(400).json({ message: 'Already acknowledged' });

    circular.acknowledgments.push({ userId: req.user._id, acknowledgedAt: new Date() });
    await circular.save();
    res.json({ message: 'Acknowledged successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCircularCompliance = async (req, res) => {
  try {
    const circular = await DOHCircular.findById(req.params.id)
      .populate('acknowledgments.userId', 'employeeName employeeId department');
    if (!circular) return res.status(404).json({ message: 'Circular not found' });

    res.json(circular.acknowledgments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Dashboard ---

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    
    const countExpiring = async (days) => {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + days);
      const fCount = await FacilityLicense.countDocuments({ expiryDate: { $gt: today, $lte: targetDate } });
      const sCount = await StaffLicense.countDocuments({ expiryDate: { $gt: today, $lte: targetDate } });
      return fCount + sCount;
    };

    const expiring30 = await countExpiring(30);
    const expiring60 = await countExpiring(60);
    const expiring90 = await countExpiring(90);

    const pendingCirculars = await DOHCircular.countDocuments({
      acknowledgmentRequired: true,
      acknowledgmentDeadline: { $lt: today },
      'acknowledgments.userId': { $ne: req.user._id }
    });

    const totalLicenses = await StaffLicense.countDocuments() + await FacilityLicense.countDocuments();
    const activeLicenses = await StaffLicense.countDocuments({ status: 'active' }) + await FacilityLicense.countDocuments({ status: 'active' });
    const compliancePercent = totalLicenses > 0 ? ((activeLicenses / totalLicenses) * 100).toFixed(2) : 100;

    res.json({
      stats: { expiring30, expiring60, expiring90, pendingCirculars, compliancePercent }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
