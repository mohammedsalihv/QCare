import { useRef, useState } from 'react';
import { Search, X, Filter, ArrowUpDown, Download, RefreshCw, SlidersHorizontal } from 'lucide-react';

export function IconAction({ label, ...props }) {
  delete props.children;
  const Icon = /refresh|reload/i.test(label) ? RefreshCw : /export|download/i.test(label) ? Download : /sort/i.test(label) ? ArrowUpDown : /search/i.test(label) ? Search : /criteria|advanced/i.test(label) ? SlidersHorizontal : Filter;
  return <button {...props} type={props.type || 'button'} className={`qc-icon-action ${props.className || ''}`} title={label} aria-label={label}><Icon size={17} aria-hidden="true" /></button>;
}

export default function CompactSearch(inputProps) {
  const props = { ...inputProps }; delete props.className; delete props.style;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [typed, setTyped] = useState(props.defaultValue || '');
  const active = open || Boolean(props.value ?? typed);
  const label = props['aria-label'] || props.placeholder || 'Search records';
  return <span className={`qc-compact-search ${active ? 'is-open' : ''}`}>
    <button type="button" title={label} aria-label={label} aria-expanded={active} onClick={() => { setOpen(true); requestAnimationFrame(() => ref.current?.focus()); }}><Search size={17} aria-hidden="true" /></button>
    <input {...props} ref={ref} type="search" aria-label={label} hidden={!active} onChange={e => { setTyped(e.target.value); props.onChange?.(e); }} onBlur={e => { props.onBlur?.(e); if (!e.currentTarget.value) setOpen(false); }} />
    {active && <button type="button" title="Clear and close search" aria-label="Clear and close search" onMouseDown={e => e.preventDefault()} onClick={() => { if (ref.current?.value) { const target = { value: '', name: props.name }; props.onChange?.({ target, currentTarget: target }); ref.current.value = ''; setTyped(''); } setOpen(false); }}><X size={15} aria-hidden="true" /></button>}
  </span>;
}
