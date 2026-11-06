# Incident responsibility and opinions

The accountable department manager and the Quality investigator are different incident assignments. `primaryResponsible` is the department owner; `assignedTo` remains the investigator for compatibility with existing incidents. `secondaryResponsible` is the branch manager or supervisor. Existing incidents are not reassigned automatically.

`IncidentRouting` is a responsibility mapping collection: department ObjectId → head User ObjectId; branch ObjectId → manager/supervisor User ObjectId; Quality investigator → User ObjectId. It does not infer authority from designation text. The existing user department/designation strings and legacy department head names remain compatible. When no settings exist, exact unique matches of existing department heads to active users are presented as unsaved suggestions. Names that cannot be matched uniquely are left blank. No users are silently granted incident access from their title alone.

The directory should ultimately use Department and Designation ObjectId references on users, with designation describing the job title and explicit department/branch leadership relationships defining the scope of responsibility. That directory-wide migration is separate from this incident-specific mapping and is not performed by this change.

## Assignment

Administrators and Quality Managers configure Responsibility routing using existing departments, branches, and active users. A Quality Manager, Quality Officer, or administrator must be selected as the Quality investigator/triage owner before settings can be saved. The selected department takes precedence. Reporters may instead select automatic detection: configured phrases are matched locally against title/description, using whole normalized phrases. Exactly one matching department supplies its configured head. Ambiguous or missing matches are left for the Quality triage owner to resolve. This is explainable phrase matching, not a language-model or clinical assessment service. No incident content is sent externally.

The configured Quality user is assigned separately to investigate and follow up. A matching branch adds its secondary responsible person. Inactive owners are not assigned. Without saved settings, reporting continues and the incident explicitly awaits manual Quality assignment. Quality can manually set primary, secondary and investigator assignments, or explicitly apply current routing before investigation. Setup changes do not rewrite existing incidents.

## Responsibilities

- Department owner: accept an incident assigned to them without changing the Quality investigator, contribute root cause, corrective/preventive actions and evidence, and request closure.
- Quality investigator: start investigation, assess risk, gather evidence and follow up. Department owner and Quality can collaborate on investigation fields and action planning.
- Branch manager/supervisor: access their assigned incident, contribute comments/evidence and request opinions.
- Reviewer (Admin/Superadmin/Quality Manager): manual assignment, plan approval and closure review. Closure remains independent of the department/branch owners, investigator, reporter and action owners/completers.
- Invited opinion recipient: access that incident and answer only their own opinion request. The investigator, accountable owner, branch responsible person or reviewer can request an opinion. Only the recipient can submit it, and a submitted response cannot be overwritten. Follow-up can be recorded as a comment.

Outstanding opinion requests prevent closure requests and closure approval. Opinions include author, date, question and response in the detailed workflow and PDF. Assignment and opinion events are added to incident history, with best-effort portal notifications. Scheduled reminder automation is not introduced here; existing work queues remain available for follow-up.

## Verification

Client lint/build and isolated MongoDB integration tests cover automatic department routing, separate Quality assignment, branch access, self-acceptance by the accountable owner, opinion-only access, impersonation rejection, one-time responses, closure gates, attachments and exports. Pure matcher tests cover explicit department precedence, normalized phrase matching, ambiguous matches and no match.

Backend deployed on 2026-11-06 to the existing QCare service at 192.168.1.160. Live files matched their expected baselines before replacement; backup: /home/salih/QCare_deploy_backups/incident-routing-20261106. The authenticated Responsibility routing page was reviewed in the owner's existing Chrome tab. No routing settings or production incident assignments were saved during verification. Local Vite serves the updated client; hosted frontend publishing is separate.
