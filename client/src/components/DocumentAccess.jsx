import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';

export default function DocumentAccess({ document: doc, onClose, onSaved }) {
  const dialog = useRef(null);
  const [settings, setSettings] = useState({ classification: doc.classification, audience: doc.audience, allowDownload: !!doc.allowDownload });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await axios.put(`/api/documents/${doc._id}/access`, { ...settings, revision: doc.__v }, getAuthConfig());
      onSaved(data);
    } catch (e) { setError(e.response?.data?.message || 'Access could not be saved. Your choices are retained.'); }
    finally { setBusy(false); }
  };
  return <dialog className="dl-access-dialog dl-editor" ref={dialog} aria-labelledby="access-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <h2 id="access-title">Manage access</h2><p>{doc.name}</p>
    <p className="dl-notice">{doc.visibilityMessage}</p>
    <p>The owner and Super Admin keep management access regardless of the audience. For published documents, access changes take effect immediately. Drafts still need approval and publication.</p>
    {error && <p className="dl-error" role="alert">{error}</p>}
    <form onSubmit={save}><fieldset disabled={busy}>
      <label>Classification<select value={settings.classification} onChange={e => setSettings(v => ({ ...v, classification: e.target.value, audience: e.target.value === 'Public' ? 'All staff' : ['Confidential', 'Secret'].includes(e.target.value) ? 'Owner and reviewers' : v.audience }))}>{['Public','Restricted','Confidential','Secret'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Who can view<select value={settings.audience} disabled={settings.classification !== 'Restricted'} onChange={e => setSettings(v => ({ ...v, audience: e.target.value }))}><option>Owner and reviewers</option>{['Public','Restricted'].includes(settings.classification) && <><option>All staff</option><option>Department</option></>}</select></label>
      <label className="dl-check"><input type="checkbox" checked={settings.allowDownload} onChange={e => setSettings(v => ({ ...v, allowDownload: e.target.checked }))} /> Allow staff to download</label>
      <div className="dl-actions"><button type="button" onClick={onClose}>Cancel</button><button className="dl-primary" type="submit">{busy ? 'Saving…' : 'Save access'}</button></div>
    </fieldset></form>
  </dialog>;
}
