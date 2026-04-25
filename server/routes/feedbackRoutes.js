const express = require('express');
const router = express.Router();
const { getFeedbacks, createFeedback, updateFeedback, deleteFeedback } = require('../controllers/feedbackController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getFeedbacks)
  .post(protect, createFeedback);

router.route('/:id')
  .put(protect, admin, updateFeedback)
  .delete(protect, admin, deleteFeedback);

module.exports = router;
