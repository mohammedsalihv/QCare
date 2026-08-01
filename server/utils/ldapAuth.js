const ldap = require('ldapjs');
const Settings = require('../models/Settings');

const authenticateLDAP = (username, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const settings = await Settings.findOne();
      if (!settings || !settings.ldapConfigs || settings.ldapConfigs.length === 0) {
        return reject(new Error('LDAP is not configured'));
      }

      const enabledConfigs = settings.ldapConfigs.filter(c => c.ldapEnabled);
      if (enabledConfigs.length === 0) {
        return reject(new Error('No enabled LDAP configurations'));
      }

      let lastError = new Error('Invalid LDAP credentials');

      for (const config of enabledConfigs) {
        try {
          const userObj = await new Promise((res, rej) => {
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
              console.error(`[${config.configName}] LDAP auth client error:`, err.message);
            });

            client.bind(config.ldapBindDN, config.ldapBindPassword, (err) => {
              if (err) {
                client.unbind();
                return rej(err);
              }

              let searchFilter = config.ldapUserFilter.replace('{{username}}', username);
              
              // If the username looks like an email or UPN (contains '@'), make a compound filter to match sAMAccountName, mail, or userPrincipalName
              if (username && username.includes('@')) {
                const parts = username.split('@');
                const userPrefix = parts[0];
                searchFilter = `(|(sAMAccountName=${userPrefix})(sAMAccountName=${username})(mail=${username})(userPrincipalName=${username}))`;
              } else if (username) {
                // If it is a plain username, wrap the configured user filter with common fallbacks (sAMAccountName, uid, userPrincipalName)
                const cleanFilter = searchFilter.startsWith('(') ? searchFilter : `(${searchFilter})`;
                searchFilter = `(|${cleanFilter}(sAMAccountName=${username})(uid=${username})(userPrincipalName=${username}))`;
              }
              
              // Also prevent login if user is blocked in AD and syncBlockedUsers is false
              let finalFilter = searchFilter;
              if (!config.syncBlockedUsers) {
                // Exclude disabled AD accounts (userAccountControl bit 2 = disabled)
                if (searchFilter.startsWith('(&')) {
                  // Already a compound filter — insert UAC exclusion inside the existing (&...)
                  finalFilter = searchFilter.slice(0, 2) + '(!(userAccountControl:1.2.840.113556.1.4.803:=2))' + searchFilter.slice(2);
                } else {
                  finalFilter = `(&${searchFilter}(!(userAccountControl:1.2.840.113556.1.4.803:=2)))`;
                }
              }

              const searchOptions = {
                filter: finalFilter,
                scope: 'sub',
                attributes: [
                  config.ldapEmailField || 'mail',
                  config.ldapNameField || 'displayName',
                  // Note: 'dn' is NOT a valid LDAP attribute — it's always in entry.dn / entry.pojo.objectName
                  'givenName',
                  'sn',
                  'physicalDeliveryOfficeName',
                  'title',
                  'department',
                  'description',
                  'sAMAccountName',
                  'userPrincipalName'
                ]
              };

              client.search(config.ldapBaseDN, searchOptions, (err, response) => {
                if (err) {
                  client.unbind();
                  return rej(err);
                }

                let userFound = null;

                response.on('searchEntry', (entry) => {
                  // ldapjs 3.x uses entry.pojo.attributes instead of entry.object
                  if (entry && entry.pojo && entry.pojo.attributes) {
                    const adUser = {};
                    entry.pojo.attributes.forEach(attr => {
                      adUser[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
                    });
                    // Preserve the DN for user-bind authentication
                    adUser.dn = entry.dn ? entry.dn.toString() : (entry.pojo.objectName || '');
                    userFound = adUser;
                  }
                });

                response.on('error', (err) => {
                  client.unbind();
                  rej(err);
                });

                response.on('end', () => {
                  if (!userFound) {
                    client.unbind();
                    return rej(new Error('User not found in LDAP'));
                  }

                  // Authenticate user with their own DN and password
                  let userLdapUrl = config.ldapUrl;
                  let userHost = userLdapUrl.replace(/^ldaps?:\/\//, '');
                  if (config.ldapPort && !userHost.includes(':')) {
                    userHost = `${userHost}:${config.ldapPort}`;
                  }
                  const userProtocol = userLdapUrl.startsWith('ldaps://') ? 'ldaps://' : 'ldap://';
                  userLdapUrl = `${userProtocol}${userHost}`;

                  const userClient = ldap.createClient({ 
                    url: userLdapUrl,
                    connectTimeout: 10000,
                    timeout: 15000
                  });

                  userClient.on('error', (err) => {
                    console.error(`[${config.configName}] LDAP user-bind client error:`, err.message);
                  });

                  userClient.bind(userFound.dn, password, (err) => {
                    userClient.unbind();
                    client.unbind();
                    if (err) return rej(new Error('Invalid LDAP credentials'));

                    res({
                      email: userFound[config.ldapEmailField] || userFound.mail,
                      name: userFound[config.ldapNameField] || userFound.displayName,
                      username: username,
                      sAMAccountName: userFound.sAMAccountName,
                      userPrincipalName: userFound.userPrincipalName,
                      firstName: userFound.givenName,
                      lastName: userFound.sn,
                      office: userFound.physicalDeliveryOfficeName,
                      designation: userFound.title || userFound.description,
                      department: userFound.department
                    });
                  });
                });
              });
            });
          });

          // If we reach here, authentication succeeded!
          return resolve(userObj);
        } catch (err) {
          lastError = err;
          // Continue to the next LDAP configuration
        }
      }

      // If loop finishes without resolving, all attempts failed
      reject(lastError);

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { authenticateLDAP };
