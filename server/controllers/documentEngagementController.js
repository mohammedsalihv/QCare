const mongoose = require('mongoose');
const Document = require('../models/Document');
const Reading = require('../models/DocumentReading');
const User = require('../models/users');
const policy = require('../utils/documentPolicy');
const { alert } = require('../utils/documentReading');
const fail = (status, message) => { throw Object.assign(Error(message), { status }); };
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (error) { res.status(error.name === 'VersionError' ? 409 : error.status || 400).json({ message: error.name === 'VersionError' ? 'Document changed. Refresh and try again.' : error.message }); } };
async function load(req) {
  if (!mongoose.isValidObjectId(req.params.id)) fail(404, 'Document not found.');
  const doc = await Document.findById(req.params.id);
  if (!doc || !policy.readable(req.user, doc)) fail(404, 'Document not available to you.');
  return doc;
}
exports.reading = wrap(async (req, res) => {
  const doc = await load(req), team = policy.workspace(req.user, doc);
  const readings = await Reading.find({ document: doc._id, version: doc.version, ...(team ? {} : { user: req.user._id }) }).populate('user', 'employeeName').lean();
  res.set('Cache-Control', 'no-store').json({ version: doc.version, team, mine: readings.find(row => policy.id(row.user) === policy.id(req.user._id)), rows: team ? readings : [], notifyOnOpen: doc.notifyOnOpen });
});
exports.readingTasks = wrap(async (req, res) => {
  const tasks = await Reading.find({ user: req.user._id, assignedAt: { $exists: true } }).populate('document').lean();
  res.set('Cache-Control', 'no-store').json(tasks.filter(row => row.document && row.version === row.document.version && policy.readable(req.user, row.document) && row.document.status === 'Active').map(row => ({ documentId: String(row.document._id), name: row.document.name, version: row.version, dueDate: row.dueDate, acknowledgedAt: row.acknowledgedAt })));
});
exports.assign = wrap(async (req, res) => {
  const doc = await load(req);
  if (!policy.manage(req.user, doc) || doc.status !== 'Active') fail(403, 'Only the document owner or team can assign reading for a published document.');
  if (doc.revisedDate > new Date() || (doc.expiryDate && doc.expiryDate < new Date())) fail(409, 'Reading can only be assigned for a currently effective document.');
  if (req.body.version !== doc.version) fail(409, 'The published version changed. Refresh first.');
  const ids = req.body.readers;
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || !ids.every(id => typeof id === 'string' && mongoose.isValidObjectId(id))) fail(400, 'Choose between 1 and 100 readers.');
  if (typeof req.body.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(req.body.dueDate) || !Number.isFinite(Date.parse(req.body.dueDate)) || new Date(req.body.dueDate).toISOString().slice(0,10) !== req.body.dueDate) fail(400, 'Choose a valid reading deadline.');
  const dueDate = new Date(req.body.dueDate + 'T23:59:59+04:00');
  if (dueDate < new Date()) fail(400, 'The reading deadline must not be in the past.');
  const people = await User.find({ _id: { $in: [...new Set(ids)] }, isActive: { $ne: false }, status: { $nin: ['blocked', 'inactive'] } });
  if (people.length !== new Set(ids).size || people.some(person => !policy.readable(person, doc))) fail(400, 'Every reader must be active and already permitted to view this document.');
  // Compare-and-save ensures publication cannot silently race the assignment decision.
  doc.history.push({ action: 'Reading assigned', actorId: req.user._id, actorName: req.user.employeeName, at: new Date(), version: doc.version, reason: `Assigned to ${people.length} reader(s), due ${req.body.dueDate}.` });
  doc.notifyOnOpen = req.body.notifyOnOpen === true; await doc.save();
  for (const person of people) {
    await Reading.updateOne({ document: doc._id, version: doc.version, user: person._id }, { $set: { dueDate }, $setOnInsert: { assignedAt: new Date() } }, { upsert: true });
    // Existing viewers also need an assignment timestamp.
    await Reading.updateOne({ document: doc._id, version: doc.version, user: person._id, assignedAt: { $exists: false } }, { $set: { assignedAt: new Date() } });
    await alert(doc, person._id, `Please read ${doc.name}, version ${doc.version}, and confirm by ${req.body.dueDate}.`, `doc-assign:${doc._id}:${doc.version}:${person._id}:${req.body.dueDate}`, req.user);
  }
  res.json({ message: 'Reading assigned. Readers have been notified.' });
});
exports.acknowledge = wrap(async (req, res) => {
  const doc = await load(req);
  if (doc.status !== 'Active' || req.body.version !== doc.version) fail(409, 'Only the current published version can be acknowledged.');
  if (doc.revisedDate > new Date() || (doc.expiryDate && doc.expiryDate < new Date())) fail(409, 'This document is not currently effective.');
  const reading = await Reading.findOne({ document: doc._id, version: doc.version, user: req.user._id });
  if (!reading?.firstOpenedAt && !reading?.downloads) fail(400, 'Open or download this version before confirming that you have read it.');
  await Reading.updateOne({ _id: reading._id, acknowledgedAt: { $exists: false } }, { $set: { acknowledgedAt: new Date() } });
  res.json({ message: 'Your reading confirmation has been recorded for this version.' });
});
exports.delegate = wrap(async (req, res) => {
  const doc = await load(req);
  if (doc.draftState !== 'In review' || !(policy.controller(req.user) || policy.id(doc.assignedApprover) === policy.id(req.user._id))) fail(403, 'Only the assigned approver or document team can delegate a pending review.');
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (!reason || reason.length > 2000) fail(400, 'Give a reason, up to 2,000 characters.');
  let delegateName = '';
  if (req.body.revoke === true) {
    doc.delegatedApprover = undefined; doc.delegationUntil = undefined;
  } else {
    if (!mongoose.isValidObjectId(req.body.delegateId)) fail(400, 'Choose an eligible reviewer.');
    const user = await User.findById(req.body.delegateId), until = new Date(req.body.until);
    if (!user || !policy.approver(user) || user.isActive === false || ['blocked','inactive'].includes(user.status) || policy.owner(user, doc) || doc.draftEditors.some(editor => policy.id(editor) === policy.id(user._id))) fail(400, 'The delegate must be an active, independent approver.');
    if (!Number.isFinite(until.getTime()) || until <= new Date() || until > new Date(Date.now() + 30 * 86400000)) fail(400, 'Delegation must end within the next 30 days.');
    doc.delegatedApprover = user._id; doc.delegationUntil = until; delegateName = user.employeeName;
  }
  doc.history.push({ action: req.body.revoke ? 'Delegation revoked' : 'Review delegated', actorId: req.user._id, actorName: req.user.employeeName, at: new Date(), version: doc.draft.version, reason: reason + (doc.delegatedApprover ? ` Delegate: ${delegateName}; until ${doc.delegationUntil.toISOString()}` : '') });
  await doc.save();
  if (doc.delegatedApprover) await alert(doc, doc.delegatedApprover, `You have been assigned to review ${doc.name} until ${doc.delegationUntil.toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}.`, `doc-delegate:${doc._id}:${doc.__v}`, req.user);
  res.json({ message: req.body.revoke ? 'Delegation revoked.' : 'Temporary review delegation saved.' });
});
