import React from 'react';
import { displayLabel } from './auditPresentation';
export default function AuditHistory({ history = [] }) {
 return history.length ? <ol className="ca-timeline">{history.map((event, index) => <li key={event._id || index}><span className="ca-timeline-dot" /><div><p><strong>{displayLabel(event.event)}</strong><time dateTime={event.at}>{event.at ? new Date(event.at).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) + ' · Dubai' : 'Time not recorded'}</time></p><small>By {event.actor?.employeeName || 'User no longer available'}</small>{event.detail && <small>{event.detail}</small>}</div></li>)}</ol> : <div className="ca-panel-body ca-small">No recorded events for this legacy audit.</div>;
}
