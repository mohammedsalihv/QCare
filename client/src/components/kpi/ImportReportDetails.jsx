export default function ImportReportDetails({ report }) {
  const summary = report.importSummary;
  if (!summary) return null;
  return <details className="qi-saved-import"><summary>View uploaded data summary</summary>
    <p>{summary.totalRows} source rows / {summary.excluded} excluded / {summary.outsidePeriod} outside reporting period.</p>
    <p>Formula: numerator / denominator x {report.calculationRule?.multiplier || 100}. {report.calculationRule?.targetDirection === 'lower' ? 'Lower' : 'Higher'} results meet the target.</p>
    {report.calculationRule?.preset && <p>DOH waiting-time guidance v9.1. {report.target === null ? 'No numeric target specified.' : `Target: ${report.calculationRule.targetStrict ? '< ' : report.calculationRule.targetDirection === 'lower' ? '≤ ' : '≥ '}${report.target}%`}</p>}
    {summary.waitingStatistics && <p>Wait ({summary.waitingStatistics.unit}): mean {summary.waitingStatistics.mean}, median {summary.waitingStatistics.median}, minimum {summary.waitingStatistics.min}, maximum {summary.waitingStatistics.max}.</p>}
    {summary.monthly?.map(m => <p key={m.month}>Month {m.month}: mean {m.meanDays.toFixed(2)} days from {m.observations} observations.</p>)}
    {summary.nonComplianceCount !== null && summary.nonComplianceCount !== undefined && <p>Non-compliance: {summary.nonComplianceCount} ({summary.nonCompliancePercent}%).</p>}
    {summary.reasons?.length > 0 && <div><strong>Exception reasons</strong>{summary.reasons.map(item => <p key={item.label}>{item.label}: {item.count}</p>)}</div>}
    {summary.risks?.length > 0 && <div><strong>Recorded risk categories</strong>{summary.risks.map(item => <p key={item.label}>{item.label}: {item.count}</p>)}</div>}
    {summary.warnings?.map(warning => <p key={warning}>{warning}</p>)}
  </details>;
}
