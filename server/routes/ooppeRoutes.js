const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createOoppe,
  getOoppes,
  getOoppeById,
  updateOoppe,
  deleteOoppe,
} = require('../controllers/ooppeController');

router
  .route('/')
  .get(protect, authorize('SuperAdmin', 'QualityManager', 'Staff'), getOoppes)
  .post(protect, authorize('SuperAdmin', 'QualityManager'), createOoppe);

router
  .route('/:id')
  .get(protect, authorize('SuperAdmin', 'QualityManager', 'Staff'), getOoppeById)
  .put(protect, authorize('SuperAdmin', 'QualityManager'), updateOoppe)
  .delete(protect, authorize('SuperAdmin'), deleteOoppe);

module.exports = router;
