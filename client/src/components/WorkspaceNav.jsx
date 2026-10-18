import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Bell, Grid2X2, LogOut, Search, X } from 'lucide-react';
import { availableWorkspaces, workspacePath, matchesToolSearch, normalizeToolSearch } from '../utils/workspaces';
import { useNotification } from './NotificationContext';

export default function WorkspaceNav({ user, openProfileDrawer }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBox = useRef(null);
  const searchInput = useRef(null);
  const dialog = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { feedNotifications, confirm } = useNotification();
  const groups = availableWorkspaces(user?.role);
  const filtered = groups.map(group => ({ ...group, links: group.links.filter(([label, slug]) => !normalizeToolSearch(query) || matchesToolSearch(query, label, slug, `${group.name} ${group.description}`)) })).filter(group => group.links.length);
  const matches = groups.flatMap(group => group.links.map(([label, slug]) => ({ label, slug, group: group.name }))).filter(item => matchesToolSearch(search, item.label, item.slug, item.group));
  const unread = feedNotifications.filter(item => !item.isRead).length;
  const current = groups.flatMap(group => group.links).find(([, slug]) => workspacePath(slug) === location.pathname)?.[0];
  const open = () => { setSearchOpen(false); setQuery(''); if (!dialog.current.open) dialog.current.showModal(); };
  const close = () => dialog.current?.close();
  useEffect(() => {
    const handleKey = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current.open) dialog.current.close();
        searchInput.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    const handleOutside = event => {
      if (!searchBox.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, []);
  const logout = () => {
    close();
    confirm({ title: 'Sign out of QCare?', message: 'You will return to the login page.', confirmLabel: 'Sign out', cancelLabel: 'Stay signed in', onConfirm: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      navigate('/');
    } });
  };
  return <>
    <header className="qc-command-header">
      <Link to="/dashboard" className="qc-command-brand" aria-label="QCare home"><Activity size={25} /><span>QCare<span>.</span></span></Link>
      <span className="qc-command-context">{current || 'Quality in motion'}</span>
      <div className="qc-header-search" ref={searchBox} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
      }}>
        <div className="qc-header-search-input"><Search size={17} /><input ref={searchInput} aria-label="Find a tool" aria-expanded={searchOpen && Boolean(search.trim())} aria-controls="qc-tool-search-results" autoComplete="off" placeholder="Find a tool..." value={search} onFocus={() => setSearchOpen(true)} onChange={event => { setSearch(event.target.value); setSearchOpen(true); }} onKeyDown={event => {
          if (event.key === 'Escape') setSearchOpen(false);
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            searchBox.current?.querySelector('.qc-header-search-results a')?.focus();
          }
          if (event.key === 'Enter' && matches.length && searchOpen) {
            event.preventDefault();
            navigate(workspacePath(matches[0].slug));
            setSearch('');
            setSearchOpen(false);
          }
        }} /><kbd>Ctrl K</kbd></div>
        {searchOpen && search.trim() && <div id="qc-tool-search-results" className="qc-header-search-results" onKeyDown={event => {
          if (event.key === 'Escape') { setSearchOpen(false); searchInput.current?.focus(); }
        }}><div className="qc-eyebrow">RELATED TOOLS</div>{matches.length ? matches.map(item => <Link key={item.slug} to={workspacePath(item.slug)} onClick={() => { setSearch(''); setSearchOpen(false); }}><span>{item.label}<small>{item.group}</small></span><ArrowUpRight size={16} /></Link>) : <p>No matching tools. Try “incident”, “audit” or “indicator”.</p>}</div>}
      </div>
      <button className="qc-tools-button" onClick={open}><Grid2X2 size={18} /><span>All tools</span></button>
      <Link to="/notifications" className="qc-icon-button" aria-label={`${unread} unread notifications`}><Bell size={20} />{unread > 0 && <span className="qc-notification-dot" />}</Link>
      <button className="qc-avatar" onClick={openProfileDrawer} aria-label="Open my profile">{user?.name?.slice(0, 1) || 'Q'}</button>
      <button className="qc-icon-button qc-signout" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
    </header>
    <dialog ref={dialog} className="qc-tool-dialog" aria-labelledby="tool-dialog-title">
      <div className="qc-dialog-heading"><div><div className="qc-eyebrow">YOUR TOOLKIT</div><h2 id="tool-dialog-title">Where do you want to go?</h2></div><button onClick={close} className="qc-icon-button" aria-label="Close toolkit"><X size={21} /></button></div>
      <div className="qc-dialog-search"><Search size={20} /><input autoFocus aria-label="Search all tools" placeholder="Search incidents, indicators, evidence, audits..." value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="qc-tool-groups">{filtered.length ? filtered.map(group => <section key={group.name}><h3>{group.name}</h3><div>{group.links.map(([label, slug]) => <Link key={slug} to={workspacePath(slug)} onClick={close}>{label}<ArrowUpRight size={16} /></Link>)}</div></section>) : <p className="qc-no-results">No matching tools. Try a different task or module name.</p>}</div>
      <footer><Link to="/dashboard" onClick={close}>My workspace</Link><Link to="/dashboard/support" onClick={close}>Help & support</Link><Link to="/dashboard/manuals" onClick={close}>User guides</Link><span>Esc to close</span></footer>
    </dialog>
  </>;
}
