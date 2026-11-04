import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import Select from './Select';

export default function IncidentDateField({ label, value = '', onChange, required = false, pastOnly = false }) {
  const [today] = useState(() => new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 10));
  const [month, setMonth] = useState(value.slice(0, 7) || today.slice(0, 7));
  const [open, setOpen] = useState(false);
  const [year, number] = month.split('-').map(Number);
  const offset = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return <div className="iw-date"><span className="iw-label">{label}{required ? ' *' : ''}</span>
    <button type="button" className="iw-date-trigger" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}><CalendarDays size={16}/>{value.slice(0, 10) || 'Choose date'}</button>
    {open && <div className="iw-calendar" role="group" aria-label={label + ' calendar'} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}>
      <div className="iw-grid"><Select aria-label="Month" value={number} onChange={e => setMonth(year + '-' + String(e.target.value).padStart(2, '0'))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleString('en', { month: 'long' })}</option>)}</Select><Select aria-label="Year" value={year} onChange={e => setMonth(e.target.value + '-' + String(number).padStart(2, '0'))}>{Array.from({ length: 16 }, (_, i) => <option key={i}>{Number(today.slice(0, 4)) - 10 + i}</option>)}</Select></div>
      <div className="iw-days">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}{Array.from({ length: offset }, (_, i) => <span key={'empty' + i}/>)}{Array.from({ length: days }, (_, i) => { const day = month + '-' + String(i + 1).padStart(2, '0'); return <button type="button" key={day} disabled={pastOnly && day > today} aria-label={day} aria-pressed={value.slice(0, 10) === day} onClick={() => { onChange(day); setOpen(false); }}>{i + 1}</button>; })}</div>
      <button type="button" onClick={() => setOpen(false)}>Done</button>{!required && <button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear</button>}
    </div>}
  </div>;
}
