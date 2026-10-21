const { test } = require('node:test');
const assert = require('node:assert/strict');
const { catalog, getPreset, ruleFor, analyzeWaiting } = require('../utils/waitingTime');
const { analyzeRows, validateRule } = require('../utils/indicatorImport');
const KPIIndicator = require('../models/KPIIndicator');
const { submitData } = require('../controllers/kpiController');
const { previewImport } = require('../controllers/indicatorImportController');
const staffId = '507f1f77bcf86cd799439011';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.data = value; return this; } });
const base = { record_id: '1', reporting_date: '2026-07-01', population_eligible: 'yes', exclusion_reason: 'none' };
const time = minutes => new Date(Date.parse('2026-07-01T00:00:00+04:00') + minutes * 60000).toISOString();
function data(code, records) { const headers = getPreset(code).columns; return { headers, rows: records.map((r,i) => ({ row: i+2, values: headers.map(h => ({ ...base, record_id: String(i+1), ...r })[h]) })) }; }
const run = (code, records) => analyzeRows(data(code, records), ruleFor(code), 'Q3', 2026);

test('catalog contains active definitions, separate sub-KPIs, and no retired codes', () => {
  assert.equal(catalog.length, 28);
  for (const code of ['WT001','WT002','WT004']) assert.equal(getPreset(code), undefined);
  assert.equal(validateRule({ preset: 'WT008', multiplier: 1000 }).multiplier, 100);
  assert.throws(() => validateRule({ preset: 'unknown' }));
});
for (const p of catalog.filter(p => p.kind === 'time' && p.timeUnit !== 'days')) test(`${p.indicatorCode}: inclusive threshold, failures retained, complete statistics`, () => {
  const result = run(p.indicatorCode, [0, p.limit, p.limit + 1].map(minutes => ({ [p.start]: time(0), [p.end]: time(minutes) })));
  assert.equal(result.numerator, 2); assert.equal(result.denominator, 3); assert.equal(result.calculatedValue, 66.67); assert(result.canSubmit);
  assert.equal(result.waitingStatistics.count, 3);
  if (p.statsUnit === 'hours') assert.equal(result.waitingStatistics.max, Number(((p.limit+1)/60).toFixed(2)));
});
test('WT005 counts the decision day as day one, including weekends', () => {
  const result = run('WT005', [{ decision_date: '2026-07-01', admission_date: '2026-07-28' }, { decision_date: '2026-07-01', admission_date: '2026-07-29' }]);
  assert.equal(result.numerator, 1); assert.equal(result.waitingStatistics.min, 28);
});
test('exclusions and outside-period rows are excluded, without needing outcome timestamps', () => {
  const result = run('WT008', [{ exclusion_reason: 'lwbs' }, { population_eligible: 'no' }, { reporting_date: '2026-10-01' }, { registration_at: time(0), doctor_at: time(30) }]);
  assert.equal(result.excluded, 2); assert.equal(result.outsidePeriod, 1); assert.equal(result.denominator, 1); assert(result.canSubmit);
});
test('unknown exclusions, missing times, negative waits, duplicate IDs and invalid dates block submission', () => {
  const valid = { registration_at: time(0), doctor_at: time(30) };
  for (const change of [{ exclusion_reason: 'dead_on_arrival' }, { doctor_at: '' }, { doctor_at: time(-1) }, { reporting_date: '2026-02-30' }, { registration_at: '2026-07-01T25:00:00' }, { population_eligible: '' }]) {
    const result = run('WT008', [{ ...valid, ...change }]); assert.equal(result.canSubmit, false); assert.equal(result.invalidRows, 1);
  }
  assert.equal(run('WT008', [{ ...valid, record_id: 'same' }, { ...valid, record_id: 'same' }]).invalidRows, 1);
  assert.throws(() => analyzeWaiting(data('WT008', [valid]), 'WT008', 'Q2', 2026), /Q3 2026/);
});
test('zero eligible population has no performance or target assessment', () => {
  const result = run('WT008', [{ exclusion_reason: 'lwbs' }]);
  assert.equal(result.denominator, 0); assert.equal(result.calculatedValue, null); assert.equal(result.targetMet, null); assert.equal(result.canSubmit, false);
});
test('an explicitly unperformed timed event remains a denominator failure without fabricating a duration', () => {
  const result = run('WT007', [{ arrival_at: time(0), ct_interpreted_at: 'not_done' }]);
  assert.equal(result.numerator, 0); assert.equal(result.denominator, 1); assert.equal(result.calculatedValue, 0);
  assert.equal(result.waitingStatistics, null); assert.equal(result.canSubmit, true);
});
test('WT011 includes all encounters and uses <=3%; WT013 uses strictly <20%', () => {
  const lwbs = run('WT011', Array.from({length:100}, (_,i) => ({ left_without_seen: i < 3 ? 'yes' : 'no' })));
  assert.equal(lwbs.targetMet, true); assert.equal(lwbs.calculatedValue, 3);
  const admitted = run('WT013', Array.from({length:5}, (_,i) => ({ admitted: i === 0 ? 'yes' : 'no' })));
  assert.equal(admitted.targetMet, false); assert.equal(admitted.calculatedValue, 20);
});
test('WT010 uses complete seven-day follow-up and a return crossing the quarter boundary', () => {
  const row = { reporting_date: '2026-09-30', discharge_at: '2026-09-30T10:00:00+04:00', next_return_at: '2026-10-07T10:00:00+04:00', followup_complete: 'yes' };
  assert.equal(run('WT010', [row]).numerator, 1);
  assert.equal(run('WT010', [{ ...row, next_return_at: '2026-10-07T10:00:01+04:00' }]).numerator, 0);
  assert.equal(run('WT010', [{ ...row, followup_complete: 'no' }]).canSubmit, false);
  assert.equal(run('WT010', [{ ...row, next_return_at: '' }]).numerator, 0);
});
for (const [code, limit] of [['WT014',180],['WT015',60]]) test(`${code}: earlier arrival, culture before antibiotics and all-or-none bundle`, () => {
  const row = { registration_at: time(10), triage_at: time(0), culture_at: time(20), antibiotic_at: time(limit), lactate_at: time(limit) };
  for (const suffix of ['a','b','c','d']) assert.equal(run(code+suffix, [row]).numerator, 1);
  assert.equal(run(code+'d', [{ ...row, lactate_at: time(limit+1) }]).numerator, 0);
  assert.equal(run(code+'a', [{ ...row, culture_at: row.antibiotic_at }]).numerator, 0);
  assert.equal(run(code+'d', [{ ...row, lactate_at: 'not_done' }]).denominator, 1);
  assert.equal(run(code+'d', [{ ...row, lactate_at: '' }]).canSubmit, false);
});
test('appointment quarterly mean uses three monthly means, not pooled or percentage values', () => {
  const result = run('WT017', [
    { request_date: '2026-07-01', third_available_date: '2026-07-01' },
    { request_date: '2026-07-01', third_available_date: '2026-07-03' },
    { reporting_date: '2026-08-01', request_date: '2026-08-01', third_available_date: '2026-08-05' },
    { reporting_date: '2026-09-01', request_date: '2026-09-01', third_available_date: '2026-09-08' },
  ]);
  assert.equal(result.numerator, 12); assert.equal(result.denominator, 3); assert.equal(result.calculatedValue, 4); assert(result.canSubmit); assert.equal(result.targetMet, null);
  const incomplete = run('WT017', [{ request_date: '2026-07-01', third_available_date: '2026-07-01' }]);
  assert.equal(incomplete.canSubmit, false); assert.equal(incomplete.calculatedValue, null);
});
test('persisted waiting-time reports retain days, null targets and strict threshold', async t => {
  t.mock.method(KPIIndicator.collection, 'insertOne', async () => ({ acknowledged: true }));
  for (const [code,n,d,expected,status] of [['WT017',12,3,4,'not-assessed'],['WT013',1,5,20,'breached'],['WT008',0,0,null,'not-assessed']]) {
    const doc = new KPIIndicator({ indicatorCode: code, indicatorName: code, category: 'waiting-time', reportingPeriod: 'Q3', reportingYear: 2026, numerator:n, denominator:d, target:getPreset(code).target, calculationRule:ruleFor(code), createdBy:staffId });
    await doc.save(); assert.equal(doc.calculatedValue,expected); assert.equal(doc.status,status);
    if (code === 'WT017') { assert.equal(doc.target,null); assert.equal(doc.unit,'days'); }
  }
});
test('waiting preview accepts CSV, signs derived counts, and rejects manual substitution', async t => {
  const definition = { indicatorCode:'WT008', indicatorName:'ED doctor', category:'waiting-time', target:90, importRule:ruleFor('WT008') };
  let calls = 0;
  t.mock.method(KPIIndicator, 'findOne', () => (++calls <= 2 ? {sort:async()=>definition} : Promise.resolve(null)));
  t.mock.method(KPIIndicator.prototype, 'save', async function() { return this; });
  const table = data('WT008', [{registration_at:time(0),doctor_at:time(30)}]);
  const file = { originalname:'test.csv', buffer:Buffer.from([table.headers.join(','),table.rows[0].values.join(',')].join('\n')) };
  const body = { indicatorCode:'WT008', reportingPeriod:'Q3', reportingYear:2026 };
  const preview = response(); await previewImport({body,file,user:{_id:staffId}}, preview);
  assert(preview.data.token); assert.equal(preview.data.summary.numerator,1);
  const saved = response(); await submitData({body:{...body,numerator:999,denominator:999,importToken:preview.data.token},user:{_id:staffId}},saved);
  assert.equal(saved.statusCode,201); assert.equal(saved.data.numerator,1); assert.equal(saved.data.calculationRule.preset,'WT008');
  calls=0;
  const manual=response(); await submitData({body:{...body,numerator:1,denominator:1},user:{_id:staffId}},manual);
  assert.equal(manual.statusCode,400);
});
