import { useEffect, useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import Select from './Select';
import DateField from './IncidentDateField';import { useNotification } from './NotificationContext';

export default function DocumentEditor({ editor, form, change, file, setFile, approvers, busy, onClose, onSave }) {
  const ref = useRef(null);  const { showNotification } = useNotification();
  useEffect(() => { const dialog = ref.current; const previous = document.body.style.overflow; dialog.showModal(); document.body.style.overflow = 'hidden'; return () => { dialog.close(); document.body.style.overflow = previous; }; }, []);
  return <dialog ref={ref} className="dl-edit-dialog" aria-labelledby="document-editor-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <header className="dl-modal-head"><span className="dl-modal-icon"><FileText size={22} /></span><div><h2 id="document-editor-title">{editor === 'new' ? 'Add document' : 'Edit document'}</h2><p>{editor === 'new' ? 'Upload a file and prepare it for review.' : form.name}</p></div><button type="button" aria-label="Close editor" disabled={busy} onClick={onClose}><X size={18} /></button></header>
    <form onSubmit={onSave} onInvalidCapture={event => { event.preventDefault(); event.stopPropagation(); showNotification('Complete the required document fields before saving.', 'error'); }} className="dl-edit-form"><fieldset disabled={busy} className="dl-edit-body">
      <ol className="dl-workflow" aria-label="Publication steps"><li aria-current="step"><strong>1. Save draft</strong><small>Private preparation</small></li><li><strong>2. Submit for review</strong><small>Selected reviewer approves</small></li><li><strong>3. Publish</strong><small>Owner or document team</small></li><li><strong>4. Acknowledge</strong><small>Staff confirm reading</small></li></ol><section className="dl-form-section"><h3>Document details</h3><div className="dl-grid">
        <label className="dl-wide">Document name *<input name="name" required maxLength={200} value={form.name} onChange={change} /></label>
        <label>Type *<Select name="type" value={form.type} onChange={change}>{['Policy','Procedure','Guideline','Manual','Form','Certificate','Evidence'].map(v => <option key={v}>{v}</option>)}</Select></label>
        <label>Reference number *<input name="ref" required maxLength={100} value={form.ref} onChange={change} /></label>
        <label>Department *<input name="department" required maxLength={150} value={form.department} onChange={change} /></label>
        <label>Reviewer who will approve *<Select name="assignedApprover" required value={form.assignedApprover} onChange={change}><option value="">Choose a reviewer</option>{approvers.map(p => <option key={p._id} value={p._id}>{p.employeeName}</option>)}</Select></label>
      </div><label>Description<textarea name="description" rows={2} maxLength={4000} value={form.description} onChange={change} /></label></section>
      <section className="dl-form-section"><h3>Dates</h3><div className="dl-date-grid"><DateField label="Effective date" required value={form.revisedDate} onChange={value => change({ target: { name: "revisedDate", value } })} /><DateField label="Next revision" required value={form.nextRevDate} onChange={value => change({ target: { name: "nextRevDate", value } })} /><DateField label="Expiry date" value={form.expiryDate} onChange={value => change({ target: { name: "expiryDate", value } })} /></div><p className="dl-field-help">Upload and review dates are recorded automatically.</p></section>
      <section className="dl-form-section"><h3>File & revision</h3>
        <label>Source<Select name="source" value={form.source} onChange={change}><option value="file">Upload a PDF or file</option><option value="template">Generate from text</option></Select></label>
        {form.source === 'template' ? <label>Document content *<textarea name="generatedText" required rows={8} maxLength={8000} value={form.generatedText} onChange={change} /></label> : <label className="dl-file-field"><Upload size={20} /><strong>{file?.name || (editor === 'new' ? 'Choose a PDF or file' : 'Keep current file or choose a replacement')}</strong><span>PDF, PNG, JPG or CSV · up to 10 MB</span><input type="file" required={editor === 'new'} accept=".pdf,.png,.jpg,.jpeg,.csv" onChange={e => setFile(e.target.files[0] || null)} /></label>}
        <label>What changed? *<textarea name="changeSummary" required rows={2} maxLength={2000} value={form.changeSummary} onChange={change} /></label>
      </section><p className="dl-field-help">Access and downloads are managed from the document’s ••• menu → Manage access. New documents start private and remain drafts until approved and published.</p>
    </fieldset><footer className="dl-modal-foot"><span>Private draft · not visible to staff</span><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="dl-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button></footer></form>
  </dialog>;
}
