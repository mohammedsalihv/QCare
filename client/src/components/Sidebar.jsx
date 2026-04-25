import React, { useState, useEffect } from 'react';
import { 
  Library, 
  AlertTriangle, 
  BarChart3, 
  BookOpen, 
  ChevronRight,
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  HelpCircle,
  Bell,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { role } = JSON.parse(userInfo);
      setUserRole(role);
    }
  }, []);

  const sections = [
    {
      title: 'Workplace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'incidents', label: 'Incident Reporting', icon: AlertTriangle, path: '/dashboard/incidents' },
        { id: 'docs', label: 'Document Library', icon: Library, path: '/dashboard/documents' },
      ]
    },
    {
      title: 'Quality Assurance',
      roles: ['superadmin', 'admin'],
      items: [
        { id: 'risk', label: 'Risk Register', icon: ShieldCheck, path: '/dashboard/risk' },
        { id: 'audit', label: 'Audit Control', icon: FileCheck, path: '/dashboard/audit' },
        { id: 'feedback', label: 'Patient Feedback', icon: MessageSquare, path: '/dashboard/feedback' },
        { id: 'kpi', label: 'KPI Analytics', icon: BarChart3, path: '/dashboard/kpi' },
      ]
    },
    {
      title: 'System Management',
      roles: ['superadmin', 'admin'],
      items: [
        { id: 'users', label: 'User Directory', icon: Users, path: '/dashboard/users' },
        { id: 'departments', label: 'Departments', icon: Building2, path: '/dashboard/departments' },
        { id: 'settings', label: 'System Settings', icon: Settings, path: '/dashboard/settings' },
      ]
    }
  ];

  return (
    <aside className={`fixed top-0 left-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'} border-r border-slate-800`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className={`py-6 flex items-center transition-all duration-300 ${isOpen ? 'px-4 gap-3' : 'justify-center'}`}>
          <div className={`shrink-0 overflow-hidden transition-all duration-300 ${isOpen ? 'w-[56px] h-[56px]' : 'w-11 h-11'}`}>
            <img src="/logo.svg" alt="QCare" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          {isOpen && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
              <span className="font-black text-lg tracking-tight whitespace-nowrap">QCare Portal</span>
              <span className="text-[10px] text-[#b59662] font-black tracking-[0.1em] uppercase">CMC Holding</span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto scrollbar-none">
          {sections.map((section, sidx) => {
            // Role based check for section visibility
            if (section.roles && !section.roles.includes(userRole)) return null;

            return (
              <div key={sidx} className="space-y-2">
                 {isOpen && (
                   <h5 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                     {section.title}
                   </h5>
                 )}
                 <div className="space-y-1">
                   {section.items.map((item) => {
                     if (item.role && item.role !== userRole) return null;
                     const isActive = location.pathname === item.path;
                     const Icon = item.icon;

                     return (
                       <button
                         key={item.id}
                         onClick={() => navigate(item.path)}
                         className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                           isActive 
                           ? 'bg-[#b59662] text-white shadow-lg shadow-[#b59662]/20' 
                           : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-[#b59662]'} transition-colors`} />
                           {isOpen && <span className="font-bold text-[11px] whitespace-nowrap uppercase tracking-wide">{item.label}</span>}
                         </div>
                         {isOpen && isActive && <ChevronRight className="w-3.5 h-3.5" />}
                       </button>
                     );
                   })}
                 </div>
              </div>
            );
          })}
        </nav>

        {/* Support Section at bottom */}
        {isOpen && (
          <div className="p-6 border-t border-slate-800">
             <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-[#b59662]/10 flex items-center justify-center">
                   <ShieldCheck className="w-4 h-4 text-[#b59662]" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-white font-bold tracking-tight">System Guard</span>
                   <span className="text-[8px] text-slate-500 font-medium uppercase tracking-widest">Active v2.1</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
