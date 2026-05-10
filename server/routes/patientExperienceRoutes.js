const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  acknowledgeComplaint,
  updateComplaint,
  resolveComplaint,
  escalateComplaint,
  getDashboardStats,
  generateSurveyToken,
  getSurveyByToken,
  submitSurvey,
  getSurveyResults
} = require('../controllers/patientExperienceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Complaints (Internal)
router.route('/complaints')
  .post(protect, createComplaint)
  .get(protect, getComplaints);

router.get('/complaints/dashboard', protect, getDashboardStats);

router.route('/complaints/:id')
  .get(protect, getComplaintById)
  .put(protect, updateComplaint);

router.put('/complaints/:id/acknowledge', protect, authorize('QualityManager', 'SuperAdmin', 'DepartmentHead'), acknowledgeComplaint);
router.put('/complaints/:id/resolve', protect, authorize('QualityManager', 'SuperAdmin'), resolveComplaint);
router.put('/complaints/:id/escalate', protect, authorize('QualityManager', 'SuperAdmin'), escalateComplaint);

// Surveys (Internal)
router.post('/surveys/generate', protect, generateSurveyToken);
router.get('/surveys/results', protect, getSurveyResults);

// Surveys (Public - No Auth)
router.get('/surveys/fill/:token', getSurveyByToken);
router.post('/surveys/submit/:token', submitSurvey);

module.exports = router;
