# Listing rollout audit

Scope: all database-backed record lists. Summary cards and fixed configuration choices are not record registers.

## Acceptance criteria

- S/N continues across pages. Search, relevant filters, stable sort, page size and pagination apply to the entire permitted result set on the server.
- Authenticate every request and apply role/record permissions before count, search, sort and paging. Return only fields needed by the view.
- Allowlist sort and filter fields, escape literal search, bound page sizes and query time, and keep sensitive responses out of shared caches.
- Cancel superseded requests; debounce typing; refresh after mutations and when returning to the page. Distinguish polling from true server-push updates.
- Preserve compatible option-list endpoints where selectors still require them; do not silently paginate dropdown data.
- Existing sample records require explicit replacement with persisted endpoints; do not present them as live.
- Verify permission boundaries, page boundaries, filtering, sorting, deletion on the last page and error/retry behavior.

## Static inventory

These are source-code signals, not confirmation that a page meets the standard. Child components and backend authorization require review.

| Source | Tables | Shared server list | Direct API calls | Pagination signal | Seeded state signal |
|---|---:|---|---|---|---|
| client/src/pages/AuditLog.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/AuditManagement.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/ClinicalAuditCenter.jsx | 1 | No | Yes | No | No |
| client/src/pages/ClinicalPrivileges.jsx | 6 | No | No | No | Yes |
| client/src/pages/ContactInformationMaster.jsx | 1 | No | No | Yes | Yes |
| client/src/pages/Dashboard.jsx | 1 | No | Yes | No | No |
| client/src/pages/DepartmentMaster.jsx | 1 | Yes | Yes | Yes | No |
| client/src/pages/DesignationMaster.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/DeviationsNCs.jsx | 1 | No | Yes | No | No |
| client/src/pages/DocumentLibrary.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/IncidentManagement.jsx | 1 | No | Yes | No | No |
| client/src/pages/JawdaAOT.jsx | 1 | No | Yes | No | No |
| client/src/pages/JawdaASD.jsx | 1 | No | Yes | No | No |
| client/src/pages/JawdaBN.jsx | 1 | No | Yes | No | No |
| client/src/pages/JawdaDF.jsx | 1 | No | Yes | No | No |
| client/src/pages/KeyPerformanceIndicator.jsx | 9 | No | Yes | No | No |
| client/src/pages/KPIMonitor.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/LocationTypes.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/MailLog.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/MallCredential.jsx | 1 | No | No | Yes | Yes |
| client/src/pages/OoppeManagement.jsx | 1 | No | Yes | No | No |
| client/src/pages/PasswordManagement.jsx | 1 | No | No | Yes | Yes |
| client/src/pages/PatientFeedback.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/PhysicianDemography.jsx | 1 | No | No | Yes | Yes |
| client/src/pages/PhysicianDemographyVerification.jsx | 1 | No | No | Yes | Yes |
| client/src/pages/ReportGenerator.jsx | 1 | No | No | No | No |
| client/src/pages/RiskManagement.jsx | 1 | No | Yes | Yes | No |
| client/src/pages/SpecialityMaster.jsx | 1 | Yes | Yes | Yes | No |
| client/src/pages/SystemSettings.jsx | 4 | No | Yes | Yes | No |
| client/src/pages/UserManagement.jsx | 1 | No | Yes | Yes | No |
| client/src/components/audit/AuditRegister.jsx | 1 | No | No | No | No |
| client/src/components/compliance/CircularList.jsx | 1 | No | No | No | No |
| client/src/components/compliance/LicenseTable.jsx | 2 | No | No | No | No |
| client/src/components/cp/PrivilegeMatrix.jsx | 1 | No | No | No | No |
| client/src/components/fms/AssetRegisterTable.jsx | 1 | No | No | No | No |
| client/src/components/kpi/ImportReportDetails.jsx | 1 | No | No | No | No |
| client/src/components/kpi/KPIAutomaticEntry.jsx | 1 | No | Yes | No | No |
| client/src/components/kpi/KPIReports.jsx | 1 | No | No | No | No |
| client/src/components/kpi/KPITable.jsx | 1 | No | No | No | No |
| client/src/components/meds/WasteRegisterTable.jsx | 1 | No | No | No | No |
| client/src/components/px/ComplaintTable.jsx | 1 | No | No | No | No |
| client/src/components/risk/RiskRegisterTable.jsx | 1 | No | No | No | No |
| client/src/components/Table.jsx | 1 | No | No | No | No |
| client/src/components/training/ComplianceMatrix.jsx | 1 | No | No | No | No |

## Existing work detected

Uncommitted changes already implement the shared query helper, toolbar, refresh hook and Department/Specialty integrations. Ownership must be confirmed before modifying or committing that work.

The current refresh hook uses 30-second visible-page polling and focus refresh; this is not server-push real time. The existing Socket.IO server accepts room joins without socket authentication, so it must not be reused for sensitive list events until authenticated room authorization is implemented.
