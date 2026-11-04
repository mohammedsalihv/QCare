const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const { accessQuery, applyCommand, record, fail } = require('../utils/incidentWorkflow');
const populate = query => query.populate([{ path: 'reportedBy assignedTo closedBy', select: 'employeeName employeeId' }, { path: 'involvedStaff notifyStaff actions.owner actions.completedBy', select: 'employeeName employeeId' }]);
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const done = ['Closed', 'Rejected', 'Duplicate'];
function filters(user, params) {
  const clauses = [accessQuery(user)];
  if (params.search) {
    if (typeof params.search !== 'string' || params.search.length > 100) fail('Search must be under 100 characters.');
    clauses.push({ $or: ['incidentId', 'title', 'location', 'department'].map(key => ({ [key]: { $regex: escapeRegex(params.search), $options: 'i' } })) });
  }
  for (const key of ['status', 'category', 'riskLevel', 'location', 'department']) if (params[key]) {
    if (typeof params[key] !== 'string' || params[key].length > 200) fail('Invalid filter.');
    clauses.push({ [key]: params[key] });
  }
  if (params.scope === 'mine') clauses.push({ $or: [{ assignedTo: user._id }, { actions: { $elemMatch: { owner: user._id, completedAt: null } } }] });
  if (params.overdue === 'yes') clauses.push({ status: { $nin: done }, $or: [{ investigationDue: { $lt: new Date() }, status: { $in: ['Accepted', 'Investigating', 'Reopened'] } }, { actions: { $elemMatch: { completedAt: null, dueDate: { $lt: new Date() } } } }] });
  for (const [key, op] of [['from', '$gte'], ['to', '$lte']]) if (params[key]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params[key])) fail('Invalid date filter.');
    const value = new Date(params[key] + (key === 'to' ? 'T23:59:59.999+04:00' : 'T00:00:00+04:00'));
    if (!Number.isFinite(value.getTime())) fail('Invalid date filter.');
    clauses.push({ dateOfIncident: { [op]: value } });
  }
  return { $and: clauses };
}
const respondError = (res, error) => res.status(error.name === 'VersionError' ? 409 : error.status || 500).json({ message: error.name === 'VersionError' ? 'This incident changed. Reload before saving.' : error.status ? error.message : 'Could not complete the incident request.' });
async function load(req) {
  if (!mongoose.isValidObjectId(req.params.id)) fail('Incident not found.', 404);
  const row = await Incident.findOne({ $and: [{ _id: req.params.id }, accessQuery(req.user)] }).select('-attachments.data');
  if (!row) fail('Incident not found.', 404);
  return row;
}
async function list(req, res) {
  try {
    const query = filters(req.user, req.query);
    const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const sortBy = ['createdAt', 'title', 'status', 'investigationDue', 'incidentId'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sort = { [sortBy]: req.query.direction === 'asc' ? 1 : -1, _id: -1 };
    const [total, rows] = await Promise.all([Incident.countDocuments(query), populate(Incident.find(query).select('incidentId title location department category status severity riskLevel assignedTo reportedBy investigationDue createdAt actions').sort(sort).skip((page - 1) * limit).limit(limit)).lean()]);
    res.set('Cache-Control', 'no-store').json({ rows, total, page, limit });
  } catch (error) { respondError(res, error); }
}
async function detail(req, res) {
  try { const row = await load(req); await populate(row); res.set('Cache-Control', 'no-store').json(row); }
  catch (error) { respondError(res, error); }
}
async function command(req, res) {
  try {
    const row = await load(req);
    await applyCommand(row, req.user, req.body);
    await row.save();
    // Delivery is best effort and must never turn a saved mutation into a retryable failure.
    try {
      const recipients = new Set([row.reportedBy, row.assignedTo, ...row.actions.map(a => a.owner)].filter(Boolean).map(String));
      recipients.delete(String(req.user._id));
      if (row.status === 'Closure review') await Notification.create({ type: 'system_alert', message: `Incident ${row.incidentId} awaits closure review.`, user: req.user.employeeName || 'Staff', userId: req.user._id, recipientRoles: ['admin', 'superadmin', 'qualitymanager'], actionLink: `/dashboard/incidents/${row._id}` });
      for (const recipientId of recipients) {
        await Notification.create({ type: 'system_alert', message: `Incident ${row.incidentId}: ${row.status}`, user: req.user.employeeName || 'Staff', userId: req.user._id, recipientRole: 'user', recipientId, actionLink: `/dashboard/incidents/${row._id}` });
        req.io?.to(recipientId).emit('new-notification', { type: 'system_alert' });
      }
    } catch { console.error('Incident workflow notification delivery failed for ' + row.incidentId); }
    await populate(row); res.json(row);
  } catch (error) { respondError(res, error); }
}
async function evidence(req, res) {
  try {
    const row = await load(req);
    if (['Closed', 'Rejected', 'Duplicate'].includes(row.status)) fail('Reopen the incident before adding evidence.');
    if (Number(req.body.version) !== row.__v) fail('This incident changed. Reload before uploading.', 409);
    if (!req.files?.length) fail('Choose at least one file.');
    if (row.attachments.length + req.files.length > 20 || row.attachments.reduce((n, a) => n + a.size, 0) + req.files.reduce((n, a) => n + a.size, 0) > 12 * 1024 * 1024) fail('An incident can contain up to 20 attachments and 12 MB combined.');
    const allowed = /\.(png|jpe?g|gif|webp|pdf|mp4|mov|webm|mp3|wav|txt|csv|docx|xlsx|pptx)$/i;
    for (const file of req.files) {
      if (!allowed.test(file.originalname)) fail('Unsupported attachment type.');
      row.attachments.push({ name: file.originalname.replace(/[\\/\r\n]/g, '_').slice(0, 180), mime: 'application/octet-stream', size: file.size, data: file.buffer });
    }
    record(row, req.user, 'evidence', req.files.map(f => f.originalname).join(', '));
    await row.save();
    // A fresh read excludes newly uploaded bytes as well as existing ones.
    res.json(await populate(Incident.findById(row._id).select('-attachments.data')));
  } catch (error) { respondError(res, error); }
}
const csvCell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
async function exportCsv(req, res) {
  try {
    const query = filters(req.user, req.query);
    if (await Incident.countDocuments(query) > 5000) fail('Narrow the filters to 5,000 incidents or fewer before exporting.');
    const rows = await populate(Incident.find(query).select('incidentId title location department status riskLevel assignedTo createdAt investigationDue').sort({ createdAt: -1 }).limit(5000)).lean();
    const columns = ['Reference', 'Title', 'Branch', 'Department', 'Status', 'Risk', 'Investigator', 'Reported', 'Investigation due'];
    const values = rows.map(r => [r.incidentId, r.title, r.location, r.department, r.status, r.riskLevel, r.assignedTo?.employeeName, r.createdAt?.toISOString(), r.investigationDue?.toISOString()]);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="incident-register.csv"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).send('\ufeff' + [columns, ...values].map(row => row.map(csvCell).join(',')).join('\r\n'));
  } catch (error) { respondError(res, error); }
}
async function pdf(req, res) {
  try {
    const row = await load(req); await populate(row);
    const doc = new PDFDocument({ margin: 45, size: 'A4', info: { Title: `Incident ${row.incidentId}` } });
    const chunks = [];
    const completed = new Promise((resolve, reject) => { doc.on('data', chunk => chunks.push(chunk)); doc.on('end', resolve); doc.on('error', reject); });
    const section = title => { doc.moveDown().font('Helvetica-Bold').fontSize(13).fillColor('#0f766e').text(title).moveDown(.4); doc.fillColor('#1e293b').font('Helvetica').fontSize(10); };
    const field = (label, value) => doc.text(`${label}: ${value || 'Not recorded'}`, { lineGap: 3 }).moveDown(.3);
    doc.fontSize(20).text('QCare | Incident report');
    field('Reference', row.incidentId); field('Title', row.title); field('Status', row.status);
    field('Generated', new Date().toISOString());
    section('Overview');
    for (const [label, value] of [['Branch', row.location], ['Department', row.department], ['Area / room', row.areaRoom], ['Category', row.category], ['Incident date', row.dateOfIncident?.toISOString()], ['Reported by', row.reportedBy?.employeeName], ['Description', row.description], ['Harm level', row.harmLevel], ['Immediate actions', row.immediateActions], ['Involved staff', row.involvedStaff.map(u => u.employeeName).join(', ')], ['Witnesses', row.witnesses]]) field(label, value);
    section('Investigation and risk');
    for (const [label, value] of [['Investigator', row.assignedTo?.employeeName], ['Deadline', row.investigationDue?.toISOString()], ['Initial severity', row.severity], ['Assessed risk', row.riskLevel], ['Likelihood', row.likelihood], ['Potential consequence', row.potentialConsequence], ['Operational impact', row.operationalImpact], ['Temporary controls', row.temporaryControls], ['Findings', row.findings], ['Root cause', row.rootCause], ['Contributing factors', row.contributingFactors], ['Actions already taken', row.actionsTaken]]) field(label, value);
    section('Corrective and preventive actions');
    row.actions.forEach((a, i) => { field(`${i + 1}. ${a.kind}`, a.title); field('Owner / deadline', `${a.owner?.employeeName} / ${a.dueDate?.toISOString().slice(0, 10)}`); field('Success criteria', a.successCriteria); field('Completion evidence', a.completion); field('Completed', a.completedAt?.toISOString()); });
    section('Closure and effectiveness');
    for (const [label, value] of [['Summary', row.closureSummary], ['Effectiveness', row.effectiveness], ['Evidence', row.effectivenessEvidence], ['Review date', row.effectivenessDate?.toISOString()], ['Residual risk', row.residualRisk], ['Approved by', row.closedBy?.employeeName], ['Closed', row.closedAt?.toISOString()]]) field(label, value);
    section('Comments and statements'); row.comments.forEach(c => field(`${c.kind} · ${c.authorName} · ${c.at.toISOString()}`, c.body));
    section('Attachments'); row.attachments.forEach(a => field(a.name, `${a.size} bytes (download separately in QCare)`));
    section('History'); row.history.forEach(h => field(`${h.at.toISOString()} · ${h.actorName} · ${h.event}`, h.detail));
    doc.end(); await completed;
    await Incident.updateOne({ _id: row._id }, { $push: { history: { event: 'pdf', detail: 'Incident PDF downloaded', actor: req.user._id, actorName: req.user.employeeName, at: new Date() } } });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${row.incidentId}.pdf"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).send(Buffer.concat(chunks));
  } catch (error) { respondError(res, error); }
}
async function summaryPdf(req, res) {
  try {
    const query = filters(req.user, req.query);
    const [statuses, risks, categories, overdue, total] = await Promise.all([
      ...['status', 'riskLevel', 'category'].map(key => Incident.aggregate([{ $match: query }, { $group: { _id: '$' + key, count: { $sum: 1 } } }, { $sort: { count: -1 } }])),
      Incident.countDocuments(filters(req.user, { ...req.query, overdue: 'yes' })),
      Incident.countDocuments(query)
    ]);
    const doc = new PDFDocument({ margin: 45, size: 'A4' }), chunks = [];
    const completed = new Promise((resolve, reject) => { doc.on('data', c => chunks.push(c)); doc.on('end', resolve); doc.on('error', reject); });
    doc.fontSize(20).text('QCare | Incident summary').moveDown();
    doc.fontSize(10).text('Generated: ' + new Date().toISOString()).text('Scope: incidents accessible to the requesting user.');
    const filterText = ['search', 'status', 'category', 'riskLevel', 'scope', 'overdue', 'from', 'to'].filter(key => req.query[key]).map(key => `${key}: ${req.query[key]}`).join('; ');
    doc.text('Filters: ' + (filterText || 'All accessible incidents')).moveDown();
    doc.fontSize(13).text(`Total incidents: ${total}`).text(`Incidents with overdue work: ${overdue}`);
    for (const [title, rows] of [['By status', statuses], ['By assessed risk', risks], ['By category', categories]]) {
      doc.moveDown().fontSize(13).text(title).moveDown(.4);
      rows.forEach(row => doc.fontSize(10).text(`${row._id || 'Not assessed'}: ${row.count}`));
    }
    doc.moveDown().fontSize(9).text('Counts reflect current saved records, not the number of events or affected people. Overdue excludes closed, rejected and duplicate incidents.');
    doc.end(); await completed;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="incident-summary.pdf"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).send(Buffer.concat(chunks));
  } catch (error) { respondError(res, error); }
}
module.exports = { list, detail, command, evidence, exportCsv, pdf, summaryPdf, accessQuery };
