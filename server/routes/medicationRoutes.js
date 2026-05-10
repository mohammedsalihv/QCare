const express = require('express');
const router = express.Router();
const {
  reportError,
  getErrors,
  reviewError,
  getErrorDashboard,
  getHighAlertMeds,
  addHighAlertMed,
  logWaste,
  getWasteLogs,
  getWasteSummary,
  generateWasteManifestPDF,
  submitAudit,
  getAuditTrend
} = require('../controllers/medicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Medication Safety
router.route('/errors')
  .post(protect, reportError)
  .get(protect, getErrors);

router.get('/errors/dashboard', protect, getErrorDashboard);
router.put('/errors/:id/review', protect, authorize('QualityManager', 'SuperAdmin'), reviewError);

router.route('/high-alert')
  .get(protect, getHighAlertMeds)
  .post(protect, authorize('QualityManager', 'SuperAdmin', 'admin'), addHighAlertMed);

// Medical Waste
router.route('/waste')
  .post(protect, logWaste)
  .get(protect, getWasteLogs);

router.get('/waste/monthly-summary', protect, getWasteSummary);
router.get('/waste/:id/manifest/pdf', protect, generateWasteManifestPDF);

// Audits
router.post('/audits', protect, submitAudit);
router.get('/audits/trend', protect, getAuditTrend);

module.exports = router;
