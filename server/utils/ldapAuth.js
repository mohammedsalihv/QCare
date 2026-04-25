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
            const client = ldap.createClient({ url: config.ldapUrl });

            client.bind(config.ldapBindDN, config.ldapBindPassword, (err) => {
              if (err) {
                client.unbind();
                return rej(err);
              }

              const searchFilter = config.ldapUserFilter.replace('{{username}}', username);
              
              // Also prevent login if user is blocked in AD and syncBlockedUsers is false
              let finalFilter = searchFilter;
              if (!config.syncBlockedUsers) {
                // If the filter isn't already wrapped in (&), we wrap it.
                if (searchFilter.startsWith('(&')) {
                  finalFilter = searchFilter.replace('(&', '(&(!(userAccountControl:1.2.840.113556.1.4.803:=2))');
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
                  'dn',
                  'givenName',
                  'sn',
                  'physicalDeliveryOfficeName',
                  'title',
                  'department',
                  'description'
                ]
              };

              client.search(config.ldapBaseDN, searchOptions, (err, response) => {
                if (err) {
                  client.unbind();
                  return rej(err);
                }

                let userFound = null;

                response.on('searchEntry', (entry) => {
                  userFound = entry.object;
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
                  const userClient = ldap.createClient({ url: config.ldapUrl });
                  userClient.bind(userFound.dn, password, (err) => {
                    userClient.unbind();
                    client.unbind();
                    if (err) return rej(new Error('Invalid LDAP credentials'));

                    res({
                      email: userFound[config.ldapEmailField] || userFound.mail,
                      name: userFound[config.ldapNameField] || userFound.displayName,
                      username: username,
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
