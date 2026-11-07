# Incident responsibility and opinions

## Single source of responsibility

Department Master owns the accountable head (`Department.headUser`, a User ObjectId); the existing `head` name is retained for display and compatibility. Branch/Location Master owns its manager or supervisor (`Location.responsibleUser`, a User ObjectId). Its editor now includes that staff selector. New selections are validated against active users.

Incident assignment reads the current active master records directly. Until an older master record is saved with an ID, an exact unique active-user match to its existing head name or employee ID remains supported. Ambiguous names are not guessed; inactive or missing explicit user references do not fall back to another person. An administrator can resolve these cases in the master editor.

`primaryResponsible` is the accountable department manager; `assignedTo` remains the Quality investigator; `secondaryResponsible` is the branch manager/supervisor. Existing incidents retain their assignments. Quality can explicitly apply current master assignments before investigation or manually reassign an incident.

## Incident settings

The former `/dashboard/incidents/routing` page redirects to `/dashboard/incidents/settings`. The navigation label is **Incident settings**. There are no department-head or branch-manager selectors on this page.

Only the Quality investigator/triage owner and optional department-matching phrases remain in `IncidentRouting`. Old saved owner/branch mappings are ignored, omitted from API responses, and rejected on settings updates. They cannot override master data. Existing department heads are usable without saving incident settings first; Quality assignment remains pending when no Quality investigator is configured.

The reporter-selected department takes precedence. When automatic detection is chosen, locally configured phrases match the title/description. Exactly one matching department supplies its master head. Ambiguous or missing matches require Quality triage. This is phrase matching; no incident content is sent externally for AI analysis.

## Responsibilities and opinions

- Department owner: accept assigned responsibility, contribute root cause, corrective/preventive actions and evidence, then request closure.
- Quality investigator: start investigation, assess risk, gather evidence and follow up. Department owner and Quality collaborate on investigation fields and actions.
- Branch responsible person: access assigned incidents, contribute comments/evidence and request opinions.
- Reviewer (Admin/Superadmin/Quality Manager): manual assignment, plan approval and independent closure review.
- Invited opinion recipient: access that incident and answer their own request. Other users cannot submit an opinion on their behalf. Completed responses cannot be overwritten; follow-up can be added as comments.

Outstanding requested opinions prevent closure requests/approval. Opinions and responsibilities appear in the incident detail/PDF; portal notifications and history track workflow activity. Scheduled reminder automation is not introduced by this feature.

## Verification and deployment

Isolated MongoDB tests cover master user-ID selection, inactive-user rejection, legacy exact/ambiguous matching, master changes affecting future routing only, stale duplicate mappings being ignored/rejected, separate Quality assignment, branch access, opinion permissions, closure gates, attachments and exports. Client lint/build passed.

The master consolidation was deployed on 2026-11-07 to the existing backend at 192.168.1.160. Live source baselines and staged syntax were verified before replacement; rollback files are at `/home/salih/QCare_deploy_backups/incident-master-consolidation-20261107`. Only PM2 QCare was restarted. The owner's existing Chrome portal tab confirmed the old route redirected and duplicate mapping sections were absent. No production master values or incident assignments were modified during verification. The local Vite frontend serves these changes; hosted frontend publishing is separate.
