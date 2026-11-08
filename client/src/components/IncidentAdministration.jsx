import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import { getAuthConfig } from '../utils/authConfig';
import { useNotification } from './NotificationContext';

export default function IncidentAdministration({ row, busy, beforeNavigate }) {
  const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase();
  const [expanded, setExpanded] = useState(false), [reason, setReason] = useState(''), [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { confirm, showNotification } = useNotification();
  if (!['superadmin', 'qualitymanager'].includes(role)) return null;
  const remove = () => confirm({ title: 'Delete ' + row.incidentId + '?', message: 'This removes the incident from the register and discards unsaved entries. Its audit history is retained. Reason: ' + reason.trim(), confirmLabel: 'Delete incident', cancelLabel: 'Cancel', onConfirm: async () => {
    setSaving(true);
    try { await axios.delete('/api/incidents/' + row._id, { ...getAuthConfig(), data: { version: row.__v, reason: reason.trim() } }); showNotification('Incident deleted. Audit history retained.', 'success'); navigate('/dashboard/incidents'); }
    catch (e) { showNotification(e.response?.data?.message || 'Could not delete incident.', 'error'); }
    finally { setSaving(false); }
  } });
  return <section className="iw-admin-tools" aria-label="Incident administration"><div className="iw-row-tools">
    {role === 'superadmin' && <button className="iw-secondary" disabled={busy || saving} onClick={() => beforeNavigate(() => navigate(`/dashboard/incidents/${row._id}/edit`))}><Pencil size={16}/>Edit report</button>}
    <button className="iw-secondary" disabled={busy || saving} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><Trash2 size={16}/>Delete incident</button>
  </div>{expanded && <form className="iw-card iw-padded" onSubmit={e => { e.preventDefault(); if (reason.trim()) remove(); }}><label>Reason for deletion *<textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} disabled={saving}/></label><p>The incident will leave the active register. Its history remains in Audit log.</p><button className="iw-secondary" disabled={busy || saving || !reason.trim()}>Review deletion</button></form>}</section>;
}
