const governanceReport = require('./governanceReport');

module.exports = function incidentSummaryPdf({ statuses, risks, categories, overdue, total, filters = {} }, options = {}) {
  const selected = ['queue', 'search', 'status', 'category', 'riskLevel', 'location', 'department', 'scope', 'overdue', 'from', 'to']
    .filter(key => filters[key]).map(key => `${key}: ${filters[key]}`).join('\n');
  return governanceReport({
    title: 'Incident management summary', reference: 'INCIDENT-SUMMARY', reportLabel: filters.demo === 'only' ? 'DUMMY INCIDENT SUMMARY - TRAINING ONLY' : 'INCIDENT SUMMARY REPORT',
    status: 'Management summary', approvalText: 'Current saved records',
    metrics: [[String(total), 'Total incidents'], [String(overdue), 'With overdue work'], [String(statuses.find(row => row._id === 'Closed')?.count || 0), 'Closed incidents']],
    ...options,
    render: ({ table }) => {
      table('01', 'Report scope', [], [1], [
        [{ caption: 'Access', text: 'Incidents accessible to the requesting user.' }],
        [{ caption: 'Applied filters', text: selected || 'All accessible incidents' }],
        ...(total === 0 ? [[{ text: 'No incidents match these filters. There are no records to summarize.', color: '#627488' }]] : [])
      ]);
      const breakdown = [['Status', statuses], ['Assessed risk', risks], ['Category', categories]].flatMap(([title, rows]) =>
        rows.length ? rows.map(row => [title, row._id || 'Not assessed', String(row.count)]) : [[title, 'No incidents', '0']]);
      table('02', 'Incident breakdown', ['Breakdown', 'Group', 'Incidents'], [.3, .5, .2], breakdown);
      table('03', 'Interpretation', [], [1], [[{ text: 'Counts reflect current saved records, not the number of events or affected people. Overdue excludes closed, rejected and duplicate incidents.' }]]);
    }
  });
};
