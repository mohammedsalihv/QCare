import { useId, useRef, useState } from 'react';
import { EllipsisVertical, Eye, Pencil, Trash2, CheckCheck, LockKeyhole } from 'lucide-react';

export default function DocumentActions({ document: doc, canUpload = false, onView, onEdit, onDelete }) {
  const id = useId(), panel = useRef(null), trigger = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const choose = action => { panel.current.hidePopover(); action(doc); };
  const position = () => {
    const rect = trigger.current.getBoundingClientRect();
    const target = panel.current;
    const width = Math.min(290, window.innerWidth - 24);
    target.style.width = `${width}px`;
    target.style.left = `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`;
    // Native popovers escape table clipping; clamp tall panels to the viewport.
    const height = Math.min(target.scrollHeight || 440, window.innerHeight - 24);
    const below = window.innerHeight - rect.bottom;
    const top = below >= height + 12 ? rect.bottom + 6 : rect.top >= height + 12 ? rect.top - height - 6 : Math.max(12, window.innerHeight - height - 12);
    target.style.top = `${top}px`;
    target.style.bottom = 'auto';
    target.style.maxHeight = `${window.innerHeight - 24}px`;
  };
  const canRead = doc.status === 'Active' && new Date(doc.revisedDate) <= new Date() && (!doc.expiryDate || new Date(doc.expiryDate) > new Date());
  return <>
    <button className="dl-menu-trigger" aria-label={`Actions for ${doc.name}`} title="Document actions" ref={trigger} popoverTarget={id} aria-haspopup="dialog" aria-expanded={expanded} aria-controls={id} onClick={position}><EllipsisVertical size={18} aria-hidden="true" /></button>
    <div id={id} ref={panel} popover="auto" role="dialog" aria-label={`Actions for ${doc.name}`} className="dl-action-menu" onToggle={event => { setExpanded(event.newState === 'open'); if (event.newState === 'open') position(); }}>
      <header><strong>{doc.name}</strong><span>{doc.ref} · Version {doc.version}</span></header>
      <div className="dl-menu-options">
        <button autoFocus onClick={() => choose(onView)}><Eye size={16} aria-hidden="true" /> View document</button>
        {canUpload && doc.permissions.edit && <button onClick={() => choose(onEdit)}><Pencil size={16} aria-hidden="true" />{doc.status === 'Active' && !doc.draft ? 'Create revision' : 'Edit document'}</button>}
        {canRead && <button onClick={() => choose(onView)}><CheckCheck size={16} aria-hidden="true" /> Read & acknowledge</button>}
      </div>
      <section className="dl-menu-controls" aria-label="Document controls"><h3><LockKeyhole size={14} aria-hidden="true" /> Controls</h3><dl><dt>Who can view</dt><dd>{doc.status === 'Draft' ? 'Owner and reviewers' : doc.audience}</dd>{doc.status === 'Draft' && <><dt>After publication</dt><dd>{doc.draft?.audience || doc.audience}</dd></>}<dt>Reader downloads</dt><dd>{(doc.status === 'Draft' ? doc.draft?.allowDownload : doc.allowDownload) ? 'Allowed' : 'Not allowed'}</dd></dl>
        {canUpload && doc.permissions.edit ? <button onClick={() => choose(onEdit)}>Manage access & downloads</button> : <p className="dl-control-help">{doc.permissions.edit && !canUpload ? 'Management permissions are unavailable. The document service needs updating to enable these controls.' : 'Only authorized document managers can change these controls.'}</p>}
      </section>
      {doc.permissions.delete && <div className="dl-menu-options dl-menu-danger"><button className="dl-delete" onClick={() => choose(onDelete)}><Trash2 size={16} aria-hidden="true" /> Delete draft</button></div>}
    </div>
  </>;
}
