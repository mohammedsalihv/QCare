import React from 'react';
import { 
  X, 
  Users, 
  Building2, 
  Settings,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Award,
  Lock,
  UserCheck,
  KeyRound,
  Database,
  MailSearch,
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SystemManagementDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const sections = [
    {
      title: 'Staff & Credentials',
      items: [
        { 
          id: 'users', 
          label: 'Staff Master', 
          icon: Users, 
          path: '/dashboard/users', 
          color: 'bg-indigo-500', 
          shadow: 'shadow-indigo-200/50', 
          description: 'Manage employee directories, onboarding, and access status.' 
        },
        { 
          id: 'designations', 
          label: 'Designation Master', 
          icon: Briefcase, 
          path: '/dashboard/designation-master', 
          color: 'bg-[var(--color-primary)]', 
          shadow: 'shadow-[var(--color-primary)]/20', 
          description: 'Configure official organizational designations and grades.' 
        },
        { 
          id: 'credentials', 
          label: 'Mall Credential', 
          icon: Award, 
          path: '/dashboard/mall-credential', 
          color: 'bg-emerald-500', 
          shadow: 'shadow-emerald-200/50', 
          description: 'Track staff clinical licenses, compliance training, and certifications.' 
        }
      ]
    },
    {
      title: 'Access & Control',
      items: [
        { 
          id: 'roles', 
          label: 'Application Roles', 
          icon: Lock, 
          path: '/dashboard/application-roles', 
          color: 'bg-purple-500', 
          shadow: 'shadow-purple-200/50', 
          description: 'Manage roles and system-wide permission matrices.' 
        },
        { 
          id: 'assignment', 
          label: 'User Assignment', 
          icon: UserCheck, 
          path: '/dashboard/user-assignment', 
          color: 'bg-amber-500', 
          shadow: 'shadow-amber-200/50', 
          description: 'Assign users to departments and manage local privileges.' 
        },
        { 
          id: 'passwords', 
          label: 'Password Management', 
          icon: KeyRound, 
          path: '/dashboard/password-management', 
          color: 'bg-rose-500', 
          shadow: 'shadow-rose-200/50', 
          description: 'Enforce password complexity, resets, and MFA rules.' 
        }
      ]
    },
    {
      title: 'System Logs & Config',
      items: [
        { 
          id: 'settings', 
          label: 'Global Settings', 
          icon: Settings, 
          path: '/dashboard/settings', 
          color: 'bg-slate-700', 
          shadow: 'shadow-slate-200/50', 
          description: 'Configure LDAP settings, directories, and server endpoints.' 
        },
        { 
          id: 'audit_log', 
          label: 'System Audit Log', 
          icon: Database, 
          path: '/dashboard/audit-log', 
          color: 'bg-teal-600', 
          shadow: 'shadow-teal-200/50', 
          description: 'Access full database change log history and admin activities.' 
        },
        { 
          id: 'mail_log', 
          label: 'Mail Log', 
          icon: MailSearch, 
          path: '/dashboard/mail-log', 
          color: 'bg-sky-500', 
          shadow: 'shadow-sky-200/50', 
          description: 'Review system-generated notification emails and statuses.' 
        },
        { 
          id: 'reports', 
          label: 'Report Generator', 
          icon: BarChart2, 
          path: '/dashboard/report-generator', 
          color: 'bg-cyan-600', 
          shadow: 'shadow-cyan-200/50', 
          description: 'Generate and export administrative, staff, and audit reports.' 
        }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-white/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-[70] transition-transform duration-500 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-black font-bold uppercase tracking-tight">Admin Control</h2>
              <p className="text-[10px] text-black font-bold font-bold uppercase tracking-[0.2em] mt-1">Administrative Controls</p>
            </div>
            <button 
              onClick={handleClose}
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 text-black font-bold hover:text-black font-bold transition-all active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Info */}
          <div className="p-8 pb-0">
             <div className="p-5 rounded-3xl bg-[#040404] text-white relative overflow-hidden shadow-xl shadow-slate-200">
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center">
                         <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Admin Privileges Active</span>
                   </div>
                   <p className="text-xs font-medium leading-relaxed text-slate-350">
                      You have full access to system configuration. Use these tools to manage users, roles, credential matrices, and system log trails.
                   </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-[var(--color-primary)]/10 rounded-full blur-3xl"></div>
             </div>
          </div>

          {/* Management Items */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-4">
                  {section.title}
                  <div className="flex-1 h-px bg-slate-100"></div>
                </h4>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full bg-white p-4.5 rounded-2xl border border-slate-100 hover:border-[var(--color-primary)]/30 hover:bg-slate-50 transition-all group text-left flex items-start gap-4 shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                      <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg ${item.shadow} group-hover:scale-105 transition-transform shrink-0`}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-black text-black font-bold text-xs uppercase tracking-tight truncate">{item.label}</h4>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-450 font-bold font-medium leading-relaxed pr-4 line-clamp-2">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50">
             <div className="flex items-center justify-between">
                <span className="text-[9px] text-black font-bold font-black uppercase tracking-widest">QCare Enterprise v1.0.4</span>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-black font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   SECURE SESSION
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemManagementDrawer;
