const express = require('express');
const router = express.Router();
const {
  createRisk,
  getRisks,
  getRiskById,
  updateRisk,
  logReview,
  closeRisk,
  getDashboardStats,
  getRiskMatrix,
  exportRiskRegister
} = require('../controllers/riskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('QualityManager', 'DepartmentHead', 'SuperAdmin'), createRisk)
  .get(protect, getRisks);

router.get('/dashboard', protect, getDashboardStats);
router.get('/matrix', protect, getRiskMatrix);
router.get('/export/excel', protect, exportRiskRegister);

router.route('/:id')
  .get(protect, getRiskById)
  .put(protect, updateRisk);

router.put('/:id/review', protect, logReview);
router.put('/:id/close', protect, closeRisk);

module.exports = router;
