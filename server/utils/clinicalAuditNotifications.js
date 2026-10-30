const event = require('./workflowNotifications');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const ClinicalAudit = require('../models/ClinicalAudit');

const isQuality = user => ['quality', 'qualitymanager', 'superadmin'].includes(user?.role?.trim().toLowerCase());
async function requestApproval(audit) {
  if (mongoose.connection.readyState !== 1 || audit.status !== 'pending-approval') return;
  const prefix = `audit-approval:${audit._id}:`;
  const sourceKey = prefix + (audit.__v || 0);
  await Notification.updateMany({ resolvedAt: null, sourceKey: { $regex: `^${prefix}`, $ne: sourceKey } }, { $set: { resolvedAt: new Date(), actionLink: '/dashboard/audit' } });
  await event({ module: 'Audit schedule', recordId: audit._id, title: audit.auditTitle, status: 'Awaiting approval', actor: audit.scheduleRequestedBy || audit.history?.[0]?.actor,
   requester: audit.scheduleRequestedBy || audit.history?.[0]?.actor, at: audit.scheduleRequestedAt || new Date(), sourceKey,
   actionLink: '/dashboard/audit?approval=' + audit._id, recipientRoles: ['qualitymanager'] });
}
async function resolve(audit, reason, actor) {
  if (mongoose.connection.readyState !== 1) return;
  if (actor) await event({ module: 'Audit schedule', recordId: audit._id, title: audit.auditTitle, status: reason === 'approved' ? 'Approved' : reason === 'rejected' ? 'Rejected' : 'Deleted', actor,
   requester: audit.scheduleRequestedBy || audit.history?.[0]?.actor, reason: audit.scheduleRejectionReason || audit.scheduleApprovalComment || '',
   actionLink: '/dashboard/audit', sourceKey: 'audit-decision:' + audit._id + ':' + audit.__v + ':' + reason, recipientRoles: ['qualitymanager'] });
  await Notification.updateMany({ sourceKey: { $regex: `^audit-approval:${audit._id}:` }, resolvedAt: null }, { $set: { resolvedAt: new Date(), actionLink: '/dashboard/audit' } });
}
async function syncPending() {
  const audits = await ClinicalAudit.find({ status: 'pending-approval' }).select('_id auditTitle status __v scheduleRequestedBy scheduleRequestedAt history.actor');
  for (const audit of audits) await requestApproval(audit);
}
module.exports = { isQuality, requestApproval, resolve, syncPending };
