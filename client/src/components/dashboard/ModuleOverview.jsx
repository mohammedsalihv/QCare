import { Link } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartNoAxesCombined } from 'lucide-react';
import { availableWorkspaces } from '../../utils/workspaces';

const groups = [
  ['Measure & improve', [
    ['indicators', 'Indicator definitions', 'kpi'], ['indicatorReports', 'Indicator reports', 'kpi'], ['clinicalAudits', 'Clinical audits', 'audit'], ['correctiveActions', 'Corrective actions', 'capa'], ['changeRequests', 'Change requests', 'change-management'], ['deviations', 'Deviations', 'deviations'],
  ]],
  ['Safety & experience', [
    ['incidents', 'Incidents', 'incidents'], ['risks', 'Risks', 'risks'], ['complaints', 'Complaints', 'experience'], ['patientSurveys', 'Patient surveys', 'experience'], ['medicationErrors', 'Medication errors', 'meds'], ['handHygieneAudits', 'Hand hygiene audits', 'ipc'], ['infectionSurveillance', 'Infection surveillance', 'ipc'],
  ]],
  ['Assurance & operations', [
    ['documents', 'Documents', 'documents'], ['trainingRecords', 'Training records', 'training'], ['competencies', 'Competencies', 'training'], ['staffLicenses', 'Staff licenses', 'compliance'], ['facilityLicenses', 'Facility licenses', 'compliance'], ['clinicalPrivileges', 'Clinical privileges', 'cp'], ['equipment', 'Equipment assets', 'equipment'], ['suppliers', 'Suppliers', 'supplier'], ['maintenanceRecords', 'Maintenance records', 'fms'],
  ]],
];
const colors = ['#0f9b8e', '#8b7be8', '#eeac56', '#ed7b8b'];
export default function ModuleOverview({ overview, loading, role }) {
  const counts = overview?.counts || {};
  const allowed = new Set(availableWorkspaces(role).flatMap(group => group.links.map(([, slug]) => slug)));
  const activity = groups.flatMap(([, entries]) => entries).map(([key, name]) => ({ name, count: counts[key] })).filter(row => row.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);
  const structure = [['departments', 'Departments'], ['specialties', 'Specialties'], ['locations', 'Locations'], ['designations', 'Designations']].filter(([key]) => counts[key] != null).map(([key, name]) => ({ name, count: counts[key] }));
  const empty = available => <div className="qd-empty"><ChartNoAxesCombined size={28} /><strong>{loading ? 'Loading module totals' : available ? 'No records yet' : 'Data unavailable'}</strong><span>{loading ? 'Fetching recorded activity.' : available ? 'Totals will grow as records are added.' : 'Refresh to reconnect this source.'}</span></div>;
  return <section className="qd-organization" aria-label="Module statistics"><div className="qd-section-heading"><div><p className="qd-eyebrow">ACROSS QCARE</p><h2>Activity across modules</h2></div><span>All recorded data · Every status</span></div>
    <div className="qd-chart-row qd-equal"><section className="qd-panel"><div className="qd-panel-heading"><h2>Module record totals</h2></div><p className="qd-caption">The ten modules with the most records. Full totals are listed below.</p>{!loading && activity.length ? <div className="qd-chart qd-module-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={activity} layout="vertical" margin={{ top: 10, left: 0, right: 24, bottom: 0 }}><CartesianGrid strokeDasharray="4 5" horizontal={false} stroke="#e9edf3" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={135} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={value => [value, 'Records']} /><Bar dataKey="count" radius={[0, 5, 5, 0]} maxBarSize={24} isAnimationActive={false}>{activity.map((row, index) => <Cell key={row.name} fill={colors[index % colors.length]} />)}</Bar></BarChart></ResponsiveContainer></div> : empty(Boolean(overview) && Object.values(counts).some(value => value != null))}</section>
      <section className="qd-panel"><div className="qd-panel-heading"><h2>Organization structure</h2></div><p className="qd-caption">Departments, specialties, locations and designations in the master records.</p>{!loading && structure.some(row => row.count > 0) ? <><div className="qd-chart qd-module-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={structure} margin={{ top: 20, left: -20, right: 10, bottom: 0 }}><CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e9edf3" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" name="Records" radius={[6, 6, 0, 0]} maxBarSize={50} isAnimationActive={false}>{structure.map((row, index) => <Cell key={row.name} fill={colors[index]} />)}</Bar></BarChart></ResponsiveContainer></div><p className="qd-chart-foot">{structure.map(row => row.name + ': ' + row.count).join(' · ')}</p></> : empty(structure.length > 0)}</section></div>
    <div className="qd-module-groups">{groups.map(([name, entries]) => <section className="qd-panel" key={name}><h2>{name}</h2><dl>{entries.map(([key, label, slug]) => <div key={key}><dt>{allowed.has(slug) ? <Link to={'/dashboard/' + slug}>{label}</Link> : label}</dt><dd>{loading ? '…' : counts[key] == null ? <span aria-label="Data unavailable">—</span> : counts[key].toLocaleString()}</dd></div>)}</dl></section>)}</div><p className="qd-caption">Indicator definitions count unique indicator codes; indicator reports count individual period records. Other totals count saved records, including inactive, closed and archived statuses.</p>
  </section>;
}
