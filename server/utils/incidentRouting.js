const Routing = require('../models/IncidentRouting');
const Department = require('../models/department');
const User = require('../models/users');
const normalize = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Local, explainable phrase matching. It never overrides a reporter-selected department.
function chooseDepartment(report, departments) {
  if (report.department) return { department: departments.find(d => d.name === report.department), reason: 'Reporter-selected department' };
  const content = ' ' + normalize(report.title + ' ' + report.description) + ' ';
  const matches = departments.filter(d => d.keywords.some(word => content.includes(' ' + normalize(word) + ' ')));
  return matches.length === 1 ? { department: matches[0], reason: 'Content matched configured department phrases' } : { reason: matches.length ? 'Multiple departments matched; Quality triage required' : 'No department match; Quality triage required' };
}
async function resolveRouting(report) {
  const settings = await Routing.findOne({ key: 'default' }).lean();
  if (!settings) return { routingReason: 'Routing is not configured; awaiting manual Quality assignment', routingSource: 'unassigned' };
  const departments = await Department.find({ _id: { $in: settings.departments.map(d => d.department) }, isActive: { $ne: false } }).lean();
  const choices = departments.map(d => ({ ...d, ...settings.departments.find(rule => String(rule.department) === String(d._id)) }));
  const match = chooseDepartment(report, choices);
  const active = async id => id && await User.exists({ _id: id, isActive: { $ne: false }, status: { $nin: ['inactive', 'blocked'] } });
  const primary = match.department?.owner;
  const primaryResponsible = await active(primary) ? primary : undefined;
  const assignedTo = await active(settings.fallback) ? settings.fallback : undefined;
  const secondary = settings.branches.find(b => String(b.branch) === String(report.branch))?.owner;
  return {
    ...(assignedTo ? { assignedTo } : {}),
    ...(primaryResponsible ? { primaryResponsible } : {}),
    ...(await active(secondary) && String(secondary) !== String(primaryResponsible) ? { secondaryResponsible: secondary } : {}),
    ...(!report.department && match.department ? { department: match.department.name } : {}),
    routingSource: primaryResponsible ? 'department' : 'quality-fallback',
    routingReason: match.reason + (primaryResponsible ? '; department manager accountable, Quality investigates' : '; department owner unresolved, Quality must assign responsibility') + (!assignedTo ? '; Quality investigator unavailable' : ''),
  };
}
module.exports = { chooseDepartment, resolveRouting };
