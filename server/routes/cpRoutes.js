const express = require('express');
const router = express.Router();
const {
  requestPrivileges,
  approvePrivileges,
  getStaffPrivileges,
  getAllPrivileges,
  addCredential,
  getStaffCredentials,
  getExpiringCredentials,
  getCPDashboard
} = require('../controllers/cpController');
const { protect, authorize } = require('../middleware/authMiddleware');
const controller = require('../controllers/cpController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 5 * 1024 * 1024, fields: 1, fieldSize: 50000 } }).array('documents', 5);
const applicationUpload = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  upload(req, res, error => {
    if (error) return res.status(400).json({ message: 'Attach up to 5 files, maximum 5 MB each.' });
    try { req.body = JSON.parse(req.body.payload); if (!req.body || Array.isArray(req.body)) throw Error(); } catch { return res.status(400).json({ message: 'Invalid application.' }); }
    next();
  });
};
router.get('/privileges/options', protect, controller.applicationOptions);
router.get('/privileges/mine', protect, controller.myApplications);
router.get('/privileges/:id/documents/:documentId', protect, controller.downloadDocument);

// Privileges
router.route('/privileges')
  .post(protect, applicationUpload, requestPrivileges)
  .get(protect, authorize('SuperAdmin', 'QualityManager', 'admin'), getAllPrivileges);

router.put('/privileges/:id/approve', protect, authorize('SuperAdmin', 'QualityManager'), approvePrivileges);
router.get('/privileges/staff/:staffId', protect, getStaffPrivileges);

// Credentialing
router.route('/credentials')
  .post(protect, addCredential);

router.get('/credentials/staff/:staffId', protect, getStaffCredentials);
router.get('/credentials/expiring', protect, authorize('SuperAdmin', 'QualityManager'), getExpiringCredentials);

// Dashboard
router.get('/dashboard', protect, getCPDashboard);

module.exports = router;
