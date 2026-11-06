import { statusInfo } from '../utils/incidentPresentation';
import IncidentWorkspace from '../components/IncidentWorkspace';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, CheckCircle2, Clock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Select from '../components/Select';
import UserSelect from '../components/UserSelect';
import IncidentDateField from '../components/IncidentDateField';
import IncidentReportDetails from '../components/IncidentReportDetails';
import IncidentOpinions from '../components/IncidentOpinions';
import { useNotification } from '../components/NotificationContext';
import { getAuthConfig } from '../utils/authConfig';
import { incidentDownload } from '../utils/incidentDownload';
import '../components/incidentWorkflow.css';

const tabs = ['Report & acceptance', 'Investigation, risk & root cause', 'Actions & follow-up', 'Opinions, comments & evidence', 'Closure, approvals & history'];
const riskOptions = ['Low', 'Medium', 'High', 'Critical'];
const identity = value => value?._id || value;
const same = (a, b) => String(identity(a)) === String(identity(b));
const when = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';

export default function IncidentDetail() {
  const { id } = useParams();
  const [row, setRow] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [tab, setTab] = useState(0), [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false), [draftRevision, setDraftRevision] = useState(0);
  const { showNotification, confirm } = useNotification();
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = user._id || user.id;
  const reviewer = ['admin', 'superadmin', 'qualitymanager'].includes(user.role?.toLowerCase());
  useEffect(() => { if (error) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [error]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const switchTab = next => {
    if (next === tab) return;
    const change = () => { setDirty(false); setDraftRevision(v => v + 1); setTab(next); };
    if (dirty) confirm({ title: 'Discard unsaved entries?', message: 'Save your changes before switching sections, or discard these entries.', confirmLabel: 'Discard entries', cancelLabel: 'Keep editing', onConfirm: change });
    else change();
  };
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/incidents/' + id, { ...getAuthConfig(), signal: controller.signal }).then(({ data }) => { setRow(data); setError(''); }).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Unable to load incident.'); });
    return () => controller.abort();
  }, [id, revision]);
  const run = async (command, data = {}) => {
    if (busy) return false;
    setBusy(true); setError('');
    try { const result = await axios.post(`/api/incidents/${id}/workflow`, { ...data, command, version: row.__v }, getAuthConfig()); setRow(result.data); setDirty(false); showNotification('Incident updated.', 'success'); return true; }
    catch (e) { setError(e.response?.data?.message || 'Unable to save. Your entered details are still available.'); return false; }
    finally { setBusy(false); }
  };
  const approve = (command, title, message, data = {}) => confirm({ title, message, confirmLabel: title, cancelLabel: 'Cancel', onConfirm: () => run(command, data) });
  const download = async () => { setBusy(true); try { await incidentDownload(`/api/incidents/${id}/report.pdf`, `${row.incidentId}.pdf`); } catch (e) { showNotification(e.message, 'error'); } finally { setBusy(false); } };
  const upload = async files => {
    if (!files.length) return;
    setBusy(true); setError('');
    try { const body = new FormData(); body.append('version', row.__v); files.forEach(file => body.append('attachments', file)); const { data } = await axios.post(`/api/incidents/${id}/evidence`, body, getAuthConfig()); setRow(data); setDirty(false); showNotification('Evidence uploaded.', 'success'); return true; }
    catch (e) { setError(e.response?.data?.message || 'Unable to upload evidence.'); return false; }
    finally { setBusy(false); }
  };
  const nextSection = row ? ({ Pending: 0, 'Needs clarification': 3, Accepted: 1, Investigating: 1, 'Action in progress': 2, 'Closure review': 4, Resolved: 0, Reopened: 1, Closed: 4, Rejected: 4, Duplicate: 4 })[row.status] ?? 0 : 0;
  const locked = row && ['Closed', 'Rejected', 'Duplicate'].includes(row.status);
  const investigator = row && (reviewer || same(row.assignedTo, userId) || same(row.primaryResponsible, userId));
  const leaveIncident = next => {
    if (dirty) confirm({ title: 'Discard unsaved entries?', message: 'Save your changes before leaving, or discard these entries.', confirmLabel: 'Discard entries', cancelLabel: 'Keep editing', onConfirm: () => { setDirty(false); next(); } });
    else next();
  };
  return <DashboardLayout><IncidentWorkspace beforeNavigate={leaveIncident} busy={busy} sections={row ? tabs : undefined} activeSection={tab} onSectionChange={switchTab}><div className="iw-page">
    <Link className="ir-back" to="/dashboard/incidents"><ArrowLeft size={16}/>Incident register</Link>
    {error && <div role="alert" className="iw-error">{error} <button disabled={busy} onClick={() => confirm({ title: 'Reload incident?', message: 'Unsaved entries will be discarded when the latest incident is loaded.', confirmLabel: 'Reload', onConfirm: () => { setRow(null); setRevision(v => v + 1); } })}>Reload latest</button></div>}
    {!row ? <p className="iw-empty">{error ? 'Incident unavailable.' : 'Loading incident…'}</p> : <>
      <header className="iw-heading"><div><p className="iw-reference"><strong>Incident ID: {row.incidentId}</strong></p><p>Search this exact ID in the incident register.</p><h1>{row.title}</h1><p>{row.location} · {row.department || 'Department not recorded'} · Reported {when(row.createdAt)}</p></div><button className="iw-secondary" disabled={busy} onClick={download}><Download size={16}/>Download PDF</button></header>
      <div className="iw-summary"><span className={'iw-status-pill iw-tone-' + statusInfo(row.status).tone}>{statusInfo(row.status).label}</span><span>Risk: <strong>{row.riskLevel || 'Not assessed'}</strong></span><span>Investigator: <strong>{row.assignedTo?.employeeName || 'Unassigned'}</strong></span>{row.investigationDue && <span><Clock size={14}/>Due {when(row.investigationDue)}</span>}</div>
      <div className="iw-next"><div><strong>Next step</strong><p>{statusInfo(row.status).meaning} {statusInfo(row.status).next}</p></div>{nextSection !== tab && <button type="button" className="iw-secondary" disabled={busy} onClick={() => switchTab(nextSection)}>Open next step</button>}{(reviewer || same(row.assignedTo, userId)) && ['Accepted', 'Reopened', 'Resolved'].includes(row.status) && <button disabled={busy} className="iw-primary" onClick={() => run('start')}>Start investigation</button>}</div>
      <div className="iw-section-heading"><span>Incident section {tab + 1} of {tabs.length}</span><h2 id="incident-current-section">{tabs[tab]}</h2></div>
      <fieldset key={draftRevision} disabled={busy} className="iw-body" aria-busy={busy} onChange={() => setDirty(true)}>
        <div hidden={tab !== 0} role="region" aria-labelledby="incident-current-section">
          <IncidentReportDetails incident={row}/>
          {(reviewer || (same(row.primaryResponsible, userId) && ['Pending', 'Needs clarification', 'Reopened'].includes(row.status))) && !['Closed', 'Rejected', 'Duplicate', 'Closure review'].includes(row.status) && <Triage key={row.__v} row={row} run={run} approve={approve} reviewer={reviewer}/>}
        </div>
        <div hidden={tab !== 1} role="region" aria-labelledby="incident-current-section"><Investigation key={row.__v} row={row} editable={investigator && ['Investigating', 'Action in progress', 'Reopened'].includes(row.status)} run={run}/></div>
        <div hidden={tab !== 2} role="region" aria-labelledby="incident-current-section"><Actions key={row.__v} row={row} userId={userId} reviewer={reviewer} investigator={investigator} run={run} approve={approve}/></div>
        <div hidden={tab !== 3} role="region" aria-labelledby="incident-current-section"><IncidentOpinions row={row} userId={userId} reviewer={reviewer} run={run} locked={locked}/><Comments key={row.__v} row={row} locked={locked} run={run} upload={upload}/></div>
        <div hidden={tab !== 4} role="region" aria-labelledby="incident-current-section"><Closure key={row.__v} row={row} reviewer={reviewer} investigator={investigator} userId={userId} approve={approve}/><section className="iw-card iw-padded"><h2>Activity & approvals</h2><p>All times shown in UAE time. Earlier records may have limited history.</p><ol className="iw-history">{[...row.history].reverse().map(h => <li key={h._id}><strong>{eventName(h.event)}</strong><small>{h.actorName} · {when(h.at)}</small><p>{h.detail}</p></li>)}</ol></section></div>
      </fieldset>
    </>}
  </div></IncidentWorkspace></DashboardLayout>;
}
function Read({ label, value }) { return <div className="iw-read"><span>{label}</span><p>{value || 'Not recorded'}</p></div>; }
function Area({ label, value, onChange, required = false, rows = 3 }) { return <label>{label}{required ? ' *' : ''}<textarea required={required} maxLength={5000} rows={rows} value={value || ''} onChange={e => onChange(e.target.value)}/></label>; }
function Choices({ label, value, onChange, options, required = false }) { return <label>{label}{required ? ' *' : ''}<Select required={required} aria-label={label} value={value || ''} onChange={e => onChange(e.target.value)}><option value="">Select</option>{options.map(o => <option key={o}>{o}</option>)}</Select></label>; }
function Triage({ row, run, approve, reviewer }) {
  const accepting = ['Pending', 'Needs clarification', 'Reopened'].includes(row.status);
  const [data, setData] = useState({ assignedTo: identity(row.assignedTo) || '', primaryResponsible: identity(row.primaryResponsible) || '', secondaryResponsible: identity(row.secondaryResponsible) || '', investigationDue: row.investigationDue?.slice(0, 10) || '', riskLevel: row.riskLevel || '' });
  const [decision, setDecision] = useState('clarify'), [reason, setReason] = useState('');
  return <section className="iw-card iw-padded"><h2>{accepting ? 'Accept & assign' : 'Assignment & deadline'}</h2><p>Choose an investigator and deadline. Assess risk using your approved organizational criteria.</p><form onSubmit={e => { e.preventDefault(); run(accepting ? 'accept' : 'assign', data); }}><div className="iw-grid"><label>Quality investigator *<UserSelect required disabled={!reviewer} value={data.assignedTo} selectedLabel={row.assignedTo?.employeeName} onChange={e => setData({ ...data, assignedTo: e.target.value })}/></label>{reviewer && <label>Accountable department manager<UserSelect value={data.primaryResponsible} selectedLabel={row.primaryResponsible?.employeeName} onChange={e => setData({ ...data, primaryResponsible: e.target.value })}/></label>}{reviewer && <label>Secondary branch responsible<UserSelect value={data.secondaryResponsible} selectedLabel={row.secondaryResponsible?.employeeName} onChange={e => setData({ ...data, secondaryResponsible: e.target.value })}/></label>}<IncidentDateField label="Investigation deadline" required value={data.investigationDue} onChange={value => setData({ ...data, investigationDue: value })}/><Choices label="Initial risk level" required options={riskOptions} value={data.riskLevel} onChange={value => setData({ ...data, riskLevel: value })}/></div><button className="iw-primary" type="submit">{accepting ? 'Accept & assign' : 'Save assignment'}</button></form>
    {reviewer && accepting && <button type="button" className="iw-secondary" onClick={() => approve('route', 'Apply automatic routing', 'Replace the current primary and secondary assignments using the saved routing rules.')}>Apply automatic routing</button>}{reviewer && accepting && <details><summary>Need clarification or a different decision?</summary><form onSubmit={e => { e.preventDefault(); approve(decision, decision === 'clarify' ? 'Request clarification' : decision === 'duplicate' ? 'Mark duplicate' : 'Reject report', reason, { reason }); }}><label>Decision<Select value={decision} onChange={e => setDecision(e.target.value)}><option value="clarify">Request clarification</option><option value="duplicate">Mark duplicate</option><option value="reject">Reject report</option></Select></label><Area required label={decision === 'duplicate' ? 'Reason and original incident reference' : 'Reason / information needed'} value={reason} onChange={setReason}/><button className="iw-secondary">Confirm decision</button></form></details>}
  </section>;
}
function Investigation({ row, editable, run }) {
  const keys = { findings: 'Verified findings', rootCause: 'Root cause — why did it happen?', contributingFactors: 'Contributing factors', operationalImpact: 'Impact on services and workflow', temporaryControls: 'Temporary controls', potentialConsequence: 'Potential consequence', actionsTaken: 'Actions already taken' };
  const [data, setData] = useState(Object.fromEntries([...Object.keys(keys), 'riskLevel', 'likelihood'].map(k => [k, row[k] || ''])));
  const change = (key, value) => setData(previous => ({ ...previous, [key]: value }));
  return <section className="iw-card iw-padded"><h2>Investigation & risk assessment</h2><p>Record the root cause, risk level, impact on operations and temporary controls. Plan permanent preventive actions in Actions & follow-up.</p>{!editable && <p className="iw-note">This section is read-only until the incident is accepted and investigation is started. Only its assigned investigator or a reviewer can edit it.</p>}{!editable ? <><div className="iw-grid">{Object.entries(keys).map(([key, label]) => <Read key={key} label={label} value={row[key]}/>)}</div><Read label="Likelihood" value={row.likelihood}/><Read label="Risk level" value={row.riskLevel}/></> : <form onSubmit={e => { e.preventDefault(); run('investigate', data); }}><div className="iw-grid">{Object.entries(keys).map(([key, label]) => <Area key={key} label={label} value={data[key]} onChange={value => change(key, value)}/>)}<Choices label="Likelihood" value={data.likelihood} options={['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain']} onChange={value => change('likelihood', value)}/><Choices required label="Assessed risk level" value={data.riskLevel} options={riskOptions} onChange={value => change('riskLevel', value)}/></div><p className="iw-note">Use your approved risk matrix. QCare records your assessment; it does not infer a clinical risk score.</p><button className="iw-primary">Save investigation</button></form>}</section>;
}
function Actions({ row, userId, reviewer, investigator, run, approve }) {
  const [data, setData] = useState({ title: '', kind: 'Corrective', owner: '', dueDate: '', successCriteria: '' });
  const change = (key, value) => setData(previous => ({ ...previous, [key]: value }));
  const completed = row.actions.filter(a => a.completedAt).length;
  return <><section className="iw-card iw-padded"><h2>Actions & follow-up</h2><p>{completed} of {row.actions.length} actions completed. Each action has one owner, a deadline and a measurable outcome.</p>{!row.actions.length && <p className="iw-empty">No actions planned yet.</p>}{row.actions.map((action, i) => <Action key={action._id} action={action} index={i} onEdit={investigator && !action.completedAt && ['Investigating', 'Action in progress', 'Reopened'].includes(row.status) ? () => { setData({ actionId: action._id, title: action.title, kind: action.kind, owner: identity(action.owner), dueDate: action.dueDate.slice(0, 10), successCriteria: action.successCriteria }); document.getElementById('incident-action-editor')?.scrollIntoView({ behavior: 'smooth' }); } : null} canComplete={row.status === 'Action in progress' && (reviewer || same(action.owner, userId))} run={run}/>)}
    {reviewer && ['Investigating', 'Reopened'].includes(row.status) && <button className="iw-primary" onClick={() => approve('approvePlan', 'Approve action plan', 'Confirm the findings, root cause, action owners and success criteria have been reviewed.')}>Approve action plan</button>}
    </section>{investigator && ['Investigating', 'Action in progress', 'Reopened'].includes(row.status) && <section className="iw-card iw-padded"><h2 id="incident-action-editor">{data.actionId ? 'Edit action' : 'Add an action'}</h2><form onSubmit={e => { e.preventDefault(); run(data.actionId ? 'editAction' : 'addAction', data); }}><label>Action *<input required maxLength={500} value={data.title} onChange={e => change('title', e.target.value)} placeholder="What will be done to address the cause?"/></label><div className="iw-grid"><Choices required label="Action type" value={data.kind} options={['Correction', 'Corrective', 'Preventive']} onChange={v => change('kind', v)}/><label>Owner *<UserSelect required value={data.owner} onChange={e => change('owner', e.target.value)}/></label><IncidentDateField required label="Action deadline" value={data.dueDate} onChange={v => change('dueDate', v)}/><Area required label="Success criteria / how effectiveness will be checked" value={data.successCriteria} onChange={v => change('successCriteria', v)}/></div><button className="iw-primary">{data.actionId ? 'Save action' : 'Add action'}</button>{row.status === 'Action in progress' && <p className="iw-note">Adding an action returns the plan for reviewer approval.</p>}</form></section>}</>;
}
function Action({ action, index, canComplete, run, onEdit }) {
  const [completion, setCompletion] = useState('');
  return <article className="iw-action"><div className="iw-heading"><h3>{index + 1}. {action.title}</h3><span className="iw-badge">{action.completedAt ? <><CheckCircle2 size={14}/>Completed</> : 'Open'}</span></div><p>{action.kind} · {action.owner?.employeeName || 'Unassigned'} · Due {when(action.dueDate)}</p><Read label="Success criteria" value={action.successCriteria}/>{onEdit && <button type="button" className="iw-secondary" onClick={onEdit}>Edit action</button>}{action.completedAt ? <Read label={'Completed ' + when(action.completedAt)} value={action.completion}/> : canComplete && <details><summary>Record completion</summary><form onSubmit={e => { e.preventDefault(); run('completeAction', { actionId: action._id, completion }); }}><Area required label="What was done and what evidence supports completion?" value={completion} onChange={setCompletion}/><p className="iw-note">Add supporting files in Comments & evidence and reference their names here.</p><button className="iw-primary">Mark completed</button></form></details>}</article>;
}
function Comments({ row, locked, run, upload }) {
  const [body, setBody] = useState(''), [kind, setKind] = useState('Comment'), [files, setFiles] = useState([]);
  return <><section className="iw-card iw-padded"><h2>Comments, opinions & statements</h2><p>Keep follow-up questions, responses and opinions together. Comments are visible to authorized incident participants.</p>{row.comments.map(c => <article className="iw-comment" key={c._id}><strong>{c.authorName}</strong><small>{c.kind} · {when(c.at)}</small><p>{c.body}</p></article>)}{!locked && <form onSubmit={e => { e.preventDefault(); run('comment', { body, kind }); }}><Choices label="Entry type" required value={kind} onChange={setKind} options={['Comment', 'Witness statement', 'Clarification']}/><Area required label="Message" value={body} onChange={setBody}/><button className="iw-primary">Add comment</button></form>}</section><section className="iw-card iw-padded"><h2>Supporting evidence</h2><IncidentReportDetails incident={row} attachmentsOnly/>{!locked && <form onSubmit={async e => { e.preventDefault(); await upload(files); }}><label>Choose files<input required type="file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.mp4,.mov,.webm,.mp3,.wav,.txt,.csv,.docx,.xlsx,.pptx" onChange={e => setFiles(Array.from(e.target.files))}/></label><p className="iw-note">Up to 5 files per upload; 20 attachments and 12 MB total per incident. Images, video, audio, PDFs and office documents.</p><button className="iw-primary">Upload evidence</button></form>}</section></>;
}
function Closure({ row, reviewer, investigator, userId, approve }) {
  const [summary, setSummary] = useState(row.closureSummary || ''), [reason, setReason] = useState('');
  const [review, setReview] = useState({ effectiveness: 'Effective', effectivenessEvidence: '', residualRisk: '', effectivenessDate: '' });
  const independent = !same(row.primaryResponsible, userId) && !same(row.secondaryResponsible, userId) && !same(row.assignedTo, userId) && !same(row.reportedBy, userId) && !row.actions.some(a => same(a.owner, userId) || same(a.completedBy, userId));
  return <section className="iw-card iw-padded"><h2>Effectiveness & closure</h2><p>Verify that actions worked before closing. If the controls are ineffective, return the incident for further investigation.</p>
    <Read label="Closure summary" value={row.closureSummary}/><Read label="Effectiveness result" value={row.effectiveness}/><Read label="Effectiveness evidence" value={row.effectivenessEvidence}/><Read label="Residual risk" value={row.residualRisk}/>{row.closedAt && <Read label="Approved closure" value={`${row.closedBy?.employeeName || 'Reviewer'} · ${when(row.closedAt)}`}/>}
    {investigator && (!row.primaryResponsible || reviewer || same(row.primaryResponsible, userId)) && ['Action in progress', 'Resolved'].includes(row.status) && <form onSubmit={e => { e.preventDefault(); approve('requestClosure', 'Request closure review', 'Send this incident to an independent reviewer after all actions are complete.', { closureSummary: summary }); }}><Area required label="Summarize the outcome and prevention measures" value={summary} onChange={setSummary}/><button className="iw-primary">Request closure review</button></form>}
    {reviewer && row.status === 'Closure review' && <><form onSubmit={e => { e.preventDefault(); if (review.effectiveness === 'Effective') approve('close', 'Approve closure', 'Confirm that effectiveness evidence and remaining risk have been reviewed.', review); else approve('return', 'Return for further work', reason, { effectiveness: review.effectiveness, reason }); }}><Choices required label="Review result" value={review.effectiveness} onChange={effectiveness => setReview({ ...review, effectiveness })} options={['Effective', 'Partially effective', 'Ineffective']}/>{review.effectiveness === 'Effective' ? <><Area required label="Evidence that controls are effective" value={review.effectivenessEvidence} onChange={effectivenessEvidence => setReview({ ...review, effectivenessEvidence })}/><div className="iw-grid"><IncidentDateField required pastOnly label="Effectiveness review date" value={review.effectivenessDate} onChange={effectivenessDate => setReview({ ...review, effectivenessDate })}/><Choices required label="Remaining risk" value={review.residualRisk} onChange={residualRisk => setReview({ ...review, residualRisk })} options={riskOptions}/></div>{!independent && <p className="iw-note">A reviewer who is not the reporter, investigator or action owner must approve closure.</p>}</> : <Area required label="Reason and further work required" value={reason} onChange={setReason}/>}<button className="iw-primary" disabled={review.effectiveness === 'Effective' && !independent}>{review.effectiveness === 'Effective' ? 'Approve closure' : 'Return for further work'}</button></form></>}
    {reviewer && ['Closed', 'Rejected', 'Duplicate'].includes(row.status) && <details><summary>Reopen incident</summary><form onSubmit={e => { e.preventDefault(); approve('reopen', 'Reopen incident', reason, { reason }); }}><Area required label="Reason for reopening" value={reason} onChange={setReason}/><button className="iw-secondary">Reopen incident</button></form></details>}
  </section>;
}
function eventName(event) { return ({ reported: 'Reported', accept: 'Accepted and assigned', assign: 'Assignment updated', clarify: 'Clarification requested', reject: 'Rejected', duplicate: 'Marked duplicate', start: 'Investigation started', investigate: 'Investigation updated', addAction: 'Action added', editAction: 'Action updated', approvePlan: 'Action plan approved', completeAction: 'Action completed', requestClosure: 'Closure requested', close: 'Closure approved', return: 'Returned for further work', reopen: 'Reopened', comment: 'Comment added', evidence: 'Evidence uploaded', pdf: 'PDF downloaded' })[event] || event; }
