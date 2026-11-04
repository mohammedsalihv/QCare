const governanceReport = require('./governanceReport');
const C = { red: '#E51B2B', navy: '#17364D', muted: '#627488', pale: '#F1F5F9', line: '#C8D4DF', green: '#107C65', amber: '#946000', purple: '#6551A8' };
const label = value => String(value || 'Not specified').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim() || 'Not recorded';
const names = (items, key) => (items || []).map(item => item?.[key]).filter(Boolean).join(', ');
const person = value => value?.employeeName || 'Not recorded';
const date = (value, time = true) => !value || !Number.isFinite(new Date(value).getTime()) ? 'Not recorded' : new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}) });
const time = value => !value || !Number.isFinite(new Date(value).getTime()) ? 'Not specified' : new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false });
const cell = (text, extra = {}) => ({ text: clean(text), ...extra });
const field = (caption, text) => cell(text, { caption });
const tone = status => ['non-compliant', 'overdue'].includes(status) ? C.red : ['compliant', 'completed'].includes(status) ? C.green : ['partial', 'pending-review'].includes(status) ? C.amber : status === 'in-progress' ? C.purple : C.muted;


module.exports = function clinicalAuditReport(audit, { generatedAt = new Date() } = {}) {
  const draft = audit.status !== 'completed';
  return governanceReport({
    title: audit.auditTitle, reference: String(audit._id || '').toUpperCase(), reportLabel: 'CLINICAL AUDIT REPORT',
    status: label(audit.status), statusColor: tone(audit.status), approvalColor: draft ? C.muted : C.green, approvalText: draft ? 'Working report - not yet approved' : 'Approved assessment', generatedAt,
    metrics: [[audit.overallScore == null || ['scheduled', 'overdue'].includes(audit.status) ? 'Not scored' : audit.overallScore + '%', 'Compliance score'], [(audit.coverage ?? 0) + '%', 'Assessment coverage'], [String((audit.improvementActions || []).filter(a => a.status !== 'completed').length), 'Open actions']],
    render: ({ table }) => {
      const scope = [
        [field('Location', [audit.location?.name, audit.location?.code].filter(Boolean).join(' / ') || 'Not specified'), field('Standard / framework', audit.standard)],
        [field('Checklist template', audit.templateId?.templateName || 'Original template unavailable'), field('Governance pillar', label(audit.governancePillar))],
        [field('Audit type', label(audit.auditType)), field('Auditor', audit.auditorName || audit.auditor?.employeeName || 'Not specified')],
        [field('Concerned departments', names(audit.concernedDepartments, 'name') || audit.department || 'Not selected'), field('Concerned people', names(audit.concernedPersons, 'employeeName') || 'Not selected')]
      ];
      if (audit.frequency || audit.nextAuditDate) scope.push([field('Frequency', label(audit.frequency)), field('Next audit', date(audit.nextAuditDate, false))]);
      table('01', 'Audit scope', [], [0.5, 0.5], scope);
      const sessions = audit.sessions?.length ? audit.sessions : [{ startAt: audit.scheduledDate, endAt: audit.scheduledUntil }];
      const schedule = sessions.map((s, i) => [cell(`Visit ${i + 1}`, { bold: true }), date(s.startAt, false), `${time(s.startAt)} - ${s.endAt ? (date(s.endAt, false) === date(s.startAt, false) ? time(s.endAt) : date(s.endAt)) : 'End time not specified'}`]);
      if (audit.conductedDate) schedule.push([field('Assessment started', date(audit.conductedDate))]);
      table('02', 'Dates & timing', ['Visit', 'Date', 'Time window'], [0.16, 0.36, 0.48], schedule, 'All dates and times are shown in Dubai time (UTC+04:00).');
      const checklist = audit.criteriaSnapshot?.length ? audit.criteriaSnapshot : audit.templateId?.criteria || [], findings = audit.findings || [];
      const criteria = [...checklist, ...findings.filter(f => !checklist.some(c => c.criterionId === f.criterionId)).map(f => ({ criterionId: f.criterionId, text: 'Historical criterion' }))];
      const assessment = criteria.map((c, i) => {
        const f = findings.find(f => f.criterionId === c.criterionId), status = f?.complianceStatus || 'not-assessed';
        const evidence = [f?.evidence || 'Not recorded', f?.exclusionReason && `Exclusion reason: ${f.exclusionReason}`, f?.attachments?.length && `Evidence files: ${f.attachments.length} attachment(s) in the audit workspace`].filter(Boolean).join('\n\n');
        return [cell(`${i + 1}. ${c.text || c.criterionId}\n\n${c.criterionId}${c.weight != null ? ` | Weight: ${c.weight}` : ''}`, { bold: true }), cell(label(status), { color: tone(status), bold: true }), evidence];
      });
      table('03', 'Assessment findings', ['Criterion', 'Result', 'Evidence / observations'], [0.34, 0.19, 0.47], assessment.length ? assessment : [[cell('No assessment criteria recorded.', { color: C.muted })]], `Non-compliant: ${audit.nonCompliantCount || 0}   |   Partially compliant: ${audit.partialCount || 0}`);
      const actions = (audit.improvementActions || []).map((a, i) => [
        [ `${i + 1}. ${a.actionText}`, a.criterionId && `Criterion: ${a.criterionId}`, a.rootCause && `Root cause: ${a.rootCause}`, a.completionEvidence && `Completion evidence: ${a.completionEvidence}` ].filter(Boolean).join('\n\n'),
        `${person(a.owner)}\n\nDue: ${date(a.dueDate, false)}`,
        cell([label(a.status), `${label(a.priority)} priority`, a.verifiedAt && `Verified: ${person(a.verifiedBy)}\n${date(a.verifiedAt)}`].filter(Boolean).join('\n\n'), { color: tone(a.status) })
      ]);
      table('04', 'Corrective action plan', ['Action / follow-up', 'Owner / due date', 'Status / priority'], [0.48, 0.25, 0.27], actions.length ? actions : [[cell('No corrective actions recorded.', { color: C.muted })]]);
      table('05', 'Review & approval', [], [0.5, 0.5], [
        [field('Submitted by', `${person(audit.submittedBy)}${audit.submittedAt ? `\n${date(audit.submittedAt)}` : ''}`), field('Reviewed by', `${person(audit.reviewedBy)}${audit.reviewedAt ? `\n${date(audit.reviewedAt)}` : ''}`)],
        [field('Review comments', audit.reviewComment || 'No review comments recorded')],
        [cell(draft ? 'Approval is pending. This report reflects the current audit record.' : 'Approval details reflect the recorded independent review in QCare.', { color: draft ? C.amber : C.green })]
      ]);
      table('06', 'Activity record', ['Date & time', 'Activity', 'Recorded by'], [0.27, 0.43, 0.30], (audit.history || []).map(e => [date(e.at), `${label(e.event)}${e.detail ? `\n${e.detail}` : ''}`, person(e.actor)]));
    }
  });
};

module.exports.filename = (audit, generatedAt = new Date()) => {
  const readable = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 65).replace(/_+$/g, '');
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(generatedAt);
  return ['CMC', 'Clinical_Audit', readable(audit.auditTitle) || 'Report', readable(audit.location?.name || audit.location?.code), day].filter(Boolean).join('_') + '.pdf';
};
