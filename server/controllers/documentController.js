const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const Document = require('../models/Document');
const DocumentFile = require('../models/DocumentFile');
const User = require('../models/users');
const policy = require('../utils/documentPolicy');
const { input, fileInput } = require('../utils/documentInput');
const notify = require('../utils/workflowNotifications');
const fail = (code, message) => { const error = Error(message); error.code = code; throw error; };
const handler = fn => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    const code = error.name === 'VersionError' ? 409 : Number.isInteger(error.code) && error.code >= 400 && error.code <= 599 ? error.code : 400;
    res.status(code).json({ message: error.name === 'VersionError' ? 'Someone changed this document. Refresh and try again.' : error.message });
  }
};
const load = async req => {
  if (!mongoose.isValidObjectId(req.params.id)) fail(404, 'Document not found.');
  const doc = await Document.findById(req.params.id);
  if (!doc || !policy.readable(req.user, doc)) fail(404, 'Document not found or not available to you.');
  return doc;
};
function history(doc, user, action, reason = '') {
  doc.history.push({ action, actorId: user._id, actorName: user.employeeName, at: new Date(), reason, version: doc.draft?.version || doc.version });
}
function present(doc, user) {
  const row = doc.toObject(), workspace = policy.workspace(user, doc);
  row.ownerName = row.uploadedBy?.employeeName || '';
  row.approverName = row.assignedApprover?.employeeName || '';
  row.uploadedBy = policy.id(row.uploadedBy);
  row.assignedApprover = policy.id(row.assignedApprover);
  const editable = policy.manage(user, doc) && doc.status !== 'Archived';
  row.permissions = { edit: editable && (!doc.draftState || ['Draft', 'Changes requested'].includes(doc.draftState)), submit: editable && !!doc.draft && ['Draft', 'Changes requested'].includes(doc.draftState), review: policy.review(user, doc) && doc.draftState === 'In review', publish: policy.controller(user) && doc.draftState === 'Approved', archive: policy.controller(user) && doc.status === 'Active', delete: policy.owner(user, doc) && doc.status === 'Draft' && !doc.history.some(h => h.action === 'Submitted for review'), workspace, download: workspace || doc.allowDownload };
  if (!workspace) { delete row.draft; delete row.draftState; delete row.versions; delete row.history; delete row.draftEditors; }
  if (!row.fileName && row.fileUrl) row.fileName = path.basename(row.fileUrl);
  delete row.fileUrl;
  if (row.draft) delete row.draft.fileUrl;
  row.versions?.forEach(v => { if (!v.fileName && v.fileUrl) v.fileName = path.basename(v.fileUrl); delete v.fileUrl; });
  return row;
}
const sendNotice = (req, doc, status) => notify({ module: 'Documents', recordId: doc._id, title: doc.name, status, actor: req.user, requester: doc.uploadedBy, participants: [doc.assignedApprover], actionLink: '/dashboard/documents', recipientRoles: [] });
const activeApprover = async (value, doc, user) => {
  if (!mongoose.isValidObjectId(value)) fail(400, 'Select an independent approver.');
  const person = await User.findById(value);
  if (!person || person.isActive === false || ['blocked', 'inactive'].includes(person.status) || !policy.approver(person) || policy.id(person._id) === policy.id(user._id) || policy.id(person._id) === policy.id(doc.uploadedBy) || doc.draftEditors?.some(editor => policy.id(editor) === policy.id(person._id))) fail(400, 'Choose an active approver who did not author or edit this revision.');
  return person._id;
};
exports.options = handler(async (req, res) => {
  const people = await User.find({ isActive: { $ne: false }, status: { $nin: ['blocked', 'inactive'] } }).select('employeeName role designation');
  res.json({ approvers: people.filter(p => policy.approver(p) && policy.id(p._id) !== policy.id(req.user._id)) });
});
exports.getDocuments = handler(async (req, res) => {
  const docs = await Document.find().populate('uploadedBy assignedApprover', 'employeeName').sort({ updatedAt: -1 });
  res.set('Cache-Control', 'no-store').json(docs.filter(doc => policy.readable(req.user, doc)).map(doc => present(doc, req.user)));
});
exports.addDocument = handler(async (req, res) => {
  const data = input(req.body), file = data.generatedText ? await require('../utils/documentTemplate')(data, '01') : fileInput(req.file);
  const doc = new Document({ ...data, documentId: 'DOC-' + randomUUID(), uploadedBy: req.user._id, status: 'Draft', version: '01', draftEditors: [req.user._id] });
  doc.assignedApprover = await activeApprover(req.body.assignedApprover, doc, req.user);
  const stored = await DocumentFile.create(file);
  try {
    Object.assign(doc, { fileId: stored._id, fileName: stored.name, fileMime: stored.mime });
    doc.draft = policy.snapshot(doc); doc.draftState = 'Draft';
    history(doc, req.user, 'Draft created'); await doc.save();
  } catch (error) { await DocumentFile.deleteOne({ _id: stored._id }); throw error; }
  res.status(201).json(present(doc, req.user));
});
exports.updateDocument = handler(async (req, res) => {
  const doc = await load(req);
  if (!present(doc, req.user).permissions.edit) fail(403, 'Only the owner or document controller can edit an available draft.');
  const data = input(req.body);
  if ((doc.draft?.generatedText || (!doc.draft && doc.generatedText)) && req.body.source !== 'template' && !req.file) fail(400, 'Attach a replacement file to switch from a generated document to an upload.');
  const approver = await activeApprover(req.body.assignedApprover, doc, req.user);
  let stored;
  const nextVersion = doc.draft?.version || String((parseInt(doc.version, 10) || 1) + (doc.status === 'Active' ? 1 : 0)).padStart(2, '0');
  if (data.generatedText) stored = await DocumentFile.create(await require('../utils/documentTemplate')(data, nextVersion));
  else if (req.file) { stored = await DocumentFile.create(fileInput(req.file)); data.generatedText = undefined; }
  try {
    const base = doc.draft ? doc.draft.toObject() : policy.snapshot(doc);
    const version = doc.draft?.version || String((parseInt(doc.version, 10) || 1) + (doc.status === 'Active' ? 1 : 0)).padStart(2, '0');
    doc.draft = { ...base, ...data, version, approvedBy: undefined, approvedAt: undefined, reviewedAt: undefined, ...(stored ? { fileId: stored._id, fileName: stored.name, fileMime: stored.mime, fileUrl: undefined } : {}) };
    doc.draftState = 'Draft'; doc.assignedApprover = approver;
    doc.delegatedApprover = undefined; doc.delegationUntil = undefined;
    if (!doc.draftEditors.some(editor => policy.id(editor) === policy.id(req.user._id))) doc.draftEditors.push(req.user._id);
    if (doc.status === 'Draft') for (const key of policy.fields) doc[key] = doc.draft[key];
    history(doc, req.user, 'Draft updated', data.changeSummary); await doc.save();
  } catch (error) { if (stored) await DocumentFile.deleteOne({ _id: stored._id }); throw error; }
  res.json(present(doc, req.user));
});
exports.command = handler(async (req, res) => {
  const doc = await load(req), command = req.body.command;
  const permissions = present(doc, req.user).permissions;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (reason.length > 2000) fail(400, 'Use up to 2,000 characters for the reason.');
  if (command === 'submit') {
    if (!permissions.submit) fail(403, 'This draft cannot be submitted by you.');
    await activeApprover(policy.id(doc.assignedApprover), doc, req.user);
    if (!doc.draft.fileId && !doc.draft.fileUrl) fail(400, 'Attach a document before submitting.');
    doc.draftState = 'In review'; history(doc, req.user, 'Submitted for review');
  } else if (['approve', 'return'].includes(command)) {
    if (!permissions.review) fail(403, 'Only the assigned independent approver can review this revision.');
    if (command === 'return' && !reason) fail(400, 'Explain what needs to be changed.');
    doc.draftState = command === 'approve' ? 'Approved' : 'Changes requested';
    doc.draft.approvedBy = command === 'approve' ? req.user._id : undefined;
    doc.draft.approvedAt = command === 'approve' ? new Date() : undefined;
    doc.draft.reviewedAt = new Date();
    history(doc, req.user, command === 'approve' ? 'Revision approved' : 'Changes requested', reason);
  } else if (command === 'publish') {
    if (!permissions.publish) fail(403, 'Only a document controller can publish an approved revision.');
    if (doc.draft.expiryDate && doc.draft.expiryDate < new Date()) fail(400, 'An expired revision cannot be published.');
    if (doc.status === 'Active') doc.versions.push(policy.snapshot(doc));
    history(doc, req.user, 'Revision published', doc.draft.changeSummary);
    for (const key of [...policy.fields, 'version', 'approvedBy', 'approvedAt', 'reviewedAt']) doc[key] = doc.draft[key];
    doc.status = 'Active'; doc.draft = undefined; doc.draftState = undefined; doc.draftEditors = [];
  } else if (command === 'archive') {
    if (!permissions.archive) fail(403, 'Only a document controller can archive a published document.');
    if (!reason) fail(400, 'Explain why this document is being archived.');
    if (doc.draft) fail(409, 'Finish the revision before archiving this document.');
    doc.status = 'Archived'; history(doc, req.user, 'Document archived', reason);
  } else fail(400, 'Choose a valid action.');
  await doc.save();
  if (command === 'publish') await require('../utils/documentReading').carryAssignments(doc).catch(error => console.error('Document reading assignments will retry in daily job:', error.message));
  await sendNotice(req, doc, doc.draftState || doc.status);
  res.json(present(doc, req.user));
});
exports.deleteDocument = handler(async (req, res) => {
  const doc = await load(req);
  if (!present(doc, req.user).permissions.delete) fail(403, 'Only an unsubmitted draft can be deleted by its owner. Published documents must be archived.');
  const result = await Document.deleteOne({ _id: doc._id, __v: doc.__v });
  if (!result.deletedCount) fail(409, 'The document changed. Refresh and try again.');
  // Retain file objects; purging is a separate retention-policy operation.
  res.json({ message: 'Unsubmitted draft deleted.' });
});
exports.endorseDocument = handler(async (req, res) => {
  const doc = await load(req);
  if (doc.status !== 'Active') fail(409, 'Only published documents can be marked helpful.');
  const found = doc.endorsedBy.some(value => policy.id(value) === policy.id(req.user._id));
  if (found) doc.endorsedBy.pull(req.user._id); else doc.endorsedBy.push(req.user._id);
  await doc.save(); res.json(present(doc, req.user));
});
exports.download = handler(async (req, res) => {
  const doc = await load(req), workspace = policy.workspace(req.user, doc);
  let version = doc;
  if (req.query.version === 'draft') { if (!workspace || !doc.draft) fail(404, 'Draft not available.'); version = doc.draft; }
  else if (req.query.version && req.query.version !== doc.version) {
    if (!workspace) fail(403, 'Earlier versions are restricted to the document team.');
    version = doc.versions.find(row => row.version === req.query.version);
    if (!version) fail(404, 'Version not found.');
  }
  if (req.query.download === 'true' && !workspace && !version.allowDownload) fail(403, 'Downloading is not permitted for this document.');
  let file;
  if (version.generatedText) file = await require('../utils/documentTemplate')(version, version.version, doc.status !== 'Draft' && version !== doc.draft, req.query.download === 'true' ? req.user.employeeName : '');
  else if (version.fileId) file = await DocumentFile.findById(version.fileId).select('+data');
  else if (version.fileUrl) {
    const match = /^\/uploads\/([a-zA-Z0-9_.-]+)$/.exec(version.fileUrl);
    if (!match || match[1].includes('..')) fail(404, 'File not available.');
    const legacyPath = path.join(__dirname, '../uploads', match[1]);
    try { file = { name: match[1], mime: ({ '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.csv': 'text/csv' })[path.extname(match[1]).toLowerCase()] || 'application/octet-stream', data: await fs.readFile(legacyPath) }; }
    catch { fail(404, 'Original file is missing. Ask the owner to upload a revision.'); }
  }
  if (!file) fail(404, 'No file is available for this version.');
  const preview = ['application/pdf', 'image/png', 'image/jpeg'].includes(file.mime);
  if (!preview && req.query.download !== 'true') fail(400, 'This file has no preview. Use Download if permitted.');
  res.set({ 'Content-Type': file.mime, 'Content-Disposition': `${req.query.download === 'true' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Content-Security-Policy': "sandbox; default-src 'none'" });
  if (doc.status === 'Active' && version === doc) await require('../utils/documentReading').recordAccess(doc, req.user, doc.version, req.query.download === 'true');
  res.send(file.data);
});
