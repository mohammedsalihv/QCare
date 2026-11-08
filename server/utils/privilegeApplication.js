const { normalizeRole } = require('./roles');
const canReview = user => normalizeRole(user.role) === 'QualityManager' || String(user.designation || '').trim().replace(/\s+/g, ' ').toLowerCase() === 'medical director';
const canRead = (user, row) => canReview(user) || ['admin', 'SuperAdmin'].includes(normalizeRole(user.role)) || [row.staffId, row.requestedBy].some(id => String(id?._id || id) === String(user._id));
function applicationData(body, files = []) {
  const fail = message => { throw new Error(message); };
  const text = (value, label, max) => typeof value !== 'string' || !value.trim() || value.trim().length > max ? fail(`${label} is required (maximum ${max} characters).`) : value.trim();
  const specialty = text(body.specialty, 'Specialty', 150);
  const reason = text(body.reason, 'Reason for this request', 4000);
  if (!['new', 'renewal', 'extension'].includes(body.applicationType)) fail('Choose the application type.');
  if (!['core', 'special', 'emergency'].includes(body.privilegeType)) fail('Choose the privilege type.');
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!date(body.requestedStartDate) || !date(body.expiryDate) || body.expiryDate <= body.requestedStartDate) fail('Choose valid start and end dates; the end must be after the start.');
  if (!Array.isArray(body.procedures) || !body.procedures.length || body.procedures.length > 50) fail('Request between 1 and 50 procedures.');
  const procedures = body.procedures.map(p => {
    if (!['direct-supervision', 'indirect-supervision', 'independent'].includes(p.level)) fail('Choose a supervision level for each procedure.');
    return { name: text(p.name, 'Procedure', 300), level: p.level, requested: true, approved: false };
  });
  if (new Set(procedures.map(p => p.name.toLowerCase())).size !== procedures.length) fail('Remove duplicate procedures.');
  if (files.length > 5 || files.reduce((sum, f) => sum + f.size, 0) > 10 * 1024 * 1024) fail('Attach up to 5 files, maximum 5 MB each and 10 MB combined.');
  const supportingDocuments = files.map(f => {
    const b = f.buffer;
    const type = b.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : b[0] === 255 && b[1] === 216 && b[2] === 255 ? 'image/jpeg' : '';
    if (!type || type !== f.mimetype || f.size > 5 * 1024 * 1024) fail('Supporting documents must be PDF, PNG or JPEG files up to 5 MB.');
    return { name: String(f.originalname).replace(/[\x00-\x1f/\\]/g, '_').slice(0, 180), mimeType: type, size: f.size, data: b };
  });
  return { specialty, reason, applicationType: body.applicationType, privilegeType: body.privilegeType, requestedStartDate: body.requestedStartDate, expiryDate: body.expiryDate, procedures, supportingDocuments };
}
module.exports = { applicationData, canRead, canReview };
