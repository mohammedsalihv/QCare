const AuditLog = require('../models/AuditLog');
const { context, metadata, moduleFor, clean } = require('../utils/requestAudit');
const secret = /password|passwd|secret|token|authorization|cookie|credential|buffer|base64|^data$|^payload$/i;
module.exports = async function moduleAudit(req, res, next) {
  const path = req.originalUrl.split('?')[0];
  const module = moduleFor(path);
  if (!module || ['OPTIONS', 'HEAD'].includes(req.method)) return next();
  const meta = metadata(req), started = Date.now();
  req.auditMetadata = meta;
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  // Routine polling is not a business event; writes and explicit downloads are captured.
  const download = /export|download|pdf|attachments|certificate|evidence/i.test(path);
  if (!isWrite && !download) return context.run({ metadata: meta }, next);
  let entry;
  try {
    entry = await AuditLog.create({ ...meta, moduleKey: module.key, module: module.label, source: 'server-request', action: isWrite ? req.method === 'DELETE' ? 'Delete' : req.method === 'POST' ? 'Submit' : 'Update' : 'Download', method: req.method, path, outcome: 'Pending', timestamp: new Date() });
  } catch {
    return res.status(503).json({ message: 'Audit service is unavailable. Please retry shortly.' });
  }
  let responseId = '', authActor;
  const json = res.json;
  res.json = function(body) {
    if (body && !Array.isArray(body)) {
      const id = body._id || body.id || body.incident?._id;
      if (id && /^[a-f\d]{24}$/i.test(String(id))) responseId = String(id);
      if (module.key === 'authentication' && res.statusCode < 400 && id) authActor = { _id: id, employeeName: body.employeeName, employeeId: body.employeeId, role: body.role };
    }
    return json.call(this, body);
  };
  let finalized = false;
  const finish = async aborted => {
    if (finalized) return; finalized = true;
    const user = req.user || authActor;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const fields = Object.keys(body).filter(key => !secret.test(key)).slice(0, 100).map(key => clean(key, 80));
    const command = typeof body.command === 'string' && /^[a-zA-Z]{1,40}$/.test(body.command) ? body.command : '';
    try {
      await AuditLog.updateOne({ _id: entry._id }, { $set: {
        performedBy: user?._id, actorName: clean(user?.employeeName), actorEmployeeId: clean(user?.employeeId, 80), actorRole: clean(user?.role, 80),
        recordId: responseId || path.match(/\b[a-f\d]{24}\b/i)?.[0] || '',
        activity: command || entry.action, statusCode: res.statusCode, durationMs: Date.now() - started,
        outcome: aborted ? 'Interrupted' : res.statusCode < 400 ? 'Success' : [401, 403].includes(res.statusCode) ? 'Denied' : 'Failed',
        details: { submittedFields: fields, uploadedFiles: [...(Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat()), ...(req.file ? [req.file] : [])].slice(0, 20).map(f => ({ size: f.size, mime: clean(f.mimetype, 100) })), note: 'Submitted field names describe the request, not proof that each field changed.' }
      } });
    } catch { console.error('Audit completion failed; pending event retained: ' + meta.requestId); }
  };
  res.once('finish', () => finish(false));
  res.once('close', () => finish(!res.writableFinished));
  context.run({ metadata: meta }, next);
};
