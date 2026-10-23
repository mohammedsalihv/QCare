const { test } = require('node:test');
const assert = require('node:assert/strict');
const id = '507f1f77bcf86cd799439011';

const samples = {
  EquipmentAsset: [{ assetId: 'TEST-1', equipmentName: 'Monitor', serialNumber: 'SN-1', department: 'Ward', lastCalibrationDate: '2026-01-01' }, d => assert.equal(d.nextCalibrationDate.getFullYear(), 2027)],
  IPCSurveillance: [{ reportingMonth: 10, reportingYear: 2026, infectionType: 'HAI', ward: 'Ward', casesCount: 2, patientDays: 1000 }, d => assert.equal(d.rate, 2)],
  MedicationError: [{ errorDate: '2026-10-23', medicationName: 'Test medication', errorType: 'near-miss', stage: 'dispensing' }, d => assert.match(d.errorRef, /^MERR-\d{4}-001$/)],
  Complaint: [{ source: 'phone', patientName: 'Test patient', category: 'communication', description: 'Test complaint' }, d => assert.match(d.complaintRef, /^COMP-\d{4}-001$/)],
  Risk: [{ riskTitle: 'Test risk', riskCategory: 'clinical', description: 'Test', department: 'Ward', likelihood: 4, impact: 5, owner: id }, d => { assert.equal(d.riskScore, 20); assert.equal(d.riskLevel, 'critical'); }],
  FacilityLicense: [{ licenseNumber: 'TEST', licenseType: 'facility', issuedDate: '2000-01-01', expiryDate: '2001-01-01' }, d => assert.equal(d.status, 'expired')],
  StaffLicense: [{ staffId: id, licenseNumber: 'TEST', specialty: 'Test', licenseType: 'DOH', issuedDate: '2000-01-01', expiryDate: '2001-01-01' }, d => assert.equal(d.status, 'expired')],
  HandHygieneAudit: [{ shift: 'morning', ward: 'Ward', totalOpportunities: 4, compliantCount: 3 }, d => assert.equal(d.complianceRate, 75)],
  IPCChecklistSubmission: [{ checklistType: 'PPE-compliance', ward: 'Ward', items: [{ compliant: true }, { compliant: false }] }, d => assert.equal(d.overallCompliance, 50)],
  MedicationAudit: [{ ward: 'Ward', auditType: 'storage', findings: [{ compliant: true }] }, d => assert.equal(d.overallCompliance, 100)],
  MedicalWaste: [{ ward: 'Ward', wasteType: 'sharps', quantityKg: 1 }, d => assert.match(d.wasteRef, /^WASTE-\d{4}-001$/)],
  OutbreakAlert: [{ infectionType: 'Test', affectedWard: 'Ward' }, d => assert.match(d.alertRef, /^OB-\d{4}-001$/)],
};

for (const [name, [values, verify]] of Object.entries(samples)) {
  test(`${name} saves through Mongoose middleware and computes derived fields`, async t => {
    const Model = require(`../models/${name}`);
    let stored;
    t.mock.method(Model, 'countDocuments', async () => 0);
    t.mock.method(Model.collection, 'insertOne', async doc => { stored = doc; return { acknowledged: true, insertedId: doc._id }; });
    const record = new Model(values);
    await record.save();
    assert.ok(stored, 'insert must be reached after pre-save hooks');
    verify(record);
  });
}

const models = { audit: 'ClinicalAudit', template: 'AuditTemplate', asset: 'EquipmentAsset', drill: 'MockDrill', surveillance: 'IPCSurveillance', medication: 'MedicationError', complaint: 'Complaint', training: 'TrainingRecord', competency: 'CompetencyFramework', clinician: 'ClinicalPrivilege', credential: 'CredentialingRecord', facilityLicense: 'FacilityLicense', staffLicense: 'StaffLicense' };
for (const [kind, modelName] of Object.entries(models)) test(`${kind} form payload satisfies the backend schema`, async () => {
  const { recordForms, buildRecordPayload } = await import('../../client/src/components/records/recordForms.js');
  const values = Object.fromEntries(recordForms[kind].fields.map(f => [f.name, f.source ? id : f.options ? f.options[0].value : f.type === 'date' ? '2026-10-23' : f.type === 'number' ? String(f.min || 1) : f.type === 'checkbox' ? true : 'Test record']));
  const payload = buildRecordPayload(kind, values, { templateId: [{ _id: id, governancePillar: 'clinical-audit', standard: 'internal' }], procedureId: [{ _id: id, name: 'Test procedure' }] });
  const Model = require(`../models/${modelName}`);
  await new Model(payload).validate();
});

test('audit scheduling rejects stale template selections', async () => {
  const { buildRecordPayload } = await import('../../client/src/components/records/recordForms.js');
  assert.throws(() => buildRecordPayload('audit', { templateId: id }, { templateId: [] }), /Select an available/);
});

test('template criteria omit blank lines and optional empty dates are omitted', async () => {
  const { buildRecordPayload } = await import('../../client/src/components/records/recordForms.js');
  const template = buildRecordPayload('template', { criteriaText: ' First criterion \n\n Second criterion ' });
  assert.deepEqual(template.criteria.map(c => c.text), ['First criterion', 'Second criterion']);
  assert.equal('expiryDate' in buildRecordPayload('training', { expiryDate: '' }), false);
});
