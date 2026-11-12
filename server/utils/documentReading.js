const Reading = require('../models/DocumentReading');
const Notification = require('../models/Notification');
const policy = require('./documentPolicy');
async function alert(doc, recipient, message, sourceKey, actor) {
  if (!recipient || !actor?._id) return;
  await Notification.updateOne({ sourceKey }, { $setOnInsert: {
    type: 'system_alert', message, user: actor.employeeName || 'Document team', userId: actor._id,
    actionLink: '/dashboard/documents', recipientRole: 'user', recipientIds: [recipient], recipientRoles: [], sourceKey
  } }, { upsert: true });
}
async function recordAccess(doc, user, version, download) {
  const now = new Date(), query = { document: doc._id, version, user: user._id };
  const previous = await Reading.findOne(query);
  const update = download ? { $inc: { downloads: 1 } } : { $inc: { views: 1 }, $set: { lastOpenedAt: now }, $min: { firstOpenedAt: now } };
  try { await Reading.updateOne(query, update, { upsert: true }); }
  catch (error) { if (error.code !== 11000) throw error; await Reading.updateOne(query, update); }
  if (!download && !previous?.firstOpenedAt && doc.notifyOnOpen && String(doc.uploadedBy) !== String(user._id)) {
    await alert(doc, doc.uploadedBy, `${user.employeeName} opened ${doc.name}, version ${version}. Opening does not confirm understanding.`, `doc-open:${doc._id}:${version}:${user._id}`, user).catch(error => console.error('Document view notification failed:', error.message));
  }
}
async function carryAssignments(doc) {
  const previous = doc.versions?.at(-1)?.version;
  if (doc.status !== 'Active' || !previous) return;
  const assigned = await Reading.find({ document: doc._id, version: previous, assignedAt: { $exists: true } }).populate('user');
  for (const item of assigned) {
    if (!item.user || item.user.isActive === false || ['blocked','inactive'].includes(item.user.status) || !policy.readable(item.user, doc)) continue;
    const deadline = new Date(Math.max(Date.now(), new Date(doc.revisedDate).getTime()) + 14 * 86400000);
    await Reading.updateOne({ document: doc._id, version: doc.version, user: item.user._id }, { $setOnInsert: { assignedAt: new Date(), dueDate: deadline } }, { upsert: true });
    await alert(doc, item.user._id, `${doc.name} has a new published version (${doc.version}). Please read it and confirm again within 14 days.`, `doc-revision:${doc._id}:${doc.version}:${item.user._id}`, { _id: policy.id(doc.uploadedBy), employeeName: 'Document team' });
  }
}
module.exports = { alert, recordAccess, carryAssignments };
