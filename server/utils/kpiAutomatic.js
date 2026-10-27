const crypto = require('node:crypto');
const { analyzeRows } = require('./indicatorImport');
const { assessMeasurement } = require('./kpiMeasurement');

const sources = [
  { id: 'cases', label: 'Individual case observations', description: 'One eligible observation per row. A matching outcome contributes one to the numerator.' },
  { id: 'hand-hygiene', label: 'QCare hand hygiene audits', description: 'Sum compliant opportunities / sum total opportunities, using audit date and the selected ward.' },
  { id: 'medication-audit', label: 'QCare medication audit findings', description: 'Count compliant findings / count all findings, using audit date, ward and audit type.' }
];
function validateAutomaticRule(input) {
  if (!sources.some(source => source.id === input?.source)) throw new Error('Choose a supported source.');
  const rule = { source: input.source, ward: String(input.ward || '').trim(), auditType: String(input.auditType || '').trim(), measureType: input.measureType || 'compliance' };
  if (rule.ward.length > 150 || rule.auditType.length > 50) throw new Error('Source filters are too long.');
  if (!['compliance', 'event'].includes(rule.measureType)) throw new Error('Choose compliance or event counting.');
  if (rule.source !== 'cases') rule.measureType = 'compliance';
  if (rule.auditType && !['storage', 'labeling', 'high-alert', 'expiry-check', 'controlled-substance'].includes(rule.auditType)) throw new Error('Choose a valid medication audit type.');
  return rule;
}
const automaticDigest = definition => crypto.createHash('sha256').update(JSON.stringify({ rule: validateAutomaticRule(definition.automaticRule), calculation: definition.calculationRule, target: definition.target, unit: definition.unit, numeratorDesc: definition.numeratorDesc, denominatorDesc: definition.denominatorDesc, exclusions: definition.exclusions })).digest('hex');
function periodWindow(period, year) {
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(period) || !Number.isInteger(Number(year)) || year < 2000 || year > 2100) throw new Error('Choose a valid quarter and year.');
  const month = (Number(period[1]) - 1) * 3;
  // Portal reporting dates use Asia/Dubai, including quarter boundaries.
  return { start: new Date(Date.UTC(Number(year), month, 1) - 4 * 3600000), end: new Date(Date.UTC(Number(year), month + 3, 1) - 4 * 3600000) };
}
function sourceTable(rule, records) {
  if (!Array.isArray(records) || records.length > 10000) throw new Error('Use at most 10,000 source records. Narrow the source scope.');
  const totals = rule.source === 'hand-hygiene';
  const headers = totals ? ['id', 'date', 'eligible', 'numerator', 'denominator', 'reason', 'department'] : ['id', 'date', 'eligible', 'outcome', 'reason', 'department'];
  const rows = [];
  const day = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Date(date.getTime() + 4 * 3600000).toISOString().slice(0, 10) : '';
  };
  for (const record of records) {
    if (rule.source === 'cases') {
      if (!record || typeof record !== 'object' || [record.recordId, record.date, record.outcome, record.reason, record.department].some(value => value !== undefined && typeof value !== 'string')) throw new Error('Case fields must contain text.');
      if (String(record.recordId || '').length > 100 || String(record.reason || '').length > 120 || String(record.department || '').length > 150) throw new Error('Use short anonymous case references and reason categories.');
      if (record.outcome === 'excluded' && !record.reason?.trim()) throw new Error('Record an exclusion reason for every excluded observation.');
      rows.push({ values: [record.recordId, record.date, record.outcome === 'excluded' ? 'no' : 'yes', record.outcome, record.reason, record.department || 'Unassigned'] });
    } else if (totals) {
      rows.push({ values: [String(record._id), day(record.auditDate), 'yes', Number.isSafeInteger(record.compliantCount) ? record.compliantCount : null, Number.isSafeInteger(record.totalOpportunities) ? record.totalOpportunities : null, 'Reason not categorized in source', record.department || record.ward || 'Unassigned'] });
    } else {
      const findings = record.findings?.length ? record.findings : [{}];
      findings.forEach((finding, index) => rows.push({ values: [`${record._id}:${finding._id || index}`, day(record.auditDate), 'yes', typeof finding.compliant === 'boolean' ? finding.compliant ? 'yes' : 'no' : '', finding.item || 'Unspecified checklist item', record.ward || 'Unassigned'] }));
    }
  }
  if (rows.length > 50000) throw new Error('Too many findings. Narrow the source scope.');
  return { headers, rows: rows.map((row, index) => ({ ...row, row: index + 1 })) };
}
function analyzeAutomatic(definition, records, period, year) {
  periodWindow(period, year);
  const automaticRule = validateAutomaticRule(definition.automaticRule);
  const multiplier = definition.calculationRule?.multiplier ?? 100;
  if (![100, 1000, 10000].includes(multiplier)) throw new Error('This source supports case percentages and rates. Average or duration indicators require a dedicated source rule.');
  const rule = { aggregationMode: automaticRule.source === 'hand-hygiene' ? 'totals' : 'rows', numeratorColumn: 'numerator', denominatorColumn: 'denominator', outcomeColumn: 'outcome', matchingValues: ['yes'], otherValues: ['no'], idColumn: 'id', dateColumn: 'date', reasonColumn: 'reason', eligibilityColumn: 'eligible', eligibleValues: ['yes'], excludedValues: ['no'], measureType: automaticRule.measureType, multiplier, targetDirection: definition.calculationRule?.targetDirection || 'higher' };
  const table = sourceTable(automaticRule, records);
  const summary = analyzeRows(table, rule, period, year);
  summary.reasons = summary.reasons.map(item => ({ ...item, percentageOfExceptions: summary.exceptions > 0 ? Number((item.count / summary.exceptions * 100).toFixed(2)) : 0 }));
  const measurement = summary.canSubmit ? assessMeasurement({ ...summary, target: definition.target, calculationRule: definition.calculationRule }) : { calculatedValue: null, variance: null, status: 'not-assessed' };
  if (!summary.canSubmit) summary.calculatedValue = null;
  const groups = new Map();
  for (const row of table.rows) {
    const group = row.values.at(-1);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(row);
  }
  if (groups.size > 100) throw new Error('Use at most 100 department or specialty labels.');
  summary.departments = [...groups].map(([label, rows]) => {
    const counts = analyzeRows({ headers: table.headers, rows }, rule, period, year);
    return { label, numerator: counts.numerator, denominator: counts.denominator, nonComplianceCount: counts.nonComplianceCount, ...(counts.canSubmit ? assessMeasurement({ ...counts, target: definition.target, calculationRule: definition.calculationRule }) : { calculatedValue: null, status: 'not-assessed' }) };
  });
  const lower = rule.targetDirection === 'lower';
  const targetMet = summary.canSubmit && definition.target != null ? (lower ? summary.numerator / summary.denominator * multiplier <= definition.target : summary.numerator / summary.denominator * multiplier >= definition.target) : null;
  summary.analysis = { ...measurement, targetMet, gap: measurement.variance === null ? null : Number(Math.max(0, lower ? measurement.variance : -measurement.variance).toFixed(2)), suggestions: [] };
  if (summary.canSubmit) {
    summary.analysis.suggestions = [...summary.reasons].sort((a, b) => b.count - a.count).slice(0, 3).map(item => `Review ${item.count} recorded exception(s) in “${item.label}”; verify the cause and agree a corrective action with ${definition.owner || 'the responsible department'}.`);
    if (targetMet === false && !summary.analysis.suggestions.length) summary.analysis.suggestions.push('Review the source observations with the responsible department and document the reasons for the target gap.');
    if (targetMet === true) summary.analysis.suggestions.push('Maintain the current process and monitor the next reporting period.');
  }
  summary.sourceKind = 'automatic';
  summary.calculatedAt = new Date().toISOString();
  summary.automaticRule = automaticRule;
  summary.sourceLabel = sources.find(source => source.id === automaticRule.source).label;
  summary.sourceSha256 = crypto.createHash('sha256').update(JSON.stringify(table)).digest('hex');
  summary.sourceRecordCount = records.length;
  summary.sourceRecordIds = records.slice(0, 100).map(record => String(automaticRule.source === 'cases' ? record.recordId || '' : record._id));
  if (automaticRule.source === 'cases') {
    // Keep anonymous source observations with the reviewed snapshot for corrections.
    summary.caseObservations = records.map(record => Object.fromEntries(['recordId', 'date', 'outcome', 'reason', 'department'].map(key => [key, record[key] || ''])));
  }
  return { summary, rule };
}
module.exports = { sources, validateAutomaticRule, automaticDigest, periodWindow, sourceTable, analyzeAutomatic };
