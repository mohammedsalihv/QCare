const express = require('express');
const router = express.Router();
const {
  getFacilityLicenses,
  createFacilityLicense,
  updateFacilityLicense,
  getStaffLicenses,
  createStaffLicense,
  updateStaffLicense,
  getCirculars,
  createCircular,
  acknowledgeCircular,
  getCircularCompliance,
  getDashboardStats
} = require('../controllers/complianceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Dashboard
router.get('/dashboard', protect, getDashboardStats);

// Facility Licenses
router.route('/licenses/facility')
  .get(protect, getFacilityLicenses)
  .post(protect, authorize('SuperAdmin'), createFacilityLicense);

router.put('/licenses/facility/:id', protect, updateFacilityLicense);

// Staff Licenses
router.route('/licenses/staff')
  .get(protect, getStaffLicenses)
  .post(protect, authorize('QualityManager', 'SuperAdmin'), createStaffLicense);

router.put('/licenses/staff/:id', protect, updateStaffLicense);

// Circulars
router.route('/circulars')
  .get(protect, getCirculars)
  .post(protect, authorize('SuperAdmin'), createCircular);

router.post('/circulars/:id/acknowledge', protect, acknowledgeCircular);

router.get('/circulars/:id/compliance', protect, authorize('QualityManager', 'SuperAdmin'), getCircularCompliance);

module.exports = router;
