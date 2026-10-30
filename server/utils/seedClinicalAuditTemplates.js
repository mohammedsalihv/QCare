const Template = require('../models/AuditTemplate');
const starters = require('../data/clinicalAuditStarterTemplates');
module.exports = async createdBy => {
  const result = [];
  for (const item of starters) {
    // Never overwrite a checklist that a quality team has edited or archived.
    const saved = await Template.findOneAndUpdate({ templateName: item.templateName }, { $setOnInsert: { ...item, createdBy } }, { upsert: true, returnDocument: 'after', runValidators: true });
    result.push({ standard: saved.standard, name: saved.templateName, criteria: saved.criteria.length, active: saved.isActive });
  }
  return result;
};
