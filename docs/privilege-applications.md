# Clinical privilege applications

Open **Clinical privileges → Apply or renew** (`/dashboard/clinical-privileges?tab=apply`).

Applications capture clinician, specialty, new/renewal/scope-extension request, core/special/emergency type, reason, individual procedures and requested supervision, requested start/end dates, one assigned approver, and optional supporting documents. The applicant reviews the complete request before submission. Applications persist in MongoDB and appear under My submitted applications and the Approval queue.

Approvers are active users with the QualityManager role or the exact designation Medical Director (case and whitespace insensitive). SuperAdmin alone does not confer clinical approval authority. The selected approver must be active and independent of the clinician and submitter. Only the assigned eligible reviewer can decide a new application; applicants and submitters cannot approve their own. Ordinary users can apply only for themselves; administrators and Quality Managers can submit on behalf of staff. Selecting an approver does not grant any new role. Requested dates do not grant permission to practise.

The approval queue displays the reason, scope, requested dates, assigned approver and downloadable evidence before a decision. Rejection requires notes. Approval marks the requested procedures approved; optimistic concurrency prevents overlapping decisions from overwriting each other.

Uploads accept up to five PDF/JPEG/PNG files, maximum 5 MB each and 10 MB combined. File signatures are checked. Bytes are stored privately in the application document, excluded from normal responses, and served only through an authenticated download route to the applicant, submitter or existing administrative/reviewer roles. This checks file format, not malware scanning. Application submissions, decisions and downloads pass through the existing module audit middleware.

Other Clinical privileges tabs remain explicitly labelled preview data; the procedure library, eligibility criteria and sample three-level workflow are not a configured live approval chain. The live application uses manually entered procedure scope and a single assigned authorised reviewer.

Each saved application now has a read-only **Audit history** in the application journey. Submission and approval/rejection entries capture the server time (displayed in UAE time), actor identity/employee ID, role and designation at the time, previous/new status, reason or review notes, and procedure scope with approval results. History is saved atomically with the application, and request payloads cannot supply history entries. Older applications explicitly show that earlier history is unavailable; no events are invented. The central decision log also records the correct outcome, application ID and actor. Review notes accept up to 4,000 characters.

Verification: `node --test tests/privilegeApplication.test.js` (isolated MongoDB, not production), targeted client ESLint, production client build, and visual review in the owner's existing portal tab. No real clinical privilege request was submitted during UI review.
