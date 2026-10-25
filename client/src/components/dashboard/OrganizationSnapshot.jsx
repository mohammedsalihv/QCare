import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Stethoscope, MapPin, BadgeCheck, Files, ChartNoAxesCombined } from 'lucide-react';
import { BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const palette = ['#0f9b8e', '#eeac56', '#ed7b8b'];
const number = value => value == null ? '—' : value.toLocaleString();
const metrics = [
  ['users', 'Users', Users, '/dashboard/users', 'User accounts'],
  ['departments', 'Departments', Building2, '/dashboard/departments', 'Organization departments'],
  ['specialties', 'Specialties', Stethoscope, '/dashboard/speciality-master', 'Registered specialties'],
  ['locations', 'Locations', MapPin, '/dashboard/location-types', 'Recorded locations'],
  ['designations', 'Designations', BadgeCheck, '/dashboard/designation-master', 'Defined designations'],
  ['documents', 'Documents', Files, '/dashboard/documents', 'All document statuses'],
];
function EmptyChart({ loading, available }) {
  return <div className="qd-empty"><ChartNoAxesCombined size={28} /><strong>{loading ? 'Loading organization data' : available ? 'No records yet' : 'Data unavailable'}</strong><span>{loading ? 'Fetching the latest totals.' : available ? 'Charts will appear when records are added.' : 'Refresh to reconnect this data source.'}</span></div>;
}
export default function OrganizationSnapshot({ overview, loading, canManage }) {
  const users = overview?.users;
  const allDepartments = users?.byDepartment || [];
  const departmentData = allDepartments.slice(0, 8);
  if (allDepartments.length > 8) departmentData.push({ name: 'Other departments', count: allDepartments.slice(8).reduce((sum, row) => sum + row.count, 0) });
  const userStatuses = (users?.statuses || []).map((row, index) => ({ ...row, color: palette[index] }));
  const statusData = userStatuses.filter(row => row.count > 0);
  return <section className="qd-organization" aria-label="Organization statistics">
    <div className="qd-section-heading"><div><p className="qd-eyebrow">PEOPLE & ORGANIZATION</p><h2>Organization at a glance</h2></div><span>Current totals · All records</span></div>
    {!loading && (!overview || overview.unavailable?.length > 0) && <p className="qd-data-notice" role="status">Some organization or module totals are unavailable. Refresh to try again; unavailable values are shown as —.</p>}
    <div className="qd-metrics qd-organization-metrics">{metrics.map(([key, label, Icon, path, detail], index) => {
      const value = overview?.counts?.[key];
      return <article className={'qd-metric qd-tone-' + index % 4} key={key} data-metric={key}><div className="qd-metric-top"><span className="qd-metric-icon">{createElement(Icon, { size: 21 })}</span>{(canManage || key === 'documents') && <Link to={path} className="qd-metric-link" aria-label={'View ' + label.toLowerCase()}>View →</Link>}</div><h2>{label}</h2><strong>{loading ? '…' : number(value)}</strong><p>{!loading && value == null ? 'Data unavailable' : key === 'users' && users ? number(users.statuses.find(row => row.name === 'Active')?.count || 0) + ' active accounts' : detail}</p></article>;
    })}</div>
    <div className="qd-chart-row">
      <section className="qd-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">WORKFORCE DISTRIBUTION</p><h2>Users by department</h2></div><Building2 size={20} /></div><p className="qd-caption">All user accounts, grouped by the department recorded on their profile.</p>{!loading && departmentData.length ? <><div className="qd-chart qd-workforce-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={departmentData} layout="vertical" margin={{ top: 10, left: 0, right: 24, bottom: 0 }}><CartesianGrid strokeDasharray="4 5" horizontal={false} stroke="#e9edf3" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={value => [value, 'Users']} /><Bar dataKey="count" fill="#0f9b8e" radius={[0, 5, 5, 0]} maxBarSize={25} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><p className="qd-chart-foot">{departmentData.map(row => row.name + ': ' + row.count).join(' · ')}{allDepartments.length > 8 ? ' · Showing the largest 8 departments plus all remaining departments.' : ''}</p></> : <EmptyChart loading={loading} available={Boolean(users)} />}</section>
      <section className="qd-panel"><div className="qd-panel-heading"><div><p className="qd-eyebrow">ACCOUNT OVERVIEW</p><h2>User account status</h2></div><Users size={20} /></div><p className="qd-caption">Active, inactive and blocked users.</p>{!loading && statusData.length ? <><div className="qd-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="count" nameKey="name" innerRadius="68%" outerRadius="88%" paddingAngle={4} stroke="none" isAnimationActive={false}>{statusData.map(row => <Cell key={row.name} fill={row.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="qd-donut-center"><strong>{number(users.total)}</strong><span>users</span></div></div><div className="qd-legend">{userStatuses.map(row => <div key={row.name}><span style={{ background: row.color }} /><span>{row.name}</span><strong>{number(row.count)}</strong></div>)}</div></> : <EmptyChart loading={loading} available={Boolean(users)} />}</section>
    </div>
  </section>;
}
