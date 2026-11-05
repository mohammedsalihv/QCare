// Shared list-control layout, matching Clinical staff & licences.
// Children retain their own query state, permissions and event handlers.
export default function TableToolbar({ children, className = '', label = 'List controls', ...props }) {
  return <div {...props} className={`qc-list-toolbar ${className}`} role="group" aria-label={label}>{children}</div>;
}
