const express = require('express');
const router = express.Router();
const {
  createIndicator,
  getIndicators,
  getDashboardStats,
  getIndicatorById,
  updateIndicator,
  submitToDOH,
  exportToExcel
} = require('../controllers/kpiController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Dashboard aggregates
router.get('/dashboard', protect, getDashboardStats);

// Export to Excel
router.get('/export/excel', protect, exportToExcel);

// Main routes
router.route('/')
  .get(protect, getIndicators)
  .post(protect, authorize('SuperAdmin', 'QualityManager'), createIndicator);

router.route('/:id')
  .get(protect, getIndicatorById)
  .put(protect, authorize('SuperAdmin', 'QualityManager'), updateIndicator);

// Submit to DOH
router.post('/:id/submit', protect, authorize('SuperAdmin', 'QualityManager'), submitToDOH);

module.exports = router;