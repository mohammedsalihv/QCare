# Incident management workflow

Incident Management is independent of Clinical Privileges. A Clinical incident category only identifies the kind of event and enables area/room information.

## Daily use

1. **Report incident** opens a full page. Submit the facts, branch, department, people involved, harm and evidence. QCare assigns a unique reference.
2. A **reviewer** opens the report, accepts it and chooses an investigator, investigation deadline and initial risk. If needed, request clarification, reject with a reason, or mark a duplicate with the original reference in the reason.
3. The **investigator** starts investigation and saves findings, root cause, contributing factors, service/workflow impact, temporary controls and risk assessment.
4. Add actions with an owner, deadline, action type and success criteria. A reviewer approves the plan. Changing or adding an action returns it for approval.
5. **Action owners** record completion details and reference supporting evidence. They can upload evidence and comment on their assigned incidents.
6. The investigator requests closure after recording findings, root cause and completing every action.
7. An **independent reviewer** records effectiveness evidence, review date and residual risk, then approves closure. A reviewer who reported, investigated, owns or completed an action cannot approve closure. Partially effective or ineffective controls return the incident for further work.
8. Closed, rejected or duplicate records are read-only. Reviewers can reopen them with a reason; history is retained.

The five tabs are Overview, Investigation, Actions & follow-up, Comments & evidence, and Approvals & history. The header explains the next step. Save changes before changing sections; a confirmation protects unsaved text. Do not treat a saved draft investigation as an approved action plan.

### Navigation update

The compact Incident Management side menu now exposes All incidents, Acceptance & triage, Investigations & risk, Actions & follow-up, Assigned to me, Overdue work, Closure approvals, and Reports & downloads. These are live, permission-filtered work queues. Actions includes plans awaiting approval as well as approved work. The Reports area has labelled PDF and CSV choices instead of relying only on toolbar icons.

Sidebar navigation asks before discarding unsaved report or investigation entries. On narrow screens the menus become horizontally scrollable rows. Queue filtering is enforced on the backend and applies to exports as well. The queue backend update was deployed with backup `/home/salih/QCare_deploy_backups/incident-workflow-1793779905733`.

## Roles and access

- Admin, superadmin and qualitymanager are reviewers and can access all incidents.
- Reporters, investigators, action owners and explicitly notified staff can access their related incidents.
- Being named as involved staff alone does not grant access.
- Only the reviewer or assigned investigator edits findings and plans. Only the action owner or reviewer completes an action.
- Participant comments are shared with everyone authorized to access the incident, not private messages.
- Attachment, PDF and CSV endpoints enforce the same access scope. Files download as attachments, not executable inline content.

## Finding work and reporting

- All incidents, Assigned to me, Overdue and Closure review queues.
- Backend search by reference, title, branch or department; status, category, risk and incident date filters; sorting and pagination.
- The visible register refreshes every 30 seconds and on returning to the tab. Detail pages do not refresh over unsaved entries: conflicting writes are rejected with an explicit reload option.
- Filtered CSV export, capped at 5,000 rows; spreadsheet formula prefixes are escaped.
- Summary PDF shows current accessible counts by status, risk and category, plus overdue work, respecting filters.
- Individual PDF includes the report, findings, actions, completion, effectiveness, comments, attachment names and history. Evidence files download separately.
- Assignment/status changes send best-effort in-app notifications. Closure review also notifies reviewers. There is no automatic email delivery or scheduled overdue-reminder service in this release.

## Operational notes

- Date filters and deadlines use UAE time. Date-only deadlines expire at the end of that day.
- Risk levels are explicitly assessed using the organization's approved criteria. The application does not invent an automatic clinical risk matrix.
- Upload up to five files per request, with a maximum of 20 attachments and 12 MB combined per incident. Existing report creation still accepts up to five initial files. Extension allowlisting is not malware scanning.
- Report IDs and old records are preserved. Old Pending records go through triage. Old Resolved records need assignment, documented root cause/actions and verified closure. Historical records cannot reconstruct approvals that were never stored.
- The legacy arbitrary status PATCH is replaced by validated workflow commands; old frontend builds must be updated to use this workflow.
- Incident PDFs embed the same DejaVu fonts as the clinical audit report. Complex-script shaping has not been validated.

## Verification and rollout

- Isolated MongoDB integration tests cover the lifecycle, role restrictions, stale-version rejection, evidence persistence/access, CSV formula protection, filtered listing and PDFs. No production test incidents are created.
- Targeted frontend lint and production build pass. The existing bundle-size advisory remains.
- Backend deployed to `192.168.1.160`; only PM2 `QCare` restarted. Rollback files: `/home/salih/QCare_deploy_backups/incident-workflow-1793779066913`.
- Live authenticated register and summary PDF return 200; anonymous register requests return 401.
- Frontend changes are in the local project used by the Vite portal. The separate hosted frontend build has not been published by this change.
- Visual review in the owner's visible browser remains unverified because browser access was unavailable.

## Individual reports

Every row in the incident register and its filtered queues has a **PDF** button. The incident workspace also retains **Download PDF**, available at every saved status, including pending reports. Access remains limited to authorized incident participants and quality reviewers.

Incident PDFs use the same shared CMC report renderer as clinical audits: the logo, fonts, red/navy palette, numbered bordered tables, repeating headers, confidentiality footer and page numbers. Long narratives continue across pages. Reports include the overview, investigation and risk, actions and completion evidence, closure, comments, attachment metadata and history; attachment files are downloaded separately.

## Summary layout and hover correction

The management summary uses the shared CMC report layout, aligned count tables, Dubai generation time and page numbers. Empty results are displayed explicitly. The Report incident button retains readable contrast on hover and focus.

## Register and status guidance

The register puts the unique incident reference above the title and groups each row into incident/location, status/next step, risk/harm, investigator/action progress, dates/deadline and report controls. Search, status, type, risk, sorting and page-size controls have visible labels. Overdue deadlines are highlighted; completed actions and inactive investigation deadlines are excluded. Closed, rejected and duplicate records have no open deadline.

“Understand every status” explains all stored statuses and can filter the register. The same status definitions appear on the incident detail and in PDFs. “Resolved — review required” is explicitly distinguished from approved closure. The individual PDF starts with workflow position, next responsible role, completion and deadlines. The summary explains the next action for each status group and distinguishes assessed risk from initial severity.

Verification for this register update: production client build, targeted frontend lint and six server tests passed. Individual and summary PDF fixtures were rendered and visually checked. The backend update and pending demo removal were deployed with source-hash verification; backup: `/home/salih/QCare_deploy_backups/incident-register-1793810426015`. All five fictional sample records were preserved. The local Vite server serves the revised modules. Live authenticated downloads and visual browser review remain unverified: browser automation captured the wrong window, and automatic approval review rejected a fallback-secret authentication check.
