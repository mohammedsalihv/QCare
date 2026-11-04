const governanceReport = require('./governanceReport');
const { guide } = require('./incidentReportPresentation');

module.exports = function incidentSummaryPdf({ statuses, risks, categories, overdue, total, filters = {} }, options = {}) {
  const selected = ['queue', 'search', 'status', 'category', 'riskLevel', 'location', 'department', 'scope', 'overdue', 'from', 'to']
    .filter(key => filters[key]).map(key => `${key}: ${filters[key]}`).join('\n');
  return governanceReport({
    title: 'Incident management summary', reference: 'INCIDENT-SUMMARY', reportLabel: 'INCIDENT SUMMARY REPORT',
    status: 'Management summary', approvalText: 'Current saved records',
    metrics: [[String(total), 'Total incidents'], [String(overdue), 'With overdue work'], [String(statuses.find(row => row._id === 'Closed')?.count || 0), 'Closed incidents']],
    ...options,
    render: ({ table }) => {
      table('01', 'Report scope', [], [1], [
        [{ caption: 'Access', text: 'Incidents accessible to the requesting user.' }],
        [{ caption: 'Applied filters', text: selected || 'All accessible incidents' }],
        ...(total === 0 ? [[{ text: 'No incidents match these filters. There are no records to summarize.', color: '#627488' }]] : [])
      ]);
      table('02', 'Workflow position & next actions', ['Status', 'Count', 'Meaning / next action'], [.25, .09, .66], statuses.map(row => {
        const info = guide[row._id];
        return [info?.label || row._id, String(row.count), info ? `${info.meaning}\n\n${info.next}` : 'Review the incident record.'];
      }));
      const breakdown = [['Assessed risk', risks], ['Category', categories]].flatMap(([title, rows]) =>
        rows.length ? rows.map(row => [title, row._id || 'Not assessed', String(row.count)]) : [[title, 'No incidents', '0']]);
      table('03', 'Risk & incident types', ['Breakdown', 'Group', 'Incidents'], [.3, .5, .2], breakdown);
      table('04', 'Reading this report', [], [1], [
        [{ text: 'Counts reflect current saved records, not the number of events or affected people. Overdue excludes closed, rejected and duplicate incidents.' }],
        [{ caption: 'Risk and severity', text: 'Assessed risk reflects the investigation assessment. Initial severity is recorded when reporting; an unassessed incident must not be interpreted as low risk.' }],
        [{ caption: 'Closure', text: 'Awaiting closure review means independent approval is still pending. Resolved is a legacy status requiring review; only Closed indicates approved closure.' }],
        [{ caption: 'Follow-up', text: 'Open the matching incidents in the register to review owners, deadlines and completion evidence. Each incident has its own downloadable full report.' }]
      ]);
    }
  });
};
