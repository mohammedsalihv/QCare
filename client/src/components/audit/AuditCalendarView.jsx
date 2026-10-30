import AuditConcernedPeople from './AuditConcernedPeople';
import React, { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileDown, Pencil, Trash2, MapPin, Plus, UserRound } from 'lucide-react';
import { auditSessions, dubaiDay, sessionTime } from './auditSchedule';
import { auditStatus, canEditScheduledAudit, dateLabel } from './auditPresentation';
import { StatusBadge } from './AuditBadges';

export function AuditSessionSummary({ audit }) {
  return <ul className="ca-schedule-summary" aria-label="Scheduled dates and times">{auditSessions(audit).map((slot, index) => <li key={slot._id || index}><CalendarDays size={13} /><time dateTime={slot.startAt}>{dateLabel(slot.startAt)}</time><span>{slot.endAt ? `${sessionTime(slot.startAt)}–${sessionTime(slot.endAt)}` : 'Time not specified'}</span></li>)}</ul>;
}
export default function AuditCalendarView({ audits, onOpen, onSchedule, onDownload, onDelete, onEditSchedule, canSchedule, busy, initialDate }) {
  const today = dubaiDay(new Date());
  const [selected, setSelected] = useState(initialDate || today), [month, setMonth] = useState((initialDate || today).slice(0, 7));
  const [year, number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1)).getUTCDay(), days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const events = audits.filter(audit => ['scheduled', 'in-progress', 'pending-review', 'completed', 'overdue'].includes(audit.status)).flatMap(audit => auditSessions(audit).map((slot, index) => ({ ...slot, audit, key: `${audit._id}-${index}`, day: dubaiDay(slot.startAt) }))).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const selectedEvents = events.filter(e => e.day === selected);
  const moveMonth = amount => {
    const date = new Date(Date.UTC(year, number - 1 + amount, 1));
    const next = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    setMonth(next); setSelected(`${next}-01`);
  };
  return <div className="ca-calendar-layout">
    <section className="ca-panel"><div className="ca-panel-heading"><div><p className="ca-eyebrow">Audit calendar</p><h2>{new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</h2><p>Published audit visits · Dubai time (UTC+04:00)</p></div><div className="ca-calendar-controls"><button className="ca-button ca-secondary" onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }}>Today</button><button className="ca-icon-button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button><button className="ca-icon-button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button></div></div>
      <div className="ca-calendar-month"><div className="ca-calendar-week">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}</div><div className="ca-calendar-grid">{Array.from({ length: first }, (_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: days }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, '0')}`, visits = events.filter(e => e.day === date);
        return <button key={date} aria-label={`View audits on ${date}`} aria-pressed={selected === date} onClick={() => setSelected(date)} className={`ca-calendar-day ${date === today ? 'is-today' : ''} ${visits.length ? 'has-visits' : ''}`}><strong>{index + 1}</strong>{visits.length > 0 && <><span className="ca-calendar-dots" aria-hidden="true">{visits.slice(0, 3).map(v => <i key={v.key} data-status={auditStatus(v.audit)} />)}</span><small className="ca-visit-count">{visits.length} visit{visits.length > 1 ? 's' : ''}</small><span className="ca-day-previews">{visits.slice(0, 2).map(v => <span key={v.key} title={`${sessionTime(v.startAt)} · ${v.audit.auditTitle}`}><b>{sessionTime(v.startAt)}</b> {v.audit.auditTitle}</span>)}</span></>}</button>;
      })}</div></div><div className="ca-calendar-legend">{['scheduled', 'in-progress', 'pending-review', 'completed', 'overdue'].map(status => <StatusBadge key={status} status={status} />)}</div>
    </section>
    <section className="ca-panel"><div className="ca-agenda-date"><p className="ca-eyebrow">Daily schedule</p><h3>{dateLabel(`${selected}T12:00:00+04:00`, { weekday: 'long' })}</h3><p>{selectedEvents.length} scheduled visit{selectedEvents.length !== 1 ? 's' : ''}</p></div>
      {selectedEvents.length ? <div className="ca-agenda-list">{selectedEvents.map(event => <article key={event.key} className="ca-agenda-card"><div className="ca-agenda-card-top"><span className="ca-agenda-time"><Clock3 size={14} /><time>{event.endAt ? `${sessionTime(event.startAt)}–${sessionTime(event.endAt)}` : 'Time not specified'}</time></span><StatusBadge status={auditStatus(event.audit)} /></div><h3>{event.audit.auditTitle}</h3><p><MapPin size={13} />{event.audit.location?.name || 'Location not specified'}</p><p><UserRound size={13} />{event.audit.auditorName || event.audit.auditor?.employeeName || 'Auditor not specified'}</p><AuditConcernedPeople audit={event.audit} /><div className="ca-button-row"><button className="ca-button ca-secondary ca-compact" disabled={busy} onClick={() => onOpen(event.audit)}>Open audit<ArrowRight size={14} /></button><button className="ca-icon-button" disabled={busy} aria-label={`Download PDF for ${event.audit.auditTitle}`} title="PDF report" onClick={() => onDownload(event.audit)}><FileDown size={17} /></button>{canSchedule && canEditScheduledAudit(event.audit) && <button className="ca-icon-button" disabled={busy} title="Edit scheduled audit" aria-label={`Edit scheduled audit ${event.audit.auditTitle}`} onClick={() => onEditSchedule(event.audit)}><Pencil size={17} /></button>}{canSchedule && <button className="ca-icon-button ca-delete-audit" disabled={busy} aria-label={`Delete audit ${event.audit.auditTitle}`} title="Delete audit" onClick={() => onDelete(event.audit)}><Trash2 size={17} /></button>}</div></article>)}</div> : <div className="ca-empty ca-empty-small"><CalendarDays size={28} /><h3>No visits scheduled</h3><p>No audits on this date. Select another day or plan a new visit.</p></div>}
      {canSchedule && <div className="ca-agenda-footer"><button aria-label="+ Schedule on this date" className="ca-button ca-primary" onClick={() => onSchedule(selected)}><Plus size={16} />Schedule this date</button></div>}
    </section>
  </div>;
}
