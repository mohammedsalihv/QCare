const Settings = require('../models/Settings');
const LdapSyncLog = require('../models/LdapSyncLog');
const { syncLDAPUsers } = require('../utils/ldapSync');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get LDAP sync logs
// @route   GET /api/settings/ldap-logs
// @access  Private/Admin
const getLdapLogs = async (req, res) => {
  try {
    const logs = await LdapSyncLog.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Trigger LDAP sync manually
// @route   POST /api/settings/ldap-sync
// @access  Private/Admin
const triggerLdapSync = async (req, res) => {
  try {
    const result = await syncLDAPUsers();
    if (!result) {
      return res.status(400).json({ message: 'LDAP is disabled or failed to start.' });
    }
    res.json({ message: 'Sync completed', data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Test LDAP Connection
// @route   POST /api/settings/ldap-test
// @access  Private/Admin
const testLdapConnection = async (req, res) => {
  const { ldapUrl, ldapBindDN, ldapBindPassword } = req.body;
  
  const ldap = require('ldapjs');
  const client = ldap.createClient({ url: ldapUrl, connectTimeout: 5000, timeout: 5000 });

  client.bind(ldapBindDN, ldapBindPassword, (err) => {
    if (err) {
      client.unbind();
      return res.status(400).json({ message: `Connection failed: ${err.message}` });
    }
    client.unbind();
    res.json({ message: 'LDAP Connection Successful!' });
  });
};

module.exports = {
  getSettings,
  updateSettings,
  getLdapLogs,
  triggerLdapSync,
  testLdapConnection
};
