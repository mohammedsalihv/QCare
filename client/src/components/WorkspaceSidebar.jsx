import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Building2, ChartNoAxesCombined, ChevronDown, CircleHelp, ClipboardCheck, ClipboardList, Contact, FileCheck, FileText, FolderCheck, GraduationCap, Grid2X2, Heart, House, LogOut, KeyRound, Mail, MapPin, Package, Pill, Search, Settings, ShieldCheck, Stethoscope, TriangleAlert, Truck, UserCheck, Users, Wrench, X } from 'lucide-react';
import { availableWorkspaces, matchesToolSearch, workspacePath } from '../utils/workspaces';

const groupIcons = [ChartNoAxesCombined, ShieldCheck, FolderCheck, Users];
const icons = {
  kpi: ChartNoAxesCombined, audit: ClipboardCheck, capa: ClipboardList,
  'change-management': FileCheck, deviations: TriangleAlert, 'report-generator': FileText,
  incidents: TriangleAlert, risks: ShieldCheck, experience: Heart, ipc: Activity, meds: Pill, fms: Building2,
  compliance: FolderCheck, documents: FileText, training: GraduationCap, cp: Stethoscope,
  'clinical-privileges': UserCheck, supplier: Truck, equipment: Wrench, users: Users,
  departments: Building2, 'contact-master': Contact, 'location-types': MapPin,
  'speciality-master': Stethoscope, 'designation-master': UserCheck, 'mall-credential': KeyRound,
  'physician-demography': Contact, 'physician-demography-verification': ClipboardCheck,
  'application-roles': ShieldCheck, 'user-assignment': ClipboardList, 'password-management': KeyRound,
  'audit-log': Activity, 'mail-log': Mail, settings: Settings,
};

export default function WorkspaceSidebar({ user, drawerRef, onSignOut, side = 'right' }) {
  const [query, setQuery] = useState('');
  const { pathname } = useLocation();
  const groups = availableWorkspaces(user?.role);
  useEffect(() => {
    const openFeatures = event => {
      setQuery(event.detail?.category || '');
      if (!drawerRef.current?.open) drawerRef.current?.showModal();
    };
    window.addEventListener('qc:open-features', openFeatures);
    return () => window.removeEventListener('qc:open-features', openFeatures);
  }, [drawerRef]);
  const close = () => drawerRef.current?.close();
  const visible = groups.map(group => ({ ...group, links: group.links.filter(([label, slug]) => !query.trim() || matchesToolSearch(query, label, slug, `${group.name} ${group.description}`)) })).filter(group => group.links.length);
  return <dialog ref={drawerRef} id="qc-navigation-drawer" className="qc-feature-drawer" data-side={side} aria-labelledby="qc-feature-drawer-title" onClose={() => setQuery('')} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="qc-feature-drawer-shell">
      <header><div><span className="qc-directory-kicker">QCARE / WORKSPACE</span><h2 id="qc-feature-drawer-title">Modules & features</h2><p>Find the right tool for your next task.</p></div><button type="button" onClick={close} aria-label="Close feature directory"><X size={20} /></button></header>
      <label className="qc-directory-search"><Search size={20} /><input autoFocus type="search" aria-label="Search all features" placeholder="Search a feature or category..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear feature search"><X size={15} /></button>}</label>
      <nav className="qc-directory-content" aria-label="Feature directory">
        {visible.map(group => {
          const GroupIcon = groupIcons[groups.findIndex(item => item.name === group.name)] || Grid2X2;
          return <section className="qc-directory-section" key={group.name}><div className="qc-directory-section-title"><span><GroupIcon size={21} /></span><div><h3>{group.name}</h3><p>{group.description}</p></div><small>{group.links.length} tools</small></div><div className="qc-directory-links">{group.links.map(([label, slug]) => {
            const Icon = icons[slug] || Package;
            const path = workspacePath(slug);
            const active = pathname === path || pathname.startsWith(`${path}/`);
            return <Link key={slug} to={path} onClick={close} aria-current={active ? 'page' : undefined} className={active ? 'is-current' : ''}><Icon size={18} /><span>{label}</span><ChevronDown size={14} /></Link>;
          })}</div></section>;
        })}
        {!visible.length && <div className="qc-directory-empty"><Search size={28} /><h3>No matching features</h3><p>Try another feature name or category.</p></div>}
      </nav>
      <footer><Link to="/dashboard" onClick={close}><House size={16} />Overview</Link><Link to="/dashboard/manuals" onClick={close}><BookOpen size={16} />User guides</Link><Link to="/dashboard/support" onClick={close}><CircleHelp size={16} />Support</Link><button type="button" className="qc-drawer-signout" onClick={onSignOut}><LogOut size={16} />Sign out</button></footer>
    </div>
  </dialog>;
}
