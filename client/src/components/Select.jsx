import { Children, Fragment, forwardRef, isValidElement, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

function textOf(children) {
  return Children.toArray(children).map(child => isValidElement(child) ? textOf(child.props.children) : String(child)).join('');
}
function flattenOptions(children, disabled = false) {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) return [];
    if (child.type === Fragment || child.type === 'optgroup') return flattenOptions(child.props.children, disabled || child.props.disabled);
    if (child.type !== 'option') return [];
    const label = textOf(child.props.children);
    return [{ value: String(child.props.value ?? label), label, disabled: disabled || Boolean(child.props.disabled) }];
  });
}

// A custom popup with a native form bridge; the browser's select menu is never opened.
const Select = forwardRef(function Select({ className = '', children, value, defaultValue, disabled, required, onChange, onInvalid, onFocus, searchable = true, ...props }, ref) {
  const uid = useId();
  const native = useRef(null);
  const trigger = useRef(null);
  const popup = useRef(null);
  const list = useRef(null);
  const searchInput = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [active, setActive] = useState(-1);
  const [invalid, setInvalid] = useState(false);
  const [accessibleLabel, setAccessibleLabel] = useState('');
  const [position, setPosition] = useState({ left: 0, top: 0, width: 240, maxHeight: 300 });
  const options = flattenOptions(children);
  const selectedValue = String(value ?? internalValue ?? options.find(option => !option.disabled)?.value ?? '');
  const selected = options.find(option => option.value === selectedValue);
  const filtered = options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()));
  const showSearch = searchable && options.length > 6;
  useImperativeHandle(ref, () => native.current);
  useLayoutEffect(() => {
    const labels = Array.from(native.current?.labels || []).map(label => {
      const copy = label.cloneNode(true);
      copy.querySelectorAll('select, button, [role="alert"]').forEach(element => element.remove());
      return copy.textContent.trim();
    }).filter(Boolean);
    setAccessibleLabel(labels.join(' '));
  }, [props.id, props.name]);
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const start = () => {
    if (disabled) return;
    setQuery('');
    const selectedIndex = options.findIndex(option => option.value === selectedValue && !option.disabled);
    setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex(option => !option.disabled));
    setOpen(true);
  };
  const choose = option => {
    if (!option || option.disabled || disabled) return;
    native.current.value = option.value;
    native.current.dispatchEvent(new Event('change', { bubbles: true }));
    setInvalid(false);
    close(true);
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 24);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < 260 && above > below;
      const height = Math.min(310, Math.max(100, upwards ? above : below));
      setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), top: upwards ? undefined : rect.bottom + 6, bottom: upwards ? window.innerHeight - rect.top + 6 : undefined, width, maxHeight: height });
    };
    place();
    const surface = popup.current;
    if (surface?.showPopover && !surface.matches(':popover-open')) surface.showPopover();
    if (showSearch) searchInput.current?.focus();
    else list.current?.focus();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const outside = event => {
      if (!trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      if (surface?.hidePopover && surface.matches(':popover-open')) surface.hidePopover();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open, showSearch]);
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${uid}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, uid]);
  const move = direction => {
    if (!filtered.some(option => !option.disabled)) return;
    let next = active < 0 ? (direction > 0 ? -1 : 0) : active;
    for (let count = 0; count < filtered.length; count++) {
      next = (next + direction + filtered.length) % filtered.length;
      if (!filtered[next].disabled) { setActive(next); break; }
    }
  };
  const handleKeys = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    else if (event.key === 'Tab') close(true);
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); move(event.key === 'ArrowDown' ? 1 : -1); list.current?.focus();
    } else if (event.key === 'Enter' || (event.key === ' ' && event.target === list.current)) {
      event.preventDefault(); choose(filtered[active] || filtered.find(option => !option.disabled));
    } else if (event.target === list.current && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      const indexes = filtered.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
      setActive(event.key === 'Home' ? indexes[0] ?? -1 : indexes.at(-1) ?? -1);
    } else if (event.target === list.current && event.key.length === 1 && /\S/.test(event.key)) {
      const index = filtered.findIndex(option => !option.disabled && option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (index >= 0) setActive(index);
    }
  };
  const popupHost = trigger.current?.closest('dialog') || (typeof document !== 'undefined' ? document.body : null);
  return <span className={`qc-custom-select ${className}`} data-disabled={disabled || undefined} data-invalid={invalid || undefined}>
    <select {...props} className="qc-select-native" ref={native} value={value} defaultValue={defaultValue} disabled={disabled} required={required} tabIndex={-1} aria-hidden="true" onClick={event => event.preventDefault()} onFocus={event => { trigger.current?.focus(); onFocus?.(event); }} onChange={event => { setInternalValue(event.target.value); setInvalid(false); onChange?.(event); }} onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); onInvalid?.(event); }}>
      {children}
    </select>
    <button ref={trigger} type="button" className="qc-select-button" disabled={disabled} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${uid}-list`} aria-required={required || undefined} aria-invalid={invalid || undefined} aria-label={props['aria-label'] || accessibleLabel || undefined} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} onClick={() => open ? close() : start()} onKeyDown={event => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); start(); }
    }}><span>{selected?.label || 'Select an option'}</span><ChevronDown size={16} aria-hidden="true" /></button>
    {invalid && <span className="qc-select-validation" role="alert">Please choose an option.</span>}
    {open && popupHost && createPortal(<div ref={popup} popover="manual" className="qc-select-popup" style={position} onKeyDown={handleKeys}>
      {showSearch && <div className="qc-select-search"><Search size={16} /><input ref={searchInput} aria-label="Filter options" placeholder="Search options..." value={query} onChange={event => { setQuery(event.target.value); setActive(-1); }} /></div>}
      <div ref={list} id={`${uid}-list`} role="listbox" aria-label={props['aria-label'] || 'Options'} tabIndex={-1} aria-activedescendant={active >= 0 ? `${uid}-option-${active}` : undefined} className="qc-select-options">
        {filtered.map((option, index) => <div key={`${option.value}-${index}`} id={`${uid}-option-${index}`} role="option" aria-selected={option.value === selectedValue} aria-disabled={option.disabled || undefined} className={`qc-select-option ${index === active ? 'active' : ''} ${option.value === selectedValue ? 'selected' : ''}`} onPointerMove={() => { if (!option.disabled) setActive(index); }} onClick={() => choose(option)}><span>{option.label}</span>{option.value === selectedValue && <Check size={15} aria-hidden="true" />}</div>)}
        {!filtered.length && <p className="qc-select-empty">No matching options</p>}
      </div>
    </div>, popupHost)}
  </span>;
});
export default Select;
