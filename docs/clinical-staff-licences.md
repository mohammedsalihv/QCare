# Clinical staff and licences

The existing `/dashboard/physician-demography` URL now opens the live clinical staff licence register. The old verification URL redirects to the register; use the Pending status filter to review licences. The hardcoded physician and verification demo arrays have been removed.

- Links each licence to an existing active user; department comes from that user's directory record.
- Supports Doctor, Nurse, Allied health and Other, optional specialty, authority, professional category, licence number, issue and expiry dates. Multiple authorities/licences per person are supported. Authority + licence number is unique, ignoring case.
- Administrators, super administrators and quality managers can create, edit, renew, attach certificates and review. Other authenticated staff can read only their own records and certificates. Self-verification is forbidden.
- Edits, renewals and certificate replacement reset verification to Pending. Rejection requires a reason. Previous versions, reviewers and certificates remain available in history. Renewals require a later expiry date.
- Certificate uploads accept PDF/PNG/JPEG signatures up to 5 MB, stored in a separate database collection. Downloads require authentication and scoped record access, and use attachment disposition. Signature checking does not constitute malware scanning.
- Lists use bounded server-side queries, literal search, allowlisted sorting, profession/status filters and pagination. The screen refreshes every 30 seconds while visible and on focus; this is polling, not streaming.
- Expiry uses UTC calendar dates, inclusive of the expiry date. In-app reminders run at 07:00 Asia/Dubai at 90/30/7 days, on the expiry date and after expiry. Missed runs catch up at the current urgency; unique source keys prevent duplicates. Recipients are the staff member and administrators/quality managers. No email is sent.

Deploy both the client build and backend, then restart the backend to register the new API and scheduler. This change creates new ClinicalStaffLicense and ClinicalLicenseCertificate collections; it does not migrate the older compliance module's StaffLicense records or infer verification from clinical privileges. Standard MongoDB index creation must be enabled or the schema indexes must be provisioned before use.

Validation: `node --test server/tests/clinicalStaffLicenses.test.js` starts an isolated temporary MongoDB process on localhost:27984 and never connects to the application database. Configure QCARE_TEST_MONGOD if the installed MongoDB executable differs. Client validation: targeted ESLint and `npm run build`. The production build retains its existing large-bundle warning. Visible browser review was blocked because Computer Use could not determine the active Chrome URL on Windows.
