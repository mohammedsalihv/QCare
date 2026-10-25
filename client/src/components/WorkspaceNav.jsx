import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, ChevronDown, PanelRightOpen, Pause, Play, Search } from 'lucide-react';
import WorkspaceSidebar from './WorkspaceSidebar';
import useFloatingWorkspaceLauncher from '../hooks/useFloatingWorkspaceLauncher';
import { availableWorkspaces, workspacePath, matchesToolSearch } from '../utils/workspaces';
import { useNotification } from './NotificationContext';
import qcareLogo from '../assets/qcare-brand-logo.png';
import '../navbar.css';

// Original healthcare messages; intentionally not attributed to an author.
const healthcareQuotes = [
  'Compassion is at the heart of every healing journey.',
  'Better care begins with listening.',
  'Every patient deserves dignity, safety and kindness.',
  'Small improvements today build safer care tomorrow.',
  'Behind every measure is a person who matters.',
  'Great care grows through teamwork and trust.',
];

export default function WorkspaceNav({ user, openProfileDrawer }) {
  const [{ quoteIndex, quoteElapsed }, setQuoteProgress] = useState({ quoteIndex: 0, quoteElapsed: 0 });
  const [quotesPaused, setQuotesPaused] = useState(false);
  useEffect(() => {
    if (quotesPaused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setQuoteProgress(current => current.quoteElapsed >= 11950
        ? { quoteIndex: (current.quoteIndex + 1) % healthcareQuotes.length, quoteElapsed: 0 }
        : { ...current, quoteElapsed: current.quoteElapsed + 50 });
    }, 50);
    return () => window.clearInterval(timer);
  }, [quotesPaused]);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBox = useRef(null);
  const searchInput = useRef(null);
  const navigationDrawer = useRef(null);


  const location = useLocation();
  const navigate = useNavigate();
  const { feedNotifications, confirm } = useNotification();
  const groups = availableWorkspaces(user?.role);
  const matches = groups.flatMap(group => group.links.map(([label, slug]) => ({ label, slug, group: group.name }))).filter(item => matchesToolSearch(search, item.label, item.slug, item.group));
  const unread = feedNotifications.filter(item => !item.isRead).length;
  const open = () => { setSearchOpen(false); if (!navigationDrawer.current?.open) navigationDrawer.current?.showModal(); };
  const close = () => navigationDrawer.current?.close();
  const launcher = useFloatingWorkspaceLauncher(user?._id, open);
  useEffect(() => {
    const handleKey = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        navigationDrawer.current?.close();
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
  useEffect(() => { navigationDrawer.current?.close(); }, [location.pathname, location.search]);
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
      <div className="qc-navbar-identity">
        <Link to="/dashboard" className="qc-command-brand qc-logo-brand" aria-label="QCare home"><img src={qcareLogo} alt="QCare" width="2172" height="724" /></Link>
        <div className={`qc-health-quote${quotesPaused ? ' is-paused' : ''}`}>
          <div><p className="qc-health-quote-text">
            <span className="qc-quote-accessible">“{healthcareQuotes[quoteIndex]}”</span>
            <span className="qc-quote-typed" aria-hidden="true">“{healthcareQuotes[quoteIndex].slice(0, Math.floor(quoteElapsed / 55))}{quoteElapsed >= healthcareQuotes[quoteIndex].length * 55 ? '”' : ''}<span className="qc-quote-caret" /></span>
            <span className="qc-quote-reduced" aria-hidden="true">“{healthcareQuotes[quoteIndex]}”</span>
          </p></div>
          <button type="button" onClick={() => setQuotesPaused(paused => !paused)} aria-label={quotesPaused ? 'Resume healthcare quotes' : 'Pause healthcare quotes'} title={quotesPaused ? 'Resume quotes' : 'Pause quotes'}>{quotesPaused ? <Play size={13} /> : <Pause size={13} />}</button>
        </div>
      </div>

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
      <Link to="/notifications" className="qc-icon-button" aria-label={`${unread} unread notifications`}><Bell size={20} />{unread > 0 && <span className="qc-notification-dot" />}</Link>
      <button className="qc-navbar-profile" onClick={openProfileDrawer} aria-label="Open my profile"><span className="qc-avatar">{user?.name?.slice(0, 1) || 'Q'}</span><ChevronDown size={14} /></button>
    </header>
    <button type="button" {...launcher.buttonProps} className={'qc-drawer-launcher is-positionable' + (launcher.dragging ? ' is-dragging' : '')} aria-label="Open workspace tools" aria-describedby="qc-launcher-move-help" title="Tap to open. Drag to move to either side." aria-haspopup="dialog" aria-controls="qc-navigation-drawer"><span className="qc-launcher-icon" aria-hidden="true"><PanelRightOpen size={27} /></span><span className="qc-drawer-launcher-hint">Tap to open · Drag to move</span></button>
    <span id="qc-launcher-move-help" className="qc-quote-accessible">Drag to either side and move up or down. With keyboard focus, use arrow keys to move, Home for the top, End for the bottom, and Enter to open.</span>
    <WorkspaceSidebar user={user} side={launcher.side} drawerRef={navigationDrawer} onSignOut={logout} />
  </>;
}
