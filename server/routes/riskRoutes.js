const express = require('express');
const router = express.Router();
const { getRisks, createRisk, updateRisk, deleteRisk } = require('../controllers/riskController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRisks)
  .post(protect, admin, createRisk);

router.route('/:id')
  .put(protect, admin, updateRisk)
  .delete(protect, admin, deleteRisk);

module.exports = router;
