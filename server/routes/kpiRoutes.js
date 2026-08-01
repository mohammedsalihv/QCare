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

// Submaster Selection Criteria
router.route('/submaster/criteria')
  .get(protect, getCriteria)
  .post(protect, authorize('SuperAdmin', 'QualityManager'), createCriteria);

router.route('/submaster/criteria/:id')
  .delete(protect, authorize('SuperAdmin', 'QualityManager'), deleteCriteria);

// Submaster Indicator Types
router.route('/submaster/type')
  .get(protect, getTypes)
  .post(protect, authorize('SuperAdmin', 'QualityManager'), createType);

router.route('/submaster/type/:id')
  .delete(protect, authorize('SuperAdmin', 'QualityManager'), deleteType);

// Notification Rules
router.route('/notifications')
  .get(protect, getNotificationRules)
  .post(protect, authorize('SuperAdmin', 'QualityManager'), createNotificationRule);

router.route('/notifications/:id')
  .delete(protect, authorize('SuperAdmin', 'QualityManager'), deleteNotificationRule);

// Dashboard aggregates
router.get('/dashboard', protect, getDashboardStats);

// Export to Excel
router.get('/export/excel', protect, exportToExcel);

// Periodic Submission
router.post('/submit-data', protect, authorize('SuperAdmin', 'QualityManager'), submitData);

// Main routes
router.route('/')
  .get(protect, getIndicators)
  .post(protect, authorize('SuperAdmin', 'QualityManager'), createIndicator);

router.route('/:id')
  .get(protect, getIndicatorById)
  .put(protect, authorize('SuperAdmin', 'QualityManager'), updateIndicator);

// Workflow state validation / approvals
router.post('/:id/validate', protect, authorize('SuperAdmin', 'QualityManager'), validateIndicator);
router.post('/:id/approve', protect, authorize('SuperAdmin', 'QualityManager'), approveIndicator);

// Submit to DOH
router.post('/:id/submit', protect, authorize('SuperAdmin', 'QualityManager'), submitToDOH);

module.exports = router;