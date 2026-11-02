# Compact list controls

ListToolbar now shares compact search, status, sort, direction, page size and refresh controls. Clinical staff and licence history reuse the same toolbar, including their profession/status options. Compact dropdown tooltips and accessible names include the selected value; a small dot marks selections different from the first option.

CompactSearch replaces page-level list search fields across administration, audit, clinical privileges, documents, incidents, JAWDA, KPI, logs, feedback, risks and staff pages. Click its icon to type; empty searches collapse on blur, and the close action clears the current search. Existing change handlers, pagination resets and API queries are preserved.

Select provides both normal form fields and compact list triggers, with the same searchable options, keyboard navigation, validation and popup positioning. Remaining native JSX dropdowns in dashboard, licence and KPI screens were migrated to Select; the only native select remaining is Select's internal form bridge. Listing dropdowns whose first choice is an All statuses/departments/categories/etc. option also use compact triggers. Data-entry choices continue to display the chosen text. Navigation search and dropdown option search remain expanded for their existing keyboard workflows.

Validation: production client build; no new ESLint violations against the existing baseline across the modified JSX screens; source audit of native select usage. Visible browser review remains unavailable because Computer Use could not determine the current Chrome URL on Windows. The local Vite session picks up the source changes; hosted frontend publication requires deploying the client build.
