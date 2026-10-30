const express = require('express');
const router = express.Router();
// A version marker lets deployment checks identify the API serving the new audit form.
router.use((req, res, next) => { res.setHeader('X-QCare-Audit-Workflow', '13'); next(); });
const {
  getTemplates,
  getAudits,
  getAuditById,
  getDashboardStats,
  generatePDFReport
} = require('../controllers/clinicalAuditController');
const workflow = require('../controllers/clinicalAuditWorkflow');
const multer = require('multer');
const evidenceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 } }).single('file');
const { protect, authorize } = require('../middleware/authMiddleware');
router.get('/permissions', protect, (req, res) => res.json({ role: req.user.role, canManage: require('../utils/clinicalAuditNotifications').isQuality(req.user) }));

// Templates
router.route('/templates')
  .post(protect, authorize('QualityManager', 'SuperAdmin'), workflow.createTemplate)
  .get(protect, getTemplates);

router.route('/templates/:templateId')
  .put(protect, authorize('QualityManager', 'SuperAdmin'), workflow.updateTemplate)
  .delete(protect, authorize('QualityManager', 'SuperAdmin'), workflow.deleteTemplate);

// Audits
router.route('/')
  .post(protect, authorize('QualityManager', 'QualityOfficer', 'SuperAdmin'), workflow.scheduleAudit)
  .get(protect, getAudits);

router.get('/dashboard', protect, getDashboardStats);

router.route('/:id')
  .put(protect, authorize('QualityManager', 'QualityOfficer', 'SuperAdmin'), workflow.updateScheduledAudit)
  .delete(protect, authorize('QualityManager', 'SuperAdmin'), workflow.deleteAudit)
  .get(protect, getAuditById);

router.put('/:id/schedule-approval', protect, authorize('QualityManager', 'SuperAdmin'), workflow.approveSchedule);
router.put('/:id/start', protect, workflow.startAudit);
router.put('/:id/findings', protect, workflow.updateFindings);
router.put('/:id/complete', protect, workflow.completeAudit);
router.put('/:id/review', protect, authorize('QualityManager', 'SuperAdmin'), workflow.reviewAudit);
router.post('/:id/actions', protect, workflow.addAction);
router.put('/:id/actions/:actionId', protect, workflow.updateAction);
router.post('/:id/evidence/:criterionId', protect, (req, res, next) => {
  evidenceUpload(req, res, err => err ? res.status(400).json({ message: 'Upload one PDF, PNG, or JPEG file up to 10 MB.' }) : next());
}, workflow.uploadEvidence);
router.get('/:id/evidence/:fileId', protect, workflow.downloadEvidence);

router.get('/:id/report/pdf', protect, generatePDFReport);

module.exports = router;
