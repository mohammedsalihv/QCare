const Document = require('../models/Document');
const Reading = require('../models/DocumentReading');
const User = require('../models/users');
const policy = require('./documentPolicy');
const { alert } = require('./documentReading');
module.exports = async function documentReminders(now = new Date()) {
  const day = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
  const docs = await Document.find({ status: 'Active' }).populate('uploadedBy', 'employeeName');
  for (const doc of docs) {
    if (!doc.uploadedBy?._id) continue;
    await require('./documentReading').carryAssignments(doc);
    for (const [field, label] of [['nextRevDate', 'review'], ['expiryDate', 'expiry']]) {
      if (!doc[field]) continue;
      const days = Math.ceil((doc[field] - now) / 86400000);
      const band = days <= 0 ? 'overdue' : days <= 7 ? '7 days' : days <= 30 ? '30 days' : days <= 60 ? '60 days' : null;
      if (band) await alert(doc, doc.uploadedBy._id, `${doc.name}: ${label} ${days <= 0 ? 'date has been reached' : `is due within ${band}`}.`, `doc-date:${doc._id}:${field}:${doc[field].toISOString()}:${band}`, doc.uploadedBy);
    }
    const readings = await Reading.find({ document: doc._id, version: doc.version }).populate('user');
    let pending = 0, read = 0, opened = 0;
    for (const item of readings) {
      if (!item.user || item.user.isActive === false || ['blocked','inactive'].includes(item.user.status) || !policy.readable(item.user, doc)) continue;
      if (item.firstOpenedAt) opened++;
      if (item.acknowledgedAt) read++;
      if (item.assignedAt && !item.acknowledgedAt) {
        pending++;
        if (item.dueDate && item.dueDate <= new Date(now.getTime() + 7 * 86400000)) await alert(doc, item.user._id, `Reminder: please read ${doc.name}, version ${doc.version}, and confirm you have understood it.`, `doc-reading:${item._id}:${day}`, doc.uploadedBy);
      }
    }
    if (readings.some(item => item.assignedAt)) await alert(doc, doc.uploadedBy._id, `${doc.name}, version ${doc.version}: ${opened} opened, ${read} confirmed reading, ${pending} still awaiting confirmation.`, `doc-summary:${doc._id}:${doc.version}:${day}`, doc.uploadedBy);
    if (pending && readings.some(item => item.assignedAt && !item.acknowledgedAt && item.dueDate < now)) {
      const managers = await User.find({ role: 'QualityManager', isActive: { $ne: false }, status: { $nin: ['blocked','inactive'] }, department: doc.department });
      for (const manager of managers) await alert(doc, manager._id, `${doc.name} has overdue reading confirmations. Please follow up with the document owner.`, `doc-escalation:${doc._id}:${doc.version}:${manager._id}:${day}`, doc.uploadedBy);
    }
  }
};
