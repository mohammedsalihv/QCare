const field = (name, label, type = 'text', extra = {}) => ({ name, label, type, required: true, ...extra });
const choice = (name, label, values) => field(name, label, 'select', { options: values.map(value => ({ value, label: value })) });
const master = (name, label, source, labelKey = 'name') => field(name, label, 'select', { source, labelKey, valueKey: labelKey });
const staff = (name = 'staffId', label = 'Staff member') => field(name, label, 'select', { source: '/api/users/directory', labelKey: 'employeeName' });
export const recordForms = {
  facilityLicense: { title: 'Add Facility License', endpoint: '/api/compliance/licenses/facility', fields: [field('licenseNumber', 'License number'), choice('licenseType', 'License type', ['facility', 'pharmacy', 'laboratory', 'radiology']), field('issuedDate', 'Issued date', 'date'), field('expiryDate', 'Expiry date', 'date')] },
  staffLicense: { title: 'Add Staff License', endpoint: '/api/compliance/licenses/staff', fields: [staff(), field('licenseNumber', 'License number'), master('specialty', 'Specialty', '/api/masters/specialties'), choice('licenseType', 'License type', ['DOH', 'DHA', 'MOHAP']), field('issuedDate', 'Issued date', 'date'), field('expiryDate', 'Expiry date', 'date')] },
  audit: { title: 'Schedule New Audit', endpoint: '/api/audit', fields: [field('auditTitle', 'Audit title'), field('templateId', 'Audit template', 'select', { source: '/api/audit/templates', labelKey: 'templateName' }), choice('auditType', 'Audit type', ['planned', 'unannounced', 'follow-up']), field('scheduledDate', 'Scheduled date', 'date'), staff('auditor', 'Auditor'), master('department', 'Department', '/api/departments')], related: 'template' },
  template: { title: 'Create Audit Template', endpoint: '/api/audit/templates', fields: [field('templateName', 'Template name'), choice('governancePillar', 'Governance pillar', ['clinical-risk', 'clinical-audit', 'effectiveness-outcomes', 'training', 'staff-management', 'patient-involvement', 'information-management']), choice('standard', 'Standard', ['DOH', 'JCI', 'internal', 'ISO']), field('criteriaText', 'Audit criteria (one per line)', 'textarea')] },
  asset: { title: 'Add Asset', endpoint: '/api/fms/assets', fields: [field('assetId', 'Asset ID'), field('equipmentName', 'Equipment name'), field('serialNumber', 'Serial number'), master('department', 'Department', '/api/departments'), field('manufacturer', 'Manufacturer', 'text', { required: false }), choice('criticality', 'Criticality', ['non-critical', 'critical', 'life-saving'])] },
  drill: { title: 'Log Mock Drill', endpoint: '/api/fms/drills', fields: [choice('drillType', 'Drill type', ['Code Red (Fire)', 'Code Blue (Cardiac)', 'Code Pink (Abduction)', 'Code Yellow (Disaster)', 'Code Black (Threat)', 'Evacuation']), field('drillDate', 'Drill date', 'date'), field('location', 'Location'), choice('shift', 'Shift', ['morning', 'afternoon', 'night']), field('scenario', 'Scenario', 'textarea'), field('responseTimeSeconds', 'Response time (seconds)', 'number', { min: 0 })] },
  surveillance: { title: 'Log Monthly Data', endpoint: '/api/ipc/surveillance', fields: [field('reportingMonth', 'Reporting month', 'number', { min: 1, max: 12 }), field('reportingYear', 'Reporting year', 'number', { min: 2000, max: 2100 }), choice('infectionType', 'Infection type', ['HAI', 'SSI', 'CAUTI', 'CLABSI', 'VAP', 'CDiff', 'MRSA', 'VRE', 'COVID', 'Other']), field('ward', 'Ward'), field('casesCount', 'Cases', 'number', { min: 0 }), field('patientDays', 'Patient days', 'number', { min: 1 })] },
  medication: { title: 'Report Medication Incident', endpoint: '/api/medication/errors', fields: [field('errorDate', 'Incident date', 'date'), field('medicationName', 'Medication name'), choice('errorType', 'Error type', ['wrong-drug', 'wrong-dose', 'wrong-patient', 'wrong-route', 'wrong-time', 'omission', 'near-miss', 'prescribing', 'transcription', 'dispensing', 'administration']), choice('stage', 'Stage', ['prescribing', 'dispensing', 'administration', 'monitoring']), choice('harmLevel', 'Harm level', ['none', 'minimal', 'minor', 'moderate', 'serious', 'catastrophic']), field('immediateActionTaken', 'Immediate action taken', 'textarea')] },
  complaint: { title: 'Log Complaint', endpoint: '/api/patient-experience/complaints', fields: [field('patientName', 'Patient name'), field('patientContact', 'Patient contact', 'text', { required: false }), choice('source', 'Source', ['walk-in', 'phone', 'email', 'DOH-portal', 'social-media', 'internal']), choice('category', 'Category', ['clinical-care', 'waiting-time', 'communication', 'billing', 'cleanliness', 'staff-attitude', 'privacy', 'other']), choice('severity', 'Severity', ['low', 'medium', 'high', 'critical']), field('description', 'Description', 'textarea')] },
  training: { title: 'Log Training', endpoint: '/api/training/records', related: 'competency', fields: [staff(), field('competencyId', 'Competency', 'select', { source: '/api/training/framework', labelKey: 'competencyName' }), field('trainingTitle', 'Training title'), choice('trainingType', 'Training type', ['mandatory-DOH', 'competency-assessment', 'CPD', 'orientation', 'refresher']), choice('deliveryMethod', 'Delivery method', ['in-house', 'external', 'e-learning', 'simulation', 'on-the-job']), field('completionDate', 'Completion date', 'date'), field('expiryDate', 'Expiry date', 'date', { required: false }), field('score', 'Score', 'number', { min: 0, max: 100 }), field('passed', 'Passed', 'checkbox', { required: false })] },
  competency: { title: 'Create Competency', endpoint: '/api/training/framework', fields: [field('competencyName', 'Competency name'), field('competencyCode', 'Competency code'), choice('assessmentMethod', 'Assessment method', ['direct-observation', 'written-test', 'simulation', 'portfolio', '360-feedback']), choice('frequency', 'Frequency', ['on-hire', 'annual', 'biannual', 'triggered-by-incident'])] },
  clinician: { title: 'Add Clinician Privilege Request', endpoint: '/api/cp/privileges', fields: [staff(), master('specialty', 'Specialty', '/api/masters/specialties'), choice('privilegeType', 'Privilege type', ['core', 'special', 'emergency']), field('expiryDate', 'Expiry date', 'date'), field('procedureId', 'Procedure', 'select', { source: '/api/masters/procedures', labelKey: 'name' })] },
  credential: { title: 'Add Credential', endpoint: '/api/cp/credentials', fields: [staff(), choice('documentType', 'Document type', ['BLS', 'ACLS', 'PALS', 'NRP', 'Malpractice-Insurance', 'Dataflow-Report', 'Degree-Verification', 'Police-Clearance']), field('documentNumber', 'Document number'), field('issuingAuthority', 'Issuing authority'), field('issuedDate', 'Issued date', 'date'), field('expiryDate', 'Expiry date', 'date'), field('attachmentUrl', 'Document link', 'url', { required: false })] },
};

export function buildRecordPayload(kind, values, lookups = {}) {
  const payload = Object.fromEntries(recordForms[kind].fields.filter(f => values[f.name] !== '' && values[f.name] != null).map(f => [f.name, f.type === 'number' ? Number(values[f.name]) : typeof values[f.name] === 'string' ? values[f.name].trim() : values[f.name]]));
  if (kind === 'audit') {
    const template = lookups.templateId?.find(item => item._id === payload.templateId);
    if (!template) throw new Error('Select an available audit template.');
    payload.standard = template.standard;
    payload.governancePillar = template.governancePillar;
  }
  if (kind === 'template') {
    payload.criteria = payload.criteriaText.split('\n').map(text => text.trim()).filter(Boolean).map((text, index) => ({ criterionId: `criterion-${index + 1}`, text, weight: 1 }));
    if (!payload.criteria.length) throw new Error('Enter at least one audit criterion.');
    delete payload.criteriaText;
  }
  if (kind === 'clinician') {
    const procedure = lookups.procedureId?.find(item => item._id === payload.procedureId);
    if (!procedure) throw new Error('Select a procedure from the master.');
    payload.procedures = [{ name: procedure.name, requested: true }];
    delete payload.procedureId;
  }
  if (kind === 'competency') payload.applicableRoles = ['All'];
  if (kind === 'medication') payload.patientHarmed = payload.harmLevel !== 'none';
  return payload;
}
