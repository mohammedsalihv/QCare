const event = require('../utils/workflowNotifications');
const notifyPrivilege = (req, privilege) => event({module:'Clinical privileges', recordId:privilege._id, title:privilege.specialty + ' privileges', status:privilege.status, actor:req.user, requester:privilege.requestedBy || privilege.staffId, participants:[privilege.staffId, privilege.assignedApprover], reason:privilege.reviewNotes || '', actionLink:'/dashboard/clinical-privileges?tab=reviews', recipientRoles:[]});
const ClinicalPrivilege = require('../models/ClinicalPrivilege');
const CredentialingRecord = require('../models/CredentialingRecord');
const User = require('../models/users');
const AuditLog = require('../models/AuditLog');
const { applicationData, canRead, canReview } = require('../utils/privilegeApplication');
const mongoose = require('mongoose');

// --- Clinical Privileges ---

exports.requestPrivileges = async (req, res) => {
  try {
    const data = applicationData(req.body, req.files);
    if (![req.body.staffId, req.body.assignedApprover].every(id => mongoose.isValidObjectId(id))) return res.status(400).json({ message: 'Select a clinician and an approver.' });
    const [staff, approver] = await Promise.all([User.findById(req.body.staffId), User.findById(req.body.assignedApprover)]);
    const active = user => user && user.isActive !== false && !['blocked', 'inactive'].includes(user.status);
    if (!active(staff) || !active(approver) || !canReview(approver)) return res.status(400).json({ message: 'Choose an active clinician and an eligible approver.' });
    if ([String(staff._id), String(req.user._id)].includes(String(approver._id))) return res.status(400).json({ message: 'Select an independent approver, different from the applicant and submitter.' });
    if (!canReview(req.user) && !['admin', 'SuperAdmin'].includes(req.user.role) && String(staff._id) !== String(req.user._id)) return res.status(403).json({ message: 'You can only apply for your own privileges.' });
    const privilege = await ClinicalPrivilege.create({ ...data, staffId: staff._id, assignedApprover: approver._id, requestedBy: req.user._id, status: 'pending-approval' });
    await notifyPrivilege(req, privilege).catch(error => console.error('Privilege notification failed:', error.message));
    res.status(201).json(await ClinicalPrivilege.findById(privilege._id).populate('staffId assignedApprover', 'employeeName'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.approvePrivileges = async (req, res) => {
  try {
    const privilege = await ClinicalPrivilege.findById(req.params.id);
    if (!privilege) return res.status(404).json({message:'Privilege request not found'});
    if ([privilege.staffId, privilege.requestedBy].some(id => String(id) === String(req.user._id))) return res.status(403).json({ message: 'An independent reviewer must decide this application.' });
    if (privilege.assignedApprover && String(privilege.assignedApprover) !== String(req.user._id)) return res.status(403).json({ message: 'This application is assigned to another approver.' });
    if (privilege.status !== 'pending-approval') return res.status(409).json({message:'Only pending requests can be reviewed.'});
    const decision = req.body.decision || 'approve';
    if (!['approve','reject'].includes(decision)) return res.status(400).json({message:'Choose approve or reject.'});
    if (decision === 'reject' && !req.body.reviewNotes?.trim()) return res.status(400).json({message:'Provide a rejection reason.'});
    privilege.status = decision === 'approve' ? 'approved' : 'rejected';
    privilege.reviewedBy = req.user._id; privilege.reviewedAt = new Date();
    privilege.approvedBy = decision === 'approve' ? req.user._id : undefined; privilege.approvalDate = decision === 'approve' ? new Date() : undefined; privilege.reviewNotes = req.body.reviewNotes || '';
    privilege.procedures.forEach(p => { p.approved = decision === 'approve'; });
    await privilege.save(); await notifyPrivilege(req, privilege).catch(error => console.error('Privilege notification failed:', error.message));

    await AuditLog.create({
      action: decision === 'approve' ? 'PRIVILEGES_APPROVED' : 'PRIVILEGES_REJECTED',
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
    if (!canRead(req.user, { staffId: req.params.staffId })) return res.status(403).json({ message: 'You cannot view this staff portfolio.' });
    const privileges = await ClinicalPrivilege.find({ staffId: req.params.staffId })
      .populate('approvedBy', 'employeeName')
      .populate('assignedApprover staffId', 'employeeName')
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
      .populate('assignedApprover', 'employeeName')
      .sort({ status: 1 });
    res.json(privileges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applicationOptions = async (req, res) => {
  const users = await User.find({ isActive: { $ne: false }, status: { $nin: ['blocked', 'inactive'] } }).select('employeeName role designation');
  res.json({ approvers: users.filter(user => canReview(user) && String(user._id) !== String(req.user._id)) });
};
exports.myApplications = async (req, res) => {
  const rows = await ClinicalPrivilege.find({ $or: [{ staffId: req.user._id }, { requestedBy: req.user._id }] }).populate('staffId assignedApprover approvedBy', 'employeeName').sort({ createdAt: -1 });
  res.json(rows);
};
exports.downloadDocument = async (req, res) => {
  try {
    const row = await ClinicalPrivilege.findById(req.params.id).select('+supportingDocuments.data');
    if (!row || !canRead(req.user, row)) return res.status(404).json({ message: 'Document not found.' });
    const document = row.supportingDocuments.id(req.params.documentId);
    if (!document) return res.status(404).json({ message: 'Document not found.' });
    res.set({ 'Content-Type': document.mimeType, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    res.send(document.data);
  } catch { res.status(400).json({ message: 'Unable to download document.' }); }
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
