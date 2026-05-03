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

      let ldapUrl = config.ldapUrl;
      let host = ldapUrl.replace(/^ldaps?:\/\//, '');
      if (config.ldapPort && !host.includes(':')) {
        host = `${host}:${config.ldapPort}`;
      }
      const protocol = ldapUrl.startsWith('ldaps://') ? 'ldaps://' : 'ldap://';
      ldapUrl = `${protocol}${host}`;
      
      const client = ldap.createClient({ 
        url: ldapUrl,
        connectTimeout: 10000,
        timeout: 15000
      });

      client.on('error', (err) => {
        console.error(`[${config.configName}] LDAP client error:`, err.message);
      });

      try {
        await new Promise((resolve, reject) => {
          client.bind(config.ldapBindDN, config.ldapBindPassword, async (err) => {
            if (err) {
              client.unbind();
              if (configIndex !== -1) {
                settings.ldapConfigs[configIndex].executionStatus = 'Failed';
                settings.ldapConfigs[configIndex].lastExecutionDate = new Date();
                await settings.save().catch(e => console.error("Error saving settings status:", e));
              }
              return reject(new Error(`[${config.configName}] Bind failed: ` + err.message));
            }

            const searchOptions = {
              filter: config.syncBlockedUsers ? '(&(objectCategory=person)(objectClass=user))' : '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
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

            const userPromises = [];

              client.search(config.ldapBaseDN, searchOptions, (err, res) => {
                if (err) {
                  client.unbind();
                  console.error(`[${config.configName}] Search initiation failed:`, err.message);
                  return reject(new Error(`[${config.configName}] Search failed: ` + err.message));
                }

                console.log(`[${config.configName}] Search initiated with filter: ${searchOptions.filter} and BaseDN: ${config.ldapBaseDN}`);

              res.on('searchEntry', (entry) => {
                console.log(`[${config.configName}] Found entry: ${entry.dn.toString()}`);
                const processUser = async () => {
                  if (!entry || !entry.pojo) return;
                  
                  // Map ldapjs 3.x attributes to a flat object
                  const adUser = {};
                  if (entry.pojo.attributes) {
                    entry.pojo.attributes.forEach(attr => {
                      adUser[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
                    });
                  }
                  
                  const employeeId = adUser.sAMAccountName || adUser.userPrincipalName;
                  
                  if (!employeeId) {
                    // Only log if it's not a computer account (ends with $)
                    if (adUser.cn && !adUser.cn.toString().endsWith('$')) {
                       console.warn(`[${config.configName}] Entry found but missing sAMAccountName/userPrincipalName. Available attributes:`, Object.keys(adUser));
                    }
                    return;
                  }

                  try {
                    let user = await User.findOne({ employeeId });
                    const fullName = adUser[config.ldapNameField] || adUser.displayName || 
                                     (adUser.givenName && adUser.sn ? `${adUser.givenName} ${adUser.sn}` : null) || 
                                     employeeId;
                    
                    const email = adUser[config.ldapEmailField] || adUser.mail || `${employeeId}@internal.com`;
                    
                    if (!user) {
                      const department = adUser.department || adUser.physicalDeliveryOfficeName || 'Unassigned';
                      const designation = adUser.title || adUser.description || 'LDAP User';
                      await User.create({
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
                };
                userPromises.push(processUser());
              });

              res.on('error', (err) => {
                console.error(`[${config.configName}] Search error:`, err.message);
                // Don't reject yet, try to wait for existing promises
              });

              res.on('end', async () => {
                try {
                  console.log(`[${config.configName}] Search ended. Waiting for ${userPromises.length} users to be processed...`);
                  await Promise.all(userPromises);
                  client.unbind();
                  console.log(`[${config.configName}] Sync finished. Processed ${totalSuccessCount} successfully, ${totalFailedCount} failed.`);
                  if (configIndex !== -1) {
                    settings.ldapConfigs[configIndex].executionStatus = 'Success';
                    settings.ldapConfigs[configIndex].lastExecutionDate = new Date();
                    await settings.save().catch(e => console.error("Error saving success status:", e));
                  }
                  resolve();
                } catch (e) {
                  client.unbind();
                  console.error(`[${config.configName}] Final processing error:`, e.message);
                  reject(e);
                }
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
          await settings.save().catch(e => console.error("Error saving failure status:", e));
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
