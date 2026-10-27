import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MapPin, Maximize2, X } from 'lucide-react';
import Select from '../Select';
import AuditMultiSelect from './AuditMultiSelect';
import AuditDatePlanner from './AuditDatePlanner';
import { buildAuditDates, initialDatePlan } from './auditDatePlan';
import './auditPlanning.css';

const input = 'w-full min-w-0 border border-slate-200 rounded-xl p-3 bg-white text-sm';
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''}` } });
async function directories() {
  const paths = ['/api/locations', '/api/departments', '/api/users/directory'];
  const results = await Promise.allSettled(paths.map(path => axios.get(path, config())));
  const list = index => results[index].status === 'fulfilled' ? results[index].value.data : [];
  return { locations: Array.isArray(list(0)) ? list(0).filter(l => l.isActive !== false) : [], departments: Array.isArray(list(1)) ? list(1).filter(d => d.isActive !== false) : [], persons: Array.isArray(list(2)) ? list(2).filter(p => p.isActive !== false && !['blocked', 'inactive'].includes(p.status)) : [], failures: results.map(r => r.status === 'rejected') };
}

export default function AuditPlanningDialog({ templates, onSchedule, onClose, initialDate = '' }) {
  const [details, setDetails] = useState({ auditTitle: '', templateId: '', auditType: 'planned', location: '', concernedDepartments: [], concernedPersons: [], auditorName: '' });
  const [plan, setPlan] = useState(() => initialDatePlan(initialDate));
  const [lists, setLists] = useState({ locations: [], departments: [], persons: [], failures: [] });
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef(null);
  const toggleSize = () => {
    // Native resizing sets inline dimensions; clear those when switching size modes.
    if (dialogRef.current) { dialogRef.current.style.width = ''; dialogRef.current.style.height = ''; }
    setExpanded(previous => !previous);
  };
  const available = templates.filter(t => t.criteria?.length);
  useEffect(() => { let active = true; directories().then(data => { if (active) { setLists(data); setLoading(false); } }); return () => { active = false; }; }, []);
  const retry = async () => { setLoading(true); setLists(await directories()); setLoading(false); };
  const update = (field, value) => { setDetails(prev => ({ ...prev, [field]: value })); setError(''); };
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!details.location) throw new Error('Select an audit location.');
      await onSchedule({ ...details, auditorName: details.auditorName.trim(), sessions: buildAuditDates(plan) });
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(false); }
  };
  return <div className="audit-planning-backdrop" onKeyDown={event => { if (event.key === 'Escape' && !busy) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="schedule-title" className={`audit-planning-dialog ${expanded ? 'audit-planning-expanded' : ''}`}>
      <form onSubmit={submit} className="audit-planning-form">
        <header className="audit-planning-header"><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">Clinic audit</p><h2 id="schedule-title" className="text-xl font-semibold">Schedule clinic audit</h2><p className="text-sm text-slate-500 mt-1">Choose the location, people and dates for your audit.</p></div><div className="flex gap-2"><button type="button" className="audit-planning-icon hidden sm:flex" aria-label={expanded ? 'Restore form size' : 'Expand audit form'} aria-pressed={expanded} onClick={toggleSize}><Maximize2 size={17} /></button><button type="button" className="audit-planning-icon" disabled={busy} aria-label="Close scheduling" onClick={onClose}><X size={18} /></button></div></header>
        <div className="audit-planning-body">
          {error && <p role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm mb-4">{error}</p>}
          <div className="audit-planning-columns">
            <fieldset disabled={busy} className="space-y-5 min-w-0"><section className="space-y-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5"><h3 className="font-semibold">Audit details</h3>
              <label className="block text-sm font-medium">Audit title<input autoFocus required className={input} value={details.auditTitle} onChange={e => update('auditTitle', e.target.value)} placeholder="e.g. Infection prevention review" /></label>
              <label className="block text-sm font-medium">Checklist template<Select aria-label="Checklist template" required disabled={busy} className={input} value={details.templateId} onChange={e => update('templateId', e.target.value)}><option value="">Select a template</option>{available.map(t => <option key={t._id} value={t._id}>{t.templateName} · {t.standard}</option>)}</Select></label>
              {!available.length && <p className="text-xs text-amber-700">Create a checklist template first in Templates.</p>}
              <label className="block text-sm font-medium">Audit type<Select aria-label="Audit type" disabled={busy} className={input} value={details.auditType} onChange={e => update('auditType', e.target.value)}>{['planned', 'unannounced', 'follow-up'].map(t => <option key={t}>{t}</option>)}</Select></label>
              <label className="block text-sm font-medium">Location <span className="text-rose-600">*</span><Select aria-label="Location" required disabled={busy || loading} className={input} value={details.location} onChange={e => update('location', e.target.value)}><option value="">{loading ? 'Loading locations…' : 'Select audit location'}</option>{lists.locations.map(l => <option key={l._id} value={l._id}>{l.name}{l.code ? ` · ${l.code}` : ''}</option>)}</Select></label>
              {!loading && !lists.locations.length && <p className="text-xs text-rose-700">{lists.failures[0] ? 'The location list could not be loaded. Retry below.' : 'No active locations. Add a location in Location Master first.'}</p>}
              <label className="block text-sm font-medium">Auditor name (optional)<input maxLength={200} className={input} value={details.auditorName} onChange={e => update('auditorName', e.target.value)} placeholder="External auditor’s name, if known" /></label>
            </section>
            <section className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5"><h3 className="font-semibold">Concerned teams & people</h3><p className="text-xs text-slate-500">Select any relevant departments and people. Both fields can be left empty.</p>
              <AuditMultiSelect label="Concerned departments" options={lists.departments.map(d => ({ value: d._id, label: d.name, description: d.code }))} value={details.concernedDepartments} onChange={value => update('concernedDepartments', value)} disabled={busy || loading} unavailable={lists.failures[1]} />
              <AuditMultiSelect label="Concerned persons" options={lists.persons.map(p => ({ value: p._id, label: p.employeeName, description: [p.employeeId, p.department].filter(Boolean).join(' · ') }))} value={details.concernedPersons} onChange={value => update('concernedPersons', value)} disabled={busy || loading} unavailable={lists.failures[2]} />
              {lists.failures.some(Boolean) && <div className="text-xs text-amber-700">Some directory lists could not be loaded. <button type="button" disabled={loading || busy} className="underline font-semibold" onClick={retry}>Retry lists</button></div>}
            </section></fieldset>
            <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 min-w-0"><AuditDatePlanner value={plan} onChange={value => { setPlan(value); setError(''); }} disabled={busy} /></div>
          </div>
        </div>
        <footer className="audit-planning-footer"><div className="min-w-0 text-xs text-slate-500"><p className="flex items-center gap-1 text-slate-700"><MapPin size={13} /><span className="truncate">{lists.locations.find(l => l._id === details.location)?.name || 'Location required'}</span><span className="shrink-0">· {plan.dates.length} dates</span></p><p className="hidden sm:block mt-1">Drag the lower-right corner to resize the form.</p></div><div className="flex gap-2 shrink-0"><button type="button" disabled={busy} onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Cancel</button><button disabled={busy || loading || !available.length || !lists.locations.length} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40">{busy ? 'Scheduling…' : 'Schedule audit'}</button></div></footer>
      </form>
    </section>
  </div>;
}
