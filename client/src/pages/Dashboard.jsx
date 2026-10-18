import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BarChart3, FileCheck2, ShieldAlert, Bell, CheckCheck } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TaskLauncher from '../components/TaskLauncher';
import { useNotification } from '../components/NotificationContext';
import { workspacePath } from '../utils/workspaces';

const actions = [
  { title: 'Report an incident', detail: 'Capture what happened. Start the follow-up.', path: 'incidents?action=new', icon: ShieldAlert, tone: 'rose' },
  { title: 'Submit indicator data', detail: 'Enter counts and review the calculated result.', path: 'kpi', icon: BarChart3, tone: 'teal' },
  { title: 'Find or add evidence', detail: 'Keep supporting documents in one library.', path: 'documents', icon: FileCheck2, tone: 'violet' },
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { feedNotifications } = useNotification();
  const unread = feedNotifications.filter(item => !item.isRead);
  return <DashboardLayout><div className="qc-workspace">
    <section className="qc-welcome qc-action-welcome"><div><div className="qc-eyebrow">WELCOME, {user.employeeName?.split(' ')[0] || 'COLLEAGUE'}</div><h1>Less searching.<br />More improving.</h1><p>Start with what you need to do. Your quality tools are one search away.</p></div><TaskLauncher /></section>
    <section aria-labelledby="quick-actions"><div className="qc-section-heading"><h2 id="quick-actions">What would you like to do?</h2><span>Start with a task</span></div><div className="qc-action-grid">{actions.map((action) => { const { title, detail, path, icon: Icon, tone } = action; return <Link className={`qc-action-card ${tone}`} to={workspacePath(path)} key={path}><span className="qc-action-icon"><Icon size={23} /></span><ArrowUpRight className="qc-card-arrow" size={19} /><h3>{title}</h3><p>{detail}</p><span className="qc-card-link">Get started <ArrowRight size={16} /></span></Link>; })}</div></section>
    <div className="qc-workspace-columns"><section className="qc-panel"><div className="qc-section-heading"><div><div className="qc-eyebrow">KEEP WORK MOVING</div><h2>Needs your attention</h2></div><Link to="/notifications">View updates <ArrowUpRight size={15} /></Link></div>
      {unread.length ? <div className="qc-attention-list">{unread.slice(0, 5).map(item => <Link to="/notifications" key={item._id}><Bell size={18} /><span>{item.message || item.title || 'New quality update'}<small>Open notification to review details</small></span><ArrowRight size={16} /></Link>)}</div> : <div className="qc-empty"><CheckCheck size={30} /><h3>No unread updates</h3><p>New notifications will appear here. Open a workspace below to review its records and assignments.</p></div>}
    </section><section className="qc-focus-panel"><div className="qc-eyebrow">CLOSE THE LOOP</div><h2>From finding<br />to improvement.</h2><p>Review findings, assign corrective actions and keep the supporting evidence close.</p><Link to="/dashboard/capa">Open corrective actions <ArrowRight size={17} /></Link><Link to="/dashboard/audit">Review clinical audits <ArrowRight size={17} /></Link></section></div>
  </div></DashboardLayout>;
}
