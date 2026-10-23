# QCare project rules

## Shared dropdowns
- Every existing and new value-selection dropdown must use `client/src/components/Select.jsx`, directly or through `Dropdown.jsx` / `MasterSelect.jsx`. Native `<select>` elements are permitted only inside `Select.jsx` as its form bridge. Action menus are not value selectors.
- Keep accessibility, search, keyboard navigation, disabled states, validation and modal positioning in the shared component. Do not create page-specific dropdown implementations.

## Master records
- Patients and external supplier contacts remain separate from staff User Master; keep their dedicated data-entry flows.
- People, staff, clinicians, physicians, owners, approvers and assignees come from the main User collection. Never maintain sample people, independent person identities, or current-user-only fallback lists. Use the authenticated user directory for selectors and the existing restricted user-management API for account administration.
- Departments, designations, locations, specialties, procedure categories and procedures must come from their corresponding persisted master. Use `MasterSelect` / `useMasterData` and `masterData.js` for shared lookup access. Fixed workflow enums (status, severity, frequency, etc.) may remain static.
- Create/edit a master in its management page; consumers load that master. Refresh dependent lists after mutations. Show loading, empty and error states rather than substituting demo records.
- Persist user references as User IDs when the API supports them. Preserve existing name-based API contracts explicitly until migrated; do not silently change field types. Clinical profiles and credentials attach to a User ID rather than creating another person.
- Keep historical/inactive referenced records readable, but do not offer inactive records for new assignments. Keep existing server authorization for mutations; directory endpoints expose only explicitly selected fields.
- Run the dropdown/master-data guard tests and relevant API/model tests when changing these flows.
