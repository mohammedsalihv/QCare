import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';

const tasks = [
  { name: 'Report an incident', detail: 'Open a new report directly', terms: 'report incident event safety near miss harm', to: '/dashboard/incidents?action=new' },
  { name: 'Submit or review indicator data', detail: 'Open indicators and reporting periods', terms: 'submit indicator kpi numerator denominator measure data rate', to: '/dashboard/kpi' },
  { name: 'Find supporting evidence', detail: 'Search your document library', terms: 'find evidence document policy upload procedure', to: '/dashboard/documents' },
  { name: 'Review corrective actions', detail: 'Follow up on improvement work', terms: 'review action capa corrective improvement task', to: '/dashboard/capa' },
  { name: 'Review compliance', detail: 'Open requirements and licensing', terms: 'standard accreditation compliance license regulation', to: '/dashboard/compliance' },
  { name: 'Conduct a clinical audit', detail: 'Open audits and findings', terms: 'clinical audit checklist finding inspection', to: '/dashboard/audit' },
  { name: 'Review a risk', detail: 'Open the risk register', terms: 'risk assess register hazard', to: '/dashboard/risks' },
  { name: 'Review patient feedback', detail: 'Open patient experience', terms: 'patient feedback complaint experience satisfaction', to: '/dashboard/experience' },
];

export default function TaskLauncher() {
  const [query, setQuery] = useState('');
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = words.length ? tasks.filter(task => words.every(word => `${task.name} ${task.terms}`.toLowerCase().includes(word))) : [];
  return <div className="qc-task-launcher"><div className="qc-task-input"><Search size={23} /><input aria-label="Find a quality task" placeholder="What do you need to do?" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery(''); }} /><span>Search tasks</span></div>
    {query.trim() && <div className="qc-task-results" aria-live="polite">{results.length ? results.map(task => <Link key={task.to} to={task.to}><span>{task.name}<small>{task.detail}</small></span><ArrowUpRight size={19} /></Link>) : <p>No matching task. Use “All tools” above to browse every module.</p>}</div>}
    <div className="qc-task-suggestions"><span>Try</span>{['Report incident', 'Indicator data', 'Find evidence', 'Review action'].map(label => <button key={label} onClick={() => setQuery(label)}>{label}</button>)}</div>
  </div>;
}
