import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export default function AuditMultiSelect({ label, options, value, onChange, disabled = false, unavailable = false }) {
  const id = useId(), root = useRef(null), list = useRef(null);
  const [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const filtered = options.filter(o => `${o.label} ${o.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const toggle = key => onChange(value.includes(key) ? value.filter(v => v !== key) : [...value, key]);
  return <div ref={root} className="space-y-2 min-w-0" onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); root.current?.querySelector('[role=combobox]')?.focus(); } }}>
    <span id={`${id}-label`} className="text-sm font-medium">{label} <span className="text-slate-500 font-normal">(optional)</span></span>
    <button type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup="listbox" disabled={disabled || unavailable} onClick={() => setOpen(!open)} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => list.current?.querySelector('button')?.focus()); } }} className="w-full min-w-0 flex justify-between items-center gap-2 border border-slate-200 rounded-xl bg-white p-3 text-left disabled:opacity-50"><span className="truncate text-sm">{unavailable ? 'List unavailable' : value.length ? `${value.length} selected` : `Select ${label.toLowerCase()}`}</span><ChevronDown size={16} /></button>
    {value.length > 0 && <div className="flex flex-wrap gap-2">{value.map(key => <span key={key} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-teal-50 text-teal-800 px-2 py-1 text-xs"><span className="truncate">{options.find(o => o.value === key)?.label || key}</span><button type="button" disabled={disabled} aria-label={`Remove ${options.find(o => o.value === key)?.label || key}`} onClick={() => toggle(key)}><X size={13} /></button></span>)}</div>}
    {open && <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-2 space-y-2">
      <div className="flex items-center gap-2 border rounded-lg px-2"><Search size={15} /><input aria-label={`Search ${label.toLowerCase()}`} className="w-full min-w-0 border-0 bg-transparent p-2 text-sm outline-none" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className="flex justify-between text-xs px-1"><button type="button" disabled={disabled || !filtered.length} onClick={() => onChange([...new Set([...value, ...filtered.map(o => o.value)])])}>Select results</button><button type="button" disabled={disabled} onClick={() => onChange([])}>Clear</button></div>
      <div ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} aria-multiselectable="true" className="max-h-48 overflow-y-auto" onKeyDown={e => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault(); const items = [...list.current.querySelectorAll('[role=option]')], index = items.indexOf(document.activeElement);
        items[e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }}>{filtered.map(o => <button type="button" role="option" aria-label={o.label} key={o.value} disabled={disabled} aria-selected={value.includes(o.value)} onClick={() => toggle(o.value)} className={`w-full flex items-center gap-3 rounded-lg p-2 text-left text-sm ${value.includes(o.value) ? 'bg-teal-50 text-teal-900' : 'hover:bg-slate-50'}`}><span className="w-4 h-4 shrink-0 rounded border border-slate-300 flex items-center justify-center">{value.includes(o.value) && <Check size={12} />}</span><span className="min-w-0"><span className="block truncate">{o.label}</span>{o.description && <span className="block text-xs text-slate-500 truncate">{o.description}</span>}</span></button>)}{!filtered.length && <p className="p-3 text-sm text-slate-500">No matching options.</p>}</div>
    </div>}
  </div>;
}
