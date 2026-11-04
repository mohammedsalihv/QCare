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

Inside a record, the same sidebar provides five explicit sections: Report & acceptance; Investigation, risk & root cause; Actions & follow-up; Comments & evidence; and Closure, approvals & history. This replaces the former horizontal tabs. All sections remain discoverable; editing is controlled by role and workflow stage. New reports must be accepted and investigation started before findings can be edited. No demonstration records are added to the production database.

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

## Individual reports and training walkthrough

Every row in the incident register and its filtered queues has a **PDF** button. The incident workspace also retains **Download PDF**, available at every saved status, including pending reports. Access remains limited to authorized incident participants and quality reviewers.

Incident PDFs use the same shared CMC report renderer as clinical audits: the logo, fonts, red/navy palette, numbered bordered tables, repeating headers, confidentiality footer and page numbers. Long narratives continue across pages. Reports include the overview, investigation and risk, actions and completion evidence, closure, comments, attachment metadata and history; attachment files are downloaded separately.

Select **Demo walkthrough** in Incident Management, or **Explore a demo incident from report to closure** above the register. The fictional medicine-storage near miss explains seven steps, responsible roles, example decisions and completion evidence. Previous/next controls and step buttons let users explore the complete flow, with a sample PDF available from the demo header.

The demo is read-only training content, served through authenticated `/api/incidents/demo/example` and `/api/incidents/demo/report.pdf` routes. It creates no incident, staff or notification records and never contributes to live register totals. Live workflow permissions, approvals and independent closure requirements are unchanged.

## Summary layout and hover correction

The management summary now uses the shared CMC clinical audit layout, with aligned count tables, Dubai generation time, page numbers and an explicit empty state. The Report incident hover/focus styling is isolated from ordinary navigation links. Demo loading errors include a retry control and explain when the server route is unavailable.

Verified with the production build, targeted lint, incident and audit integration tests, and rendered summary PDFs. Live deployment of the PDF/demo release remains blocked pending explicit approval to update the backend and restart QCare; a GitHub push alone does not activate these endpoints.
