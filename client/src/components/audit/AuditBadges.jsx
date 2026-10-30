import React from 'react';
import { statusLabels } from './auditPresentation';
export function StatusBadge({ status, label }) { return <span className="ca-status" data-status={status}><i aria-hidden="true" />{label || statusLabels[status] || status}</span>; }
export function StandardBadge({ standard }) { return <span className="ca-standard" data-standard={standard}>{standard === 'internal' ? 'Internal' : standard}</span>; }
