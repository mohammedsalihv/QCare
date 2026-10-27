export const dubaiDay = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
export const sessionTime = value => new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' });
export const auditSessions = audit => audit.sessions?.length ? audit.sessions : [{ startAt: audit.scheduledDate, endAt: null }];
