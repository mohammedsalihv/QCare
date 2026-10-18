const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const KPIIndicator = require('../models/KPIIndicator');
const { analyzeRows, parseSpreadsheet, validateRule, signPreview, ruleDigest } = require('../utils/indicatorImport');
const { previewImport } = require('../controllers/indicatorImportController');
const { submitData } = require('../controllers/kpiController');

const rule = { outcomeColumn: 'compliant', matchingValues: ['yes'], otherValues: ['no'], eligibilityColumn: 'eligible', eligibleValues: ['yes'], excludedValues: ['no'], idColumn: 'record_id', dateColumn: 'date', reasonColumn: 'reason', riskColumn: 'risk', measureType: 'compliance', multiplier: 100, targetDirection: 'higher' };
const headers = ['record_id', 'date', 'eligible', 'compliant', 'reason', 'risk'];
const data = values => ({ headers, rows: values.map((row, index) => ({ row: index + 2, values: row })) });
const staffId = '507f1f77bcf86cd799439011';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.data = value; return this; } });
const source = data([
  ['1', '2026-07-01', 'yes', 'YES', '', ''],
  ['2', '2026-08-01', 'yes', 'no', 'Missing documentation', 'high'],
  ['3', '2026-08-01', 'no', '', '', ''],
  ['4', '2026-01-01', 'yes', 'yes', '', ''],
]);

test('counts outcomes, eligibility and dates; groups exceptions from source labels', () => {
  const result = analyzeRows(source, rule, 'Q3', 2026);
  assert.equal(result.numerator, 1); assert.equal(result.denominator, 2);
  assert.equal(result.excluded, 1); assert.equal(result.outsidePeriod, 1);
  assert.equal(result.calculatedValue, 50); assert.equal(result.nonComplianceCount, 1);
  assert.deepEqual(result.risks, [{ label: 'high', count: 1 }]);
  assert.equal(result.canSubmit, true);
});

test('unrecognized outcomes, duplicate IDs and invalid dates block submission', () => {
  for (const extra of [
    ['5', '2026-07-01', 'yes', 'unknown', '', ''],
    ['1', '2026-07-01', 'yes', 'yes', '', ''],
    ['5', '2026-02-30', 'yes', 'yes', '', ''],
    ['5', '2026-07-01', 'maybe', 'yes', '', ''],
  ]) {
    const result = analyzeRows({ headers, rows: [...source.rows, { row: 7, values: extra }] }, rule, 'Q3', 2026);
    assert.equal(result.canSubmit, false); assert.equal(result.invalidRows, 1);
    assert.equal(result.issues[0].row, 7);
  }
});

test('zero eligible population produces no result or submission token', () => {
  const result = analyzeRows(data([['1', '2026-01-01', 'yes', 'yes', '', '']]), rule, 'Q3', 2026);
  assert.equal(result.canSubmit, false); assert.equal(result.calculatedValue, null);
});

test('missing required columns and overlapping outcome values are rejected', () => {
  assert.throws(() => analyzeRows(source, { ...rule, outcomeColumn: 'missing' }, 'Q3', 2026), /Required column/);
  assert.throws(() => validateRule({ ...rule, otherValues: ['YES'] }), /overlap/);
});

test('numeric event totals sum exposure and use configured multiplier without inventing noncompliance', () => {
  const totalsRule = { ...rule, aggregationMode: 'totals', numeratorColumn: 'events', denominatorColumn: 'patient_days', eligibilityColumn: '', idColumn: '', dateColumn: '', reasonColumn: '', riskColumn: '', measureType: 'event', multiplier: 1000, targetDirection: 'lower' };
  const result = analyzeRows({ headers: ['events', 'patient_days'], rows: [{ row: 2, values: [2, 500] }, { row: 3, values: [1, 1000] }] }, totalsRule, 'Q3', 2026);
  assert.equal(result.numerator, 3); assert.equal(result.denominator, 1500);
  assert.equal(result.calculatedValue, 2); assert.equal(result.nonComplianceCount, null);
  assert.equal(result.warnings.length, 2);
  assert.equal(result.canSubmit, true);
});

test('compliance totals cannot exceed the population and blanks are not zero', () => {
  const r = { ...rule, aggregationMode: 'totals', numeratorColumn: 'n', denominatorColumn: 'd', eligibilityColumn: '', idColumn: '', dateColumn: '', reasonColumn: '', riskColumn: '' };
  for (const values of [[4, 2], ['', 2], [1, 0], ['4bad', 5]]) {
    const result = analyzeRows({ headers: ['n', 'd'], rows: [{ row: 2, values }] }, r, 'Q3', 2026);
    assert.equal(result.canSubmit, false); assert.equal(result.invalidRows, 1);
  }
});

test('CSV and XLSX parse actual spreadsheet values consistently', async () => {
  const csv = Buffer.from('record_id,date,eligible,compliant,reason,risk\r\n1,2026-07-01,yes,yes,,\r\n');
  const parsedCsv = await parseSpreadsheet({ originalname: 'observations.csv', buffer: csv });
  assert.equal(analyzeRows(parsedCsv, rule, 'Q3', 2026).numerator, 1);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data'); sheet.addRow(headers); sheet.addRow(['1', new Date('2026-07-01T00:00:00Z'), 'yes', 'yes', '', '']);
  const parsedXlsx = await parseSpreadsheet({ originalname: 'observations.xlsx', buffer: Buffer.from(await workbook.xlsx.writeBuffer()) });
  assert.equal(analyzeRows(parsedXlsx, rule, 'Q3', 2026).numerator, 1);
});

test('multiple sheets, duplicate headers and spreadsheet formulas are rejected', async () => {
  await assert.rejects(parseSpreadsheet({ originalname: 'bad.csv', buffer: Buffer.from('x,X\n1,2\n') }), /unique/);
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Data'); sheet.addRow(['x']); sheet.addRow([{ formula: '1+1', result: 2 }]);
  await assert.rejects(parseSpreadsheet({ originalname: 'bad.xlsx', buffer: Buffer.from(await workbook.xlsx.writeBuffer()) }), /formulas/);
  workbook.addWorksheet('Other').addRow(['other']);
  await assert.rejects(parseSpreadsheet({ originalname: 'bad.xlsx', buffer: Buffer.from(await workbook.xlsx.writeBuffer()) }), /exactly one/);
});

test('a preview issues a token only for valid analyzable source data', async t => {
  const definition = { ...{ indicatorCode: 'PS-1', target: 90 }, importRule: rule };
  t.mock.method(KPIIndicator, 'findOne', () => ({ sort: async () => definition }));
  const res = response();
  await previewImport({ body: { indicatorCode: 'PS-1', reportingPeriod: 'Q3', reportingYear: 2026 }, user: { _id: staffId }, file: { originalname: 'data.csv', buffer: Buffer.from(headers.join(',') + '\n1,2026-07-01,yes,yes,,\n') } }, res);
  assert.equal(res.statusCode, 200); assert(res.data.token); assert.equal(res.data.summary.numerator, 1);
});

test('server uses signed import counts instead of client-provided numbers and retains provenance', async t => {
  const definition = { indicatorCode: 'PS-1', indicatorName: 'Compliance', category: 'safety', target: 90, importRule: rule };
  let calls = 0;
  t.mock.method(KPIIndicator, 'findOne', () => ++calls === 1 ? { sort: async () => definition } : Promise.resolve(null));
  t.mock.method(KPIIndicator.prototype, 'save', async function() { return this; });
  const summary = { ...analyzeRows(source, rule, 'Q3', 2026), sourceSha256: 'file-hash' };
  const token = signPreview({ userId: staffId, indicatorCode: 'PS-1', reportingPeriod: 'Q3', reportingYear: 2026, ruleDigest: ruleDigest(definition), summary });
  const res = response();
  await submitData({ body: { indicatorCode: 'PS-1', reportingPeriod: 'Q3', reportingYear: 2026, numerator: 999, denominator: 999, importToken: token }, user: { _id: staffId, role: 'Staff' } }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.data.numerator, 1); assert.equal(res.data.denominator, 2);
  assert.equal(res.data.importSummary.sourceSha256, 'file-hash'); assert.equal(res.data.calculationRule.multiplier, 100);
});

test('preview cannot be submitted for another user or after its rule changes', async t => {
  const definition = { indicatorCode: 'PS-1', target: 90, importRule: rule };
  t.mock.method(KPIIndicator, 'findOne', () => ({ sort: async () => definition }));
  const payload = { userId: staffId, indicatorCode: 'PS-1', reportingPeriod: 'Q3', reportingYear: 2026, ruleDigest: 'stale', summary: { numerator: 1, denominator: 2 } };
  const body = { indicatorCode: 'PS-1', reportingPeriod: 'Q3', reportingYear: 2026, importToken: signPreview(payload) };
  const stale = response(); await submitData({ body, user: { _id: staffId } }, stale); assert.equal(stale.statusCode, 409);
  const wrongUser = response(); await submitData({ body, user: { _id: 'other' } }, wrongUser); assert.equal(wrongUser.statusCode, 400);
  const tampered = response(); await submitData({ body: { ...body, importToken: body.importToken + 'x' }, user: { _id: staffId } }, tampered); assert.equal(tampered.statusCode, 400);
});

test('saved calculations use snapshotted multiplier and lower-is-better direction', async t => {
  t.mock.method(KPIIndicator.collection, 'insertOne', async () => ({ acknowledged: true }));
  const doc = new KPIIndicator({ indicatorCode: 'EV-1', indicatorName: 'Event rate', category: 'safety', reportingPeriod: 'Q3', reportingYear: 2026, numerator: 3, denominator: 1500, target: 3, createdBy: staffId, calculationRule: { multiplier: 1000, targetDirection: 'lower' } });
  await doc.save();
  assert.equal(doc.calculatedValue, 2); assert.equal(doc.status, 'on-track');
});
