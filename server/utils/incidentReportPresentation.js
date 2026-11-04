const guide = require('./incidentStatus.json');
const colors = { amber: '#855005', blue: '#245B91', purple: '#6541A0', green: '#166950', slate: '#526579' };
function presentation(row, now = new Date()) {
  const status = guide[row.status] || { label: row.status || 'Unknown', tone: 'slate', stage: 'Review required', meaning: 'Review the incident record.', next: 'Open the incident for details.' };
  const actions = row.actions || [];
  const terminal = ['Closed', 'Rejected', 'Duplicate'].includes(row.status);
  const due = terminal ? [] : actions.filter(a => !a.completedAt && a.dueDate).map(a => ({ date: new Date(a.dueDate), kind: 'Action' }));
  if (!terminal && ['Accepted', 'Investigating', 'Reopened'].includes(row.status) && row.investigationDue) due.push({ date: new Date(row.investigationDue), kind: 'Investigation' });
  due.sort((a, b) => a.date - b.date);
  return { ...status, color: colors[status.tone], completed: actions.filter(a => a.completedAt).length, total: actions.length, nextDue: due[0], overdue: due.filter(a => a.date < now).length };
}
const eventLabel = event => ({ reported: 'Report submitted', accept: 'Accepted and assigned', assign: 'Assignment changed', clarify: 'Clarification requested', reject: 'Report rejected', duplicate: 'Duplicate identified', start: 'Investigation started', investigate: 'Investigation updated', addAction: 'Action planned', editAction: 'Action updated', approvePlan: 'Action plan approved', completeAction: 'Action completed', requestClosure: 'Closure review requested', close: 'Closure approved', return: 'Returned for further work', reopen: 'Incident reopened', comment: 'Comment recorded', evidence: 'Evidence uploaded', pdf: 'PDF downloaded' })[event] || event;
module.exports = { guide, presentation, eventLabel };
