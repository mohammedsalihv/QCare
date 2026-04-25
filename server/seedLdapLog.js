const mongoose = require('mongoose');
const LdapSyncLog = require('./models/LdapSyncLog');

const MONGO_URL = 'mongodb://localhost:27017/QCare';

const seedLdapLog = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB.');

    // Remove old logs so the clean one is easy to see
    await LdapSyncLog.deleteMany({});

    const demoLog = await LdapSyncLog.create({
      status: "partial",
      successCount: 42,
      failedCount: 2,
      totalFetched: 44,
      syncedConfigs: ["Primary AD", "Forumsys Public Test LDAP"],
      importedUsers: [
        { employeeId: "tesla", employeeName: "Nikola Tesla", email: "tesla@ldap.forumsys.com", status: "Created", source: "Forumsys Public Test LDAP" },
        { employeeId: "einstein", employeeName: "Albert Einstein", email: "einstein@ldap.forumsys.com", status: "Updated", source: "Forumsys Public Test LDAP" },
        { employeeId: "newton", employeeName: "Isaac Newton", email: "newton@internal.com", status: "Updated", source: "Primary AD" },
        { employeeId: "curie", employeeName: "Marie Curie", email: "curie@internal.com", status: "Created", source: "Primary AD" }
      ],
      failedUsers: [
        { employeeId: "galileo", reason: "Invalid email format from Active Directory", source: "Forumsys Public Test LDAP" },
        { employeeId: "unknown_user", reason: "Missing required 'department' attribute", source: "Primary AD" }
      ],
      errorMessage: "Some users failed validation during the sync process. See failed users list for details."
    });

    console.log('Demo LDAP Sync Log with sources created successfully!');
    process.exit();
  } catch (err) {
    console.error('Failed to create demo log:', err);
    process.exit(1);
  }
};

seedLdapLog();
