const fs = require('node:fs');
const report = require('../server/utils/clinicalAuditReport');
const person = { employeeName: 'Dr. Amina Hassan' };
const audit = {
  _id: '681c120ca1034e75e7cb8742', auditTitle: 'Clinical documentation & patient safety', standard: 'Jawda', governancePillar: 'clinical-audit', auditType: 'planned', status: 'completed',
  location: { name: 'CMC Delma', code: 'CMCDL' }, templateId: { templateName: 'Jawda - Outpatient quality assessment' },
  concernedDepartments: [{ name: 'Nursing' }, { name: 'Outpatient Services' }], concernedPersons: [person, { employeeName: 'Mohammed Al Mansoori' }], auditorName: 'Dr. Sarah Williams (External auditor)',
  sessions: [21,22,24].map(day => ({ startAt: `2026-11-${day}T09:00:00+04:00`, endAt: `2026-11-${day}T12:30:00+04:00` })),
  overallScore: 83.33, coverage: 100, nonCompliantCount: 1, partialCount: 1,
  criteriaSnapshot: [
    { criterionId: 'JWD-01', text: 'Patient identity is verified using two identifiers before clinical care.', weight: 2 },
    { criterionId: 'JWD-02', text: 'Consent and clinical documentation are complete, legible and available.', weight: 2 },
    { criterionId: 'JWD-03', text: 'Staff follow the documented escalation procedure for abnormal results.', weight: 1 }
  ],
  findings: [
    { criterionId: 'JWD-01', complianceStatus: 'compliant', evidence: 'A sample of 20 patient records was reviewed. All records contained the required identifiers. Staff demonstrated the identity verification process during observation.', attachments: ['evidence-one.pdf'] },
    { criterionId: 'JWD-02', complianceStatus: 'partial', evidence: 'Three records were missing the time of consent. The nursing lead confirmed that the revised checklist has been introduced. A follow-up sample will be reviewed after staff briefing.' },
    { criterionId: 'JWD-03', complianceStatus: 'non-compliant', evidence: 'The escalation register did not consistently record the responsible clinician and time of acknowledgement. The department is updating the register and assigning daily checks.' }
  ],
  improvementActions: [{ actionText: 'Introduce a daily documentation check and brief all clinical teams on the revised consent checklist.', owner: person, dueDate: '2026-12-01', priority: 'high', status: 'in-progress', criterionId: 'JWD-02', rootCause: 'The current handover process does not include confirmation of consent documentation.' }],
  submittedBy: person, submittedAt: '2026-11-24T10:00:00Z', reviewedBy: { employeeName: 'Dr. Omar Khalid' }, reviewedAt: '2026-11-25T08:00:00Z', reviewComment: 'Assessment reviewed and approved. Follow up on the assigned action at the next quality meeting.',
  history: [{ event: 'scheduled', at: '2026-11-01T05:00:00Z', actor: person, detail: 'Three audit visits scheduled.' }, { event: 'approved', at: '2026-11-25T08:00:00Z', actor: { employeeName: 'Dr. Omar Khalid' }, detail: 'Independent review completed.' }]
};
(async () => {
  fs.mkdirSync('output/pdf', { recursive: true });
  fs.writeFileSync('output/pdf/cmc-clinical-audit-sample.pdf', await report(audit, { generatedAt: new Date('2026-11-25T09:00:00Z') }));
  const long = { ...audit, auditTitle: 'Long-form report verification', findings: audit.findings.map(f => ({ ...f, evidence: (f.evidence + '\n').repeat(35) })), concernedPersons: Array.from({ length: 40 }, (_, i) => ({ employeeName: 'Concerned staff member ' + (i + 1) })) };
  fs.mkdirSync('tmp/pdfs', { recursive: true });
  fs.writeFileSync('tmp/pdfs/long-audit.pdf', await report(long));
  const current = { ...audit, auditTitle: 'sxdcfvgbhnj', status: 'in-progress', standard: 'DOH', auditorName: '', concernedDepartments: [{ name: 'Marketing' }], concernedPersons: [{ employeeName: 'ADARMC' }], templateId: { templateName: 'cvbnm' }, overallScore: null, coverage: 0, nonCompliantCount: 0, partialCount: 0,
    sessions: [15,16,17,18,19].map(day => ({ startAt: `2026-10-${day}T13:00:00+04:00`, endAt: `2026-10-${day}T16:00:00+04:00` })),
    conductedDate: '2026-10-28T07:58:00Z', criteriaSnapshot: [{ criterionId: 'C1', text: 'rytuybinim,;', weight: 1 }], findings: [], improvementActions: [], submittedBy: null, submittedAt: null, reviewedBy: null, reviewedAt: null, reviewComment: '',
    history: [{ event: 'scheduled', at: '2026-10-27T19:42:00Z', actor: { employeeName: 'Portal Super Administrator' } }, { event: 'started', at: '2026-10-28T07:58:00Z', actor: { employeeName: 'Portal Super Administrator' } }] };
  fs.writeFileSync('tmp/pdfs/requested-layout.pdf', await report(current, { generatedAt: new Date('2026-10-28T07:59:00Z') }));
  const assert = require('node:assert/strict');
  assert.equal(report.filename(current, new Date('2026-10-28T23:59:00Z')), 'CMC_Clinical_Audit_sxdcfvgbhnj_CMC_Delma_2026-10-29.pdf');
  assert(!report.filename({ auditTitle: '../../Unsafe title\\name', location: {} }).includes('/'));
  console.log('Readable filenames verified, including Dubai date rollover.');
  console.log('Generated branded sample and pagination stress report.');
})().catch(error => { console.error(error); process.exitCode = 1; });
