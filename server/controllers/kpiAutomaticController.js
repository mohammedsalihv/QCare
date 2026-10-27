const KPIIndicator = require('../models/KPIIndicator');
const { signPreview } = require('../utils/indicatorImport');
const { sources, validateAutomaticRule, automaticDigest, periodWindow, analyzeAutomatic } = require('../utils/kpiAutomatic');

exports.automaticSources = (req, res) => res.json(sources);
exports.saveAutomaticRule = async (req, res) => {
  try {
    const definition = await KPIIndicator.findOne({ indicatorCode: req.params.code }).sort({ createdAt: 1 });
    if (!definition) return res.status(404).json({ message: 'Indicator not found.' });
    if (definition.importRule?.preset || definition.calculationRule?.preset) return res.status(400).json({ message: 'Use the versioned waiting-time source workflow for this indicator.' });
    if (![100, 1000, 10000].includes(definition.calculationRule?.multiplier ?? 100)) return res.status(400).json({ message: 'Average and duration indicators require a dedicated source rule.' });
    const rule = validateAutomaticRule(req.body);
    await KPIIndicator.updateOne({ _id: definition._id }, { $set: { automaticRule: rule, updatedBy: req.user._id } });
    res.json({ rule });
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.previewAutomatic = async (req, res) => {
  try {
    const { indicatorCode, reportingPeriod, reportingYear } = req.body;
    const { start, end } = periodWindow(reportingPeriod, reportingYear);
    if (typeof indicatorCode !== 'string' || !indicatorCode.trim()) return res.status(400).json({ message: 'Choose an indicator.' });
    const definition = await KPIIndicator.findOne({ indicatorCode }).sort({ createdAt: 1 });
    if (!definition) return res.status(404).json({ message: 'Indicator not found.' });
    const rule = validateAutomaticRule(definition.automaticRule);
    if (definition.importRule?.preset || definition.calculationRule?.preset) return res.status(400).json({ message: 'Use the versioned waiting-time source workflow for this indicator.' });
    let records;
    if (rule.source === 'cases') {
      if (!Array.isArray(req.body.cases) || req.body.cases.length > 500) return res.status(400).json({ message: 'Enter up to 500 individual observations.' });
      records = req.body.cases;
    } else {
      const model = rule.source === 'hand-hygiene' ? require('../models/HandHygieneAudit') : require('../models/MedicationAudit');
      const filter = { auditDate: { $gte: start, $lt: end } };
      if (rule.ward) filter.ward = rule.ward;
      if (rule.source === 'medication-audit' && rule.auditType) filter.auditType = rule.auditType;
      const fields = rule.source === 'hand-hygiene' ? 'auditDate compliantCount totalOpportunities department ward' : 'auditDate findings._id findings.item findings.compliant ward';
      records = await model.find(filter).select(fields).sort({ _id: 1 }).limit(10001).lean();
    }
    const result = analyzeAutomatic(definition, records, reportingPeriod, reportingYear);
    const token = result.summary.canSubmit ? signPreview({ userId: String(req.user._id), indicatorCode, reportingPeriod, reportingYear: Number(reportingYear), sourceKind: 'automatic', ruleDigest: automaticDigest(definition), calculationRule: definition.calculationRule || { multiplier: 100, targetDirection: 'higher' }, summary: result.summary }) : null;
    res.json({ ...result, token, target: definition.target, targetMet: result.summary.analysis.targetMet });
  } catch (error) { res.status(400).json({ message: error.message }); }
};
