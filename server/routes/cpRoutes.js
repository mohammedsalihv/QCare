const express = require('express');
const router = express.Router();
const {
  requestPrivileges,
  approvePrivileges,
  getStaffPrivileges,
  getAllPrivileges,
  addCredential,
  getStaffCredentials,
  getExpiringCredentials,
  getCPDashboard
} = require('../controllers/cpController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Privileges
router.route('/privileges')
  .post(protect, requestPrivileges)
  .get(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), getAllPrivileges);

router.put('/privileges/:id/approve', protect, authorize('SuperAdmin', 'QualityManager'), approvePrivileges);
router.get('/privileges/staff/:staffId', protect, getStaffPrivileges);

// Credentialing
router.route('/credentials')
  .post(protect, addCredential);

router.get('/credentials/staff/:staffId', protect, getStaffCredentials);
router.get('/credentials/expiring', protect, authorize('SuperAdmin', 'QualityManager'), getExpiringCredentials);

// Dashboard
router.get('/dashboard', protect, getCPDashboard);

// A shared credential register; non-administrators only see their own records.
router.get('/credentials', protect, async (req, res) => {
  try {
    const Credential = require('../models/CredentialingRecord');
    const canViewAll = ['superadmin', 'admin', 'qualitymanager'].includes(req.user.role?.toLowerCase());
    res.json(await Credential.find(canViewAll ? {} : { staffId: req.user._id }).populate('staffId', 'employeeName employeeId').sort({ expiryDate: 1 }));
  } catch (error) { res.status(500).json({ message: 'Unable to load credentials' }); }
});
router.put('/credentials/:id', protect, authorize('SuperAdmin', 'admin', 'QualityManager'), async (req, res) => {
  try {
    const Credential = require('../models/CredentialingRecord');
    const User = require('../models/users');
    const allowed = ['staffId', 'documentType', 'documentNumber', 'issuingAuthority', 'verificationStatus', 'expiryDate'];
    const values = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    if (values.staffId && !await User.exists({ _id: values.staffId })) return res.status(400).json({ message: 'Select a user from User Master' });
    const record = await Credential.findByIdAndUpdate(req.params.id, values, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: 'Credential not found' });
    res.json(record);
  } catch (error) { res.status(400).json({ message: error.message }); }
});
router.delete('/credentials/:id', protect, authorize('SuperAdmin', 'admin', 'QualityManager'), async (req, res) => {
  try {
    const record = await require('../models/CredentialingRecord').findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Credential not found' });
    res.json({ message: 'Credential removed' });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;
