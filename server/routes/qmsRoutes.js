const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getChangeRequests,
  createChangeRequest,
  updateChangeRequest,
  getDeviations,
  createDeviation,
  updateDeviation,
  getCapas,
  createCapa,
  updateCapa,
  getSuppliers,
  createSupplier,
  updateSupplier
} = require('../controllers/qmsController');

// Change Requests
router.route('/change-requests')
  .get(protect, getChangeRequests)
  .post(protect, createChangeRequest);
router.route('/change-requests/:id')
  .put(protect, updateChangeRequest);

// Deviations
router.route('/deviations')
  .get(protect, getDeviations)
  .post(protect, createDeviation);
router.route('/deviations/:id')
  .put(protect, updateDeviation);

// CAPAs
router.route('/capa')
  .get(protect, getCapas)
  .post(protect, createCapa);
router.route('/capa/:id')
  .put(protect, updateCapa);

// Suppliers
router.route('/suppliers')
  .get(protect, getSuppliers)
  .post(protect, createSupplier);
router.route('/suppliers/:id')
  .put(protect, updateSupplier);

module.exports = router;
