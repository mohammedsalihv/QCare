import guide from '../../../server/utils/incidentStatus.json';
export const incidentStatuses = guide;
export const statusInfo = status => guide[status] || { label: status || 'Unknown', tone: 'slate', stage: 'Review required', meaning: 'Review this record for its current workflow position.', next: 'Open the incident for details.' };
export const incidentDate = value => value && Number.isFinite(+new Date(value)) ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded';
export function incidentDeadline(row, now = Date.now()) {
  if (['Closed', 'Rejected', 'Duplicate'].includes(row.status)) return { label: 'No open deadline', overdue: false };
  const dates = (row.actions || []).filter(a => !a.completedAt && a.dueDate).map(a => ({ value: a.dueDate, kind: 'Action due' }));
  if (['Accepted', 'Investigating', 'Reopened'].includes(row.status) && row.investigationDue) dates.push({ value: row.investigationDue, kind: 'Investigation due' });
  dates.sort((a, b) => +new Date(a.value) - +new Date(b.value));
  const next = dates[0];
  return next ? { label: incidentDate(next.value), kind: next.kind, overdue: +new Date(next.value) < now } : { label: row.status === 'Closure review' ? 'Awaiting reviewer' : 'Not scheduled', overdue: false };
}
