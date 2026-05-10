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

module.exports = router;
