const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getOverview } = require('../controllers/dashboardController');
router.get('/overview', protect, getOverview);
module.exports = router;
