import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  Building2,
  CalendarDays
} from 'lucide-react';

const ProfileDrawer = ({ isOpen, onClose, user = { name: 'User', id: 'N/A', dept: 'N/A', role: 'N/A', email: 'N/A' } }) => {

  const handleClose = () => {
    onClose();
  };

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
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-extrabold text-slate-900">User Profile</h2>
            <button 
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="p-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#b59662] to-[#8a7249] p-1 shadow-xl shadow-[#b59662]/20">
                <div className="w-full h-full rounded-[20px] bg-white p-1 overflow-hidden">
                   <img 
                     src={`https://ui-avatars.com/api/?name=${user.name}&background=b59662&color=fff&size=200&bold=true`} 
                     alt={user.name}
                     className="w-full h-full object-cover rounded-[18px]"
                   />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg">
                 <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h3>
            <p className="text-sm font-semibold text-[#b59662] uppercase tracking-[0.2em] mt-1 opacity-90">{user.role}</p>
            
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Session</span>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-4">
               <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 Professional Information
                 <div className="flex-1 h-[1px] bg-slate-100"></div>
               </h4>
               
               <div className="grid grid-cols-1 gap-4">
                 <DetailItem label="Employee ID" value={user.id} icon={User} />
                 <DetailItem label="Department" value={user.dept} icon={Building2} />
                 <DetailItem label="Official Email" value={user.email} icon={Mail} />

                 <DetailItem 
                   label="Last Login" 
                   value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', {
                     day: '2-digit',
                     month: 'short',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   }) : 'First Session'} 
                   icon={CalendarDays} 
                 />
               </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-auto p-8 border-t border-slate-100 bg-slate-50/50">
             <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
               QCare Secure Environment v1.0.4
             </p>
          </div>
        </div>
      </div>
    </>
  );
};

const DetailItem = ({ label, value, icon: Icon, status }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
    <div className="p-2.5 rounded-xl bg-white text-slate-400 shadow-inner-sm">
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        {status && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">{status}</span>}
      </div>
    </div>
  </div>
);

export default ProfileDrawer;
