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
  let { ldapUrl, ldapPort, ldapBindDN, ldapBindPassword } = req.body;
  
  const ldap = require('ldapjs');
  
  // Ensure the URL has the correct protocol and port
  if (ldapUrl) {
    // Remove protocol if present to normalize
    let host = ldapUrl.replace(/^ldaps?:\/\//, '');
    
    // If port is specified separately, append it if not already in host
    if (ldapPort && !host.includes(':')) {
      host = `${host}:${ldapPort}`;
    }
    
    const protocol = ldapUrl.startsWith('ldaps://') ? 'ldaps://' : 'ldap://';
    ldapUrl = `${protocol}${host}`;
  }
  
  try {
    const client = ldap.createClient({ url: ldapUrl, connectTimeout: 5000, timeout: 5000 });

    // Catch error events to prevent node from crashing on unhandled 'error' events
    client.on('error', (err) => {
      console.error('LDAP Test Client Error:', err);
    });

    client.bind(ldapBindDN, ldapBindPassword, (err) => {
      if (err) {
        client.unbind((unbindErr) => {});
        return res.status(400).json({ message: `Connection failed: ${err.message}` });
      }
      client.unbind((unbindErr) => {});
      res.json({ message: 'LDAP Connection Successful!' });
    });
  } catch (err) {
    return res.status(400).json({ message: `Invalid LDAP URL or setup: ${err.message}` });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getLdapLogs,
  triggerLdapSync,
  testLdapConnection
};
