const ClinicalPrivilege = require('../models/ClinicalPrivilege');
const CredentialingRecord = require('../models/CredentialingRecord');
const User = require('../models/users');
const AuditLog = require('../models/AuditLog');

// --- Clinical Privileges ---

exports.requestPrivileges = async (req, res) => {
  try {
    const privilege = new ClinicalPrivilege({ ...req.body, status: 'pending-approval' });
    await privilege.save();
    res.status(201).json(privilege);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.approvePrivileges = async (req, res) => {
  try {
    const privilege = await ClinicalPrivilege.findByIdAndUpdate(req.params.id, {
      ...req.body,
      status: 'approved',
      approvedBy: req.user._id,
      approvalDate: new Date()
    }, { new: true });

    await AuditLog.create({
      action: 'PRIVILEGES_APPROVED',
      module: 'MedicalAffairs',
      details: `Clinical privileges approved for staff ID: ${privilege.staffId}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(privilege);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getStaffPrivileges = async (req, res) => {
  try {
    const privileges = await ClinicalPrivilege.find({ staffId: req.params.staffId })
      .populate('approvedBy', 'employeeName')
      .sort({ createdAt: -1 });
    res.json(privileges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPrivileges = async (req, res) => {
  try {
    const privileges = await ClinicalPrivilege.find()
      .populate('staffId', 'employeeName employeeId specialty')
      .populate('approvedBy', 'employeeName')
      .sort({ status: 1 });
    res.json(privileges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Credentialing ---

exports.addCredential = async (req, res) => {
  try {
    const record = new CredentialingRecord({ ...req.body });
    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getStaffCredentials = async (req, res) => {
  try {
    const records = await CredentialingRecord.find({ staffId: req.params.staffId })
      .sort({ expiryDate: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpiringCredentials = async (req, res) => {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 90); // 90 days warning

    const expiring = await CredentialingRecord.find({
      expiryDate: { $lte: threshold },
      verificationStatus: { $ne: 'expired' }
    }).populate('staffId', 'employeeName department');
    
    res.json(expiring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCPDashboard = async (req, res) => {
  try {
    const totalStaff = await User.countDocuments({ role: { $in: ['Physician', 'Nurse', 'Technician'] } });
    const approvedPrivileges = await ClinicalPrivilege.countDocuments({ status: 'approved' });
    const pendingPrivileges = await ClinicalPrivilege.countDocuments({ status: 'pending-approval' });
    
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);
    const criticalExpiries = await CredentialingRecord.countDocuments({
      expiryDate: { $lte: threshold }
    });

    res.json({
      totalStaff,
      approvedPrivileges,
      pendingPrivileges,
      criticalExpiries,
      complianceRate: totalStaff > 0 ? ((approvedPrivileges / totalStaff) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
