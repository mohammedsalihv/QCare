import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, X, Check } from 'lucide-react';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';
const classes = [['Public','All signed-in staff'],['Restricted','Choose the audience'],['Confidential','Owner and reviewers only'],['Secret','Owner and reviewers only']];
export default function DocumentAccess({ document: doc, onClose, onSaved }) {
  const dialog = useRef(null);
  const [settings, setSettings] = useState({ classification: doc.classification, audience: doc.audience, allowDownload: !!doc.allowDownload });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; const previous = document.body.style.overflow; element.showModal(); document.body.style.overflow = 'hidden'; return () => { element.close(); document.body.style.overflow = previous; }; }, []);
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { const { data } = await axios.put(`/api/documents/${doc._id}/access`, { ...settings, revision: doc.__v }, getAuthConfig()); onSaved(data); }
    catch (e) { setError(e.response?.data?.message || 'Access could not be saved. Your choices are retained.'); }
    finally { setBusy(false); }
  };
  return <dialog className="dl-edit-dialog dl-access-dialog" ref={dialog} aria-labelledby="access-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <header className="dl-modal-head"><span className="dl-modal-icon"><LockKeyhole size={22} /></span><div><h2 id="access-title">Manage access</h2><p>{doc.name}</p></div><button type="button" aria-label="Close access controls" disabled={busy} onClick={onClose}><X size={18} /></button></header>
    <form onSubmit={save} className="dl-edit-form"><fieldset disabled={busy} className="dl-edit-body">
      {error && <p className="dl-error" role="alert">{error}</p>}
      <section className="dl-form-section"><h3>1. Classification</h3><div className="dl-choice-grid" role="group" aria-label="Classification">{classes.map(([value,hint]) => <button key={value} type="button" className={'dl-choice dl-choice-' + value.toLowerCase()} aria-pressed={settings.classification === value} onClick={() => setSettings(v => ({ ...v, classification:value, audience:value === 'Public' ? 'All staff' : ['Confidential','Secret'].includes(value) ? 'Owner and reviewers' : v.audience }))}><span><i /><strong>{value}</strong>{settings.classification === value && <Check size={16} />}</span><small>{hint}</small></button>)}</div></section>
      <section className="dl-form-section"><h3>2. Who can view</h3><div className="dl-audience-options" role="group" aria-label="Who can view">{['All staff','Department','Owner and reviewers'].map(value => <button type="button" key={value} aria-pressed={settings.audience === value} disabled={settings.classification !== 'Restricted' && value !== settings.audience} onClick={() => setSettings(v => ({ ...v, audience:value }))}>{value}{settings.audience === value && <Check size={15} />}</button>)}</div><p className="dl-field-help">{settings.classification === 'Public' ? 'Public is visible to all signed-in staff. Choose Restricted to select a smaller audience.' : ['Confidential','Secret'].includes(settings.classification) ? 'This classification limits access to the owner and reviewers. Choose Restricted above to enable Department or All staff.' : 'Select the audience. The owner and Super Admin always retain management access.'}</p></section>
      <section className="dl-form-section"><label className="dl-download-choice"><span><strong>Allow downloads</strong><small>Staff can save a copy of this document.</small></span><input type="checkbox" role="switch" checked={settings.allowDownload} onChange={e => setSettings(v => ({ ...v, allowDownload:e.target.checked }))} /></label></section>
      <p className="dl-notice">{doc.status === 'Draft' ? 'Draft: staff access begins after approval and publication.' : doc.visibilityMessage} {doc.status === 'Active' && 'Saved access changes apply immediately.'}</p>
    </fieldset><footer className="dl-modal-foot"><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="dl-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save access'}</button></footer></form>
  </dialog>;
}
