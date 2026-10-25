# KPI workspace

The main KPI routes (/dashboard/kpi and /dashboard/key-performance-indicator) open the guided workspace.

## For the quality team

1. Select the reporting quarter and year. Choose **Add indicator**.
2. Enter the name, unique code, responsible owner/department, data source, purpose, numerator and denominator definitions, and exclusions.
3. Choose the scale (percentage, ratio/average, rate per 1,000 or 10,000), unit, agreed target and whether higher or lower is better. Warning tolerance is an absolute distance in the result's unit; zero means every missed target is below target performance.
4. Save the definition. New definitions start without a measured result. Use a distinct code for a different measure.
5. Review submitted reports. Check counts and source details, validate, then approve. Return incorrect reports with a reason so staff know what to correct.
6. Use **Improvement actions** to record a planned change, owner, due date and progress. An outcome/evidence note is required to complete an action. Completed actions can be reopened.

Existing regulated waiting-time definitions remain in the dedicated catalog under **Add indicator**. Their calculation rules are preserved.

## For department staff

1. Open **Enter data** and select the indicator and quarter.
2. Follow its numerator, denominator and source instructions. Use manual totals or upload a spreadsheet when a source-data rule has been configured.
3. Review the calculated result and send it for validation.
4. Check **Reports & history** for review progress and correction feedback. Staff can correct their own reports before approval; the quality team manages other corrections.

## Monitoring and reporting

- Overview separates expected indicators, missing/returned reports, pending review, approved reports and approved results needing improvement.
- Expected reporting starts in the definition's first reporting quarter. Draft records do not count as submitted. This is a quarterly checklist, not a regulatory deadline engine.
- Approved history compares the same indicator across periods; it does not average unrelated units.
- Improvement actions span all quarters. Overdue means an unfinished action with a due date earlier than the browser's local calendar date.
- Excel export includes the selected quarter/year, review status, owner and open-action count.
- The in-app **How it works** guide explains the workflow and terminology.

## Scope and deployment

The guided workflow uses quarterly reporting. Existing advanced settings are retained. Targets are supplied by the quality team; no new clinical thresholds or automatic regulatory transmission are introduced. The legacy external-submission endpoint records a submission marker only, and now requires approval.

Deploy both client and server changes together. The added source metadata and action subdocuments are optional, so existing records require no bulk migration. Existing calculated results are not rewritten by this change; action-only saves preserve approved measurement snapshots. No live organizational data was seeded or altered during implementation.

## Verification

- Backend: node --test tests/kpiSubmission.test.js tests/indicatorImport.test.js tests/waitingTime.test.js tests/kpiWorkspace.test.js (from server).
- Frontend: targeted ESLint and Vite production build.
- Browser smoke test: tmp/kpi-workspace-smoke.cjs uses isolated API fixtures and a temporary local Vite server. Its Playwright runtime and Edge executable paths are specific to the development machine.
