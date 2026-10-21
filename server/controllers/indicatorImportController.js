const crypto = require('node:crypto');
const KPIIndicator = require('../models/KPIIndicator');
const { validateRule, parseSpreadsheet, analyzeRows, ruleDigest, signPreview } = require('../utils/indicatorImport');
const { catalog, getPreset, ruleFor, VERSION } = require('../utils/waitingTime');

exports.waitingCatalog = (req, res) => res.json(catalog);
exports.installWaiting = async (req, res) => {
  try {
    const { codes, reportingPeriod, reportingYear } = req.body;
    if (!Array.isArray(codes) || !codes.length || codes.some(code => !getPreset(code)) || !['Q3', 'Q4', 'Q1', 'Q2'].includes(reportingPeriod) || !Number.isInteger(Number(reportingYear)) || Number(reportingYear) < 2026 || Number(reportingYear) > 2100 || (Number(reportingYear) === 2026 && ['Q1','Q2'].includes(reportingPeriod))) return res.status(400).json({ message: 'Select valid indicators and a quarter from Q3 2026 onwards.' });
    const created = [], existing = [];
    for (const code of new Set(codes)) {
      if (await KPIIndicator.exists({ indicatorCode: code })) { existing.push(code); continue; }
      const p = getPreset(code);
      try {
        await KPIIndicator.create({ indicatorCode: code, indicatorName: p.indicatorName, category: 'waiting-time', reportingFrequency: 'Quarterly', reportingPeriod, reportingYear: Number(reportingYear), numerator: 0, denominator: 0, target: p.target, unit: p.unit, numeratorDesc: p.numeratorDesc, denominatorDesc: p.denominatorDesc, description: `${VERSION}, page ${p.page}. ${p.population}`, criteria: p.exclusions.join(', '), importRule: ruleFor(code), calculationRule: ruleFor(code), createdBy: req.user._id });
        created.push(code);
      } catch (err) { if (err.code === 11000) existing.push(code); else throw err; }
    }
    res.json({ created, existing });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.saveRule = async (req, res) => {
  try {
    const definition = await KPIIndicator.findOne({ indicatorCode: req.params.code }).sort({ createdAt: 1 });
    if (!definition) return res.status(404).json({ message: 'Indicator not found.' });
    if (definition.importRule?.preset || getPreset(req.params.code) || req.body.preset) return res.status(400).json({ message: 'DOH waiting-time rules are fixed by the versioned guidance.' });
    const rule = validateRule(req.body);
    // Updating the rule should not change a previously reviewed period's calculation.
    await KPIIndicator.updateOne({ _id: definition._id }, { $set: { importRule: rule, updatedBy: req.user._id } });
    res.json({ message: 'Import rule saved.', rule });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.previewImport = async (req, res) => {
  try {
    const { indicatorCode, reportingPeriod, reportingYear } = req.body;
    if (typeof indicatorCode !== 'string' || !['Q1', 'Q2', 'Q3', 'Q4'].includes(reportingPeriod) || !Number.isInteger(Number(reportingYear)) || Number(reportingYear) < 2000 || Number(reportingYear) > 2100) {
      return res.status(400).json({ message: 'Choose an indicator, quarter and valid year first.' });
    }
    const definition = await KPIIndicator.findOne({ indicatorCode }).sort({ createdAt: 1 });
    if (!definition) return res.status(404).json({ message: 'Indicator not found.' });
    if (!definition.importRule?.preset && !definition.importRule?.outcomeColumn && !definition.importRule?.numeratorColumn) return res.status(422).json({ message: 'The quality team must configure the spreadsheet counting rule for this indicator first.' });
    const data = await parseSpreadsheet(req.file);
    const rule = validateRule(definition.importRule);
    const summary = analyzeRows(data, rule, reportingPeriod, reportingYear);
    const sourceSha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const source = { sourceSha256, ...summary };
    const token = summary.canSubmit ? signPreview({ userId: String(req.user._id), indicatorCode, reportingPeriod, reportingYear: Number(reportingYear), ruleDigest: ruleDigest(definition), summary: source }) : null;
    const targetMet = !summary.canSubmit ? null : rule.preset ? summary.targetMet : rule.targetDirection === 'lower' ? summary.calculatedValue <= definition.target : summary.calculatedValue >= definition.target;
    res.json({ summary, token, rule, target: definition.target, targetMet });
  } catch (err) { res.status(400).json({ message: err.message || 'The spreadsheet could not be analyzed.' }); }
};
