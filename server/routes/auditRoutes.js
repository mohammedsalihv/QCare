const express = require('express');
const router = express.Router();
const { getAudits, createAudit, updateAudit, deleteAudit } = require('../controllers/auditController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAudits)
  .post(protect, admin, createAudit);

router.route('/:id')
  .put(protect, admin, updateAudit)
  .delete(protect, admin, deleteAudit);

module.exports = router;
