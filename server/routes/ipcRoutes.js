const express = require('express');
const router = express.Router();
const {
  logSurveillance,
  getSurveillance,
  getSurveillanceDashboard,
  submitHandHygieneAudit,
  getHandHygieneTrend,
  createOutbreak,
  getOutbreaks,
  getOutbreakById,
  addOutbreakEvent,
  notifyDOHOutbreak,
  submitChecklist,
  getChecklistSummary
} = require('../controllers/ipcController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/surveillance')
  .post(protect, authorize('QualityManager', 'SuperAdmin', 'admin'), logSurveillance)
  .get(protect, getSurveillance);

router.get('/surveillance/dashboard', protect, getSurveillanceDashboard);

router.route('/hand-hygiene')
  .post(protect, submitHandHygieneAudit)
  .get(protect);

router.get('/hand-hygiene/trend', protect, getHandHygieneTrend);

router.route('/outbreaks')
  .post(protect, createOutbreak)
  .get(protect, getOutbreaks);

router.route('/outbreaks/:id')
  .get(protect, getOutbreakById)
  .put(protect, addOutbreakEvent);

router.put('/outbreaks/:id/notify-doh', protect, authorize('QualityManager', 'SuperAdmin'), notifyDOHOutbreak);

router.route('/checklists')
  .post(protect, submitChecklist);

router.get('/checklists/summary', protect, getChecklistSummary);

module.exports = router;
