// CMC working checklists, written for local review. IDs are internal checklist IDs,
// not official regulator clause numbers. Facility-specific requirements take precedence.
const checklist = (standard, title, pillar, sourceUrl, items) => ({
  templateName: `${standard === 'internal' ? 'Internal' : standard} — ${title}`,
  standard, governancePillar: pillar,
  guidance: 'Editable CMC starter checklist. Confirm the applicable edition, facility scope and approved requirements before use. Checklist IDs are internal references.',
  sourceUrl,
  criteria: items.map((text, index) => ({ criterionId: `${standard.toUpperCase()}-${String(index + 1).padStart(2, '0')}`, text, weight: 1 }))
});
module.exports = [
  checklist('internal', 'Clinic quality & safety review', 'clinical-audit', '', [
    'Confirm audit scope, sampling method, department owners and the approved local policies being assessed.',
    'Sample patient records for identity checks, consent, assessment, care plans and follow-up documentation.',
    'Inspect hand hygiene supplies, cleaning records, waste segregation and infection-control practice.',
    'Check medication storage, expiry checks, temperature logs and escalation of out-of-range readings.',
    'Review emergency equipment readiness, inspection logs and staff response training.',
    'Confirm staff credentials, competency assessments and required training are current.',
    'Review incident learning, complaints, risk controls and overdue corrective actions.',
    'Record findings with evidence, accountable owners, due dates and a method to verify improvement.'
  ]),
  checklist('ADHICS', 'Healthcare information & cyber security', 'information-management', 'https://www.doh.gov.ae/-/media/Feature/Resources/Standards/ADHICS-v2-standard.ashx', [
    'Record the applicable ADHICS edition, information-security owner, approved policies and assessment scope.',
    'Review information assets, data classification, risk assessments and treatment responsibilities.',
    'Sample joiner, mover and leaver access approvals; verify privileged access reviews and authentication controls.',
    'Inspect endpoint protection, vulnerability remediation and approved system-change records.',
    'Verify backup monitoring and documented restoration tests for critical health information.',
    'Review security event monitoring, incident escalation and exercised response procedures.',
    'Check third-party access, confidentiality commitments and controls over health-information transfers.',
    'Inspect physical access controls and security awareness evidence; track unresolved control gaps.'
  ]),
  checklist('Jawda', 'Indicator data quality & improvement', 'effectiveness-outcomes', 'https://www.doh.gov.ae/en/programs-initiatives/muashir/jawda-indicators-submission-guidelines2026', [
    'Identify the facility category, applicable JAWDA indicator set, reporting period and approved guidance version.',
    'Confirm each indicator has an assigned owner and a documented data source.',
    'Check local definitions against the applicable indicator specification, including exclusions.',
    'Trace sampled reported values to source records and reconcile missing or duplicate cases.',
    'Recalculate selected numerator, denominator and performance results from retained evidence.',
    'Review validation, authorised sign-off, submission receipts and correction records.',
    'Check whether performance variations and data-quality issues were investigated.',
    'Review improvement actions and follow-up measures for indicators below the agreed target.'
  ]),
  checklist('ADMCC', 'Abu Dhabi CCTV inspection', 'information-management', 'https://www.doh.gov.ae/-/media/D5E1B44DFE4A4F909F15D90DFE11B52C.ashx', [
    'Identify the applicable MCC surveillance manual, site category, approved design and inspection conditions.',
    'Verify installer authorisation, approvals, commissioning records and the camera inventory.',
    'Walk through camera locations against the approved plan; document blind spots and privacy restrictions.',
    'Sample live and recorded images for usable detail in expected lighting conditions.',
    'Check recording continuity and retrieval against the approved retention requirement for this site.',
    'Verify camera and recorder timestamps, time synchronisation and playback accuracy.',
    'Inspect recorder security, authorised access accounts and controls over remote viewing.',
    'Test a permitted footage export; document access approval, custody and readable playback.',
    'Review fault alerts, power protection, maintenance arrangements and repair logs.',
    'Retain inspection evidence and close deficiencies against the approved CCTV requirements.'
  ]),
  checklist('DOH', 'Clinic regulatory readiness', 'clinical-audit', 'https://www.doh.gov.ae/en/Shafafiya/standards', [
    'Identify applicable DOH standards and circulars for the clinic licence and services provided.',
    'Verify facility licensing, approved service scope and professional credentials.',
    'Sample records for assessment, consent, treatment documentation and safe referral arrangements.',
    'Inspect infection prevention, environmental cleaning and waste handling against approved procedures.',
    'Review medicines, emergency readiness and medical-equipment maintenance evidence.',
    'Check patient confidentiality, record access controls and handling of information requests.',
    'Review complaints, reportable incidents, indicator submissions and management oversight.',
    'Document inspection gaps, responsible owners, due dates and evidence of corrective-action closure.'
  ]),
  checklist('JCI', 'Ambulatory patient safety readiness', 'clinical-risk', 'https://www.jointcommission.org/en/en/standards/international-patient-safety-goals', [
    'Confirm the applicable accreditation programme and edition; select services and patient pathways for sampling.',
    'Observe patient identification checks before treatment, testing and medication administration.',
    'Sample handovers and critical-result communication for completeness and timely acknowledgement.',
    'Review safeguards for high-alert medicines and other locally identified medication risks.',
    'Where applicable, observe procedure verification, site confirmation and team safety checks.',
    'Review hand-hygiene practice and measures to prevent healthcare-associated infection.',
    'Trace patient education, consent and continuity-of-care arrangements through sampled visits.',
    'Review leadership oversight, staff competency and evidence that safety improvements are sustained.'
  ]),
  checklist('ISO', 'Quality management system review', 'clinical-audit', 'https://www.iso.org/standard/9001', [
    'Confirm the applicable ISO 9001 edition, quality-system scope and relevant interested-party requirements.',
    'Review process ownership, quality objectives and plans addressing risks and opportunities.',
    'Check document approval, revision control and access to current work instructions.',
    'Sample competency records and resources needed to deliver the defined services.',
    'Review operational controls and monitoring of externally supplied services.',
    'Trace performance measures, customer feedback and handling of service nonconformities.',
    'Review the internal audit programme, objective evidence and follow-up of findings.',
    'Check management review decisions, corrective-action effectiveness and continual improvement records.'
  ])
];
