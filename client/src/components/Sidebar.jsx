import React, { useState, useEffect } from 'react';
import { 
  Library, 
  AlertTriangle, 
  BarChart3, 
  BookOpen, 
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  HelpCircle,
  Bell,
  FileCheck,
  MessageSquare,
  X,
  Heart,
  Building2,
  Puzzle,
  Layout,
  Flame,
  Droplets,
  ClipboardList,
  AlertCircle,
  GraduationCap,
  Pill,
  Activity,
  UserCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);

  const sections = React.useMemo(() => [
    {
      title: 'Workplace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'incidents', label: 'Incident Reporting', icon: AlertTriangle, path: '/dashboard/incidents' },
        { id: 'docs', label: 'Document Library', icon: Library, path: '/dashboard/documents' },
      ]
    },
    {
      title: 'Quality & Governance',
      roles: ['SuperAdmin', 'QualityManager', 'admin', 'Quality'],
      items: [
        { id: 'risks', label: 'Enterprise Risks', icon: ShieldCheck, path: '/dashboard/risks' },
        { id: 'audit', label: 'Clinical Audits', icon: FileCheck, path: '/dashboard/audit' },
        { id: 'experience', label: 'Patient Experience', icon: Heart, path: '/dashboard/experience' },
      ]
    },
    {
      title: 'Governance & Standards',
      items: [
        { 
          id: 'jawda', 
          label: 'JAWDA Registries', 
          icon: Layout,
          subItems: [
            { id: 'jawdakpi', label: 'Quarterly KPI Report', icon: BarChart3, path: '/dashboard/kpi' },
            { id: 'aot', label: 'Organ Transplant (AOT)', icon: Activity, path: '/dashboard/jawda/aot' },
            { id: 'asd', label: 'Autism Services (ASD)', icon: Puzzle, path: '/dashboard/jawda/asd' },
            { id: 'bn', label: 'Burn Services (BN)', icon: Flame, path: '/dashboard/jawda/bn' },
            { id: 'df', label: 'Dialysis Facilities (DF)', icon: Droplets, path: '/dashboard/jawda/df' },
          ]
        },
        {
          id: 'clinical',
          label: 'Clinical Governance',
          icon: ShieldCheck,
          subItems: [
            { id: 'ipc', label: 'IPC Command Center', icon: Droplets, path: '/dashboard/ipc' },
            { id: 'meds', label: 'Pharma Safety', icon: Pill, path: '/dashboard/meds' },
            { id: 'training', label: 'Staff Competency', icon: GraduationCap, path: '/dashboard/training' },
            { id: 'compliance', label: 'DOH Compliance', icon: ShieldCheck, path: '/dashboard/compliance' },
            { id: 'fms', label: 'Facility Safety', icon: Building2, path: '/dashboard/fms' },
            { id: 'cp', label: 'Medical Affairs', icon: UserCheck, path: '/dashboard/cp' },
          ]
        }
      ]
    }
  ], []);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { role } = JSON.parse(userInfo);
      setUserRole(role);
    }
  }, []);

  // Auto-expand menu if active item is inside it
  useEffect(() => {
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems && item.subItems.some(sub => location.pathname === sub.path)) {
          setExpandedSubmenu(item.id);
        }
      });
    });
  }, [location.pathname, sections]);

  return (
    <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a] text-white transition-all duration-300 z-50 border-r border-white/5 ${
      isMobile 
        ? (isOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full') 
        : (isOpen ? 'w-72' : 'w-20')
    }`}>
      <div className="flex flex-col h-full relative">
        {/* Mobile Close Button */}
        {isMobile && isOpen && (
          <button 
            onClick={toggleSidebar}
            className="absolute top-6 right-[-50px] w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center border border-white/10 shadow-xl"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
                     const hasSubItems = item.subItems && item.subItems.length > 0;
                     const isExpanded = expandedSubmenu === item.id;
                     const isActive = location.pathname === item.path || (hasSubItems && item.subItems.some(sub => location.pathname === sub.path));
                     const Icon = item.icon;

                     return (
                       <div key={item.id} className="space-y-1">
                         <button
                           onClick={() => {
                             if (hasSubItems) {
                               setExpandedSubmenu(isExpanded ? null : item.id);
                             } else {
                               navigate(item.path);
                               if (isMobile) toggleSidebar();
                             }
                           }}
                           className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                             isActive && !hasSubItems
                             ? 'bg-gradient-to-r from-[#2dd4bf] to-[#3b82f6] text-slate-950 shadow-lg shadow-[#2dd4bf]/20 font-black' 
                             : isActive && hasSubItems
                             ? 'bg-white/10 text-white'
                             : 'text-slate-400 hover:bg-white/5 hover:text-white'
                           }`}
                         >
                           <div className="flex items-center gap-4 relative z-10">
                             <Icon className={`w-5 h-5 ${isActive ? (hasSubItems ? 'text-[#2dd4bf]' : 'text-slate-950') : 'group-hover:text-[#2dd4bf]'} transition-colors`} />
                             {(isOpen || isMobile) && <span className="text-[11px] whitespace-nowrap uppercase tracking-wider">{item.label}</span>}
                           </div>
                           {(isOpen || isMobile) && (
                             hasSubItems ? (
                               <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                             ) : isActive && (
                               <ChevronRight className="w-4 h-4 relative z-10" />
                             )
                           )}
                         </button>

                         {hasSubItems && isExpanded && (isOpen || isMobile) && (
                           <div className="ml-4 pl-4 border-l border-white/10 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                             {item.subItems.map((subItem) => {
                               const isSubActive = location.pathname === subItem.path;
                               const SubIcon = subItem.icon;
                               return (
                                 <button
                                   key={subItem.id}
                                   onClick={() => {
                                     navigate(subItem.path);
                                     if (isMobile) toggleSidebar();
                                   }}
                                   className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                                     isSubActive 
                                     ? 'bg-[#2dd4bf]/10 text-[#2dd4bf] font-bold' 
                                     : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                   }`}
                                 >
                                   <SubIcon className="w-4 h-4" />
                                   <span className="text-[10px] uppercase tracking-wide">{subItem.label}</span>
                                 </button>
                               );
                             })}
                           </div>
                         )}
                       </div>
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
