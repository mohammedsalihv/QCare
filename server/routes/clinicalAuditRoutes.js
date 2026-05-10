const express = require('express');
const router = express.Router();
const {
  createTemplate,
  getTemplates,
  scheduleAudit,
  getAudits,
  getAuditById,
  startAudit,
  updateFindings,
  completeAudit,
  getDashboardStats,
  generatePDFReport
} = require('../controllers/clinicalAuditController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Templates
router.route('/templates')
  .post(protect, authorize('QualityManager', 'SuperAdmin'), createTemplate)
  .get(protect, getTemplates);

// Audits
router.route('/')
  .post(protect, authorize('QualityManager', 'SuperAdmin'), scheduleAudit)
  .get(protect, getAudits);

router.get('/dashboard', protect, getDashboardStats);

router.route('/:id')
  .get(protect, getAuditById);

router.put('/:id/start', protect, startAudit);
router.put('/:id/findings', protect, updateFindings);
router.put('/:id/complete', protect, completeAudit);

router.get('/:id/report/pdf', protect, generatePDFReport);

module.exports = router;
