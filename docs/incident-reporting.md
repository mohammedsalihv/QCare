# Expanded incident reporting

New reports receive a server-generated INC-prefixed UUID backed by the incident ID unique index. Codes no longer depend on record counts.

The reporting form loads active branches from the Locations master and active departments from Departments. Clinical reports can include an area/room. Staff involvement and additional notification recipients use the existing active staff directory with multiple selections. The notification question requires Yes or No; Yes requires at least one selected recipient. Witness/contact details, harm level and immediate actions are stored and shown in incident details.

The form uses a QCare calendar grid and shared hour/minute dropdowns. Time entry is explicitly UAE UTC+4. Future incident timestamps are rejected by both the form and API. The date picker covers the current year and previous 29 years.

Attachments support PNG/JPEG/GIF/WebP, PDF, MP4/MOV/WebM, MP3/WAV, TXT/CSV and DOCX/XLSX/PPTX. Up to five files, 12 MB combined, are stored in the incident document. File extensions are allowlisted; this is not malware scanning. Files are served only as downloads with nosniff, no-store and application/octet-stream, never as public upload URLs. Raw attachment buffers are excluded from list/create responses. Administrators, the reporter and selected notification recipients can access the incident and its attachments. Staff involvement alone does not grant access.

Additional recipients receive in-app notifications linking to the incident register and can see the report there. Existing administrator/reporter notifications remain. Notification creation is best effort after incident persistence; no email delivery or automatic retry queue is introduced. Legacy JSON reporting remains compatible; the expanded client sends multipart payloads. This update does not change incident listing pagination behavior.

Validation: isolated MongoDB integration checks authenticated upload/download, file persistence, buffer exclusion, recipient visibility and unrelated-user denial. Controller tests cover concurrent unique IDs, invalid dates/IDs/harm values, unsupported files and size limits. Client build passed, new components pass ESLint, and the existing incident screen has no additional lint findings against its baseline. Visible browser review remains unavailable due to the Windows browser URL access limitation.

Deployed with explicit owner approval to /home/salih/QCare on 192.168.1.160, with backup /home/salih/QCare_deploy_backups/incident-report-1793728438732. PM2 QCare restarted successfully; authenticated GET returned HTTP 200. Verification created no production incident records. The local Vite frontend uses the updated client source; hosted frontend publication is separate.
