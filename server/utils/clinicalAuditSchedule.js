function normalizeAuditSchedule(sessions, legacyDate) {
  if (sessions === undefined) {
    const date = new Date(legacyDate);
    if (!legacyDate || !Number.isFinite(date.getTime())) throw new Error('Choose at least one audit date and time.');
    return { scheduledDate: date, sessions: [] };
  }
  if (!Array.isArray(sessions) || !sessions.length || sessions.length > 100) throw new Error('Add between 1 and 100 audit sessions.');
  const normalized = sessions.map(session => {
    const startAt = new Date(session?.startAt), endAt = new Date(session?.endAt);
    const withZone = value => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
      const [year, month, day] = value.slice(0, 10).split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60;
    };
    if (!withZone(session?.startAt) || !withZone(session?.endAt) || !Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) throw new Error('Each session needs a valid start and end time with a timezone.');
    if (endAt <= startAt) throw new Error('Each session must end after its start time.');
    return { startAt, endAt };
  }).sort((a, b) => a.startAt - b.startAt);
  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i].startAt < normalized[i - 1].endAt) throw new Error('Audit sessions cannot overlap. Choose a different date or time.');
  }
  return { sessions: normalized, scheduledDate: normalized[0].startAt, scheduledUntil: normalized.at(-1).endAt };
}
module.exports = { normalizeAuditSchedule };
