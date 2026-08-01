const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getLdapLogs, triggerLdapSync, getAuditLogs, getMailLogs } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/ldap-logs').get(protect, admin, getLdapLogs);
router.route('/ldap-sync').post(protect, admin, triggerLdapSync);
router.route('/ldap-test').post(protect, admin, require('../controllers/settingsController').testLdapConnection);
router.route('/audit-logs').get(protect, admin, getAuditLogs);
router.route('/mail-logs').get(protect, admin, getMailLogs);

router.route('/')
  .get(protect, admin, getSettings)
  .put(protect, admin, updateSettings);

module.exports = router;
