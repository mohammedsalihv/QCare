import React, { useState } from 'react';
import AuditScopeSummary from './AuditScopeSummary';
import { auditSessions, dubaiDay, sessionTime } from './auditSchedule';

export function AuditSessionSummary({ audit }) {
  return <ul className="text-sm space-y-1" aria-label="Scheduled dates and times">{auditSessions(audit).map((s, i) => <li key={s._id || i}><time dateTime={s.startAt}>{new Date(s.startAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', year: 'numeric' })}</time>{s.endAt ? ` · ${sessionTime(s.startAt)}–${sessionTime(s.endAt)} Dubai` : ' · Time not specified'}</li>)}</ul>;
}

export default function AuditCalendar({ audits, onOpen, onSchedule, canSchedule, busy }) {
  const [selected, setSelected] = useState(() => dubaiDay(new Date()));
  const [month, setMonth] = useState(() => dubaiDay(new Date()).slice(0, 7));
  const [year, number] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const events = audits.flatMap(audit => auditSessions(audit).map((s, i) => ({ ...s, audit, key: `${audit._id}-${i}`, day: dubaiDay(s.startAt) }))).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const selectedEvents = events.filter(e => e.day === selected);
  const moveMonth = amount => {
    const date = new Date(Date.UTC(year, number - 1 + amount, 1));
    const next = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    setMonth(next); setSelected(`${next}-01`);
  };
  return <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
    <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center gap-2"><button className="border rounded-xl p-2" aria-label="Previous month" onClick={() => moveMonth(-1)}>←</button><h2 className="text-lg font-semibold">{new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</h2><button className="border rounded-xl p-2" aria-label="Next month" onClick={() => moveMonth(1)}>→</button></div>
      <p className="text-sm text-slate-600">Audit calendar · Dubai time (UTC+04:00)</p>
      <div className="grid grid-cols-7 gap-1 text-center">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day} className="text-xs text-slate-500 py-2">{day}</span>)}
        {Array.from({ length: firstDay }, (_, i) => <span key={`empty-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, '0')}`, count = events.filter(e => e.day === date).length;
          return <button key={date} aria-label={`View audits on ${date}`} aria-pressed={selected === date} onClick={() => setSelected(date)} className={`min-h-14 rounded-xl border flex flex-col items-center justify-center gap-1 ${selected === date ? 'bg-primary text-white border-transparent' : 'border-slate-100 hover:bg-slate-50'}`}><span>{i + 1}</span>{count > 0 && <span className="text-[10px] font-semibold">{count} <span className="hidden sm:inline">time{count > 1 ? 's' : ''}</span></span>}</button>;
        })}
      </div>
    </section>
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"><div className="flex flex-wrap justify-between items-center gap-3"><h2 className="font-semibold">{new Date(`${selected}T12:00:00+04:00`).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'full' })}</h2>{canSchedule && <button className="bg-primary text-white rounded-xl px-3 py-2 text-sm" onClick={() => onSchedule(selected)}>+ Schedule on this date</button>}</div>
      {!selectedEvents.length && <p className="text-slate-500 py-8">No audits on this date.</p>}
      {selectedEvents.map(e => <article key={e.key} className="border border-slate-200 rounded-xl p-4 space-y-2"><p className="text-sm font-semibold text-teal-700">{e.endAt ? `${sessionTime(e.startAt)}–${sessionTime(e.endAt)}` : 'Time not specified'}</p><h3 className="font-semibold">{e.audit.auditTitle}</h3><AuditScopeSummary audit={e.audit} showPeople={false} /><p className="text-sm">{e.audit.auditorName || e.audit.auditor?.employeeName || 'Auditor not specified'}</p><p className="text-xs text-slate-500">{e.audit.status.replaceAll('-', ' ')}</p><button disabled={busy} className="text-sm text-blue-700 underline" onClick={() => onOpen(e.audit)}>Open audit</button></article>)}
    </section>
  </div>;
}
