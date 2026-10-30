import { dubaiDay, sessionTime } from './auditSchedule.js';
export const initialDatePlan = (date = '') => ({ dates: date ? [date] : [], mode: 'shared', windows: [{ start: '09:00', end: '10:00' }], dateWindows: {} });
export function datesBetween(first, last) {
  const [start, end] = [first, last].sort(), values = [];
  const cursor = new Date(`${start}T12:00:00Z`), finish = new Date(`${end}T12:00:00Z`);
  while (cursor <= finish) {
    values.push(cursor.toISOString().slice(0, 10));
    if (values.length > 100) throw new Error('Choose a range of up to 100 dates.');
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return values;
}
export function buildAuditDates(plan) {
  if (!plan.dates.length) throw new Error('Choose at least one audit date from the calendar.');
  const sessions = [...new Set(plan.dates)].sort().flatMap(date => (plan.mode === 'shared' ? plan.windows : plan.dateWindows[date] || plan.windows).map(w => ({ startAt: `${date}T${w.start}:00+04:00`, endAt: `${date}T${w.end}:00+04:00` })));
  if (!sessions.length || sessions.length > 100) throw new Error('Choose between 1 and 100 audit time windows.');
  sessions.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  if (sessions.some(s => !Number.isFinite(new Date(s.startAt).getTime()) || !Number.isFinite(new Date(s.endAt).getTime()) || new Date(s.endAt) <= new Date(s.startAt))) throw new Error('Each time window must end after its start time.');
  if (sessions.some((s, i) => i > 0 && new Date(s.startAt) < new Date(sessions[i - 1].endAt))) throw new Error('Time windows cannot overlap on the same date.');
  return sessions;
}

export function datePlanFromAudit(audit) {
  if (!audit?.sessions?.length) return initialDatePlan(audit?.scheduledDate ? dubaiDay(audit.scheduledDate) : '');
  const dateWindows = {};
  for (const slot of [...audit.sessions].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))) {
    const day = dubaiDay(slot.startAt);
    (dateWindows[day] ||= []).push({ start: sessionTime(slot.startAt), end: sessionTime(slot.endAt) });
  }
  return { dates: Object.keys(dateWindows).sort(), mode: 'individual', windows: initialDatePlan().windows, dateWindows };
}
