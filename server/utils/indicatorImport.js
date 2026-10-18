const ExcelJS = require('exceljs');
const { Readable } = require('node:stream');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const signingKey = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const normalized = value => String(value ?? '').trim().toLowerCase();
const error = message => { throw new Error(message); };
const ruleFields = ['aggregationMode', 'numeratorColumn', 'denominatorColumn', 'outcomeColumn', 'matchingValues', 'otherValues', 'eligibilityColumn', 'eligibleValues', 'excludedValues', 'idColumn', 'dateColumn', 'reasonColumn', 'riskColumn', 'measureType', 'multiplier', 'targetDirection'];

function validateRule(input) {
  const rule = Object.fromEntries(ruleFields.map(key => [key, input?.[key]]).filter(([, value]) => value !== undefined));
  for (const key of ['matchingValues', 'otherValues', 'eligibleValues', 'excludedValues']) {
    rule[key] = Array.isArray(rule[key]) ? [...new Set(rule[key].map(normalized).filter(Boolean))] : [];
    if (rule[key].length > 30 || rule[key].some(value => value.length > 100)) error('Use at most 30 short values per rule.');
  }
  for (const key of ['numeratorColumn', 'denominatorColumn', 'outcomeColumn', 'eligibilityColumn', 'idColumn', 'dateColumn', 'reasonColumn', 'riskColumn']) {
    rule[key] = String(rule[key] || '').trim();
    if (rule[key].length > 100) error('Column names must be at most 100 characters.');
  }
  rule.aggregationMode = rule.aggregationMode || 'rows';
  if (!['rows', 'totals'].includes(rule.aggregationMode)) error('Choose row counting or numeric totals.');
  if (rule.aggregationMode === 'rows' && (!rule.outcomeColumn || !rule.matchingValues.length || !rule.otherValues.length)) error('Configure an outcome column, numerator values and other outcome values.');
  if (rule.aggregationMode === 'totals' && (!rule.numeratorColumn || !rule.denominatorColumn || normalized(rule.numeratorColumn) === normalized(rule.denominatorColumn))) error('Choose separate numeric numerator and denominator columns.');
  if (rule.aggregationMode === 'rows' && rule.matchingValues.some(value => rule.otherValues.includes(value))) error('Numerator and other outcome values must not overlap.');
  if (rule.eligibilityColumn && (!rule.eligibleValues.length || !rule.excludedValues.length)) error('Define both included and excluded eligibility values.');
  if (rule.eligibleValues.some(value => rule.excludedValues.includes(value))) error('Included and excluded eligibility values must not overlap.');
  if (!['compliance', 'event'].includes(rule.measureType)) error('Choose compliance or event rate.');
  rule.multiplier = Number(rule.multiplier);
  if (![100, 1000, 10000].includes(rule.multiplier)) error('Choose a multiplier of 100, 1000 or 10000.');
  if (!['higher', 'lower'].includes(rule.targetDirection)) error('Choose whether higher or lower results meet the target.');
  return rule;
}

async function parseSpreadsheet(file) {
  if (!file?.buffer?.length) error('Upload a CSV or XLSX spreadsheet.');
  const workbook = new ExcelJS.Workbook();
  const extension = file.originalname.toLowerCase().split('.').pop();
  if (extension === 'csv') await workbook.csv.read(Readable.from([file.buffer]), { map: value => value });
  else if (extension === 'xlsx') await workbook.xlsx.load(file.buffer);
  else error('Only CSV and XLSX files are supported.');
  const sheets = workbook.worksheets.filter(sheet => sheet.rowCount > 0);
  if (sheets.length !== 1) error('Use a file with exactly one populated worksheet.');
  const sheet = sheets[0];
  if (sheet.rowCount > 50001 || sheet.columnCount > 100) error('Use at most 50,000 data rows and 100 columns.');
  const cellValue = value => {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if (value.formula || value.sharedFormula) error('Use exported values rather than spreadsheet formulas.');
      if (value.richText) return value.richText.map(part => part.text).join('');
      if (typeof value.text === 'string') return value.text;
      error('Unsupported cell value. Export the sheet as plain values.');
    }
    return value;
  };
  const headers = Array.from({ length: sheet.columnCount }, (_, i) => String(cellValue(sheet.getRow(1).getCell(i + 1).value) ?? '').trim());
  if (headers.some(header => !header) || new Set(headers.map(normalized)).size !== headers.length) error('Every column needs a unique, non-empty header in the first row.');
  const rows = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const values = headers.map((_, i) => cellValue(row.getCell(i + 1).value));
    if (values.some(value => value !== null && value !== undefined && String(value).trim() !== '')) rows.push({ row: index, values });
  });
  if (!rows.length) error('The spreadsheet has no data rows.');
  return { headers, rows };
}

function analyzeRows({ headers, rows }, inputRule, period, year) {
  const rule = validateRule(inputRule);
  const column = name => {
    if (!name) return -1;
    const index = headers.findIndex(header => normalized(header) === normalized(name));
    if (index === -1) error(`Required column "${name}" was not found. Available columns: ${headers.join(', ')}`);
    return index;
  };
  const fields = ['eligibilityColumn', 'idColumn', 'dateColumn', 'reasonColumn', 'riskColumn', ...(rule.aggregationMode === 'totals' ? ['numeratorColumn', 'denominatorColumn'] : ['outcomeColumn'])];
  const indexes = Object.fromEntries(fields.map(key => [key, column(rule[key])]));
  let numerator = 0, denominator = 0, excluded = 0, outsidePeriod = 0;
  const issues = [], ids = new Set(), reasons = new Map(), risks = new Map();
  const add = (map, value, count) => {
    const key = String(value || 'Unspecified').trim().slice(0, 120);
    if (!map.has(key) && map.size >= 100) error('Too many distinct summary categories. Use category labels rather than free text for reason/risk columns.');
    map.set(key, (map.get(key) || 0) + count);
  };
  for (const record of rows) {
    const get = key => record.values[indexes[key]];
    if (indexes.dateColumn >= 0) {
      const raw = get('dateColumn');
      // Date-only ISO text or Excel date cells avoid ambiguous regional date parsing.
      const value = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw || '').trim();
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      const date = match ? new Date(`${value}T00:00:00Z`) : null;
      if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) { issues.push({ row: record.row, message: 'Date must be a real YYYY-MM-DD date or Excel date cell.' }); continue; }
      if (date.getUTCFullYear() !== Number(year) || `Q${Math.floor(date.getUTCMonth() / 3) + 1}` !== period) { outsidePeriod++; continue; }
    }
    if (indexes.eligibilityColumn >= 0) {
      const value = normalized(get('eligibilityColumn'));
      if (rule.excludedValues.includes(value)) { excluded++; continue; }
      if (!rule.eligibleValues.includes(value)) { issues.push({ row: record.row, message: 'Missing or unrecognized eligibility value.' }); continue; }
    }
    if (indexes.idColumn >= 0) {
      const id = String(get('idColumn') ?? '').trim();
      if (!id || ids.has(id)) { issues.push({ row: record.row, message: id ? 'Duplicate record ID within eligible rows.' : 'Missing record ID.' }); continue; }
      ids.add(id);
    }
    let rowNumerator, rowDenominator;
    if (rule.aggregationMode === 'totals') {
      const n = get('numeratorColumn'), d = get('denominatorColumn');
      const numeric = value => ['string', 'number'].includes(typeof value) && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= Number.MAX_SAFE_INTEGER;
      if (!numeric(n) || !numeric(d) || (Number(d) === 0 && Number(n) !== 0) || (rule.measureType === 'compliance' && Number(n) > Number(d))) {
        issues.push({ row: record.row, message: 'Totals must be non-negative numbers with a valid denominator. Compliant cases cannot exceed eligible cases.' }); continue;
      }
      rowNumerator = Number(n); rowDenominator = Number(d);
    } else {
      const outcome = normalized(get('outcomeColumn'));
      if (!rule.matchingValues.includes(outcome) && !rule.otherValues.includes(outcome)) { issues.push({ row: record.row, message: 'Missing or unrecognized outcome value.' }); continue; }
      rowNumerator = rule.matchingValues.includes(outcome) ? 1 : 0; rowDenominator = 1;
    }
    numerator += rowNumerator; denominator += rowDenominator;
    if (numerator > Number.MAX_SAFE_INTEGER || denominator > Number.MAX_SAFE_INTEGER) error('Numeric totals exceed the supported precision. Review source values and aggregation units.');
    const exceptions = rule.measureType === 'compliance' ? rowDenominator - rowNumerator : rowNumerator;
    if (exceptions > 0) {
      if (indexes.reasonColumn >= 0) add(reasons, get('reasonColumn'), exceptions);
      if (indexes.riskColumn >= 0) add(risks, get('riskColumn'), exceptions);
    }
  }
  const exceptions = rule.measureType === 'compliance' ? denominator - numerator : numerator;
  return {
    totalRows: rows.length, numerator, denominator, excluded, outsidePeriod,
    invalidRows: issues.length, issues: issues.slice(0, 30),
    calculatedValue: denominator ? Number(((numerator / denominator) * rule.multiplier).toFixed(2)) : null,
    nonComplianceCount: rule.measureType === 'compliance' ? exceptions : null,
    nonCompliancePercent: rule.measureType === 'compliance' && denominator ? Number((exceptions / denominator * 100).toFixed(2)) : null,
    exceptions, reasons: Array.from(reasons, ([label, count]) => ({ label, count })), risks: Array.from(risks, ([label, count]) => ({ label, count })),
    warnings: [!rule.idColumn && 'No record ID column configured: duplicate detection is unavailable.', !rule.dateColumn && 'No date column configured: confirm the file contains only the selected reporting period.'].filter(Boolean),
    canSubmit: issues.length === 0 && denominator > 0,
  };
}

const ruleDigest = definition => crypto.createHash('sha256').update(JSON.stringify({ rule: validateRule(definition.importRule), target: definition.target })).digest('hex');
function signPreview(payload) { return jwt.sign(payload, signingKey, { expiresIn: '30m', audience: 'indicator-import', issuer: 'qcare-import' }); }
function verifyPreview(token) { return jwt.verify(token, signingKey, { audience: 'indicator-import', issuer: 'qcare-import' }); }
module.exports = { validateRule, parseSpreadsheet, analyzeRows, ruleDigest, signPreview, verifyPreview };
