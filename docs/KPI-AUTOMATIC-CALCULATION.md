# Automatic KPI calculation

Open **KPI workspace → Enter data → Automatic calculation**. A quality manager or administrator selects the source once for each indicator. Staff then calculate and review the report without entering numerator or denominator totals.

Supported sources:

| Source | Numerator | Denominator | Scope |
| --- | --- | --- | --- |
| Individual observations | Eligible observations marked as a numerator match | All eligible observations | Observation date, explicit exclusions, department/specialty |
| QCare hand hygiene audits | Sum of compliant opportunities | Sum of total opportunities | Audit date and optional exact ward label |
| QCare medication audits | Number of compliant findings | Number of findings with known outcomes | Audit date, optional exact ward label and audit type |

Case observations support compliance measures and event rates with one opportunity per row. They do not estimate exposure populations such as patient-days. Generic averages/durations require a dedicated source rule; the existing versioned waiting-time workflow remains available. Additional portal modules need explicit adapters before they can supply counts. Indicator names or narrative descriptions are never treated as executable counting rules.

The quality team must confirm the source population matches the KPI definition, including clinical eligibility and exclusions. A blank ward filter includes all wards. Portal audit sources include the stored audits/findings in that scope; they do not independently infer clinical exclusions or prove completeness. Reporting boundaries use Asia/Dubai dates.

Analysis includes performance, target gap, department/specialty results, non-compliance/event categories and suggested follow-up. Suggestions describe recorded exceptions and ask the responsible team to confirm causes. They do not invent causes or assign actions automatically. Owners and due dates are managed in the existing Improvement actions workflow.

Duplicate eligible case references, invalid dates, unknown outcomes and invalid source counts block submission. Empty/invalid populations are not assessed. Cases outside the quarter and explicit exclusions are counted separately. Hand hygiene totals are summed before calculating performance; audit percentages are not averaged.

The server signs calculated previews, binds them to the user/indicator/quarter, and rejects previews after a source rule, population definition, formula, target or unit changes. Automatic indicators reject manually supplied totals. Reviewed snapshots retain source hashes, calculation time, source scope, analysis and anonymous case observations for corrections. Connected source references are sampled up to 100 IDs alongside the full record count and hash. Recalculating fetches current portal records; submitting a preview retains the reviewed snapshot. Existing validation, approval, ownership and finalized-report locks still apply.

Do not enter patient names or MRNs in case references, reason categories or notes. Anonymous case observations are saved with the report and visible to users who can read KPI reports.

Verification:

```text
cd server
node --test tests/kpiAutomatic.test.js tests/kpiSubmission.test.js tests/kpiWorkspace.test.js tests/indicatorImport.test.js tests/waitingTime.test.js
cd ../client
npm run build
```
