# Clinical audit workflow

Current deletion behavior (version 8): SuperAdmin and QualityManager can delete audits in **any status**, including in-progress, overdue, pending review and completed. This supersedes the earlier unstarted-only deletion rule described in the release history below. Schedule editing still requires an unstarted audit.

Open `/dashboard/audit` for Overview, Audits, Calendar, Findings & actions, and Templates.

QualityManager and SuperAdmin users can create weighted templates and schedule audits. Auditor name is optional free text and can identify an external person without a user account. Older internal auditor assignments remain supported. Corrective action owners still use the internal staff directory because they perform and verify follow-up work in QCare.

New audits require an active location from Location Master. Concerned departments and concerned persons are optional multi-select references to active departments and users. These selections describe the audit scope; they do not grant editing or approval privileges. Existing audits without a location remain editable. The scheduling form expands and can be resized on desktop; its content scrolls independently of the header and footer.

The date planner supports individual dates or an inclusive date range, shared time windows for every date, and different time windows by date. Morning, afternoon, and full-day presets can be adjusted. Multiple time windows per date remain supported without adding numbered sessions.

Template standards include ADHICS, Jawda, ADMCC, DOH, JCI, ISO and internal, plus an optional custom standard name. Standards are labels for the organization's approved checklist criteria.

QualityManager and SuperAdmin users can edit or delete templates in the Templates tab. Edit loads the existing checklist into the form; Save changes updates its name, standard, governance pillar and criteria for future audits. Delete requires confirmation and removes the template from the active library. The stored template is retained for existing audit/report references. Before a template changes, any legacy audits without checklist snapshots receive a copy of the original criteria. Existing snapshots and results are preserved. Template versions prevent stale edits or deletions from overwriting newer changes.

An audit can have multiple dates and start/end times, including several sessions on one day. Times are explicitly Dubai (UTC+04:00). Empty, reversed and overlapping sessions are rejected. The Calendar tab shows each session on its date and can start scheduling from a selected day. Audits become overdue after the last session ends. Date-only legacy audits remain visible with time marked as unspecified. Each new audit keeps a copy of its checklist so later template edits do not change historical criteria. Existing audits capture their criteria when first started.

The assigned auditor or a quality manager starts an audit, records findings, and saves drafts. New findings start as not assessed. Compliance is weighted (compliant = 100%, partial = 50%, non-compliant = 0%); not assessed and not applicable are excluded from the score. Coverage counts explicitly assessed and excluded criteria. Not applicable requires an explanation. An all-excluded audit has no compliance score. Every criterion must be assessed before submission.

Submission locks findings and enters pending review. A different QualityManager or SuperAdmin approves the audit, or returns it with a required comment. Approval completes the audit; it does not automatically close corrective actions. Existing completed records stay completed.

Corrective actions have an owner, due date, priority, optional criterion and root cause. Owners, auditors, and managers can start an action and provide completion evidence. Only a quality manager other than the owner can verify closure or return it for further work. Workflow events record actor and time.

Evidence accepts one PDF, PNG, or JPEG up to 10 MB, validates its signature, and stores it in `server/private/clinical-audit/`. Files are excluded from Git and are never served by the public uploads route. Downloads require authentication and audit membership (auditor, quality manager, or assigned action owner). Back up this private directory alongside the database. Legacy attachment strings are not migrated into private storage.

Concurrent document saves use Mongoose optimistic concurrency. A conflict asks the user to reopen the record. Automatic recurrence, scheduled reminders, AI assistance, offline support, and regulatory certification are not part of this release.

Validation: `node --test server/tests/clinicalAudit.test.js` and `npm run build` in `client/`.

The browser smoke helper `node server/tests/helpers/clinicalAuditBrowser.cjs` exercises the UI using in-memory API fixtures, including desktop/mobile screenshots in `output/clinical-audit-verification/`. It requires Playwright and Edge; runtime paths can be overridden with `QCARE_TEST_PLAYWRIGHT` and `QCARE_TEST_BROWSER`. It does not exercise a live MongoDB database.

## API alignment and live repair — 2026-10-26

The development frontend uses the existing API on `192.168.1.160:5000`. Its original audit handler still passed the new form directly to the old schema, causing required-field errors for auditor, department, scheduledDate, standard and governancePillar. Updating the local frontend and local API alone did not update that LAN API.

The seven audit backend files were staged under `/home/salih/.cache/qcare-audit-releases/1793043431329` and passed syntax checks, module loading and 24 tests on the host. These tests include real Express/MongoDB persistence for the screenshot's four-date payload without an auditor or departments, using a separate temporary database. The files were then applied to `/home/salih/QCare` and only PM2 process `QCare` was restarted. Originals are backed up at `/home/salih/QCare_deploy_backups/audit-1793043504234`. Database configuration and existing clinic records were not changed.

Audit responses now carry `X-QCare-Audit-Workflow: 3`, including authentication failures, so proxy/backend alignment can be checked without accessing private records. Audit routes still require authentication and retain their role checks.

Run `node --test server/tests/clinicalAudit.test.js server/tests/clinicalAuditPersistence.test.js` for unit and isolated-database coverage. The persistence test starts its own MongoDB process; `QCARE_TEST_MONGOD` can override the binary path. It never connects to the clinic database.

## Template management release — 2026-10-27

Template editing and deletion are available through manager-protected `PUT` and `DELETE /api/audit/templates/:templateId`. The frontend sends the loaded template version with each change. Templates deleted from the library remain stored as inactive so historical references are retained. Legacy checklist snapshots are preserved before editing or deleting a template.

The backend passed all 25 tests on the live host in an isolated staging environment, including real MongoDB persistence for edits/deletion, permission checks, stale-version rejection and preservation of current and legacy audit criteria. It was applied with originals backed up at `/home/salih/QCare_deploy_backups/audit-1793130511088`; PM2 `QCare` is online. Both new endpoints were checked through the `localhost:5173` proxy and return authentication-required responses with `X-QCare-Audit-Workflow: 4`. Browser smoke coverage uses mock API data for editing, reloading, cancellation, deletion confirmation, failed deletion retention and responsive layouts. No real user template was edited or deleted during verification.

## Clinical audit interface redesign — 2026-10-28

The audit section uses a scoped design system in `clinicalAudit.css`: stronger headings, consistent surfaces and controls, semantic status badges, an aligned desktop audit register with mobile cards, overview metrics, a calendar/day agenda and a clearer corrective action board. Templates are shown in a searchable library; creation and editing open a separate focused editor instead of placing an empty form beneath the saved templates. Scheduling, assessment, review and history use the same visual hierarchy. Changing sections or closing the template editor resets page scroll to avoid the sticky application header obscuring the section title.

This is a frontend redesign; API permissions and workflow rules are unchanged. The browser smoke helper also loads diverse synthetic records to check status colours, heading weight, register search/filter behavior and horizontal overflow at desktop and mobile widths. Screenshots of overview, register, calendar, actions, library, editor and scheduling are written as `redesign-*.png` under `output/clinical-audit-verification/`. No clinic records are changed by these UI checks.

## Scheduled audit deletion and CMC reports — 2026-10-28

SuperAdmin and QualityManager can delete an unstarted scheduled/overdue audit from its register row or calendar card after confirmation. `DELETE /api/audit/:id` enforces these roles and requires `expectedVersion`; its atomic database filter also requires no conducted date, findings or corrective actions. Started, reviewed and completed records are retained. Concurrent changes return 409 instead of removing an audit being assessed. Concerned staff names are visible on register cards, calendar cards and overview summaries.

PDF downloads use the supplied CMC logo alongside Canadian Medical Center, with red/navy branding, embedded DejaVu fonts, A4 pages, repeated headers, confidentiality footers and page numbers. Reports include scope, departments and people, every scheduled visit in Dubai time, saved checklist findings and evidence text, corrective action owners and completion information, review details and history. Unapproved reports are explicitly marked as working reports. Private evidence attachments remain in the authenticated workspace. The API builds the complete PDF before sending an attachment response; the frontend verifies the PDF signature and downloads a readable `.pdf` filename. Font redistribution terms are included under `server/assets/clinical-audit/FONT-LICENSE.txt`.

The backend passed 25 tests locally and on the server, including isolated MongoDB checks for delete permissions, stale-version rejection, completed-record protection and PDF responses. Browser checks covered download content/filename, role visibility, cancellation, failed-delete retention and successful deletion/reload using synthetic data. A three-page demonstration report and an eight-page stress report passed text/margin/page-count checks and visual review. Frontend build and targeted lint passed.

The report module, assets and audit API were deployed to the existing LAN backend with backup `/home/salih/QCare_deploy_backups/audit-1793170845071`; PM2 `QCare` is online and audit responses carry workflow version `5`. No real clinic audit was deleted during verification.

## Bordered report tables and readable filenames — 2026-10-28

The revised PDF has an enclosing border and navy heading bar for every section, paired audit-scope fields, and column-based tables for visit dates, findings, corrective actions and activity. Result colours remain inside the findings table. Long tables repeat their section and column headings on continuation pages. The user's five-visit example renders in two pages; the demonstration report renders in three pages. A fourteen-page stress report passed text, margins, page numbering and section-border checks. These files were rendered and visually inspected.

Downloads now use `CMC_Clinical_Audit_<audit title>_<location>_<Dubai generation date>.pdf`. The client honours the server's attachment filename and uses a readable fallback if the header is absent. Browser checks verify the exact filename, and filename checks include Dubai date rollover. The build, targeted lint and all 25 isolated backend tests passed.

Workflow version `6` was staged and tested at `/home/salih/.cache/qcare-audit-releases/1793185649757`. Its initial deployment was blocked by a server connection timeout. When connectivity returned, it was successfully deployed with backup `/home/salih/QCare_deploy_backups/audit-1793200750858` and verified through the portal proxy. Newly downloaded reports use the bordered layout; previously downloaded PDF files remain unchanged.

## Editing scheduled audits — 2026-10-28

SuperAdmin and QualityManager can use the pencil control in the audit register or calendar to edit an unstarted scheduled/overdue audit. The existing planner opens with the saved title, template, type, location, optional external auditor, concerned departments/people, and each date's time windows. Cancel discards edits. Save updates the existing audit and records a `schedule-updated` event without starting the assessment. Opening the schedule editor uses a read-only GET; assessment start remains a separate action.

Manager-protected `PUT /api/audit/:id` validates the same schedule/scope inputs as creation and requires the loaded version. Started audits or records with findings/actions cannot be rescheduled this way. Optimistic concurrency rejects stale changes or a simultaneous assessment start. Keeping the current template preserves its original checklist snapshot and standard, including when that template has been archived; selecting another active template replaces the unstarted audit's checklist with that template's criteria.

The build and targeted lint passed. Browser tests cover prefilled values, cancel, failed-save retention, changed dates/times, save/reload and manager-only visibility. All 25 backend tests passed locally and on the host, including additional real-database edit permission, rescheduling, stale-version, injected-state and checklist-preservation assertions. Version `7` was deployed with backup `/home/salih/QCare_deploy_backups/audit-1793201205032`. The API is online and edit/delete/report routes were verified through `localhost:5173`. No real clinic records were edited or deleted during verification.

## Deleting started audits — 2026-10-28

The previous UI reused the schedule-edit eligibility check for deletion. This hid Delete after an audit had been started, even at zero coverage. Deletion now depends only on the manager role; schedule editing keeps its separate eligibility check. The register and calendar show a red trash button for every audit status, with confirmation naming the audit.

Deletion atomically checks the loaded version, records `deletedAt`, `deletedBy` and a `deleted` history event, and increments the version. Findings, actions and evidence are retained. Model query filters exclude deleted audits from lists, details, reports, evidence access, counts and dashboard aggregates. In-flight saves conflict rather than restoring a deleted audit. Staff requests remain forbidden.

All 25 backend tests passed locally and on the host, including deletion with existing findings/actions, retention of clinical evidence, stale-version checks, inaccessible deleted records and empty dashboard counts. Browser tests verified all-status button visibility and confirmed deletion of an in-progress audit followed by reload. Build and targeted lint passed. Version `8` is deployed and verified through the portal, with backup `/home/salih/QCare_deploy_backups/audit-1793202117332`. No real clinic audit was deleted during verification.

## Schedule approval and calendar visibility — 2026-10-28

New requests enter `pending-approval`, including requests created by managers. Proposed dates remain on the request but are excluded from the calendar and upcoming visits. The register labels them Awaiting QM approval and opens a review dialog showing scope, concerned teams/people and every proposed time slot. QualityManager or SuperAdmin explicitly approves through `PUT /api/audit/:id/schedule-approval`, supplying the loaded version and an optional comment. Approval records the actor, timestamp and history, sets scheduled status and publishes all visits. The interface opens the calendar at the first published visit.

Editing an unstarted schedule, including an already approved one, resets it to pending approval and clears the previous approval fields. Its visits disappear from the calendar until reapproved. Started schedules remain protected from editing. Pending records cannot be started, assessed, submitted, or assigned corrective actions. Calendar API consumers can use `GET /api/audit?scope=calendar`. Existing records retain their statuses; no retrospective approval or status migration was applied. Manager-only deletion remains available for all statuses.

Published calendar days now have a strong teal fill and border, bold day numbers and visit-count badges; desktop cells also preview times and titles. The selected day is navy, and mobile retains prominent counts without overflowing.

All 25 backend tests passed locally and on the server, including real-database approval permissions, stale-version handling, assessment blocking, calendar exclusion/publication and edit/reapproval. Edge tests verified the complete request-to-approval flow, pending calendar exclusion, highlighted days, editing, deletion and mobile layout. Production build and targeted ESLint passed. Workflow `9` was deployed with backup `/home/salih/QCare_deploy_backups/audit-1793204270778` and verified through the actual portal proxy, including the authenticated approval endpoint. Verification used isolated databases and mocked browser data; existing clinic records were not changed.

## Quality role, approval notifications and starter templates — 2026-10-29

The live `portal.superadmin` account was confirmed active with role `Quality`, with one pending audit request. Audit manager gates previously recognised QualityManager/SuperAdmin only. The audit routes, workflow and interface now also recognise Quality. A protected permissions endpoint returns the current database role so stale browser role data does not hide approval controls. This account's role and password were not changed.

Schedule creation and resubmission now create persistent, version-specific notifications for Quality/QualityManager/SuperAdmin. Reading the notification feed backfills pending requests created before this integration. Approval and deletion resolve their alerts; new versions resolve older alerts. Repeated fetches do not duplicate alerts or restore dismissed alerts. Notification read/delete/clear operations enforce the same recipient visibility as listing. Approval links open the request review dialog, and the shared feed refreshes on mount, focus and every 30 seconds.

Seven editable starter templates were seeded: Internal, ADHICS, Jawda, ADMCC, DOH, JCI and ISO, containing 58 criteria in total. ADMCC is the Abu Dhabi CCTV inspection checklist with ten checks. Templates show local-review guidance, internal criterion IDs and source links where applicable. These are CMC working starters rather than complete official certification checklists. The seed operation never overwrites an existing template, including edited or archived versions. References were checked against the DOH ADHICS V2 standard, 2026 Jawda guidance, DOH MCC circular, JCI patient safety goals and ISO quality-management overview.

All 25 backend tests passed locally and on the server, covering Quality approval, notification visibility, read/delete protections, alert backfill/deduplication/resolution, and repeat-safe seeding. Edge checks passed with a stale Staff browser role and current Quality server role, plus actual Staff restrictions. Production build and targeted lint passed. Workflow `10` deployed with backup `/home/salih/QCare_deploy_backups/audit-1793266895880`. Live checks confirmed Quality management permission, one pending request with its notification, and all seven active starter templates. No real audit request was approved or deleted during verification.

## Shared workflow monitoring and notification sound — 2026-10-30

Workflow notifications now carry immutable event details: module/record, status, requester identity, actor identity, reason/comment and actual event time. Participants share the same event but retain their own read/dismiss state. Quality/administrator visibility follows the notification audience, and unrelated staff cannot read targeted events. Each process history can be loaded separately from the notification centre (up to 500 events), including personally dismissed alerts. New pending, approved and rejected/returned filters distinguish active requests from historical awaiting states.

Implemented event hooks cover audit schedule submission/resubmission/approval/rejection/deletion, assessment submission/review/return and corrective-action assignment/transitions; KPI submission, validation, rejection, approval, external-submission marker and improvement-action changes; change-request creation/status/edits; and clinical privilege request/decision. Incident update notifications now name the actual actor. Existing outstanding audit schedules, assessments, KPI reviews, change requests and privilege requests receive repeat-safe backfilled notices. Historical decisions without reliable recorded actor/time are not invented.

Audit schedules can be rejected with a required reason. Rejected schedules cannot start or appear in the calendar, but can be edited and resubmitted. Decision metadata and history remain separate from subsequent edits. Change-request rejection also requires a reason and the interface collects it. Clinical privilege decision handling validates pending status, requires a rejection reason, and records reviewers separately from approvers.

The notification feed polls every ten seconds and refreshes on focus/socket activity. Newly arriving unread IDs produce a quiet two-tone chime and a toast. Initial loading and repeated fetches remain silent. A persistent sound toggle appears in the notification centre; the browser must receive a click or keypress before audio becomes available. Socket events now refresh canonical persisted notifications rather than injecting temporary feed entries.

Validation: 49 backend tests passed locally and on the deployment host, including real HTTP/MongoDB checks for shared requester/reviewer history, rejection/resubmission, actor/reason/time fields, personal dismissal retention, unrelated-user restrictions, QMS and clinical privilege decisions, and KPI regressions. Edge checks passed for sound deduplication, initial-load silence, persistent mute, process history, active-awaiting filtering and desktop/mobile layout. Audit UI checks passed with fresh screenshot paths after a Windows file lock interrupted one capture. Production builds and targeted lint passed.

Workflow version 11 is deployed with rollback backup /home/salih/QCare_deploy_backups/audit-1793348254920. Live authenticated notification fetches and deduplication checks passed, including outstanding change-request backfill. At verification there were no pending audit schedule requests. The portal proxy was verified after starting the local Vite portal at 127.0.0.1:5173. No clinical request was approved, rejected or deleted during live verification; transition tests used isolated data.

## Five roles and direct manager scheduling (2026-10-30)

Canonical roles: SuperAdmin, admin, QualityManager, QualityOfficer, user. Account selectors show Superadmin, Admin, Quality Manager, Quality Officer, User. Legacy Quality normalizes to QualityManager; lowercase superadmin normalizes to SuperAdmin; Staff is accepted as a compatibility alias for user. Unknown role assignments are rejected. The role reference screen lists fixed roles instead of presenting localStorage permissions as enforced access; User Assignment uses actual User Management.

Only QualityManager creates/edits schedules directly as scheduled, with requested/approved actor and timestamps, history, and an Approved workflow notification. Superadmin requests retain their approval step. QualityOfficer can create requests and edit their own unstarted schedules, which await manager approval; officers cannot approve or delete audits. Existing pending requests are not retroactively approved. Completed assessment review continues to require an independent reviewer.

Deployed backend workflow 12 with backup /home/salih/QCare_deploy_backups/audit-1793360313718. Six existing accounts normalized (two Quality, four lowercase superadmin) with per-account AuditLog records and role-only rollback snapshot /home/salih/QCare_deploy_backups/role-normalization-1793360342534.json. No passwords or account activation flags changed.

Validation: 49 audit/KPI tests locally and on the staged server; shared-email/login regression test passed; targeted frontend lint and production build passed. tmp/roles-focused-browser.cjs verified manager create/edit publication, officer approval-only scheduling and no delete controls, five role cards, and desktop/mobile planner layout. Live proxy authentication checks passed; portal.superadmin now returns QualityManager and notification polling remains deduplicated. A full unrelated browser workflow run timed out on an assessment submit button; focused scheduling verification and actual backend persistence tests passed.
