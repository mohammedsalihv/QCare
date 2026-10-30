const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const ClinicalAudit = require('../models/ClinicalAudit');

const isQuality = user => ['quality', 'qualitymanager', 'superadmin'].includes(user?.role?.trim().toLowerCase());
async function requestApproval(audit) {
  if (mongoose.connection.readyState !== 1 || audit.status !== 'pending-approval') return;
  const prefix = `audit-approval:${audit._id}:`;
  const sourceKey = prefix + (audit.__v || 0);
  await Notification.updateMany({ resolvedAt: null, sourceKey: { $regex: `^${prefix}`, $ne: sourceKey } }, { $set: { resolvedAt: new Date(), actionLink: '/dashboard/audit', message: `Audit schedule request updated: ${audit.auditTitle}. Review the latest request.` } });
  await Notification.updateOne({ sourceKey }, { $setOnInsert: {
    sourceKey, type: 'system_alert', recipientRole: 'qualitymanager', user: 'Clinical audit',
    userId: audit.scheduleRequestedBy || audit.history?.[0]?.actor,
    message: `QM approval required: ${audit.auditTitle}. Review the proposed dates and times before calendar publication.`,
    actionLink: `/dashboard/audit?approval=${audit._id}`, readBy: [], deletedBy: []
  } }, { upsert: true, runValidators: true }).catch(error => { if (error.code !== 11000) throw error; });
}
async function resolve(audit, reason) {
  if (mongoose.connection.readyState !== 1) return;
  await Notification.updateMany({ sourceKey: { $regex: `^audit-approval:${audit._id}:` }, resolvedAt: null }, { $set: { resolvedAt: new Date(), message: `Audit schedule ${reason}: ${audit.auditTitle}.`, actionLink: '/dashboard/audit' } });
}
async function syncPending() {
  const audits = await ClinicalAudit.find({ status: 'pending-approval' }).select('_id auditTitle status __v scheduleRequestedBy history.actor');
  for (const audit of audits) await requestApproval(audit);
}
module.exports = { isQuality, requestApproval, resolve, syncPending };
