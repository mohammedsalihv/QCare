import { useId, useRef, useState } from 'react';
import { EllipsisVertical, Eye, Pencil, Trash2, CheckCheck, LockKeyhole } from 'lucide-react';

export default function DocumentActions({ document: doc, onView, onDetails, onEdit, onManage, onDelete }) {
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
        {doc.permissions.edit && <button onClick={() => choose(onEdit)}><Pencil size={16} aria-hidden="true" />{doc.status === 'Active' && !doc.draft ? 'Create revision' : 'Edit document'}</button>}
        {canRead && <button onClick={() => choose(onView)}><CheckCheck size={16} aria-hidden="true" /> Read & acknowledge</button>}
      </div>
      {doc.permissions.manageAccess && <section className="dl-menu-controls" aria-label="Document controls"><button onClick={() => choose(onManage)}><LockKeyhole size={16} aria-hidden="true" /> Manage access</button><p className="dl-control-help">{doc.visibilityMessage}</p></section>}
      {doc.permissions.workspace && !doc.permissions.edit && <p className="dl-control-help">Content editing is locked during review.</p>}
      {doc.permissions.workspace && <div className="dl-menu-options"><button onClick={() => choose(onDetails)}>Workflow & reading report</button></div>}
      {doc.permissions.archive && <div className="dl-menu-options"><button onClick={() => choose(onDetails)}>Archive document</button></div>}
      {doc.permissions.delete && <div className="dl-menu-options dl-menu-danger"><button className="dl-delete" onClick={() => choose(onDelete)}><Trash2 size={16} aria-hidden="true" /> Delete draft</button></div>}
    </div>
  </>;
}
