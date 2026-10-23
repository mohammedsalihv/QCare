import { isActiveRecord } from '../../utils/masterData';
import Select from '../Select';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/authConfig';
import { recordForms, buildRecordPayload } from './recordForms';

export default function CreateRecordDialog({ kind, onClose, onCreated }) {
  const definition = recordForms[kind];
  const [values, setValues] = useState({});
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [related, setRelated] = useState(false);
  const [revision, setRevision] = useState(0);
  const dialog = useRef(null);
  const submitting = useRef(false);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(definition.fields.filter(f => f.source).map(async f => {
      const { data } = await axios.get(f.source, { ...getAuthConfig(), signal: controller.signal });
        return [f.name, data.filter(isActiveRecord)];
    })).then(entries => {
      if (!controller.signal.aborted) { setLookups(Object.fromEntries(entries)); setError(''); }
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Could not load form options. Close and try again.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [definition, revision]);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true); setError('');
    try {
      const payload = buildRecordPayload(kind, values, lookups);
      const { data } = await axios.post(definition.endpoint, payload, getAuthConfig());
      onCreated(data);
      onClose();
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || 'Unable to save. Please try again.');
    } finally { submitting.current = false; setSaving(false); }
  }

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); if (!saving) onClose(); }} className="m-auto w-full max-w-xl rounded-2xl p-6 shadow-xl backdrop:bg-black/40 max-h-[90vh] overflow-y-auto">
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-semibold">{definition.title}</h2>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {loading && <p role="status">Loading options…</p>}
      <fieldset disabled={saving || loading} className="space-y-4">
        {definition.fields.map(field => {
          const options = field.options || (lookups[field.name] || []).map(item => ({ value: item[field.valueKey || '_id'], label: item[field.labelKey] }));
          const props = { name: field.name, required: field.required, min: field.min, max: field.max, className: 'w-full rounded-lg border border-slate-300 p-3', value: values[field.name] ?? '', onChange: event => setValues(previous => ({ ...previous, [field.name]: field.type === 'checkbox' ? event.target.checked : event.target.value })) };
          return <label key={field.name} className="block text-sm font-medium"><span className="block mb-1">{field.label}{field.required ? ' *' : ''}</span>
            {field.type === 'select' ? <Select {...props}><option value="">{options.length ? 'Select an option' : 'No records available'}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> : field.type === 'textarea' ? <textarea {...props} rows={4} /> : field.type === 'checkbox' ? <input {...props} className="h-5 w-5" type="checkbox" checked={Boolean(values[field.name])} /> : <input {...props} type={field.type} />}
          </label>;
        })}
        {definition.related && <button type="button" className="text-blue-700 underline" onClick={() => setRelated(true)}>{recordForms[definition.related].title}</button>}
      </fieldset>
      <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button type="submit" disabled={saving || loading} className="rounded-lg bg-slate-900 text-white px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button></div>
    </form>
    {related && <CreateRecordDialog kind={definition.related} onClose={() => setRelated(false)} onCreated={() => { setLoading(true); setRevision(value => value + 1); }} />}
  </dialog>;
}
