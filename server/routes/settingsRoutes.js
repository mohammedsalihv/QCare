const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getLdapLogs, triggerLdapSync } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/ldap-logs').get(protect, admin, getLdapLogs);
router.route('/ldap-sync').post(protect, admin, triggerLdapSync);

router.route('/')
  .get(protect, admin, getSettings)
  .put(protect, admin, updateSettings);

module.exports = router;
