import { createElement, useEffect, useState } from 'react';
import axios from 'axios';
import '../dashboard.css';
import { Activity, Bell, CalendarDays, ChartNoAxesCombined, ClipboardCheck, GraduationCap, RefreshCw, ShieldAlert, Target, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import OrganizationSnapshot from '../components/dashboard/OrganizationSnapshot';
import ModuleOverview from '../components/dashboard/ModuleOverview';
import { useNotification } from '../components/NotificationContext';
import { getAuthConfig } from '../utils/authConfig';

const sources = [['overview', '/api/dashboard/overview'], ['kpi', '/api/kpi/dashboard'], ['audit', '/api/audit/dashboard'], ['risk', '/api/risks/dashboard'], ['training', '/api/training/dashboard']];
const total = rows => rows.reduce((sum, row) => sum + row.count, 0);
const display = value => value == null ? '—' : value.toLocaleString();

function DashboardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="qd-date"><CalendarDays size={16} /><time dateTime={now.toISOString()}>{now.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time></span>;
}

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { feedNotifications } = useNotification();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [updated, setUpdated] = useState(null);
  const [trendView, setTrendView] = useState('all');
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled(sources.map(([, url]) => axios.get(url, { ...getAuthConfig(), signal: controller.signal, timeout: 15000 }))).then(results => {
      if (controller.signal.aborted) return;
      setData(Object.fromEntries(results.map((result, index) => [sources[index][0], result.status === 'fulfilled' ? result.value.data : null])));
      setUpdated(new Date());
      setLoading(false);
    });
    return () => controller.abort();
  }, [revision]);
  const { overview, kpi, audit, risk, training } = data;
  const canManage = ['admin', 'superadmin'].includes(user.role?.toLowerCase());
  const cards = [
    { label: 'Approved indicators', value: kpi?.stats?.total, detail: 'Across all reporting periods', Icon: Target },
    { label: 'Clinical audits', value: audit ? total(audit.counts) : null, detail: 'All recorded audit statuses', Icon: ClipboardCheck },
    { label: 'Registered risks', value: risk ? total(risk.levels) : null, detail: 'Across all risk levels', Icon: ShieldAlert },
    { label: 'Training compliance', value: training ? `${training.complianceRate}%` : null, detail: training ? `${training.compliantCount} of ${training.totalStaff} staff compliant` : 'Staff competency coverage', Icon: GraduationCap },
  ];
  const attention = [
    { label: 'Breached indicators', value: kpi?.stats?.breached },
    { label: 'Overdue audits', value: audit?.overdue?.length },
    { label: 'Overdue risks', value: risk?.overdue },
    { label: 'Staff with overdue training', value: training?.totalOverdue },
    { label: 'Training records expiring in 30 days', value: training?.expiringSoon },
  ];
  const indicatorStatuses = kpi ? [ ['On track', kpi.stats.onTrack, 'teal'], ['At risk', kpi.stats.atRisk, 'amber'], ['Breached', kpi.stats.breached, 'rose'] ] : [];
  const riskLevels = risk?.levels?.map(row => ({ name: row._id || 'Unclassified', count: row.count })) || [];
  const unavailable = sources.filter(([key]) => data[key] === null || (key === 'overview' && overview?.unavailable?.length > 0)).length;
  const palette = ['#0f9b8e', '#8b7be8', '#eeac56', '#ed7b8b', '#64748b'];
  const trend = (kpi?.trend || []).map(row => ({
    name: `${row._id.period} ${row._id.year}`,
    achievement: row.avgTarget ? Number((row.avgValue / row.avgTarget * 100).toFixed(1)) : null,
  }));
  const visibleTrend = trendView === 'recent' ? trend.slice(-2) : trend;
  const auditStatuses = audit?.counts?.map(row => ({ name: String(row._id || 'Unclassified').replaceAll('-', ' '), count: row.count })) || [];
  const statusData = indicatorStatuses.filter(([, count]) => count > 0).map(([name, value], index) => ({ name, value, color: ['#0f9b8e', '#eeac56', '#ed7b8b'][index] }));
  const onTrack = kpi?.stats?.total ? Math.round(kpi.stats.onTrack / kpi.stats.total * 100) : null;
  const ready = !loading;
  const empty = (available, label) => <div className="qd-empty"><ChartNoAxesCombined size={30} /><strong>{loading ? 'Updating your overview' : available ? `No ${label} yet` : 'Data unavailable'}</strong><span>{loading ? 'Your latest data is on its way.' : available ? 'Statistics will appear as records are added.' : 'Try refreshing to reconnect this data source.'}</span></div>;
  return <DashboardLayout><div className="qd-dashboard" aria-busy={loading}>
    <header className="qd-heading"><div><p className="qd-eyebrow">QCARE / ANALYTICS</p><h1>Organization overview<span>.</span></h1><p>A connected view of quality, safety and organizational readiness.</p></div><div className="qd-heading-actions"><DashboardClock /><button className="qd-refresh" type="button" disabled={loading} onClick={() => { setLoading(true); setRevision(value => value + 1); }}><RefreshCw size={16} className={loading ? 'qc-analytics-spinning' : ''} />{loading ? 'Updating' : 'Refresh'}</button></div></header>
    <OrganizationSnapshot overview={overview} loading={loading} canManage={canManage} />
    <section className="qd-hero"><div className="qd-hero-copy"><span className="qd-hero-tag"><span />YOUR ORGANIZATION, AT A GLANCE</span><h2>Quality & safety<br />at a glance.</h2><p>Welcome back, {user.employeeName?.split(' ')[0] || 'colleague'}. Here is how your organization is performing across quality, safety and staff readiness.</p><div className="qd-hero-meta" role="status"><Activity size={15} />{loading ? 'Gathering the latest statistics' : unavailable ? `${sources.length - unavailable} of ${sources.length} analytics sources connected` : 'All analytics sources connected'}{!loading && updated && <span>Checked {updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}</div></div><div className="qd-hero-score"><span className="qd-hero-orbit" aria-hidden="true" /><div className="qd-score-ring" style={{ '--score': `${ready && onTrack != null ? onTrack * 3.6 : 0}deg` }}><div><strong>{ready && onTrack != null ? `${onTrack}%` : '—'}</strong><span>on track</span></div></div><p>Approved indicator health</p><small>{ready && kpi ? `${kpi.stats.onTrack} of ${kpi.stats.total} records on track` : loading ? 'Loading indicator data' : 'Indicator data unavailable'}</small></div></section>
    <section className="qd-metrics" aria-label="Key statistics">{cards.map(({ label, value, detail, Icon }, index) => <article className={`qd-metric qd-tone-${index}`} key={label}><div className="qd-metric-top"><span className="qd-metric-icon">{createElement(Icon, { size: 21 })}</span><span className="qd-metric-scope">{index === 3 ? 'Staff readiness' : 'All records'}</span></div><h2>{label}</h2><strong>{loading ? '…' : display(value)}</strong><p>{ready && value == null ? 'Data unavailable' : detail}</p></article>)}</section>
    <div className="qd-chart-row">
      <section className="qd-panel qd-trend"><div className="qd-panel-heading"><div><p className="qd-eyebrow">PERFORMANCE OVER TIME</p><h2>Target achievement</h2></div><select aria-label="Reporting periods shown" value={trendView} onChange={event => setTrendView(event.target.value)}><option value="all">Last 4 periods</option><option value="recent">Last 2 periods</option></select></div><p className="qd-caption">Average indicator value as a percentage of average target.</p>{ready && visibleTrend.some(row => row.achievement != null) ? <><div className="qd-trend-summary"><strong>{Number(kpi.stats.avgAchievement).toFixed(1)}<span>%</span></strong><span><TrendingUp size={17} />Overall average achievement</span></div><div className="qd-chart qd-chart-wide"><ResponsiveContainer width="100%" height="100%"><AreaChart data={visibleTrend} margin={{ top: 15, left: -15, right: 16, bottom: 5 }}><defs><linearGradient id="qd-achievement-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f9b8e" stopOpacity={.25} /><stop offset="100%" stopColor="#0f9b8e" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e9edf3" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickMargin={12} /><YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} /><Tooltip formatter={value => [`${value}%`, 'Target achievement']} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} /><Area type="monotone" dataKey="achievement" stroke="#0f9b8e" strokeWidth={3} fill="url(#qd-achievement-fill)" dot={{ r: 4, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 6 }} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div><p className="qd-chart-foot">{visibleTrend.map(row => `${row.name}: ${row.achievement == null ? 'No target' : `${row.achievement}%`}`).join(' · ')}</p></> : empty(kpi, 'reporting periods')}</section>
      <section className="qd-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">QUALITY SNAPSHOT</p><h2>Indicator status</h2></div><Target size={20} /></div><p className="qd-caption">Distribution of approved records</p>{ready && statusData.length ? <><div className="qd-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="88%" paddingAngle={5} cornerRadius={5} stroke="none" isAnimationActive={false}>{statusData.map(row => <Cell key={row.name} fill={row.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="qd-donut-center"><strong>{kpi.stats.total}</strong><span>approved records</span></div></div><div className="qd-legend">{indicatorStatuses.map(([name, value], index) => <div key={name}><span style={{ background: ['#0f9b8e', '#eeac56', '#ed7b8b'][index] }} /><span>{name}</span><strong>{value}</strong></div>)}</div></> : empty(kpi, 'approved indicators')}</section>
    </div>
    <div className="qd-chart-row qd-equal">
      <section className="qd-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">SAFETY INTELLIGENCE</p><h2>Risk landscape</h2></div><ShieldAlert size={20} /></div><p className="qd-caption">Registered risks by assessed severity</p>{ready && riskLevels.length ? <><div className="qd-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={riskLevels} margin={{ top: 20, left: -25, right: 10, bottom: 0 }}><CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e9edf3" /><XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f5f7fb' }} /><Bar dataKey="count" name="Risks" radius={[7, 7, 0, 0]} maxBarSize={46} isAnimationActive={false}>{riskLevels.map((row, index) => <Cell key={row.name} fill={({ low: '#0f9b8e', moderate: '#8b7be8', medium: '#8b7be8', high: '#eeac56', critical: '#ed7b8b' })[row.name.toLowerCase()] || palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer></div><p className="qd-chart-foot">{riskLevels.map(row => `${row.name}: ${row.count}`).join(' · ')}</p></> : empty(risk, 'registered risks')}</section>
      <section className="qd-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">ASSURANCE MONITOR</p><h2>Audit progress</h2></div><ClipboardCheck size={20} /></div><p className="qd-caption">Clinical audit records by workflow status</p>{ready && auditStatuses.length ? <><div className="qd-chart"><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={auditStatuses} margin={{ top: 15, left: 0, right: 20, bottom: 5 }}><CartesianGrid strokeDasharray="4 5" horizontal={false} stroke="#e9edf3" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f5f7fb' }} /><Bar dataKey="count" name="Audits" radius={[0, 6, 6, 0]} maxBarSize={28} isAnimationActive={false}>{auditStatuses.map((row, index) => <Cell key={row.name} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer></div><p className="qd-chart-foot">{auditStatuses.map(row => `${row.name}: ${row.count}`).join(' · ')}</p></> : empty(audit, 'clinical audits')}</section>
    </div>
    <ModuleOverview overview={overview} loading={loading} role={user.role} />
    <div className="qd-chart-row">
      <section className="qd-panel qd-table-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">FOLLOW-UP SUMMARY</p><h2>Items needing attention</h2></div><span className="qd-soft-badge">5 measures</span></div><p className="qd-caption">Outstanding work and upcoming deadlines</p><div className="qd-table-scroll"><table className="qd-table"><caption className="qd-sr-only">Current outstanding counts across quality, safety and training</caption><thead><tr><th scope="col">Measure</th><th scope="col">Count</th><th scope="col">Status</th></tr></thead><tbody>{attention.map(item => <tr key={item.label}><th scope="row">{item.label}</th><td>{loading ? '…' : display(item.value)}</td><td><span className={`qd-status ${!ready || item.value == null ? 'neutral' : item.value > 0 ? 'attention' : 'clear'}`}>{loading ? 'Loading' : item.value == null ? 'Unavailable' : item.value > 0 ? 'Needs review' : 'Clear'}</span></td></tr>)}</tbody></table></div></section>
      <section className="qd-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">ACTIVITY FEED</p><h2>Latest updates</h2></div><span className="qd-notification-count"><Bell size={15} />{feedNotifications.filter(item => !item.isRead).length}</span></div><p className="qd-caption">Your latest notifications across QCare</p>{feedNotifications.length ? <ul className="qd-feed">{feedNotifications.slice(0, 4).map((item, index) => <li key={item._id || index}><span className={`qd-feed-dot ${item.isRead ? 'read' : ''}`} /><div><p>{item.message || item.title || 'New quality update'}</p>{item.createdAt && <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</time>}</div></li>)}</ul> : <div className="qd-empty"><Bell size={30} /><strong>You're all caught up</strong><span>New notifications will appear here.</span></div>}</section>
    </div>
    <p className="qd-footer">QCare analytics <span>Organization totals · All recorded modules · Approved quality analytics</span></p>
  </div></DashboardLayout>;
}
