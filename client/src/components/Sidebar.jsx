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
    <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a] text-white transition-all duration-300 z-50 ${isOpen ? 'w-72' : 'w-20'} border-r border-white/5`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className={`py-8 flex items-center transition-all duration-300 ${isOpen ? 'px-6 gap-4' : 'justify-center'}`}>
          <div className={`shrink-0 overflow-hidden transition-all duration-300 ${isOpen ? 'w-[56px] h-[56px]' : 'w-11 h-11'}`}>
            <img src="/logo.svg" alt="QCare" className="w-full h-full object-contain" />
          </div>
          {isOpen && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-500">
              <span className="font-black text-xl tracking-tighter whitespace-nowrap uppercase">QCare<span className="text-[#2dd4bf]">.</span></span>
              <span className="text-[9px] text-[#2dd4bf]/70 font-black tracking-[0.3em] uppercase">Enterprise</span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-none">
          {sections.map((section, sidx) => {
            if (section.roles && !section.roles.includes(userRole)) return null;

            return (
              <div key={sidx} className="space-y-3">
                 {isOpen && (
                   <h5 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">
                     {section.title}
                   </h5>
                 )}
                 <div className="space-y-1.5">
                   {section.items.map((item) => {
                     if (item.role && item.role !== userRole) return null;
                     const isActive = location.pathname === item.path;
                     const Icon = item.icon;

                     return (
                       <button
                         key={item.id}
                         onClick={() => navigate(item.path)}
                         className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                           isActive 
                           ? 'bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-slate-950 shadow-lg shadow-[#2dd4bf]/20 font-black' 
                           : 'text-slate-400 hover:bg-white/5 hover:text-white'
                         }`}
                       >
                         <div className="flex items-center gap-4 relative z-10">
                           <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'group-hover:text-[#2dd4bf]'} transition-colors`} />
                           {isOpen && <span className="text-[11px] whitespace-nowrap uppercase tracking-wider">{item.label}</span>}
                         </div>
                         {isOpen && isActive && <ChevronRight className="w-4 h-4 relative z-10" />}
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
          <div className="p-6 border-t border-white/5 bg-slate-900/50">
             <div className="bg-[#2dd4bf]/5 p-4 rounded-[1.5rem] flex items-center gap-4 border border-[#2dd4bf]/10 transition-all hover:bg-[#2dd4bf]/10 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[#2dd4bf]/10 flex items-center justify-center border border-[#2dd4bf]/20 group-hover:scale-110 transition-transform">
                   <ShieldCheck className="w-5 h-5 text-[#2dd4bf]" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-white font-black tracking-tight uppercase">Security Unit</span>
                   <span className="text-[8px] text-[#2dd4bf]/60 font-bold uppercase tracking-widest">Active Status</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
