import { createElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Inbox, SearchCheck, ListChecks, UserRoundCheck, Clock3, ShieldCheck, FileChartColumn } from 'lucide-react';
import './incidentWorkflow.css';

const links = [
  ['', 'All incidents', ClipboardList],
  ['acceptance', 'Acceptance & triage', Inbox],
  ['investigations', 'Investigations & risk', SearchCheck],
  ['actions', 'Actions & follow-up', ListChecks],
  ['mine', 'Assigned to me', UserRoundCheck],
  ['overdue', 'Overdue work', Clock3],
  ['approvals', 'Closure approvals', ShieldCheck],
  ['reports', 'Reports & downloads', FileChartColumn],
];

export default function IncidentWorkspace({ children, beforeNavigate, busy = false, sections, activeSection, onSectionChange }) {
  const location = useLocation(), navigate = useNavigate();
  const view = new URLSearchParams(location.search).get('view') || '';
  const isRegister = location.pathname === '/dashboard/incidents';
  const isNew = location.pathname.endsWith('/new');
  const canRoute = ['admin', 'superadmin', 'qualitymanager'].includes(JSON.parse(localStorage.getItem('userInfo') || '{}').role?.toLowerCase());
  const follow = (event, target) => {
    if (busy) { event.preventDefault(); return; }
    if (beforeNavigate && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); beforeNavigate(() => navigate(target));
    }
  };
  return <div className="iw-workspace">
    <aside className="iw-sidebar">
      <div className="iw-sidebar-title"><ShieldCheck size={20}/><div>Incident management<small>Report · investigate · improve</small></div></div>
      <Link className="iw-new-report" aria-current={isNew ? 'page' : undefined} to="/dashboard/incidents/new" onClick={event => follow(event, '/dashboard/incidents/new')}><Plus size={17}/>Report incident</Link>
      <nav aria-label="Incident management menu">{links.map(([key, label, Icon]) => {
        const target = '/dashboard/incidents' + (key ? '?view=' + key : '');
        return <Link key={key} to={target} aria-current={isRegister && view === key ? 'page' : undefined} onClick={event => follow(event, target)}>{createElement(Icon, { size: 17, strokeWidth: 2 })}<span>{label}</span></Link>;
      })}{canRoute && <Link to="/dashboard/incidents/settings" aria-current={location.pathname.endsWith('/settings') ? 'page' : undefined} onClick={event => follow(event, '/dashboard/incidents/settings')}><UserRoundCheck size={17}/><span>Incident settings</span></Link>}</nav>
      {sections && <nav className="iw-record-menu" aria-label="Sections in this incident"><p>This incident</p>{sections.map((label, index) => <button type="button" key={label} disabled={busy} aria-current={activeSection === index ? 'step' : undefined} onClick={() => onSectionChange(index)}><span className="iw-menu-number">{index + 1}</span>{label}</button>)}</nav>}
      <p className="iw-sidebar-help">Open an incident to review its details and next action. Available actions depend on your role.</p>
    </aside>
    <main className="iw-workspace-main">{children}</main>
  </div>;
}
