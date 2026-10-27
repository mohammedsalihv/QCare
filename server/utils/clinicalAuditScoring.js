const statuses = new Set(['compliant', 'partial', 'non-compliant', 'not-assessed', 'not-applicable']);

function scoreFindings(criteria, findings, final = false) {
  if (!criteria.length) throw new Error('The audit template has no criteria.');
  if (!Array.isArray(findings)) throw new Error('Findings must be a list.');
  const known = new Set(criteria.map(c => c.criterionId));
  const byId = new Map();
  for (const finding of findings) {
    if (!known.has(finding.criterionId) || byId.has(finding.criterionId)) throw new Error('Unknown or duplicate criterion.');
    if (!statuses.has(finding.complianceStatus)) throw new Error('Invalid compliance status.');
    if (finding.complianceStatus === 'not-applicable' && !finding.exclusionReason?.trim()) throw new Error('Explain why a criterion is not applicable.');
    byId.set(finding.criterionId, finding);
  }
  let earned = 0, possible = 0, assessed = 0, nonCompliantCount = 0, partialCount = 0;
  const normalized = criteria.map(c => {
    const f = byId.get(c.criterionId) || { criterionId: c.criterionId, complianceStatus: 'not-assessed', evidence: '', attachments: [] };
    if (final && f.complianceStatus === 'not-assessed') throw new Error('Assess every criterion before submitting.');
    if (f.complianceStatus !== 'not-assessed') assessed++;
    if (!['not-assessed', 'not-applicable'].includes(f.complianceStatus)) {
      const weight = Number.isFinite(c.weight) && c.weight > 0 ? c.weight : 1;
      possible += weight;
      earned += weight * (f.complianceStatus === 'compliant' ? 1 : f.complianceStatus === 'partial' ? 0.5 : 0);
    }
    if (f.complianceStatus === 'non-compliant') nonCompliantCount++;
    if (f.complianceStatus === 'partial') partialCount++;
    return { criterionId: f.criterionId, complianceStatus: f.complianceStatus, evidence: f.evidence, exclusionReason: f.exclusionReason, attachments: f.attachments || [] };
  });
  return { findings: normalized, overallScore: possible ? Math.round(earned / possible * 10000) / 100 : null, coverage: Math.round(assessed / criteria.length * 10000) / 100, nonCompliantCount, partialCount };
}
module.exports = { scoreFindings };
