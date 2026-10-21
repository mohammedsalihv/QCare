# QCare interface conventions

The application uses one light theme with navy text, teal actions, white surfaces
and a blue-grey canvas. Semantic success, warning and danger colors are reserved
for status, validation and destructive actions.

## Shared foundation

- `src/design-system.css`: shared color, surface, border and control tokens.
- `src/index.css`: Tailwind typography, radius and shadow tokens.
- `DashboardLayout`: navbar, content spacing and application footer for every module.
- `Table` and `Select`: shared table and selection controls.
- `src/navbar.css`: the compact branded navbar and rotating healthcare quote.
- `src/dashboard.css`: analytics-specific composition using the common surfaces.

Use 28px page headings (24px on mobile), 17–20px section headings, 14px form
text, 13px table/body text and 12px secondary labels. Prefer sentence/title case
and normal letter spacing. Use weight 400 for body text, 600 for labels and 700
for page headings. Do not introduce tiny uppercase labels or all-black text.

Cards use 16px corners, pale borders and a subtle shadow. Controls use 10px
corners. Keep pills and circular avatars round. Preserve scroll containers on
wide tables instead of shrinking their text to fit.

Use `bg-primary text-white` for primary actions, white with a neutral border
for secondary actions, and red/rose for destructive actions. Preserve status
colors in badges and charts. Every interactive element needs a visible keyboard
focus state.

Module sidebars use `qc-module-sidebar` and set `aria-current="page"` on the
selected option. Page titles and descriptions can use `qc-module-heading`.
Keep page composition local; reuse the foundation instead of adding another
theme or overriding controls with `!important`.

`scripts/normalize-ui.cjs` records the legacy class migration. It parses JSX
and changes presentation strings only; it is not part of the runtime or build.
The old pages contained conflicting dark variants on white surfaces; this
app intentionally uses the single light palette rather than OS-driven variants.
