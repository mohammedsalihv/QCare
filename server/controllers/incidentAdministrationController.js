const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const { validateIncidentReport } = require('../utils/incidentReport');
const { fail, record } = require('../utils/incidentWorkflow');
const role = user => user.role?.toLowerCase();
const errorResponse = (res, error) => res.status(error.name === 'VersionError' ? 409 : error.status || 500).json({ message: error.name === 'VersionError' ? 'This incident changed. Reload before saving.' : error.status ? error.message : 'Could not save the incident change.' });
function requireEditor(req, res, next) {
  if (role(req.user) !== 'superadmin') return res.status(403).json({ message: 'Only Superadmin can edit an incident report.' });
  next();
}
async function load(req) {
  if (!mongoose.isValidObjectId(req.params.id)) fail('Incident not found.', 404);
  const row = await Incident.findOne({ _id: req.params.id, deletedAt: null });
  if (!row) fail('Incident not found.', 404);
  if (req.body.version !== row.__v) fail('This incident changed. Reload before saving.', 409);
  if (typeof req.body.reason !== 'string' || !req.body.reason.trim() || req.body.reason.length > 2000) fail('Enter a reason, up to 2,000 characters.');
  return row;
}
async function edit(req, res) {
  try {
    if (role(req.user) !== 'superadmin') fail('Only Superadmin can edit an incident report.', 403);
    const row = await load(req);
    const body = req.body;
    for (const [key, max] of [['title', 200], ['description', 20000]]) if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > max) fail(`Enter a valid ${key}, up to ${max} characters.`);
    if (!['Clinical', 'Safety', 'Administrative', 'Technical', 'Other'].includes(body.category) || !['Low', 'Medium', 'High', 'Critical'].includes(body.severity)) fail('Select a category and severity.');
    const validated = await validateIncidentReport(body, req.files || []);
    const { attachments, ...details } = validated;
    if (row.attachments.length + attachments.length > 20 || [...row.attachments, ...attachments].reduce((n, a) => n + a.size, 0) > 12 * 1024 * 1024) fail('An incident can contain up to 20 attachments and 12 MB combined.');
    // Only report fields are editable. IDs, ownership and signed workflow decisions cannot be overwritten.
    const updates = { ...details, title: body.title.trim(), description: body.description.trim(), category: body.category, severity: body.severity, dateOfIncident: new Date(body.dateOfIncident), location: details.location || body.location };
    const changes = {};
    for (const [key, value] of Object.entries(updates)) {
      const before = JSON.parse(JSON.stringify(row[key] ?? null));
      const after = JSON.parse(JSON.stringify(value ?? null));
      if (JSON.stringify(before) !== JSON.stringify(after)) { changes[key] = { before, after }; row.set(key, value); }
    }
    if (attachments.length) { row.attachments.push(...attachments); changes.attachments = { added: attachments.map(a => ({ name: a.name, size: a.size })) }; }
    if (!Object.keys(changes).length) fail('No report details have changed.');
    record(row, req.user, 'editReport', body.reason.trim());
    row.history[row.history.length - 1].changes = changes;
    await row.save();
    res.json({ message: 'Incident report updated.', id: row._id });
  } catch (error) { errorResponse(res, error); }
}
async function remove(req, res) {
  try {
    if (!['superadmin', 'qualitymanager'].includes(role(req.user))) fail('Only Superadmin or Quality Manager can delete incidents.', 403);
    const row = await load(req);
    row.deletedAt = new Date(); row.deletedBy = req.user._id;
    record(row, req.user, 'deleteIncident', req.body.reason.trim());
    // Retaining the record and history in one atomic save keeps the deletion auditable.
    await row.save();
    res.json({ message: 'Incident deleted. Its audit history is retained.' });
  } catch (error) { errorResponse(res, error); }
}
async function audit(req, res) {
  try {
    if (!['superadmin', 'qualitymanager', 'admin'].includes(role(req.user))) fail('Only authorized incident reviewers can view the audit log.', 403);
    const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const match = {};
    if (req.query.search) {
      if (typeof req.query.search !== 'string' || req.query.search.length > 100) fail('Search must be under 100 characters.');
      const pattern = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.$or = ['incidentId', 'previousIncidentIds', 'title', 'history.actorName', 'history.detail'].map(key => ({ [key]: { $regex: pattern, $options: 'i' } }));
    }
    if (req.query.event) {
      if (typeof req.query.event !== 'string' || req.query.event.length > 60) fail('Invalid event filter.');
      match['history.event'] = req.query.event;
    }
    const sortKey = { at: 'history.at', incidentId: 'incidentId', actor: 'history.actorName' }[req.query.sortBy] || 'history.at';
    const [result] = await Incident.aggregate([
      { $project: { incidentId: 1, previousIncidentIds: 1, title: 1, deletedAt: 1, history: 1 } },
      { $unwind: '$history' }, { $match: match },
      { $facet: { count: [{ $count: 'total' }], rows: [
        { $sort: { [sortKey]: req.query.direction === 'asc' ? 1 : -1, 'history._id': -1 } },
        { $skip: (page - 1) * limit }, { $limit: limit },
        { $project: { _id: '$history._id', incident: '$_id', incidentId: 1, title: 1, deletedAt: 1, event: '$history.event', detail: '$history.detail', changes: '$history.changes', request: '$history.request', actorName: '$history.actorName', at: '$history.at' } }
      ] } }
    ]);
    res.set('Cache-Control', 'no-store').json({ rows: result.rows, total: result.count[0]?.total || 0, page, limit });
  } catch (error) { errorResponse(res, error); }
}
module.exports = { requireEditor, edit, remove, audit };
