const { isQuality } = require('./clinicalAuditNotifications');
module.exports = user => {
  const role = user.role?.toLowerCase();
  const roles = role === 'superadmin' ? ['all', 'admin', 'superadmin', 'qualitymanager'] : role === 'admin' ? ['all', 'admin'] : isQuality(user) ? ['all', 'qualitymanager'] : ['all'];
  return { $or: [{ recipientRole: { $in: roles } }, { recipientId: user._id }] };
};
