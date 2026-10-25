# Specialty persistence and staff selectors

## Root cause

The original Specialty Master initialized React state with example rows. Add, edit, status changes and delete only changed that array. Refresh rebuilt the sample list; there was no specialty API or database write.

Some personnel selectors contained placeholder names. Others queried the administrator-only users endpoint or used an incorrect token source. Some loaded users in the same Promise.all as unrelated module data, so another request failure also prevented users from appearing.

## Implemented behavior

- Specialty Master uses authenticated GET/POST/PUT/DELETE requests to /api/specialties.
- Specialty records are stored in MongoDB with department and lead references. Names are normalized for duplicate detection; department and selected lead must exist.
- The user-facing code field is removed. MongoDB's document ID identifies each specialty.
- Administrators manage specialties; authenticated users can read them.
- A failed save leaves the form open. A failed delete retains the row and reports the error.
- /api/users/directory reads the users collection and returns only active users' identifiers, names, departments, designations and activation status. It is accessible to authenticated staff, independently of user-administration permissions.
- If the directory endpoint returns 404 on an older live server, administrator accounts can use the existing /api/users endpoint. Only active users and the minimal display fields are retained in the picker. Staff accounts still require the new directory endpoint; authentication and permission failures are never bypassed.
- UserSelect displays names only, with loading, error and retry states. User IDs remain in option values to preserve saved relationships. It preserves an existing selection if that user is no longer in the active directory.
- Specialty leads, department heads, risk owners, audit leads, feedback assignees, CAPA action owners and clinician selectors use the directory. Training's staff matrix also uses the directory.
- Directory selectors load independently from other module requests. The application's access roles are not clinical professions: a doctor can have role Staff, and the picker does not incorrectly filter for a nonexistent Doctor role.

Existing fields that store a person's name retain that representation; fields backed by User references store the user's ID. This change does not migrate unrelated historical records or implement other mock administration workflows.

## Local development connection

The local Vite frontend defaults to the existing live backend at http://192.168.1.160:5000 for API, Socket.IO and uploaded files. This preserves login against the live user database. An optional QCARE_API_TARGET setting in client/.env.local can select a different backend for deliberate testing; client/.env.example documents the default.

The new specialty and directory routes must be deployed to that same live backend. The administrator-only users fallback restores the picker on an older server; it does not add specialty persistence routes to that server. Changing the frontend proxy to a different database server is not a substitute for updating the live API.

Production browser requests continue to use the website origin, as configured in client/src/main.jsx. The deployed web server must proxy /api, /socket.io and /uploads to the backend. Vite server.proxy configures development only; it is not compiled into the production browser bundle.

## Deployment

Deploy the server routes/controller/model and the client together, then restart the backend service. Updating only the browser cannot add the new API routes. Previously entered specialties that existed only in React state were never saved in MongoDB and cannot be recovered from the database.

## Verification

The specialtyDirectory integration test starts its own temporary MongoDB instance and uses the real Express routes. It checks persistence through fresh reads, updates, deletion, duplicates, inactive leads and staff/admin permissions. It never connects to the live database.

Set QCARE_BROWSER_TEST=1 to also run the browser check. This verifies create/reload, status/reload, failed and successful deletion/reload, the removed code field, directory retry and a staff user's risk-owner dropdown even when unrelated risk endpoints fail. QCARE_TEST_MONGOD, QCARE_TEST_PLAYWRIGHT and QCARE_TEST_BROWSER can override the development-machine executable paths.

The frontend production build passes. Specialty Master and UserSelect pass ESLint. Older forms retain pre-existing lint findings; baseline comparison checks that this selector change does not add findings.

## Live backend update checklist

Update the running backend on 192.168.1.160 with server/index.js, server/routes/specialtyRoutes.js, server/controllers/specialtyController.js, server/models/Specialty.js, server/routes/userRoutes.js and server/controllers/userController.js (plus the current middleware/authMiddleware.js). Restart that backend using its existing process manager or service. Verify authenticated GET /api/users/directory and GET /api/specialties return JSON arrays. The compatibility change itself did not restart the live service.

## Live release verification — 2026-10-24

The seven backend files above were deployed to /home/salih/QCare on 192.168.1.160 after the staged update passed syntax, module-load and isolated MongoDB persistence/permission tests on that host. PM2 process QCare was restarted and verified online. The existing database configuration was retained. Backups are at /home/salih/QCare_deploy_backups/specialty-1792871097797. The previous 404 response for /api/specialties was replaced by the expected authentication-required response. No user specialty record was created as part of deployment.
