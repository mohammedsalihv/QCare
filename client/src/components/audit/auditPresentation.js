export const statusLabels = { 'schedule-rejected': 'Schedule rejected', 'pending-approval': 'Awaiting QM approval', scheduled: 'Scheduled', 'in-progress': 'In progress', 'pending-review': 'Awaiting review', completed: 'Completed', overdue: 'Overdue', open: 'Open', 'pending-verification': 'Awaiting verification', verified: 'Verified', active: 'Active', high: 'High priority', medium: 'Medium priority', low: 'Low priority', compliant: 'Compliant', partial: 'Partially compliant', 'non-compliant': 'Non-compliant', 'not-assessed': 'Not assessed', 'not-applicable': 'Not applicable' };
export const displayLabel = value => String(value || '').replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
export const dateLabel = (date, options = {}) => new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', year: 'numeric', ...options });
export function auditStatus(audit) {
  if (['scheduled', 'in-progress', 'overdue'].includes(audit.status) && new Date(audit.scheduledUntil || audit.scheduledDate) < new Date()) return 'overdue';
  return audit.status;
}
export const departmentsLabel = audit => audit.concernedDepartments?.map(d => d.name).filter(Boolean).join(', ') || audit.department || 'No department selected';

export const canEditScheduledAudit = audit => ['schedule-rejected', 'pending-approval', 'scheduled', 'overdue'].includes(audit.status) && !audit.conductedDate && !audit.findings?.length && !audit.improvementActions?.length;
