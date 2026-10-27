const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeAutomatic, automaticDigest, periodWindow } = require('../utils/kpiAutomatic');
const { signPreview } = require('../utils/indicatorImport');
const KPIIndicator = require('../models/KPIIndicator');
const { submitData } = require('../controllers/kpiController');
const { previewAutomatic, saveAutomaticRule } = require('../controllers/kpiAutomaticController');
const definition = { indicatorCode: 'AUTO-1', indicatorName: 'Compliance', category: 'patient-safety', target: 90, owner: 'Quality', automaticRule: { source: 'cases', measureType: 'compliance' }, calculationRule: { multiplier: 100, targetDirection: 'higher', warningTolerance: 0 } };
const observation = (id, outcome, extras = {}) => ({ recordId: id, date: '2026-10-25', outcome, department: 'Quality', ...extras });
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
const user = { _id: '507f1f77bcf86cd799439011', role: 'Staff' };

test('counts eligible observations and exclusions, with target gap and department analysis', () => {
  const { summary } = analyzeAutomatic(definition, [observation('1', 'yes'), observation('2', 'no', { reason: 'Incomplete checklist' }), observation('3', 'excluded', { reason: 'Not eligible' }), observation('4', 'yes', { date: '2026-09-30' })], 'Q4', 2026);
  assert.equal(summary.numerator, 1); assert.equal(summary.denominator, 2);
  assert.equal(summary.calculatedValue, 50); assert.equal(summary.excluded, 1); assert.equal(summary.outsidePeriod, 1);
  assert.equal(summary.nonComplianceCount, 1); assert.equal(summary.analysis.gap, 40);
  assert.equal(summary.analysis.targetMet, false); assert.equal(summary.analysis.status, 'breached');
  assert.match(summary.analysis.suggestions[0], /Incomplete checklist/);
  assert.equal(summary.departments[0].denominator, 2); assert(summary.canSubmit);
  assert.equal(summary.caseObservations.length, 4);
  assert.equal(summary.caseObservations[2].reason, 'Not eligible');
});
test('duplicate IDs, unknown outcomes, and invalid dates block submission', () => {
  for (const rows of [[observation('1', 'yes'), observation('1', 'no')], [observation('1', '')], [observation('1', 'yes', { date: '2026-02-30' })], [observation('', 'yes')]]) {
    const { summary } = analyzeAutomatic(definition, rows, 'Q4', 2026);
    assert.equal(summary.canSubmit, false); assert(summary.invalidRows > 0);
    assert.equal(summary.analysis.status, 'not-assessed');
    assert.equal(summary.analysis.targetMet, null);
  }
  assert.throws(() => analyzeAutomatic(definition, [observation('1', 'excluded')], 'Q4', 2026), /exclusion reason/);
});
test('missing data is not successful performance; event measures count matching events', () => {
  const empty = analyzeAutomatic(definition, [], 'Q4', 2026).summary;
  assert.equal(empty.analysis.targetMet, null); assert.equal(empty.analysis.status, 'not-assessed'); assert.equal(empty.canSubmit, false);
  const event = analyzeAutomatic({ ...definition, target: 600, automaticRule: { source: 'cases', measureType: 'event' }, calculationRule: { multiplier: 1000, targetDirection: 'lower' } }, [observation('1', 'yes'), observation('2', 'no')], 'Q4', 2026).summary;
  assert.equal(event.numerator, 1); assert.equal(event.denominator, 2); assert.equal(event.calculatedValue, 500); assert.equal(event.analysis.targetMet, true); assert.equal(event.nonComplianceCount, null);
});
test('hand hygiene aggregates opportunities, never averages audit percentages', () => {
  const records = [{ _id: '1', auditDate: '2026-10-01T00:00:00+04:00', totalOpportunities: 2, compliantCount: 2, department: 'A' }, { _id: '2', auditDate: '2026-10-25', totalOpportunities: 98, compliantCount: 48, department: 'B' }];
  const result = analyzeAutomatic({ ...definition, automaticRule: { source: 'hand-hygiene' } }, records, 'Q4', 2026).summary;
  assert.equal(result.numerator, 50); assert.equal(result.denominator, 100); assert.equal(result.calculatedValue, 50); assert.equal(result.departments.length, 2);
  records[0].compliantCount = 3;
  assert.equal(analyzeAutomatic({ ...definition, automaticRule: { source: 'hand-hygiene' } }, records, 'Q4', 2026).summary.canSubmit, false);
});
test('medication audits count findings; missing outcome does not become a failed check', () => {
  const records = [{ _id: '1', auditDate: '2026-10-25', ward: 'A', findings: [{ item: 'Label', compliant: true }, { item: 'Storage', compliant: false }] }];
  const def = { ...definition, automaticRule: { source: 'medication-audit' } };
  const result = analyzeAutomatic(def, records, 'Q4', 2026).summary;
  assert.equal(result.numerator, 1); assert.equal(result.denominator, 2); assert.equal(result.reasons[0].label, 'Storage');
  records[0].findings.push({ item: 'Unknown' });
  assert.equal(analyzeAutomatic(def, records, 'Q4', 2026).summary.canSubmit, false);
});
test('quarter boundaries use Dubai dates and source rules are explicit', () => {
  const window = periodWindow('Q4', 2026);
  assert.equal(window.start.toISOString(), '2026-09-30T20:00:00.000Z');
  assert.equal(window.end.toISOString(), '2026-12-31T20:00:00.000Z');
  assert.throws(() => analyzeAutomatic({ ...definition, automaticRule: { source: 'arbitrary-model' } }, [], 'Q4', 2026), /supported source/);
  assert.throws(() => analyzeAutomatic({ ...definition, calculationRule: { multiplier: 1 } }, [], 'Q4', 2026), /dedicated source/);
  assert.notEqual(automaticDigest(definition), automaticDigest({ ...definition, target: 80 }));
});
test('preview calculates server-side and issues a token for eligible observations only', async t => {
  t.mock.method(KPIIndicator, 'findOne', () => ({ sort: async () => definition }));
  const res = response();
  await previewAutomatic({ body: { indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, cases: [observation('1', 'yes')], numerator: 999 }, user }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.data.summary.numerator, 1); assert(res.data.token);
});
test('submission stores calculated analysis and ignores forged client totals', async t => {
  let calls = 0;
  t.mock.method(KPIIndicator, 'findOne', () => ++calls === 1 ? { sort: async () => definition } : Promise.resolve(null));
  t.mock.method(KPIIndicator.prototype, 'save', async function() { return this; });
  const { summary } = analyzeAutomatic(definition, [observation('1', 'yes'), observation('2', 'no')], 'Q4', 2026);
  const importToken = signPreview({ userId: user._id, indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, sourceKind: 'automatic', ruleDigest: automaticDigest(definition), calculationRule: definition.calculationRule, summary });
  const res = response();
  await submitData({ body: { indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, importToken, numerator: 999, denominator: 999 }, user }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.data.numerator, 1); assert.equal(res.data.denominator, 2); assert.equal(res.data.importSummary.analysis.targetMet, false); assert.equal(res.data.validationStatus, 'Pending Validation');
});
test('automatic indicators reject manual totals and stale source rules', async t => {
  t.mock.method(KPIIndicator, 'findOne', () => ({ sort: async () => definition }));
  const res = response();
  await submitData({ body: { indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, numerator: 99, denominator: 100 }, user }, res);
  assert.equal(res.statusCode, 400); assert.match(res.data.message, /configured source/);
  const importToken = signPreview({ userId: user._id, indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, sourceKind: 'automatic', ruleDigest: 'old', summary: { numerator: 1, denominator: 2, canSubmit: true } });
  const stale = response(); await submitData({ body: { indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, importToken }, user }, stale);
  assert.equal(stale.statusCode, 409);
});
test('fixed waiting-time definitions cannot use generic automatic counting', async t => {
  t.mock.method(KPIIndicator, 'findOne', () => ({ sort: async () => ({ ...definition, importRule: { preset: 'fixed' } }) }));
  const res = response(); await saveAutomaticRule({ params: { code: 'AUTO-1' }, body: { source: 'cases' }, user }, res);
  assert.equal(res.statusCode, 400);
});

test('portal source query applies ward, audit type and Dubai reporting window', async t => {
  const MedicationAudit = require('../models/MedicationAudit');
  const sourceDefinition = { ...definition, automaticRule: { source: 'medication-audit', ward: 'Ward A', auditType: 'storage' } };
  t.mock.method(KPIIndicator, 'findOne', () => ({ sort: async () => sourceDefinition }));
  let filter, projection, limit;
  t.mock.method(MedicationAudit, 'find', value => {
    filter = value;
    return { select(value) { projection = value; return this; }, sort() { return this; }, limit(value) { limit = value; return this; }, lean: async () => [{ _id: '1', auditDate: '2026-10-25', ward: 'Ward A', findings: [{ compliant: true, item: 'Label' }] }] };
  });
  const res = response();
  await previewAutomatic({ body: { indicatorCode: 'AUTO-1', reportingPeriod: 'Q4', reportingYear: 2026, cases: [observation('fake', 'no')] }, user }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.data.summary.numerator, 1);
  assert.equal(filter.ward, 'Ward A'); assert.equal(filter.auditType, 'storage');
  assert.equal(filter.auditDate.$gte.toISOString(), '2026-09-30T20:00:00.000Z');
  assert.equal(filter.auditDate.$lt.toISOString(), '2026-12-31T20:00:00.000Z');
  assert.equal(limit, 10001); assert(!projection.includes('notes'));
});

test('source setup and preview routes preserve role boundaries', () => {
  const routes = require('../routes/kpiRoutes');
  const setup = routes.stack.find(layer => layer.route?.path === '/automatic/rule/:code').route;
  const res = response();
  setup.stack[1].handle({ user }, res, () => assert.fail('Staff cannot change source rules'));
  assert.equal(res.statusCode, 403);
  const preview = routes.stack.find(layer => layer.route?.path === '/automatic/preview').route;
  assert.equal(preview.stack[0].handle.name, 'protect');
});
