const Settings = require('../models/Settings');
const LdapSyncLog = require('../models/LdapSyncLog');
const AuditLog = require('../models/AuditLog');
const MailLog = require('../models/MailLog');
const User = require('../models/users');
const Designation = require('../models/Designation');
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
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.__v;
      Object.assign(settings, updateData);
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
    const { configId } = req.body;
    const result = await syncLDAPUsers(configId);
    if (!result) {
      return res.status(400).json({ message: 'LDAP is disabled, failed to start, or configuration not found.' });
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

const seedDemoDataIfEmpty = async () => {
  try {
    // Seed default designations if empty
    const designationCount = await Designation.countDocuments({});
    if (designationCount === 0) {
      console.log('Seeding demo designations...');
      const designationsToSeed = [
        { title: 'Chief Medical Officer', code: 'CMO', grade: 'Grade 12', description: 'Overall executive lead of clinical operations', status: 'Active' },
        { title: 'Consultant Physician', code: 'CONS-PHY', grade: 'Grade 10', description: 'Specialized consultant doctor with clinical privileges', status: 'Active' },
        { title: 'Registered Nurse', code: 'RN', grade: 'Grade 6', description: 'Staff nurse with license from DOH/DHA', status: 'Active' },
        { title: 'Quality Assurance Coordinator', code: 'QA-COORD', grade: 'Grade 8', description: 'Coordinator for QMS activities and compliance monitoring', status: 'Active' },
        { title: 'Junior Laboratory Technician', code: 'JR-TECH', grade: 'Grade 4', description: 'Entry level lab technician under supervision', status: 'Inactive' }
      ];
      await Designation.insertMany(designationsToSeed);
    }

    // 1. Check if we need to seed users
    const usersToSeed = [
      { employeeId: 'EMP-YAHIYA', employeeName: 'YAHIYA MANNOOPARAMBIL', email: 'yahiya.m@cmcholding.local', department: 'OFFCE-IT', designation: 'IT MANAGER', role: 'admin', status: 'active', password: 'password123' },
      { employeeId: 'EMP-AZAD', employeeName: 'AZAD CHEERAM KULANGARA', email: 'azad.c@cmcholding.local', department: 'CMCPS - ACCOUNTS & FINANCE', designation: 'ACCOUNTANT', role: 'user', status: 'active', password: 'password123' },
      { employeeId: 'EMP-AMIRA', employeeName: 'AMIRA IBRAHIM AHMED MOHAMED', email: 'amira.i@cmcholding.local', department: 'CMCSC RECEPTION & CALL CENTER', designation: 'RECEPTIONIST', role: 'user', status: 'active', password: 'password123' },
      { employeeId: 'EMP-NISHAD', employeeName: 'NISHAD KUNHAHAMMED', email: 'nishad.k@cmcholding.local', department: 'OFFCE-BIOMEDICAL', designation: 'BIOMEDICAL COORDINATOR', role: 'user', status: 'active', password: 'password123' }
    ];

    const seededUsers = {};
    for (const u of usersToSeed) {
      let dbUser = await User.findOne({ employeeName: u.employeeName });
      if (!dbUser) {
        dbUser = await User.create(u);
      }
      seededUsers[u.employeeName] = dbUser._id;
    }

    // 2. Check if AuditLog is empty
    const auditCount = await AuditLog.countDocuments({});
    if (auditCount === 0) {
      console.log('Seeding demo audit logs...');
      const auditLogsToSeed = [
        {
          action: 'USER_LOGGED_IN',
          module: 'Main Master',
          pageName: 'Login',
          activity: "User 'YAHIYA MANNOOPARAMBIL' Logged In",
          performedBy: seededUsers['YAHIYA MANNOOPARAMBIL'],
          ipAddress: '192.168.1.160',
          createdAt: new Date('2026-06-27T18:12:00Z'),
          timestamp: new Date('2026-06-27T18:12:00Z')
        },
        {
          action: 'USER_LOGGED_IN',
          module: 'Main Master',
          pageName: 'Login',
          activity: "User 'AZAD CHEERAM KULANGARA' Logged In",
          performedBy: seededUsers['AZAD CHEERAM KULANGARA'],
          ipAddress: '192.168.1.15',
          createdAt: new Date('2026-06-27T15:21:00Z'),
          timestamp: new Date('2026-06-27T15:21:00Z')
        },
        {
          action: 'REPORT_INCIDENT_ADDED',
          module: 'Incident Module',
          pageName: 'Report Incident',
          activity: 'Clicked Add Button to Add Report Incident',
          performedBy: seededUsers['AMIRA IBRAHIM AHMED MOHAMED'],
          ipAddress: '192.168.1.42',
          createdAt: new Date('2026-06-27T14:28:00Z'),
          timestamp: new Date('2026-06-27T14:28:00Z')
        },
        {
          action: 'UNAUTHORIZED_ACCESS',
          module: 'Main Master',
          pageName: 'Login',
          activity: 'Unauthorized Access - Tried to Login with Invalid Employee ID/Password',
          performedBy: null,
          ipAddress: '192.168.1.160',
          createdAt: new Date('2026-06-27T14:20:00Z'),
          timestamp: new Date('2026-06-27T14:20:00Z')
        },
        {
          action: 'UNAUTHORIZED_ACCESS',
          module: 'Main Master',
          pageName: 'Login',
          activity: 'Unauthorized Access - Tried to Login with Invalid Employee ID/Password',
          performedBy: null,
          ipAddress: '192.168.1.160',
          createdAt: new Date('2026-06-27T14:20:00Z'),
          timestamp: new Date('2026-06-27T14:20:00Z')
        },
        {
          action: 'UNAUTHORIZED_ACCESS',
          module: 'Main Master',
          pageName: 'Login',
          activity: 'Unauthorized Access - Tried to Login with Invalid Employee ID/Password',
          performedBy: null,
          ipAddress: '192.168.1.160',
          createdAt: new Date('2026-06-27T14:20:00Z'),
          timestamp: new Date('2026-06-27T14:20:00Z')
        },
        {
          action: 'UNAUTHORIZED_ACCESS',
          module: 'Main Master',
          pageName: 'Login',
          activity: 'Unauthorized Access - Tried to Login with Invalid Employee ID/Password',
          performedBy: null,
          ipAddress: '192.168.1.160',
          createdAt: new Date('2026-06-27T14:20:00Z'),
          timestamp: new Date('2026-06-27T14:20:00Z')
        },
        {
          action: 'UNAUTHORIZED_ACCESS',
          module: 'Main Master',
          pageName: 'Login',
          activity: 'Unauthorized Access - Tried to Login with Invalid Employee ID/Password',
          performedBy: null,
          ipAddress: '192.168.1.19',
          createdAt: new Date('2026-06-27T14:19:00Z'),
          timestamp: new Date('2026-06-27T14:19:00Z')
        },
        {
          action: 'INDICATOR_ADDED',
          module: 'KPI Module',
          pageName: 'Indicator Data Submission',
          activity: "Clicked Add Button to Add 'Biomedical Preventive Maintenance Completion rate' Indicator Name",
          performedBy: seededUsers['NISHAD KUNHAHAMMED'],
          ipAddress: '192.168.1.55',
          createdAt: new Date('2026-06-27T13:15:00Z'),
          timestamp: new Date('2026-06-27T13:15:00Z')
        }
      ];
      await AuditLog.insertMany(auditLogsToSeed);
    }

    // 3. Check if MailLog is empty
    const mailCount = await MailLog.countDocuments({});
    if (mailCount === 0) {
      console.log('Seeding demo mail logs...');
      const mailLogsToSeed = [
        {
          moduleName: 'Privilege Module',
          pageName: 'Apply/Renew Privilege',
          mailSubject: 'Apply/Renew Main Privilege Approval Request',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.shaza@canadiancmc.com',
          toMailUserName: 'SHAZA YOUSIF ABDELMAGID ELAGAMI',
          submittedBy: 'YASIR ELAGAMI ABDELMAGID ELAGAMI',
          sentAt: new Date('2026-06-25T16:51:00Z')
        },
        {
          moduleName: 'Privilege Module',
          pageName: 'Apply/Renew Privilege',
          mailSubject: 'Privilege Submission',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.yasir.elagami@canadiancmc.com',
          toMailUserName: 'YASIR ELAGAMI ABDELMAGID ELAGAMI',
          submittedBy: 'YASIR ELAGAMI ABDELMAGID ELAGAMI',
          sentAt: new Date('2026-06-25T16:54:00Z')
        },
        {
          moduleName: 'Main Master',
          pageName: 'Staff Master',
          mailSubject: 'Login Credentials',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.emadeldin.elshair@alriyadhcmc.com',
          toMailUserName: 'EMADELDIN TOUFIK MABROUK ELSHAIR',
          submittedBy: 'CHRISTINA REYES NELMIDA',
          sentAt: new Date('2026-06-25T16:36:00Z')
        },
        {
          moduleName: 'Privilege Module',
          pageName: 'Apply/Renew Privilege',
          mailSubject: 'Apply/Renew Main Privilege Approval Request',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.kanaan@canadiancmc.com',
          toMailUserName: 'KANAAN SHARIF',
          submittedBy: 'ABDULQADER AMINA ABUZAID',
          sentAt: new Date('2026-06-25T16:31:00Z')
        },
        {
          moduleName: 'Privilege Module',
          pageName: 'Apply/Renew Privilege',
          mailSubject: 'Apply/Renew Main Privilege Approval Request',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.abdulqader.abuzaid@canadiancmc.com',
          toMailUserName: 'ABDULQADER AMINA ABUZAID',
          submittedBy: 'ABDULQADER AMINA ABUZAID',
          sentAt: new Date('2026-06-25T16:31:00Z')
        },
        {
          moduleName: 'Main Master',
          pageName: 'Staff Master',
          mailSubject: 'Login Credentials',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.yasir.elagami@canadiancmc.com',
          toMailUserName: 'YASIR ELAGAMI ABDELMAGID ELAGAMI',
          submittedBy: 'CHRISTINA REYES NELMIDA',
          sentAt: new Date('2026-06-25T15:53:00Z')
        },
        {
          moduleName: 'Main Master',
          pageName: 'Staff Master',
          mailSubject: 'Login Credentials',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'dr.abdulqader.abuzaid@canadiancmc.com',
          toMailUserName: 'ABDULQADER AMINA ABUZAID',
          submittedBy: 'CHRISTINA REYES NELMIDA',
          sentAt: new Date('2026-06-25T15:47:00Z')
        },
        {
          moduleName: 'Incident',
          pageName: 'Incident',
          mailSubject: 'Incident Investigation Reminder(CMC-IR-',
          fromMail: 'qsolutions@canadiancmc.com',
          toMail: 'maryam.alshkeili@canadiancmc.com',
          toMailUserName: 'MARYAM YAHYA SAIF SALEM',
          submittedBy: 'JIJOY MICHAEL',
          sentAt: new Date('2026-06-24T09:19:00Z')
        }
      ];
      await MailLog.insertMany(mailLogsToSeed);
    }
  } catch (err) {
    console.error('Error auto-seeding demo logs:', err);
  }
};

// @desc    Get system audit logs
// @route   GET /api/settings/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    await seedDemoDataIfEmpty();
    const logs = await AuditLog.find({})
      .populate('performedBy', 'employeeName email employeeId department designation')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get system mail logs
// @route   GET /api/settings/mail-logs
// @access  Private/Admin
const getMailLogs = async (req, res) => {
  try {
    await seedDemoDataIfEmpty();
    const logs = await MailLog.find({})
      .sort({ sentAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getLdapLogs,
  triggerLdapSync,
  testLdapConnection,
  getAuditLogs,
  getMailLogs
};
