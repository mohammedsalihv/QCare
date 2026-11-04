const governanceReport = require('./governanceReport');
const date = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
const person = value => value?.employeeName || 'Not recorded';
const field = (caption, text) => ({ caption, text: text || 'Not recorded' });

module.exports = function incidentPdf(row, options = {}) {
  return governanceReport({
    title: row.title, reference: row.incidentId, reportLabel: row.isDemo ? 'DEMO INCIDENT REPORT - TRAINING ONLY' : 'INCIDENT REPORT',
    status: row.status, statusColor: row.status === 'Closed' ? '#107C65' : '#627488',
    approvalText: row.isDemo ? 'Fictional training record' : row.status === 'Closed' ? 'Approved closure' : 'Current saved incident record',
    ...options,
    metrics: [[row.riskLevel || 'Not assessed', 'Assessed risk'], [row.harmLevel || 'Unknown', 'Harm level'], [String((row.actions || []).filter(a => !a.completedAt).length), 'Open actions']],
    render: ({ table }) => {
      table('01', 'Incident overview', [], [.5, .5], [
        [field('Branch', row.location), field('Department', row.department)],
        [field('Area / room', row.areaRoom), field('Category', row.category)],
        [field('Incident date (Dubai)', date(row.dateOfIncident)), field('Reported (Dubai)', date(row.createdAt))],
        [field('Reported by', person(row.reportedBy)), field('Initial severity', row.severity)],
        [field('Description', row.description)], [field('Immediate actions', row.immediateActions)],
        [field('Involved staff', (row.involvedStaff || []).map(person).join(', ')), field('Notified staff', (row.notifyStaff || []).map(person).join(', '))],
        [field('Witnesses', row.witnesses)]
      ]);
      table('02', 'Investigation & risk assessment', [], [.5, .5], [
        [field('Investigator', person(row.assignedTo)), field('Investigation deadline', date(row.investigationDue))],
        [field('Likelihood', row.likelihood), field('Potential consequence', row.potentialConsequence)],
        ...[['Operational impact', 'operationalImpact'], ['Temporary controls', 'temporaryControls'], ['Findings', 'findings'], ['Root cause', 'rootCause'], ['Contributing factors', 'contributingFactors'], ['Actions already taken', 'actionsTaken']].map(([label, key]) => [field(label, row[key])])
      ]);
      table('03', 'Corrective & preventive actions', ['Action / success criteria', 'Owner / due date', 'Completion / evidence'], [.43, .25, .32], (row.actions || []).map((a, i) => [
        `${i + 1}. ${a.kind}: ${a.title}\n\nSuccess criteria: ${a.successCriteria}`,
        `${person(a.owner)}\n\nDue: ${date(a.dueDate)}`,
        a.completedAt ? `Completed: ${date(a.completedAt)}\nBy: ${person(a.completedBy)}\n\n${a.completion || 'Not recorded'}` : 'Open - completion pending'
      ]));
      table('04', 'Closure & effectiveness', [], [.5, .5], [
        [field('Closure summary', row.closureSummary)],
        [field('Effectiveness result', row.effectiveness), field('Residual risk', row.residualRisk)],
        [field('Effectiveness evidence', row.effectivenessEvidence)],
        [field('Review date', date(row.effectivenessDate)), field('Approved by', person(row.closedBy))],
        [field('Closed', date(row.closedAt))]
      ]);
      table('05', 'Comments & statements', ['Date / author', 'Type', 'Statement'], [.28, .22, .5], (row.comments || []).map(c => [`${date(c.at)}\n${c.authorName}`, c.kind, c.body]));
      table('06', 'Supporting evidence', ['Attachment', 'Size / availability'], [.6, .4], (row.attachments || []).map(a => [a.name, `${a.size} bytes\nDownload separately in QCare`]));
      table('07', 'Activity record', ['Date & time (Dubai)', 'Activity / detail', 'Recorded by'], [.27, .43, .3], (row.history || []).map(h => [date(h.at), `${h.event}\n${h.detail || ''}`, h.actorName || 'Not recorded']));
    }
  });
};
