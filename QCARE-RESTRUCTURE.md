# QCare workspace redesign

## Product direction

Organize work around reporting, measuring, reviewing evidence and completing actions. Use a quiet teal, white and charcoal interface with clear hierarchy, concise labels and responsive navigation. Remove decorative clinical animations from working screens and avoid invented operational statistics.

## Implemented locally

- No permanent sidebar. A compact top bar opens a searchable native toolkit dialog, with Ctrl/Cmd+K and Escape keyboard support. A central home task launcher finds common actions.
- Three quality workspaces: Measure & improve, Safety & experience, Assurance & evidence. A separate administration group is shown for admin and superadmin roles.
- All 39 directory destinations retain their existing routes. Navigation visibility is not a replacement for backend authorization.
- A task-oriented home page with incident, indicator and evidence shortcuts, actual unread notifications and links to audits and corrective actions. The full module directory appears only on demand, rather than filling the home screen.
- Compact incident report opened directly from the home shortcut, a scrollable dialog, submission progress and protection against repeated clicks while saving.
- Updated login visual identity with the existing password visibility control and authentication flow.
- Development proxies for API and live notification connections to the hosted backend.

## Remaining workflow migration

### Indicator update

Both indicator entry URLs now use a shared submission workspace. Every authenticated staff role can submit period counts through `POST /api/kpi/submit-data`; setup, validation and approval remain restricted to QualityManager, SuperAdmin/superadmin and admin. The older configuration screen remains available under `/dashboard/indicator-settings` for management and has not yet received a complete visual redesign.

The workspace separates submission, period reports and the manager review queue. It calculates the existing percentage formula live, displays definition instructions, and allows a submitter to reuse existing counts for a correction. It does not infer numerator or denominator counts from hospital systems.

The server rejects invalid counts and zero denominators, prevents changing another staff member's pending report, and blocks replacement of reports under approval or finalized. Approval requires validation first. Controller and route tests cover these rules with mocked database access; no live database or hosted integration test has been run. Deploy the server changes and restart the hosted backend before testing new staff submission rights from the localhost frontend.

### Spreadsheet automation

The default entry path is now CSV/XLSX upload, with manual counts retained as a fallback. Managers configure per-indicator rules in the submission workspace: individual observation counting or summation of numeric numerator/denominator columns, eligibility filters, recognized outcomes, unique record IDs, date filtering, multiplier (100/1,000/10,000), target direction, and optional exception reason/risk category columns.

Staff upload a single populated sheet (5 MB, 50,000 rows and 100 columns maximum). Analysis produces counts, exclusions, out-of-period rows, row-level issues, performance and compliance exceptions where applicable. Numeric-total imports can use exported event counts and exposure denominators. Files with unknown outcomes, invalid values or duplicate configured IDs cannot be submitted. Dates must be ISO date text or native Excel dates. Files without date or ID mappings show explicit coverage/deduplication limitations.

Only the summary, source checksum, submitter and calculation-rule snapshot are saved. Raw source spreadsheets are processed in memory and are not archived. Signed previews expire after 30 minutes and are bound to the user, indicator, period and current rule/target. Reviewers can inspect the retained summary. Rule edits do not rewrite historical calculation snapshots.

Risk summaries use labels supplied in the source; they do not infer clinical risk or choose a numerator/denominator. This is deterministic aggregation, not AI extraction or risk adjustment. PDF, scanned-image and Word extraction, live hospital-system integrations, adjusted risk models, source-file archiving, bulk uploads spanning multiple indicators, and arbitrary formula expressions remain outside this implementation. A configured eligible row is counted once in row mode; numeric-total mode sums the mapped values. Multi-facility/department partitioning requires a deliberately scoped source file until explicit partitioning is added.

Existing module bodies and backend contracts remain in place. This is the shared navigation and presentation foundation, not a completed rewrite of every module.

1. **Indicators:** separate reusable indicator definitions from period submissions; expose the definition's numerator, denominator, multiplier, units and target direction. Derive counts only from configured, auditable source data. Define missing-data and zero-denominator handling before changing clinical calculations. Reconcile the existing indicator management and JAWDA screens into one entry point.
2. **Incidents:** introduce conditional questions by incident type, explicit harm assessment, ownership, investigation, evidence and linked actions. Preserve reporting confidentiality and existing access checks. Replace simulated cross-module handoffs with persisted relationships.
3. **Assurance:** map versioned requirements from each applicable framework to shared evidence, owners, expiry dates and review decisions. Applicability and standards must be supplied by the organization.
4. **Actions:** unify assignments and deadlines across incidents, risks, audits and compliance with backend filtering for each authorized user. The notification list on the home page is not yet that unified task inbox.
5. **Remaining modules:** migrate forms and tables individually to the same visual language; remove redundant fields only after checking validation, permissions and reporting dependencies.

## Validation and release

### Shared field and confirmation controls

All 58 standalone form selects were migrated to `components/Select.jsx`, which preserves native form events, required validation, labels, disabled states and keyboard/mobile selection. The existing Dropdown component uses the shared Select for ordinary choices while retaining its action-menu and searchable variants. Empty-string and zero-valued options are preserved. Text-field focus no longer adds an inner outline/ring; the field border or search container changes color instead. The top bar now requests confirmation before clearing login state, using a shared native confirmation dialog with focus containment and Escape cancellation. Logout is available at narrow widths, with search moved to its own row.

The Select now displays a custom popup rather than the browser's native option menu. It uses searchable options for longer lists, keyboard navigation, selected-state indicators, viewport positioning and Popover top-layer placement where supported. A visually hidden native select remains only for native form values, labels and required validation. Dropdown's searchable field choices also use this same custom Select; trigger-based action menus retain their action behavior with a matching surface style.

All 57 tables across 39 files now use `components/Table.jsx`, with shared header, row, border, spacing and hover tokens in `controls.css`. Legacy blue/dark header backgrounds are overridden by the common pale neutral-green header. Status badges and risk visualizations retain their semantic colors. Component render checks verify the form bridge and retained table content; live dropdown interactions and visual QA remain to be verified in a browser.

Production frontend build and directory-to-route checks pass. Authenticated browser workflows, responsive appearance, hosted LDAP login and backend saving still require runtime verification. No deployment or database migration is included in this local change.

Measure baseline and redesigned task completion time, required fields, repeat entry and correction rates before making speed claims. Use representative users and test data for incident reporting, KPI submission, evidence review and action closure.
