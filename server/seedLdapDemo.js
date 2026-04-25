const mongoose = require('mongoose');
const Settings = require('./models/Settings');

const MONGO_URL = 'mongodb://localhost:27017/QCare';

const seedLdap = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB.');

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.ldapConfigs.push({
      configName: "Forumsys Public Test LDAP",
      ldapEnabled: true,
      ldapUrl: "ldap://ldap.forumsys.com:389",
      ldapBaseDN: "dc=example,dc=com",
      ldapBindDN: "cn=read-only-admin,dc=example,dc=com",
      ldapBindPassword: "password",
      ldapUserFilter: "(uid={{username}})",
      ldapEmailField: "mail",
      ldapNameField: "cn",
      syncBlockedUsers: false
    });

    await settings.save();
    console.log('Demo LDAP configuration (forumsys) added successfully!');
    process.exit();
  } catch (err) {
    console.error('Failed to add demo config:', err);
    process.exit(1);
  }
};

seedLdap();
