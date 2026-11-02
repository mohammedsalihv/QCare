import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Plus, RefreshCw, X, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import UserSelect from '../components/UserSelect';
import useServerList from '../hooks/useServerList';
import { getAuthConfig } from '../utils/authConfig';

const API = '/api/clinical-staff-licenses';
const professions = ['Doctor', 'Nurse', 'Allied health', 'Other'];
const states = ['Active', 'Expiring soon', 'Expired', 'Pending', 'Verified', 'Rejected'];
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50';
const primary = 'rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50';
const day = value => value ? value.slice(0, 10) : 'N/A';
const message = error => error.response?.data?.message || 'Unable to complete the request. Please retry.';
const blank = { staff: '', profession: 'Doctor', specialty: '', authority: '', category: '', licenseNumber: '', issuedDate: '', expiryDate: '' };

function Badge({ value }) {
  const tone = ['Expired', 'Rejected'].includes(value) ? 'bg-rose-50 text-rose-700' : ['Pending', 'Expiring soon'].includes(value) ? 'bg-amber-50 text-amber-800' : 'bg-teal-50 text-teal-800';
  return <span className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>;
}
function Field({ label, children }) { return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>; }
function Filters({ list, history = false }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
    <div className="min-w-48 flex-1"><Field label="Search"><input className={input} type="search" maxLength={100} placeholder={history ? 'Number, event, remarks or person' : 'Staff, number, department or authority'} value={list.query.search} onChange={e => list.change({ search: e.target.value })} /></Field></div>
    {!history && <Field label="Profession"><select className={input} value={list.query.profession || ''} onChange={e => list.change({ profession: e.target.value })}><option value="">All professions</option>{professions.map(v => <option key={v}>{v}</option>)}</select></Field>}
    <Field label="Status"><select className={input} value={list.query.status} onChange={e => list.change({ status: e.target.value })}><option value="">All statuses</option>{(history ? ['Pending', 'Verified', 'Rejected'] : states).map(v => <option key={v}>{v}</option>)}</select></Field>
    <Field label="Sort by"><select className={input} value={list.query.sortBy} onChange={e => list.change({ sortBy: e.target.value })}>{(history ? [['name', 'Changed at']] : [['name', 'Licence number'], ['expiryDate', 'Expiry date'], ['authority', 'Authority'], ['updatedAt', 'Last updated']]).map(([v,l]) => <option value={v} key={v}>{l}</option>)}</select></Field>
    <Field label="Order"><select className={input} value={list.query.direction} onChange={e => list.change({ direction: e.target.value })}><option value="asc">Ascending</option><option value="desc">Descending</option></select></Field>
    <Field label="Rows"><select className={input} value={list.query.limit} onChange={e => list.change({ limit: Number(e.target.value) })}>{[10,25,50].map(v => <option key={v}>{v}</option>)}</select></Field>
    <button className={button} onClick={list.refresh} disabled={list.loading} aria-label="Refresh records"><RefreshCw size={17} /></button>
  </div>;
}
function Pages({ list }) { return <Pagination totalRecords={list.total} recordsPerPage={list.limit} currentPage={list.page} onPageChange={page => list.change({ page })} />; }
function History({ row, download }) {
  const list = useServerList(`${API}/${row._id}/history`);
  return <><p className="text-sm text-slate-600">Previous versions, recorded before each change. Current details remain in the register.</p><Filters list={list} history />{list.error && <p role="alert" className="p-3 text-red-700">{list.error}</p>}
    <div className="overflow-x-auto" aria-busy={list.loading}><Table><thead><tr>{['S/N','Changed at / by','Event','Previous licence','Previous review','Certificate'].map(v => <th key={v}>{v}</th>)}</tr></thead><tbody>{list.items.map((h,i) => <tr key={`${h.changedAt}-${i}`}><td>{(list.page-1)*list.limit+i+1}</td><td>{new Date(h.changedAt).toLocaleString()}<div>{h.changedBy?.employeeName || 'N/A'}</div></td><td>{h.event}</td><td>{h.authority} · {h.licenseNumber}<div>{h.profession} · {h.category}</div><div>{day(h.issuedDate)} – {day(h.expiryDate)}</div></td><td><Badge value={h.verification}/><div>{h.reviewer?.employeeName || 'N/A'}</div><div className="max-w-xs whitespace-pre-wrap">{h.remarks}</div></td><td>{h.certificateId ? <button className={button} onClick={() => download(row._id,h.certificateId)}>Download</button> : 'N/A'}</td></tr>)}{!list.items.length && <tr><td colSpan={6}>{list.loading ? 'Loading history…' : 'No previous versions.'}</td></tr>}</tbody></Table></div><Pages list={list}/></>;
}
function LicenseDialog({ mode, row, onClose, onSaved, download }) {
  const ref = useRef(null);
  const [form, setForm] = useState(row ? { ...row, issuedDate: day(row.issuedDate), expiryDate: mode === 'renew' ? '' : day(row.expiryDate), verification: 'Verified', remarks: '' } : blank);
  const [file,setFile] = useState(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => { ref.current.showModal(); }, []);
  const change = e => setForm(previous => ({ ...previous, [e.target.name]: e.target.value }));
  const titles = { add:'Add licence', edit:'Edit licence', renew:'Renew licence', review:'Review licence', certificate:'Upload certificate', history:'Licence history' };
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'certificate') { const data = new FormData(); data.append('certificate',file); await axios.post(`${API}/${row._id}/certificate`,data,getAuthConfig()); }
      else if (mode === 'add') await axios.post(API,form,getAuthConfig());
      else if (mode === 'edit') await axios.put(`${API}/${row._id}`,form,getAuthConfig());
      else await axios.post(`${API}/${row._id}/${mode}`,form,getAuthConfig());
      onSaved(); onClose();
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  const field = (key,label,type='text',required=true,maxLength=100) => <Field label={label}><input className={input} name={key} type={type} value={form[key]} onChange={change} required={required} maxLength={maxLength}/></Field>;
  return <dialog ref={ref} onCancel={e => { e.preventDefault(); if(!busy)onClose(); }} aria-labelledby="licence-dialog-title" className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-950/40 ${mode==='history'?'max-w-5xl':'max-w-xl'}`}>
    <header className="mb-5 flex items-center justify-between"><h2 id="licence-dialog-title" className="text-xl font-semibold">{titles[mode]}</h2><button className={button} onClick={onClose} disabled={busy} aria-label="Close"><X size={18}/></button></header>
    {row && <p className="mb-4 text-sm text-slate-600">{row.staff?.employeeName || 'Unavailable staff'} · {row.authority} · {row.licenseNumber}</p>}
    {mode==='history' ? <History row={row} download={download}/> : <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
      {mode==='add' && <Field label="Staff member"><UserSelect name="staff" value={form.staff} onChange={change} required /></Field>}
      {['add','edit'].includes(mode) && <><div className="grid gap-4 sm:grid-cols-2"><Field label="Profession"><select name="profession" value={form.profession} onChange={change} className={input}>{professions.map(v=><option key={v}>{v}</option>)}</select></Field>{field('specialty','Specialty (optional)','text',false,150)}</div><div className="grid gap-4 sm:grid-cols-2">{field('authority','Licensing authority','text',true,80)}{field('category','Licence category / title','text',true,150)}</div><p className="text-xs text-slate-500">Use the authority and professional title shown on the certificate.</p></>}
      {['add','edit','renew'].includes(mode) && <>{field('licenseNumber','Licence number')}<div className="grid gap-4 sm:grid-cols-2">{field('issuedDate','Issue date','date')}{field('expiryDate','Expiry date','date')}</div><p className="text-xs text-slate-500">Saved licences require verification. Attach the certificate from the register after saving.</p></>}
      {mode==='review' && <><div className="rounded-lg bg-slate-50 p-3 text-sm">{row.profession} · {row.category}<br/>{day(row.issuedDate)} – {day(row.expiryDate)}<br/>{row.certificateId ? <button type="button" className={`${button} mt-2`} onClick={()=>download(row._id,row.certificateId)}>Download certificate</button> : 'No certificate attached'}</div><Field label="Decision"><select className={input} name="verification" value={form.verification} onChange={change}><option>Verified</option><option>Rejected</option></select></Field><Field label={form.verification==='Rejected'?'Reason for rejection':'Review remarks (optional)'}><textarea className={input} name="remarks" value={form.remarks} onChange={change} required={form.verification==='Rejected'} maxLength={1000} rows={3}/></Field></>}
      {mode==='certificate' && <><Field label="Certificate (PDF, PNG or JPEG; maximum 5 MB)"><input className={input} type="file" accept=".pdf,.png,.jpg,.jpeg" required onChange={e => setFile(e.target.files[0])}/></Field><p className="text-sm text-slate-600">Uploading a certificate resets verification to Pending. Previous certificates remain in history.</p></>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={button} onClick={onClose}>Cancel</button><button className={primary} type="submit">{busy?'Saving…':mode==='review'?'Save decision':'Save'}</button></footer>
    </fieldset></form>}
  </dialog>;
}
export default function PhysicianDemography() {
  const list = useServerList(API);
  const [modal,setModal] = useState(null);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const canManage = ['admin','superadmin','qualitymanager','quality'].includes(String(user.role).replace(/\s/g,'').toLowerCase());
  async function download(id,certificateId) {
    setError('');
    try { const {data}=await axios.get(`${API}/${id}/certificate/${certificateId}`,{...getAuthConfig(),responseType:'blob'}); const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download='certificate.'+({'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[data.type]||'bin');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
    catch {setError('Certificate could not be downloaded. Please retry.');}
  }
  const open = (mode,row) => {setNotice('');setError('');setModal({mode,row});};
  return <DashboardLayout><div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-sm text-teal-700"><ShieldCheck size={17}/>Staff credentials</div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clinical staff & licences</h1><p className="mt-1 text-sm text-slate-600">Doctors, nurses and allied health professionals. One staff record, multiple licences.</p></div>{canManage && <button className={`${primary} flex items-center gap-2`} onClick={()=>open('add')}><Plus size={17}/>Add licence</button>}</header>
    <p className="text-xs text-slate-500">{canManage?'Manage registration, verification and renewals.':'Your licence records.'} Expiry alerts start 90 days before expiry. Clinical privileges are managed separately.</p>
    {notice && <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{notice}</p>}{(error||list.error) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error||list.error}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><Filters list={list}/><div className="overflow-x-auto" aria-busy={list.loading}><Table><thead><tr>{['S/N','Staff member','Profession','Licence','Validity','Verification','Actions'].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{list.items.map((row,i)=><tr key={row._id}>
      <td>{(list.page-1)*list.limit+i+1}</td><td><span className="font-semibold">{row.staff?.employeeName||'Unavailable staff'}</span><div className="text-xs text-slate-500">{row.staff?.employeeId} · {row.staff?.department||'N/A'}</div></td><td>{row.profession}<div className="text-xs text-slate-500">{row.specialty||'N/A'}</div></td><td><span className="font-medium">{row.licenseNumber}</span><div className="text-xs text-slate-500">{row.authority} · {row.category}</div></td><td><Badge value={row.status}/><div className="mt-1 whitespace-nowrap text-xs">{day(row.issuedDate)} – {day(row.expiryDate)}</div></td><td><Badge value={row.verification}/><div className="mt-1 text-xs">{row.reviewer?.employeeName}</div>{row.remarks&&<p className="mt-1 max-w-48 whitespace-pre-wrap text-xs">{row.remarks}</p>}</td>
      <td><div className="flex min-w-56 flex-wrap gap-1">{canManage && <><button className={button} onClick={()=>open('edit',row)}>Edit</button><button className={button} onClick={()=>open('renew',row)}>Renew</button><button className={button} onClick={()=>open('certificate',row)}>Attach</button>{row.verification==='Pending' && row.staff?._id!==user._id && <button className={button} onClick={()=>open('review',row)}>Review</button>}</>}{row.certificateId&&<button className={button} onClick={()=>download(row._id,row.certificateId)}>Certificate</button>}<button className={button} onClick={()=>open('history',row)}>History</button></div></td>
    </tr>)}{!list.items.length&&<tr><td colSpan={7} className="py-12 text-center text-slate-500">{list.loading?'Loading licences…':list.error?'Unable to load licences. Use Refresh to retry.':'No licences found. Adjust your filters or add a licence.'}</td></tr>}</tbody></Table></div><Pages list={list}/><p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">{list.loading?'Refreshing…':'Saved records refresh every 30 seconds while this page is visible.'}</p></section>
  </div>{modal&&<LicenseDialog {...modal} onClose={()=>setModal(null)} onSaved={()=>{list.refresh();setNotice('Licence saved.');}} download={download}/>}</DashboardLayout>;
}
