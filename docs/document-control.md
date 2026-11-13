# Evidence and documentation — first release

Open `/dashboard/documents`. Sections are Document library, My submissions, Awaiting approval, Review due and Archived. Search covers title, reference and department.

## Permissions and lifecycle

- Authenticated staff can create drafts. The recorded owner and document controllers (Admin, SuperAdmin, Quality Manager and Quality Officer) may edit available drafts.
- Select an active Quality Manager or Medical Director as the independent approver. The owner and anyone who edited the revision cannot approve it. Admin access alone does not confer approval authority.
- Draft → In review → Approved → Published. An approver can return a draft with a reason. A document controller publishes the approved revision. Publication is a separate explicit action.
- Published content stays unchanged while a new revision is prepared. Publishing retains the previous version, file and approval record. Earlier versions are available to the document team, not general readers.
- Controllers can archive a published document with a reason once any revision is finished. Only the owner can delete a draft that was never submitted. File purging is not implemented; stored files remain retained.
- Optimistic concurrency prevents stale edits or decisions from silently overwriting newer changes. Lifecycle history is saved in the same document as the transition. The existing request audit middleware captures API writes and file retrievals.

## Access and dates

Published documents can be assigned to all staff, the matching department, or the owner/reviewers only. Confidential and Secret documents are restricted to the owner, assigned reviewer and document controllers. Controllers retain administrative access to all documents. Department matching uses trimmed, case-insensitive department names.

Readers cannot see drafts, future-effective documents, expired documents, archived documents or historical versions. Owners, assigned reviewers and document controllers retain access for document management. The review date is independently chosen; an overdue review is flagged rather than automatically invalidating guidance. Expiry is optional and evaluated at the stored date boundary.

The Download setting is enforced on the server for general readers; document owners, assigned reviewers and controllers can download for their work. Previewing cannot prevent screenshots, copying or extracting content already delivered to the browser. This is not DRM or a guarantee against saving.

## Files and legacy records

New files are stored in a private MongoDB collection, served only through authenticated and authorized routes, with no-store and nosniff headers. Initial accepted formats: PDF, PNG, JPEG and CSV, up to 10 MB per file. Extension/signature checks are implemented; this is not antivirus scanning. Office-format uploads, malware scanning, preview conversion and configurable storage limits remain future work. Existing Office files can still be downloaded by authorized users, but are not previewed or accepted as replacement uploads in this release.

Existing document records and legacy files are preserved. Legacy `/uploads/<filename>` links are blocked; use the library's protected file route instead. Public profile images remain on `/uploads/profiles`. Legacy records with no audience default to owner/reviewer/document-team access until reviewed. Existing published records do not acquire invented approval history. An ownerless legacy record can be managed by the document team.

Deploy client and server together: the new UI requires `/api/documents/options`, `/:id/actions` and `/:id/download`. The browser inspected during development was still connected to an API returning 404 for the options route; live workflow validation awaits the server update. No production document was submitted, approved, archived or deleted during review.

## Verification and remaining stages

Run `node --test server/tests/documentWorkflow.test.js` from the project root (isolated MongoDB on port 27989); run client build and targeted ESLint. Integration tests cover draft access, unauthorized edits, independent approval, returned changes, publication, retained versions, download policy, archiving, deletion restrictions and concurrency.

Reading assignments, version-specific acknowledgements, reader activity and temporary delegation are now implemented. Owners/controllers assign up to 100 existing authorized readers per action with a deadline. Publishing a revision carries eligible previous assigned readers forward with a fresh 14-day deadline. General readers see only their own reading information; the document team sees named activity and totals. An open records successful file delivery, not attention or understanding. First-open notifications are optional.

The daily 08:00 Asia/Dubai job sends deduplicated in-app review/expiry reminders at 60/30/7 days and once overdue, reading reminders within seven days of the deadline, daily owner summaries and overdue-reading escalation to active Quality Managers in the document department. It also retries reading assignment carry-forward. These are in-app notifications, not email. Review delegation begins immediately, lasts at most 30 days, can be revoked, and only permits an active independent Quality Manager or Medical Director to decide the pending revision. Editing a draft clears delegation; leaving review removes delegated access.

Version-specific questions, suggestions and outdated-information reports are implemented, with owner/team responses and statuses. Readers see their own feedback; the document team can see submitted feedback. Helpful reactions are independent of reading confirmations. Authorized document teams can export reading progress as a CSV with formula-safe cells.

Authors may generate a PDF using the standard template and their own supplied content. Generated PDFs include the title, reference, department, version, effective/review dates and change summary. Drafts are labelled as unapproved; published downloads include the downloader and date plus a reminder to check the portal for the current version. The same approval workflow applies. Uploaded original files are not modified or watermarked. Office uploads, antivirus integration, custom template administration and stronger print/download controls remain outside this release.
