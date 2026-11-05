# Shared table design

Clinical staff & licences is the visual reference for all application tables: neutral table headers, consistent cell padding and borders, compact right-aligned list controls, keyboard focus and tooltips, expandable search, and the shared pagination footer.

## Components

- `client/src/components/Table.jsx`: render every tabular view through this component. Keep the module's semantic headings, captions, rows, selection and action handlers as children. Put wide tables in an overflow container.
- `client/src/components/TableToolbar.jsx`: shared wrapping control row for modules with custom query state. Compose existing `CompactSearch`, `Select compact`, and `IconAction` children; keep controls accessible with meaningful labels. Avoid fixed-width wrappers around icon controls.
- `client/src/components/ListToolbar.jsx`: configured search, additional filters, status, sort field, sort direction and page size using the same toolbar. Accepts a `list` with `query` and `change(patch)`. Query keys are `search`, `status`, `sortBy`, `direction`, `limit`, plus each extra filter's key. Modules own filtering and must reset page on a filter change. String options or `{ value, label }` options preserve stored API values while showing friendly labels. Set `statuses={false}` if the module has no status filter. Add authorized download/refresh actions as children.
- `client/src/components/Pagination.jsx`: shared record count and page navigation; pages retain their existing data loading and pagination contract.

```jsx
<ListToolbar
  list={list}
  searchLabel="Search staff, number, department or authority"
  statuses={['Active', 'Expired', 'Pending']}
  extraFilters={[{ key: 'profession', label: 'Filter by profession',
    allLabel: 'All professions', options: ['Doctor', 'Nurse'] }]}
  sorts={[{ value: 'name', label: 'Licence number' }]}
/>
<div className="overflow-x-auto">
  <Table>{/* thead and tbody */}</Table>
</div>
```

All JSX table elements now use `Table`; only its implementation renders a native table. Legacy custom search/filter toolbar layouts now use `TableToolbar`, while existing configured lists retain `ListToolbar`. Incidents use the same configured controls as staff licences, including friendly status labels with original server values. The change standardizes presentation and preserves existing handlers; it does not add unsupported server filters or sorting to informational tables.

Validation: production build passed. Shared components and incident register pass targeted ESLint; lint comparison across migrated screens found no new diagnostics (62 pre-existing diagnostics remain). In the owner's existing Chrome portal tab, incident ID search and closure-review filtering each returned the expected single sample, and ascending title sorting produced the expected alphabetical order. The reference staff page was restored after review.
