# Clinical audit workflow

Open `/dashboard/audit` for Overview, Audits, Calendar, Findings & actions, and Templates.

QualityManager and SuperAdmin users can create weighted templates and schedule audits. Auditor name is optional free text and can identify an external person without a user account. Older internal auditor assignments remain supported. Corrective action owners still use the internal staff directory because they perform and verify follow-up work in QCare.

New audits require an active location from Location Master. Concerned departments and concerned persons are optional multi-select references to active departments and users. These selections describe the audit scope; they do not grant editing or approval privileges. Existing audits without a location remain editable. The scheduling form expands and can be resized on desktop; its content scrolls independently of the header and footer.

The date planner supports individual dates or an inclusive date range, shared time windows for every date, and different time windows by date. Morning, afternoon, and full-day presets can be adjusted. Multiple time windows per date remain supported without adding numbered sessions.

Template standards include ADHICS, Jawda, ADMCC, DOH, JCI, ISO and internal, plus an optional custom standard name. Standards are labels for the organization's approved checklist criteria.

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
