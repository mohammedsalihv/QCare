const id = value => String(value?._id || value || '');
const controller = user => ['admin', 'superadmin', 'qualitymanager', 'qualityofficer'].includes(String(user.role).toLowerCase());
const approver = user => String(user.role).toLowerCase() === 'qualitymanager' || String(user.designation || '').trim().replace(/\s+/g, ' ').toLowerCase() === 'medical director';
const owner = (user, doc) => id(doc.uploadedBy) === id(user._id);
const manage = (user, doc) => owner(user, doc) || controller(user);
const delegated = (user, doc) => doc.draftState === 'In review' && id(doc.delegatedApprover) === id(user._id) && doc.delegationUntil > new Date();
const review = (user, doc) => approver(user) && (id(doc.assignedApprover) === id(user._id) || delegated(user, doc)) && !owner(user, doc) && !doc.draftEditors?.some(editor => id(editor) === id(user._id));
const workspace = (user, doc) => manage(user, doc) || id(doc.assignedApprover) === id(user._id) || delegated(user, doc);
const readable = (user, doc) => {
  if (workspace(user, doc)) return true;
  if (doc.status !== 'Active' || doc.revisedDate > new Date() || (doc.expiryDate && doc.expiryDate < new Date())) return false;
  if (['Confidential', 'Secret'].includes(doc.classification)) return false;
  return doc.audience === 'All staff' || (doc.audience === 'Department' && String(doc.department).trim().toLowerCase() === String(user.department).trim().toLowerCase());
};
const fields = ['name', 'type', 'department', 'ref', 'description', 'generatedText', 'classification', 'revisedDate', 'nextRevDate', 'expiryDate', 'changeSummary', 'audience', 'allowDownload', 'fileId', 'fileName', 'fileMime', 'fileUrl'];
const snapshot = doc => Object.fromEntries([...fields, 'version', 'approvedBy', 'approvedAt'].map(key => [key, doc[key]]));
module.exports = { id, controller, approver, owner, manage, review, workspace, readable, fields, snapshot };
