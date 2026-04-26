const ldap = require('ldapjs');
const Settings = require('../models/Settings');
const User = require('../models/users');
const LdapSyncLog = require('../models/LdapSyncLog');

const syncLDAPUsers = async () => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.ldapConfigs || settings.ldapConfigs.length === 0) {
      console.log("No LDAP configurations found, skipping sync.");
      return null;
    }

    const enabledConfigs = settings.ldapConfigs.filter(c => c.ldapEnabled);
    if (enabledConfigs.length === 0) {
      console.log("No enabled LDAP configurations, skipping sync.");
      return null;
    }

    const logEntry = new LdapSyncLog({ status: 'partial' });
    let totalSuccessCount = 0;
    let totalFailedCount = 0;
    let allImportedUsers = [];
    let allFailedUsers = [];
    let hasErrors = false;

    for (const config of enabledConfigs) {
      const configIndex = settings.ldapConfigs.findIndex(c => c._id.toString() === config._id.toString());
      if (configIndex !== -1) {
        settings.ldapConfigs[configIndex].executionStatus = 'Running';
        await settings.save();
      }

      const client = ldap.createClient({ url: config.ldapUrl });

      try {
        await new Promise((resolve, reject) => {
          client.bind(config.ldapBindDN, config.ldapBindPassword, async (err) => {
            if (err) {
              client.unbind();
              if (configIndex !== -1) {
                settings.ldapConfigs[configIndex].executionStatus = 'Failed';
                settings.ldapConfigs[configIndex].lastExecutionDate = new Date();
                await settings.save();
              }
              return reject(new Error(`[${config.configName}] Failed to bind: ` + err.message));
            }

            // Filter for enabled vs disabled
            let filterString = '(&(objectCategory=person)(objectClass=user))';
            if (!config.syncBlockedUsers) {
              filterString = '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))';
            }

            const searchOptions = {
              filter: filterString,
              scope: 'sub',
              paged: true,
              sizeLimit: 1000,
              attributes: [
                config.ldapEmailField || 'mail', 
                config.ldapNameField || 'displayName', 
                'sAMAccountName',
                'userPrincipalName',
                'givenName',
                'sn',
                'physicalDeliveryOfficeName',
                'title',
                'department',
                'description'
              ]
            };

            client.search(config.ldapBaseDN, searchOptions, (err, res) => {
              if (err) {
                client.unbind();
                if (configIndex !== -1) {
                  settings.ldapConfigs[configIndex].executionStatus = 'Failed';
                  settings.ldapConfigs[configIndex].lastExecutionDate = new Date();
                }
                return reject(new Error(`[${config.configName}] Search failed: ` + err.message));
              }

              res.on('searchEntry', async (entry) => {
                const adUser = entry.object;
                const employeeId = adUser.sAMAccountName || adUser.userPrincipalName;
                
                if (!employeeId) return;

                try {
                  let user = await User.findOne({ employeeId });

                  const fullName = adUser[config.ldapNameField] || adUser.displayName || 
                                   (adUser.givenName && adUser.sn ? `${adUser.givenName} ${adUser.sn}` : null) || 
                                   employeeId;
                  
                  const email = adUser[config.ldapEmailField] || adUser.mail || `${employeeId}@internal.com`;
                  if (!user) {
                    const department = adUser.department || adUser.physicalDeliveryOfficeName || 'Unassigned';
                    const designation = adUser.title || adUser.description || 'LDAP User';
                    user = await User.create({
                      employeeId,
                      employeeName: fullName,
                      email: email,
                      password: Math.random().toString(36).slice(-8),
                      role: 'user', 
                      department: department,
                      designation: designation,
                      status: 'active',
                      authSource: config.configName
                    });
                    allImportedUsers.push({ employeeId, employeeName: fullName, email, status: 'Created', source: config.configName });
                  } else {
                    user.employeeName = fullName;
                    user.email = email;
                    if (adUser.department || adUser.physicalDeliveryOfficeName) {
                       user.department = adUser.department || adUser.physicalDeliveryOfficeName;
                    }
                    if (adUser.title || adUser.description) {
                       user.designation = adUser.title || adUser.description;
                    }
                    user.authSource = config.configName;
                    
                    await user.save();
                    allImportedUsers.push({ employeeId, employeeName: fullName, email, status: 'Updated', source: config.configName });
                  }
                  totalSuccessCount++;
                } catch (userErr) {
                  totalFailedCount++;
                  allFailedUsers.push({ employeeId, reason: userErr.message, source: config.configName });
                }
              });

              res.on('error', (err) => {
                console.error(`[${config.configName}] search error: ` + err.message);
              });

              res.on('end', async () => {
                client.unbind();
                if (configIndex !== -1) {
                  settings.ldapConfigs[configIndex].executionStatus = 'Success';
                  settings.ldapConfigs[configIndex].lastExecutionDate = new Date();
                  await settings.save();
                }
                resolve();
              });
            });
          });
        });
      } catch (err) {
        hasErrors = true;
        totalFailedCount++;
        logEntry.errorMessage = (logEntry.errorMessage || '') + err.message + '\n';
        if (configIndex !== -1) {
          settings.ldapConfigs[configIndex].executionStatus = 'Failed';
          settings.ldapConfigs[configIndex].lastExecutionDate = new Date();
          await settings.save();
        }
      }
    }

    logEntry.totalFetched = totalSuccessCount + totalFailedCount;
    logEntry.successCount = totalSuccessCount;
    logEntry.failedCount = totalFailedCount;
    logEntry.importedUsers = allImportedUsers;
    logEntry.failedUsers = allFailedUsers;
    logEntry.syncedConfigs = enabledConfigs.map(c => c.configName);
    logEntry.status = (totalFailedCount === 0 && !hasErrors && totalSuccessCount > 0) ? 'success' : (totalSuccessCount === 0 ? 'failed' : 'partial');
    
    await logEntry.save();
    return logEntry;

  } catch (err) {
    console.error("LDAP Sync Error:", err);
    return null;
  }
};

module.exports = { syncLDAPUsers };
