const express = require('express');
const router = express.Router();
const {
  createIndicator,
  getIndicators,
  getDashboardStats,
  getIndicatorById,
  updateIndicator,
  submitToDOH,
  exportToExcel,
  submitData,
  validateIndicator,
  approveIndicator,
  getCriteria,
  createCriteria,
  deleteCriteria,
  getTypes,
  createType,
  deleteType,
  getNotificationRules,
  createNotificationRule,
  deleteNotificationRule
} = require('../controllers/kpiController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const { previewImport, saveRule } = require('../controllers/indicatorImportController');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3, fieldSize: 1024 } }).single('file');
router.post('/import/preview', protect, (req, res, next) => {
  upload(req, res, err => err ? res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Use a file smaller than 5 MB.' : 'Upload one CSV or XLSX file with the reporting details.' }) : next());
}, previewImport);
router.put('/import/rule/:code', protect, authorize('SuperAdmin', 'QualityManager', 'admin'), saveRule);

// Submaster Selection Criteria
router.route('/submaster/criteria')
  .get(protect, getCriteria)
  .post(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), createCriteria);

router.route('/submaster/criteria/:id')
  .delete(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), deleteCriteria);

// Submaster Indicator Types
router.route('/submaster/type')
  .get(protect, getTypes)
  .post(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), createType);

router.route('/submaster/type/:id')
  .delete(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), deleteType);

// Notification Rules
router.route('/notifications')
  .get(protect, getNotificationRules)
  .post(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), createNotificationRule);

router.route('/notifications/:id')
  .delete(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), deleteNotificationRule);

// Dashboard aggregates
router.get('/dashboard', protect, getDashboardStats);

// Export to Excel
router.get('/export/excel', protect, exportToExcel);

// Periodic Submission
router.post('/submit-data', protect, submitData);

// Main routes
router.route('/')
  .get(protect, getIndicators)
  .post(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), createIndicator);

router.route('/:id')
  .get(protect, getIndicatorById)
  .put(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), updateIndicator);

// Workflow state validation / approvals
router.post('/:id/validate', protect, authorize('SuperAdmin', 'QualityManager', 'admin'), validateIndicator);
router.post('/:id/approve', protect, authorize('SuperAdmin', 'QualityManager', 'admin'), approveIndicator);

// Submit to DOH
router.post('/:id/submit', protect, authorize('SuperAdmin', 'QualityManager', 'admin'), submitToDOH);

module.exports = router;
