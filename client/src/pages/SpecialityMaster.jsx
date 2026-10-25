import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, FileEdit, Trash2, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Select from '../components/Select';
import UserSelect from '../components/UserSelect';
import Pagination from '../components/Pagination';
import { useNotification } from '../components/NotificationContext';
import { getAuthConfig } from '../utils/authConfig';

const emptyForm = { name: '', department: '', head: '', status: 'Active' };
const fieldClass = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm';
export default function SpecialityMaster() {
  const { showNotification, confirm } = useNotification();
  const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase();
  const canManage = ['admin', 'superadmin'].includes(role);
  const [specialties, setSpecialties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const load = useCallback(() => axios.get('/api/specialties', getAuthConfig()).then(({ data }) => {
    if (!Array.isArray(data)) throw new Error('Unexpected specialty response');
    setSpecialties(data); setError('');
  }).catch(err => setError(err.response?.status === 404 ? 'The connected server needs the Specialty Master update before specialties can be loaded or saved.' : err.response?.data?.message || 'Could not load specialties. Please try again.')).finally(() => setLoading(false)), []);
  const loadDepartments = useCallback(() => axios.get('/api/departments', getAuthConfig()).then(({ data }) => {
    if (!Array.isArray(data)) throw new Error('Unexpected department response');
    setDepartments(data); setDepartmentError('');
  }).catch(err => setDepartmentError(err.response?.data?.message || 'Could not load departments. Please try again.')), []);
  useEffect(() => { load(); }, [load]);
  const edit = item => {
    setEditing(item); setForm(item ? { name: item.name, department: item.department?._id || '', head: item.head?._id || '', status: item.status } : { ...emptyForm });
    setFormError(''); setOpen(true); loadDepartments();
  };
  const update = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const save = async event => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setFormError('');
    try {
      const url = '/api/specialties' + (editing ? '/' + editing._id : '');
      const { data } = await axios[editing ? 'put' : 'post'](url, form, getAuthConfig());
      setSpecialties(previous => editing ? previous.map(item => item._id === data._id ? data : item) : [data, ...previous]);
      setOpen(false); setPage(1); showNotification('Specialty saved to the database.', 'success');
    } catch (err) { setFormError(err.response?.status === 404 ? 'The connected server needs the Specialty Master update. This specialty has not been saved.' : err.response?.data?.message || 'Save failed. Your changes have not been saved.'); }
    finally { setSaving(false); }
  };
  const remove = item => confirm({ title: 'Delete specialty', message: 'Delete ' + item.name + ' from the specialty master?', type: 'danger', onConfirm: async () => {
    setSaving(true);
    try {
      await axios.delete('/api/specialties/' + item._id, getAuthConfig());
      setSpecialties(previous => previous.filter(row => row._id !== item._id));
      showNotification('Specialty deleted from the database.', 'success');
    } catch (err) { showNotification(err.response?.data?.message || 'Delete failed. The specialty has not been removed.', 'error'); }
    finally { setSaving(false); }
  } });
  const toggle = async item => {
    if (saving) return; setSaving(true);
    try {
      const { data } = await axios.put('/api/specialties/' + item._id, { status: item.status === 'Active' ? 'Inactive' : 'Active' }, getAuthConfig());
      setSpecialties(previous => previous.map(row => row._id === item._id ? data : row));
    } catch (err) { showNotification(err.response?.data?.message || 'Could not update specialty status.', 'error'); }
    finally { setSaving(false); }
  };
  const filtered = specialties.filter(item => [item.name, item.department?.name, item.head?.employeeName].some(value => value?.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => a.name.localeCompare(b.name));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  return <DashboardLayout><div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-slate-800">Specialty Master</h1><p className="text-sm text-slate-600 mt-2">Manage specialties, their departments and responsible leads.</p></div>{canManage && <button className="bg-primary text-white px-5 py-3 rounded-xl flex items-center gap-2" disabled={saving} onClick={() => edit(null)}><Plus size={17} />Add specialty</button>}</header>
    {error && <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error} <button className="underline" onClick={load}>Retry</button></div>}
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="p-5 flex items-center gap-3"><Search size={18} /><input aria-label="Search specialties" placeholder="Search specialty, department or lead" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className={fieldClass} /></div>
    <div className="overflow-x-auto"><Table className="w-full text-left min-w-[750px]"><thead className="bg-slate-50"><tr>{['Specialty', 'Department', 'Specialty lead', 'Status', 'Actions'].map(title => <th key={title} className="px-5 py-4 text-sm font-semibold">{title}</th>)}</tr></thead><tbody>{!loading && !error && filtered.slice((currentPage - 1) * 10, currentPage * 10).map(item => <tr key={item._id} className="border-t border-slate-100"><td className="px-5 py-4 font-medium">{item.name}</td><td className="px-5 py-4">{item.department?.name || 'Department unavailable'}</td><td className="px-5 py-4">{item.head?.employeeName || 'Not assigned'}</td><td className="px-5 py-4"><button aria-label={'Change status for ' + item.name} disabled={!canManage || saving} onClick={() => toggle(item)} className={'px-3 py-1 rounded-full text-sm ' + (item.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{item.status}</button></td><td className="px-5 py-4">{canManage && <div className="flex gap-3"><button aria-label={'Edit ' + item.name} disabled={saving} onClick={() => edit(item)}><FileEdit size={18} /></button><button aria-label={'Delete ' + item.name} disabled={saving} className="text-red-600" onClick={() => remove(item)}><Trash2 size={18} /></button></div>}</td></tr>)}{(loading || !filtered.length || error) && <tr><td colSpan="5" className="p-10 text-center text-slate-600">{loading ? 'Loading specialties…' : error ? 'Specialties could not be loaded.' : search ? 'No specialties match your search.' : 'No specialties saved yet.'}</td></tr>}</tbody></Table></div>
    <Pagination totalRecords={filtered.length} recordsPerPage={10} currentPage={currentPage} onPageChange={setPage} /></section>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"><section role="dialog" aria-modal="true" aria-labelledby="specialty-form-title" className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"><header className="flex justify-between items-center gap-4"><h2 id="specialty-form-title" className="text-xl font-semibold">{editing ? 'Edit specialty' : 'Add specialty'}</h2><button aria-label="Close specialty form" disabled={saving} onClick={() => setOpen(false)}><X /></button></header><form onSubmit={save} className="mt-6 space-y-5"><fieldset disabled={saving} className="space-y-5"><label className="block text-sm font-medium">Specialty name<input autoFocus name="name" required maxLength="150" value={form.name} onChange={update} className={fieldClass} placeholder="For example, Cardiology" /></label><label className="block text-sm font-medium">Department<Select aria-label="Department" name="department" value={form.department} onChange={update} required className={fieldClass}><option value="">Select a department</option>{departments.map(department => <option key={department._id} value={department._id}>{department.name}</option>)}</Select></label>{departmentError && <p role="alert" className="text-sm text-red-700">{departmentError} <button type="button" onClick={loadDepartments} className="underline">Retry departments</button></p>}{!departmentError && !departments.length && <p className="text-sm text-slate-600">No departments loaded. Add a department in Department Master if the list is empty.</p>}<label className="block text-sm font-medium">Specialty lead (optional)<UserSelect aria-label="Specialty lead" name="head" value={form.head} selectedLabel={editing?.head?.employeeName} onChange={update} disabled={saving} placeholder="Select a lead from users" className={fieldClass} /></label><p className="text-xs text-slate-600">Select a name from the active users list.</p><label className="block text-sm font-medium">Status<Select aria-label="Specialty status" name="status" value={form.status} onChange={update} className={fieldClass}><option>Active</option><option>Inactive</option></Select></label></fieldset>{formError && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{formError}</p>}<div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="px-5 py-3 border rounded-xl">Cancel</button><button type="submit" disabled={saving || Boolean(departmentError)} className="bg-primary text-white px-5 py-3 rounded-xl">{saving ? 'Saving…' : 'Save specialty'}</button></div></form></section></div>}
  </div></DashboardLayout>;
}
