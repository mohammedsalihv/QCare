const express = require('express');
const router = express.Router();
const {
  addAsset,
  getAssets,
  logMaintenance,
  getAssetHistory,
  getFMSDashboard,
  logDrill,
  getDrills
} = require('../controllers/fmsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Equipment
router.route('/assets')
  .post(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), addAsset)
  .get(protect, getAssets);

router.get('/assets/:id/history', protect, getAssetHistory);
router.post('/maintenance', protect, logMaintenance);
router.get('/dashboard', protect, getFMSDashboard);

// Drills
router.route('/drills')
  .post(protect, logDrill)
  .get(protect, getDrills);

module.exports = router;
