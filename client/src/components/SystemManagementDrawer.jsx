import React from 'react';
import { 
  X, 
  Users, 
  Building2, 
  Settings,
  ChevronRight,
  ShieldCheck,
  Zap
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

  const items = [
    { 
      id: 'users', 
      label: 'User Directory', 
      icon: Users, 
      path: '/dashboard/users', 
      color: 'bg-indigo-500', 
      shadow: 'shadow-indigo-200/50', 
      description: 'Manage employee access, roles and permissions.' 
    },
    { 
      id: 'departments', 
      label: 'Departments', 
      icon: Building2, 
      path: '/dashboard/departments', 
      color: 'bg-[#2dd4bf]', 
      shadow: 'shadow-[#2dd4bf]/20', 
      description: 'Configure hospital units and organizational structure.' 
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      icon: Settings, 
      path: '/dashboard/settings', 
      color: 'bg-slate-700', 
      shadow: 'shadow-slate-200/50', 
      description: 'Global system configuration and LDAP parameters.' 
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
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
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Management</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Administrative Controls</p>
            </div>
            <button 
              onClick={handleClose}
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Info */}
          <div className="p-8 pb-0">
             <div className="p-5 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl shadow-slate-200">
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-[#2dd4bf]/20 flex items-center justify-center">
                         <ShieldCheck className="w-4 h-4 text-[#2dd4bf]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#2dd4bf]">Admin Privileges Active</span>
                   </div>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      You have full access to system configuration. Use these tools to manage users, organizational units, and global settings.
                   </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-[#2dd4bf]/10 rounded-full blur-3xl"></div>
             </div>
          </div>

          {/* Management Items */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-none">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
               CORE MODULES
               <div className="flex-1 h-px bg-slate-100"></div>
            </h4>

            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-[#2dd4bf]/30 hover:bg-slate-50 transition-all group text-left flex items-start gap-5 shadow-sm hover:shadow-lg active:scale-[0.98]"
              >
                <div className={`p-4 rounded-2xl ${item.color} text-white shadow-lg ${item.shadow} group-hover:scale-110 transition-transform shrink-0`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-slate-900 text-[13px] uppercase tracking-tight">{item.label}</h4>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2dd4bf] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed pr-4">{item.description}</p>
                </div>
              </button>
            ))}

            <div className="mt-12 p-6 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <Zap className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">More Tools Coming Soon</span>
            </div>
          </div>

          {/* Footer Section */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50">
             <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">QCare Enterprise v1.0.4</span>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-900 uppercase tracking-widest">
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
