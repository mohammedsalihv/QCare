const express = require('express');
const router = express.Router();
const {
  createFramework,
  getFramework,
  logTraining,
  getRecords,
  verifyRecord,
  getStaffCompliance,
  getDashboardStats,
  exportTrainingRegister
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/framework')
  .post(protect, authorize('QualityManager', 'SuperAdmin'), createFramework)
  .get(protect, getFramework);

router.route('/records')
  .post(protect, authorize('QualityManager', 'DepartmentHead', 'SuperAdmin'), logTraining)
  .get(protect, getRecords);

router.put('/records/:id/verify', protect, authorize('QualityManager', 'SuperAdmin'), verifyRecord);

router.get('/staff/:staffId/compliance', protect, getStaffCompliance);
router.get('/dashboard', protect, getDashboardStats);
router.get('/export/excel', protect, exportTrainingRegister);

module.exports = router;
