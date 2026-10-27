export default function ImportReportDetails({ report }) {
  const summary = report.importSummary;
  if (!summary) return null;
  return <details className="qi-saved-import"><summary>View source data and analysis</summary>
    {summary.sourceLabel && <p>Calculated from: {summary.sourceLabel}</p>}
    <p>{summary.totalRows} source rows / {summary.excluded} excluded / {summary.outsidePeriod} outside reporting period.</p>
    <p>Formula: numerator / denominator x {report.calculationRule?.multiplier || 100}. {report.calculationRule?.targetDirection === 'lower' ? 'Lower' : 'Higher'} results meet the target.</p>
    {report.calculationRule?.preset && <p>DOH waiting-time guidance v9.1. {report.target === null ? 'No numeric target specified.' : `Target: ${report.calculationRule.targetStrict ? '< ' : report.calculationRule.targetDirection === 'lower' ? '≤ ' : '≥ '}${report.target}%`}</p>}
    {summary.waitingStatistics && <p>Wait ({summary.waitingStatistics.unit}): mean {summary.waitingStatistics.mean}, median {summary.waitingStatistics.median}, minimum {summary.waitingStatistics.min}, maximum {summary.waitingStatistics.max}.</p>}
    {summary.monthly?.map(m => <p key={m.month}>Month {m.month}: mean {m.meanDays.toFixed(2)} days from {m.observations} observations.</p>)}
    {summary.nonComplianceCount !== null && summary.nonComplianceCount !== undefined && <p>Non-compliance: {summary.nonComplianceCount} ({summary.nonCompliancePercent}%).</p>}
    {summary.reasons?.length > 0 && <div><strong>Exception reasons</strong>{summary.reasons.map(item => <p key={item.label}>{item.label}: {item.count}</p>)}</div>}
    {summary.risks?.length > 0 && <div><strong>Recorded risk categories</strong>{summary.risks.map(item => <p key={item.label}>{item.label}: {item.count}</p>)}</div>}
    {summary.warnings?.map(warning => <p key={warning}>{warning}</p>)}
    {summary.analysis && <div><strong>Calculated improvement analysis</strong><p>{summary.analysis.targetMet === null ? 'Not assessed' : summary.analysis.targetMet ? 'Target met' : 'Target not met'} / {summary.analysis.status.replaceAll('-', ' ')}</p>{summary.analysis.suggestions?.map(item => <p key={item}>{item}</p>)}</div>}
    {summary.departments?.length > 0 && <div><strong>Department / specialty results</strong>{summary.departments.map(item => <p key={item.label}>{item.label}: {item.numerator} / {item.denominator} = {item.calculatedValue ?? 'Not assessed'}</p>)}</div>}
    {summary.caseObservations?.length > 0 && <details><summary>Anonymous source observations</summary><div className="ki-table-scroll"><table><thead><tr><th scope="col">Reference</th><th scope="col">Date</th><th scope="col">Outcome</th><th scope="col">Reason category</th><th scope="col">Department / specialty</th></tr></thead><tbody>{summary.caseObservations.map((item, index) => <tr key={index}><td>{item.recordId}</td><td>{item.date}</td><td>{item.outcome === 'yes' ? 'Numerator match' : item.outcome === 'excluded' ? 'Excluded' : 'No numerator match'}</td><td>{item.reason || '—'}</td><td>{item.department || 'Unassigned'}</td></tr>)}</tbody></table></div></details>}
  </details>;
}
