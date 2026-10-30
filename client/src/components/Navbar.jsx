import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  ChevronDown,
  Monitor,
  Settings,
  LogOut,
  Shield,
  HelpCircle,
  AlertTriangle,
  X,
  ThumbsUp,
  BookOpen,
  ShieldAlert,
  Building2,
  MapPin,
  Phone,
  Users,
  Briefcase,
  Award,
  Stethoscope,
  UserSquare2,
  FileCheck,
  Library,
  GraduationCap,
  AlertCircle,
  ClipboardList,
  ShieldCheck,
  Wrench,
  Heart,
  Lock,
  UserCheck,
  KeyRound,
  Database,
  ChevronRight,
  ChevronUp,
  BarChart2,
  MailSearch
} from 'lucide-react';
import Dropdown from './Dropdown';
import defaultProfile from '../assets/default_profile.png';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';
import { useNotification } from './NotificationContext';
import SystemManagementDrawer from './SystemManagementDrawer';

const Navbar = ({ openProfileDrawer, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    feedNotifications: notifications, 
    setFeedNotifications: setNotifications,
    fetchFeed: fetchNotifications,
    clearFeed
  } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isManagementDrawerOpen, setIsManagementDrawerOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  // Navigation Menus State
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);

  const menuTimeoutRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user?._id]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, getAuthConfig());
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length === 0) return;

    try {
      await Promise.all(unreadIds.map(id => 
        axios.patch(`/api/notifications/${id}/read`, {}, getAuthConfig())
      ));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      fetchNotifications();
      console.error('Error marking all as read:', error);
    }
  };

  const profileOptions = [
    { label: 'My Profile', icon: User, value: 'profile' },
    { label: 'Notifications', icon: Bell, value: 'notifications' },
    ...(user?.role?.toLowerCase().includes('admin') ? [{ label: 'Admin Control', icon: Shield, value: 'admin' }] : []),
    { label: 'Logout', icon: LogOut, value: 'logout', variant: 'danger' }
  ];

  const handleProfileSelect = (val) => {
    if (val === 'logout') {
      setShowLogoutConfirm(true);
    } else if (val === 'notifications') {
      navigate('/notifications');
    } else if (val === 'profile') {
      openProfileDrawer();
    } else if (val === 'admin') {
      setIsManagementDrawerOpen(true);
    }
  };

  const confirmLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  // Menu Handling for Mouse Enter/Leave
  const handleMouseEnter = (menuName) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMegaMenu(menuName);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    };
  }, []);

  // Close menus on path transition
  useEffect(() => {
    setActiveMegaMenu(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Mega Menu Options Definitions
  const masterDataMenu = [
    {
      title: 'Hospital Structure',
      items: [
        { label: 'Department Master', path: '/dashboard/departments', icon: Building2, desc: 'Configure hospital units & hierarchy' },
        { label: 'Location Types', path: '/dashboard/location-types', icon: MapPin, desc: 'Configure physical rooms & zones' },
        { label: 'Contact Master', path: '/dashboard/contact-master', icon: Phone, desc: 'Emergency directories & help lines' }
      ]
    },
    {
      title: 'Clinical Specialties',
      items: [
        { label: 'Speciality Master', path: '/dashboard/speciality-master', icon: Stethoscope, desc: 'Configure clinical specialties' },
        { label: 'Physician Demography', path: '/dashboard/physician-demography', icon: UserSquare2, desc: 'Physician license catalog' },
        { label: 'Profile Verification', path: '/dashboard/physician-demography-verification', icon: FileCheck, desc: 'Auditing queue for physician demography' }
      ]
    },
    {
      title: 'Privileges',
      items: [
        { label: 'Clinical Privileges', path: '/dashboard/clinical-privileges', icon: Shield, desc: 'Manage staff privilege assignments' }
      ]
    },
    {
      title: 'Performance Manager',
      items: [
        { label: 'Key Performance Indicator', path: '/dashboard/key-performance-indicator', icon: BarChart2, desc: 'Manage KPIs & sub-indicators' }
      ]
    },
    {
    title: 'Professional Practice',
    items: [
      { label: 'OOPPE Management', path: '/dashboard/ooppe-management', icon: BookOpen, desc: 'Manage ongoing professional practice records' }
    ]
  },
];

  const qmsModulesMenu = [
    {
      title: 'Quality & Compliance',
      items: [
        { label: 'Document Control', path: '/dashboard/documents', icon: Library, desc: 'SOPs, policies & manual center' },
        { label: 'Audits & Inspections', path: '/dashboard/audit', icon: FileCheck, desc: 'Schedule clinical inspections' },
        { label: 'Training Management', path: '/dashboard/training', icon: GraduationCap, desc: 'Verify employee competency logs' }
      ]
    },
    {
      title: 'Incidents & CAPA',
      items: [
        { label: 'Incident Reporting', path: '/dashboard/incidents', icon: AlertTriangle, desc: 'Log adverse medical occurrences' },
        { label: 'Deviations & NCs', path: '/dashboard/deviations', icon: AlertCircle, desc: 'Process deviations monitoring' },
        { label: 'CAPA Management', path: '/dashboard/capa', icon: ClipboardList, desc: 'Corrective & preventive actions' }
      ]
    },
    {
      title: 'Operations & Risks',
      items: [
        { label: 'Risk Management', path: '/dashboard/risks', icon: ShieldCheck, desc: 'Quantify & mitigate hospital hazards' },
        { label: 'Equipment Master', path: '/dashboard/equipment', icon: Wrench, desc: 'Medical devices inventory' },
        { label: 'Supplier Master', path: '/dashboard/supplier', icon: Building2, desc: 'Review raw materials & vendors' },
        { label: 'Patient Experience', path: '/dashboard/complaints', icon: Heart, desc: 'Incidents, surveys & complaints logs' }
      ]
    }
  ];

  const adminControlMenu = [
    {
      title: 'Staff & Credentials',
      items: [
        { label: 'Staff Master', path: '/dashboard/users', icon: Users, desc: 'Manage system users & access' },
        { label: 'Designation Master', path: '/dashboard/designation-master', icon: Briefcase, desc: 'Review staff designations & grades' },
        { label: 'Mall Credential', path: '/dashboard/mall-credential', icon: Award, desc: 'Track training certifications' }
      ]
    },
    {
      title: 'Access Control',
      items: [
        { label: 'Application Roles', path: '/dashboard/application-roles', icon: Lock, desc: 'Role permissions matrix' },
        { label: 'User Assignment', path: '/dashboard/user-assignment', icon: UserCheck, desc: 'Department mapping & permissions' }
      ]
    },
    {
      title: 'Security Auditing',
      items: [
        { label: 'Password Management', path: '/dashboard/password-management', icon: KeyRound, desc: 'Auth source settings & forced resets' },
        { label: 'System Audit Log', path: '/dashboard/audit-log', icon: Database, desc: 'MongoDB audit trail tracker' },
        { label: 'Global Settings', path: '/dashboard/settings', icon: Settings, desc: 'LDAP configurations & system settings' }
      ]
    },
    {
      title: 'Logs & Reports',
      items: [
        { label: 'Mail Log', path: '/dashboard/mail-log', icon: MailSearch, desc: 'System email delivery records' },
        { label: 'Report Generator', path: '/dashboard/report-generator', icon: BarChart2, desc: 'Generate & export quality reports' }
      ]
    }
  ];

  return (
    <>
      <header className="h-20 bg-white backdrop-blur-md border-b border-slate-300/40 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 shadow-sm shadow-slate-100/50 text-slate-800 font-semibold">
        {/* Left Side: Brand Logo and Title */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-3 cursor-pointer shrink-0"
          >
            <div className="w-11 h-11 shrink-0 overflow-hidden">
              <img src="/logo.svg" alt="QCare" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tighter whitespace-nowrap normal-case text-slate-800">
                QCare<span className="text-[var(--color-primary)]">.</span>
              </span>
              <span className="text-[12px] text-[#040404]/60 font-semibold tracking-normal normal-case">CMC Holding</span>
            </div>
          </div>
        </div>

        {/* Center: Global Navigation Links (Desktop only) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full mx-6 select-none">
          <button 
            onClick={() => navigate('/dashboard')} 
            className={`px-4 py-2 text-[13px] font-semibold normal-case tracking-normal rounded-xl transition-all ${
              location.pathname === '/dashboard' 
              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' 
              : 'text-slate-700 hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)]'
            }`}
          >
            Dashboard
          </button>

          {/* Master Data Menu Trigger */}
          <div 
            onMouseEnter={() => handleMouseEnter('master')} 
            onMouseLeave={handleMouseLeave}
            className="relative h-full flex items-center"
          >
            <button 
              className={`px-4 py-2 text-[13px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-1.5 ${
                activeMegaMenu === 'master' || location.pathname.includes('/dashboard/contact-master') || location.pathname.includes('/dashboard/location-types') || location.pathname.includes('/dashboard/departments') || location.pathname.includes('/dashboard/speciality-master') || location.pathname.includes('/dashboard/physician-demography') || location.pathname.includes('/dashboard/physician-demography-verification') || location.pathname.includes('/dashboard/clinical-privileges') || location.pathname.includes('/dashboard/key-performance-indicator')
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' 
                : 'text-slate-700 hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)]'
              }`}
            >
              <span>Master Data</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* QMS Modules Menu Trigger */}
          <div 
            onMouseEnter={() => handleMouseEnter('qms')} 
            onMouseLeave={handleMouseLeave}
            className="relative h-full flex items-center"
          >
            <button 
              className={`px-4 py-2 text-[13px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-1.5 ${
                activeMegaMenu === 'qms' || location.pathname.includes('/dashboard/documents') || location.pathname.includes('/dashboard/incidents') || location.pathname.includes('/dashboard/risks') || location.pathname.includes('/dashboard/audit') || location.pathname.includes('/dashboard/training') || location.pathname.includes('/dashboard/deviations') || location.pathname.includes('/dashboard/complaints') || location.pathname.includes('/dashboard/capa') || location.pathname.includes('/dashboard/equipment') || location.pathname.includes('/dashboard/supplier')
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' 
                : 'text-slate-700 hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)]'
              }`}
            >
              <span>QMS Modules</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>



          <button 
            onClick={() => navigate('/dashboard/support')} 
            className={`px-4 py-2 text-[13px] font-semibold normal-case tracking-normal rounded-xl transition-all ${
              location.pathname === '/dashboard/support' 
              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' 
              : 'text-slate-700 hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)]'
            }`}
          >
            Support Desk
          </button>
        </nav>

        {/* Right Side: Global controls (Search, Help, Notifications, User) */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="relative group hidden xl:block w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[var(--color-primary)] transition-colors" />
            <input 
              type="text" 
              placeholder="Search medical portal..." 
              className="w-full pl-10 pr-4 py-2 bg-white/90 border border-slate-350 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-[13px] font-medium text-slate-800"
            />
          </div>

          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="xl:hidden p-2.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-all active:scale-95"
            title="Search database"
          >
            <Search className="w-5 h-5" />
          </button>

          <button 
            onClick={() => navigate('/dashboard/manuals')} 
            className="hidden sm:block p-2.5 text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-all active:scale-95"
            title="SOP Documents"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          <div className="relative">
            <button 
              aria-label="Notifications" aria-expanded={showNotifications} onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-white text-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-all duration-300 active:scale-95 border border-slate-300/40 shadow-sm"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[12px] font-semibold flex items-center justify-center rounded-full border border-white shadow-lg animate-in zoom-in duration-300">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {showNotifications && <section aria-label="Notification dropdown" className="absolute right-[-60px] sm:right-0 mt-3 w-[min(380px,calc(100vw-24px))] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-5 py-4 bg-gradient-to-r from-teal-800 to-teal-700 text-white"><div className="flex justify-between items-start gap-3"><div><p className="text-xs uppercase tracking-widest text-teal-100">Your updates</p><h2 className="text-lg font-bold mt-1">Notifications</h2><p className="text-xs text-teal-100 mt-1">{notifications.filter(n => !n.isRead).length} unread</p></div><Bell size={21}/></div></div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100"><span className="text-xs font-semibold text-slate-600">Recent activity</span><button onClick={markAllAsRead} disabled={!notifications.some(n => !n.isRead)} className="text-xs font-semibold text-teal-700 disabled:text-slate-400">Mark all read</button></div>
              <div className="max-h-[min(420px,55vh)] overflow-y-auto">{notifications.length ? notifications.slice(0, 15).map(n => <button key={n._id} onClick={async () => { if (!n.isRead) await markAsRead(n._id); if (n.actionLink) { setShowNotifications(false); navigate(n.actionLink); } }} className={`w-full text-left flex gap-3 px-5 py-4 border-b border-slate-100 hover:bg-teal-50 transition-colors ${!n.isRead ? 'bg-teal-50/60' : 'bg-white'}`}><span className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0"><Bell size={17}/></span><span className="flex-1 min-w-0"><span className="flex justify-between gap-2"><strong className="text-xs text-teal-800">{n.workflow?.module || 'QCare update'}</strong>{!n.isRead && <span className="text-xs font-bold text-teal-700">New</span>}</span><span className="block mt-1 text-sm font-medium leading-snug text-slate-800 break-words">{n.message}</span><span className="block mt-2 text-xs text-slate-500">{n.workflow?.actor?.name || n.user || 'QCare'} · {n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB', { timeZone:'Asia/Dubai', dateStyle:'medium', timeStyle:'short' }) : 'Time unavailable'} · Dubai</span></span></button>) : <div className="py-12 px-6 text-center text-slate-500"><Bell className="mx-auto mb-3 text-teal-600" size={28}/><strong className="block text-slate-700">You're all caught up</strong><p className="text-xs mt-1">New updates will appear here.</p></div>}</div>
              <button onClick={() => { setShowNotifications(false); navigate('/notifications'); }} className="w-full py-4 text-sm font-bold text-teal-700 hover:bg-teal-50 border-t border-slate-100">Open notification center →</button>
            </section>}
          </div>

          <div className="h-8 w-px bg-slate-300"></div>

          {/* User Profile dropdown */}
          <Dropdown 
            options={profileOptions}
            onSelect={handleProfileSelect}
            trigger={
              <button className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[var(--color-primary)]/5 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-350 overflow-hidden shadow-sm relative shrink-0">
                  <img 
                    src={user?.photo ? `http://192.168.1.160:5000${user.photo}` : defaultProfile}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-semibold text-slate-800 group-hover:text-[var(--color-primary)] transition-colors whitespace-nowrap">{user?.name?.split(' ')[0]}</span>
                  <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal">{user?.designation?.substring(0, 15) || user?.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
              </button>
            }
          />

          {/* Mobile hamburger menu */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 text-slate-600 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] rounded-xl transition-all active:scale-95 shrink-0"
            title="Open Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5 text-[var(--color-primary)]" />}
          </button>
        </div>
      </header>

      {/* Mega Menu Overlay (Desktop) */}
      <div 
        onMouseEnter={() => { if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current); }}
        onMouseLeave={handleMouseLeave}
        className={`hidden lg:block fixed left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-300 shadow-2xl transition-all duration-300 z-30 select-none overflow-hidden ${
          activeMegaMenu 
          ? 'max-h-[480px] py-10 opacity-100 top-20 border-t border-slate-200' 
          : 'max-h-0 py-0 opacity-0 top-[70px] pointer-events-none'
        }`}
      >
        <div className="max-w-[1500px] mx-auto px-10">
          {activeMegaMenu === 'master' && (
            <div className="grid grid-cols-2 gap-10 max-h-[360px] overflow-y-auto custom-scrollbar pr-4">
              {masterDataMenu.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-[12px] font-semibold text-[var(--color-primary)] normal-case tracking-normal border-b border-slate-100 pb-2">{sec.title}</h4>
                  <div className="space-y-2">
                    {sec.items.map((item) => (
                      <div 
                        key={item.label}
                        onClick={() => { navigate(item.path); setActiveMegaMenu(null); }}
                        className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[var(--color-primary)]/5 group cursor-pointer transition-all duration-200"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/20 transition-all duration-250">
                          <item.icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold normal-case tracking-normal text-slate-800 group-hover:text-[var(--color-primary)] transition-colors">{item.label}</span>
                          <span className="text-[12px] text-slate-500 font-medium mt-0.5 leading-snug">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMegaMenu === 'qms' && (
            <div className="grid grid-cols-3 gap-10">
              {qmsModulesMenu.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-[12px] font-semibold text-[var(--color-primary)] normal-case tracking-normal border-b border-slate-100 pb-2">{sec.title}</h4>
                  <div className="space-y-2">
                    {sec.items.map((item) => (
                      <div 
                        key={item.label}
                        onClick={() => { navigate(item.path); setActiveMegaMenu(null); }}
                        className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[var(--color-primary)]/5 group cursor-pointer transition-all duration-200"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/20 transition-all duration-250">
                          <item.icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold normal-case tracking-normal text-slate-800 group-hover:text-[var(--color-primary)] transition-colors">{item.label}</span>
                          <span className="text-[12px] text-slate-500 font-medium mt-0.5 leading-snug">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMegaMenu === 'adminControl' && (
            <div className="grid grid-cols-4 gap-10">
              {adminControlMenu.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-[12px] font-semibold text-[var(--color-primary)] normal-case tracking-normal border-b border-slate-100 pb-2">{sec.title}</h4>
                  <div className="space-y-2">
                    {sec.items.map((item) => (
                      <div 
                        key={item.label}
                        onClick={() => { navigate(item.path); setActiveMegaMenu(null); }}
                        className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[var(--color-primary)]/5 group cursor-pointer transition-all duration-200"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/20 transition-all duration-250">
                          <item.icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold normal-case tracking-normal text-slate-800 group-hover:text-[var(--color-primary)] transition-colors">{item.label}</span>
                          <span className="text-[12px] text-slate-500 font-medium mt-0.5 leading-snug">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="xl:hidden fixed inset-x-0 top-20 p-4 bg-white border-b border-slate-200 z-50 animate-in slide-in-from-top duration-300">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input 
              type="text" 
              autoFocus
              placeholder="Search Quality Portal..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800"
            />
          </div>
        </div>
      )}

      {/* Mobile Accordion Drawer Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-white/60 backdrop-blur-sm z-[38] animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className={`lg:hidden fixed top-20 bottom-0 left-0 w-80 bg-white border-r border-slate-200 shadow-2xl z-[39] transition-transform duration-300 transform select-none overflow-y-auto ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 space-y-6">
          <div className="space-y-2">
             <button 
               onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
               className={`w-full text-left p-3.5 rounded-xl text-[13px] font-semibold normal-case tracking-normal transition-all ${
                 location.pathname === '/dashboard' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-slate-700 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
               }`}
             >
               Dashboard
             </button>

             {/* Master Data Accordion */}
             <div className="space-y-1">
               <button
                 onClick={() => setExpandedMobileCategory(expandedMobileCategory === 'master' ? null : 'master')}
                 className={`w-full flex items-center justify-between p-3.5 rounded-xl text-[13px] font-semibold normal-case tracking-normal text-slate-700 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] ${
                   expandedMobileCategory === 'master' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''
                 }`}
               >
                 <span>Master Data</span>
                 {expandedMobileCategory === 'master' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </button>

               {expandedMobileCategory === 'master' && (
                 <div className="ml-3 pl-3 border-l-2 border-slate-200 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                    {masterDataMenu.map(sec => sec.items.map(item => (
                       <button
                         key={item.label}
                         onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                         className={`w-full text-left p-2.5 rounded-lg text-[12px] font-semibold normal-case tracking-normal text-slate-600 hover:bg-[var(--color-primary)]/5 flex items-center gap-2.5 ${
                           location.pathname === item.path ? 'text-[var(--color-primary)] font-semibold' : ''
                         }`}
                       >
                         <item.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-[var(--color-primary)]" />
                         <span>{item.label}</span>
                       </button>
                    )))}
                 </div>
               )}
             </div>

             {/* QMS Modules Accordion */}
             <div className="space-y-1">
               <button
                 onClick={() => setExpandedMobileCategory(expandedMobileCategory === 'qms' ? null : 'qms')}
                 className={`w-full flex items-center justify-between p-3.5 rounded-xl text-[13px] font-semibold normal-case tracking-normal text-slate-700 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] ${
                   expandedMobileCategory === 'qms' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''
                 }`}
               >
                 <span>QMS Modules</span>
                 {expandedMobileCategory === 'qms' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </button>

               {expandedMobileCategory === 'qms' && (
                 <div className="ml-3 pl-3 border-l-2 border-slate-200 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                    {qmsModulesMenu.map(sec => sec.items.map(item => (
                       <button
                         key={item.label}
                         onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                         className={`w-full text-left p-2.5 rounded-lg text-[12px] font-semibold normal-case tracking-normal text-slate-600 hover:bg-[var(--color-primary)]/5 flex items-center gap-2.5 ${
                           location.pathname === item.path ? 'text-[var(--color-primary)] font-semibold' : ''
                         }`}
                       >
                         <item.icon className="w-3.5 h-3.5 text-slate-500" />
                         <span>{item.label}</span>
                       </button>
                    )))}
                 </div>
               )}
             </div>

             <button 
               onClick={() => { navigate('/dashboard/support'); setIsMobileMenuOpen(false); }}
               className={`w-full text-left p-3.5 rounded-xl text-[13px] font-semibold normal-case tracking-normal transition-all ${
                 location.pathname === '/dashboard/support' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-slate-700 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
               }`}
             >
               Support Desk
             </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-white/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowLogoutConfirm(false)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-red-50 mx-auto mb-6 flex items-center justify-center shadow-inner-sm">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2 tracking-tight">End Session?</h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed px-4">
                You are about to log out of the <span className="font-semibold text-[var(--color-primary)]">QCare Portal</span>. Any unsaved changes will be lost.
              </p>
            </div>

            <div className="p-8 pt-0 flex flex-col gap-3">
              <button
                onClick={confirmLogout}
                className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold normal-case tracking-normal transition-all shadow-xl shadow-red-500/30 active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Confirm Logout</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-4 rounded-xl border border-slate-200 text-[12px] font-semibold normal-case tracking-normal text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Management Drawer */}
      <SystemManagementDrawer 
        isOpen={isManagementDrawerOpen} 
        onClose={() => setIsManagementDrawerOpen(false)} 
      />
    </>
  );
};

export default Navbar;
