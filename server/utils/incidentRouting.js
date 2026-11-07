const Routing = require('../models/IncidentRouting');
const Department = require('../models/department');
const Location = require('../models/Location');
const { resolveMasterUser } = require('./masterResponsibility');
const normalize = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function chooseDepartment(report, departments) {
  if (report.department) return { department: departments.find(d => d.name === report.department), reason: 'Reporter-selected department' };
  const content = ' ' + normalize(report.title + ' ' + report.description) + ' ';
  const matches = departments.filter(d => d.keywords.some(word => content.includes(' ' + normalize(word) + ' ')));
  return matches.length === 1 ? { department: matches[0], reason: 'Content matched configured department phrases' } : { reason: matches.length ? 'Multiple departments matched; Quality triage required' : 'No department match; Quality triage required' };
}
async function resolveRouting(report) {
  const [settings, departments, branch] = await Promise.all([
    Routing.findOne({ key: 'default' }).lean(),
    Department.find({ isActive: { $ne: false } }).lean(),
    report.branch ? Location.findOne({ _id: report.branch, isActive: { $ne: false } }).lean() : null,
  ]);
  const choices = departments.map(d => ({ ...d, keywords: settings?.departments.find(rule => String(rule.department) === String(d._id))?.keywords || [] }));
  const match = chooseDepartment(report, choices);
  const primary = match.department ? await resolveMasterUser(match.department.headUser, match.department.head) : null;
  const quality = settings?.fallback ? await resolveMasterUser(settings.fallback) : null;
  const secondary = branch ? branch.responsibleUser !== undefined ? await resolveMasterUser(branch.responsibleUser) : await resolveMasterUser(null, branch.hodName) || await resolveMasterUser(null, branch.inchargeName) : null;
  return {
    ...(primary ? { primaryResponsible: primary._id } : {}),
    ...(quality ? { assignedTo: quality._id } : {}),
    ...(secondary && String(secondary._id) !== String(primary?._id) ? { secondaryResponsible: secondary._id } : {}),
    ...(!report.department && match.department ? { department: match.department.name } : {}),
    routingSource: primary ? 'department-master' : quality ? 'quality-fallback' : 'unassigned',
    routingReason: match.reason + (primary ? '; accountable head from Department Master' : '; department head unresolved, Quality must assign responsibility') + (secondary ? '; branch responsibility from Branch Master' : '') + (!quality ? '; Quality investigator requires assignment' : ''),
  };
}
module.exports = { chooseDepartment, resolveRouting };
