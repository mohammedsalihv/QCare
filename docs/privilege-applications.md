# Clinical privilege applications

Open **Clinical privileges → Apply or renew** (`/dashboard/clinical-privileges?tab=apply`).

Applications capture clinician, specialty, new/renewal/scope-extension request, core/special/emergency type, reason, individual procedures and requested supervision, requested start/end dates, one assigned approver, and optional supporting documents. The applicant reviews the complete request before submission. Applications persist in MongoDB and appear under My submitted applications and the Approval queue.

The existing server approval roles remain QualityManager and SuperAdmin. The selected approver must be active and independent of the clinician and submitter. A SuperAdmin can review another approver's request but cannot approve their own. Ordinary users can apply only for themselves; administrators and Quality Managers can submit on behalf of staff. Selecting an approver does not grant any new role. Requested dates do not grant permission to practise.

The approval queue displays the reason, scope, requested dates, assigned approver and downloadable evidence before a decision. Rejection requires notes. Approval marks the requested procedures approved; optimistic concurrency prevents overlapping decisions from overwriting each other.

Uploads accept up to five PDF/JPEG/PNG files, maximum 5 MB each and 10 MB combined. File signatures are checked. Bytes are stored privately in the application document, excluded from normal responses, and served only through an authenticated download route to the applicant, submitter or existing administrative/reviewer roles. This checks file format, not malware scanning. Application submissions, decisions and downloads pass through the existing module audit middleware.

Other Clinical privileges tabs remain explicitly labelled preview data; the procedure library, eligibility criteria and sample three-level workflow are not a configured live approval chain. The live application uses manually entered procedure scope and a single assigned authorised reviewer.

Verification: `node --test tests/privilegeApplication.test.js` (isolated MongoDB, not production), targeted client ESLint, production client build, and visual review in the owner's existing portal tab. No real clinical privilege request was submitted during UI review.
