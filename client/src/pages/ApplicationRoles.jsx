import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import {
  ChevronRight,
  FileCheck,
  Lock,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  Plus,
  X
} from 'lucide-react';

/* ─────────────────────────────────────────
   Shared button design tokens (black & white)
   ───────────────────────────────────────── */

// Primary — solid black, white text
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-slate-800 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-black transition-all duration-150 select-none';

// Secondary / Cancel — white bg, black border
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-black text-[10px] font-black uppercase tracking-widest rounded-xl border border-black/20 hover:border-black/40 transition-all duration-150 select-none';

// Icon-only — ghost, tight padding
const btnIcon = 'inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-black hover:bg-black hover:text-white text-slate-500 transition-all duration-150 active:scale-95 select-none';

// Icon danger — becomes red on hover
const btnIconDanger = 'inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all duration-150 active:scale-95 select-none';

// Permission pill — unchecked white / checked solid black
const permOff = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700 text-[9px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 select-none';
const permOn  = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black bg-black text-white text-[9px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 select-none';

const ApplicationRoles = () => {
  const { showNotification, confirm } = useNotification();

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem('app_roles');
    return saved ? JSON.parse(saved) : [
      { id: 'SuperAdmin',     label: 'SuperAdmin',      description: 'Global administrative privileges, database structure controls, system configs.' },
      { id: 'QualityManager', label: 'Quality Manager', description: 'Oversees QMS audits, clinical privileges, compliance circulars and investigations.' },
      { id: 'DepartmentHead', label: 'Department Head', description: 'Manages department specific files, indicators, and approves incident reports.' },
      { id: 'Staff',          label: 'General Staff',   description: 'Reports incidents, views document library, completes training records.' }
    ];
  });

  const [activeRole, setActiveRole] = useState('QualityManager');

  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('app_permissions');
    return saved ? JSON.parse(saved) : {
      SuperAdmin:     { documents: { read: true,  write: true,  delete: true,  audit: true  }, incidents: { read: true,  write: true,  delete: true,  audit: true  }, risks: { read: true,  write: true,  delete: true,  audit: true  }, audits: { read: true,  write: true,  delete: true,  audit: true  }, settings: { read: true,  write: true,  delete: true,  audit: true  } },
      QualityManager: { documents: { read: true,  write: true,  delete: false, audit: true  }, incidents: { read: true,  write: true,  delete: false, audit: true  }, risks: { read: true,  write: true,  delete: false, audit: true  }, audits: { read: true,  write: true,  delete: false, audit: true  }, settings: { read: true,  write: false, delete: false, audit: false } },
      DepartmentHead: { documents: { read: true,  write: true,  delete: false, audit: false }, incidents: { read: true,  write: true,  delete: false, audit: false }, risks: { read: true,  write: false, delete: false, audit: false }, audits: { read: true,  write: true,  delete: false, audit: false }, settings: { read: false, write: false, delete: false, audit: false } },
      Staff:          { documents: { read: true,  write: false, delete: false, audit: false }, incidents: { read: true,  write: true,  delete: false, audit: false }, risks: { read: false, write: false, delete: false, audit: false }, audits: { read: false, write: false, delete: false, audit: false }, settings: { read: false, write: false, delete: false, audit: false } }
    };
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleForm, setRoleForm]           = useState({ label: '', description: '' });
  const [editingRoleId, setEditingRoleId] = useState('');

  /* ── handlers ── */
  const handleToggle = (module, action) =>
    setPermissions(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [module]: { ...prev[activeRole][module], [action]: !prev[activeRole][module][action] }
      }
    }));

  const handleSave = () => {
    localStorage.setItem('app_roles', JSON.stringify(roles));
    localStorage.setItem('app_permissions', JSON.stringify(permissions));
    showNotification('Roles and permissions matrix saved successfully!', 'success');
  };

  const openAdd = () => {
    setIsEditingRole(false);
    setRoleForm({ label: '', description: '' });
    setShowRoleModal(true);
  };

  const openEdit = (role) => {
    setIsEditingRole(true);
    setEditingRoleId(role.id);
    setRoleForm({ label: role.label, description: role.description });
    setShowRoleModal(true);
  };

  const handleDelete = (role) => {
    if (role.id === 'SuperAdmin') {
      showNotification('The SuperAdmin role is protected and cannot be deleted.', 'error');
      return;
    }
    confirm({
      title: 'Delete Role',
      message: `Are you sure you want to permanently delete the "${role.label}" role? This cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        setRoles(prev => prev.filter(r => r.id !== role.id));
        setPermissions(prev => { const c = { ...prev }; delete c[role.id]; return c; });
        if (activeRole === role.id) setActiveRole('SuperAdmin');
        showNotification(`Role "${role.label}" has been deleted.`, 'warning');
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const label = roleForm.label.trim();
    if (!label) return;

    if (isEditingRole) {
      setRoles(prev => prev.map(r => r.id === editingRoleId ? { ...r, label, description: roleForm.description.trim() } : r));
      showNotification(`Role "${label}" updated successfully.`, 'success');
    } else {
      const id = label.replace(/\s+/g, '');
      if (roles.some(r => r.id.toLowerCase() === id.toLowerCase())) {
        showNotification('A role with this name already exists. Choose a different name.', 'error');
        return;
      }
      setRoles(prev => [...prev, { id, label, description: roleForm.description.trim() }]);
      setPermissions(prev => ({
        ...prev,
        [id]: {
          documents: { read: false, write: false, delete: false, audit: false },
          incidents: { read: false, write: false, delete: false, audit: false },
          risks:     { read: false, write: false, delete: false, audit: false },
          audits:    { read: false, write: false, delete: false, audit: false },
          settings:  { read: false, write: false, delete: false, audit: false }
        }
      }));
      setActiveRole(id);
      showNotification(`Role "${label}" created successfully.`, 'success');
    }
    setShowRoleModal(false);
  };

  const modules = [
    { key: 'documents', label: 'Document Library (QMS)', desc: 'Document control and SOP manuals' },
    { key: 'incidents', label: 'Incident Reporting',     desc: 'Incident submissions and tracking log' },
    { key: 'risks',     label: 'Risk Management',        desc: 'Risk register, mitigations and analytics' },
    { key: 'audits',    label: 'Audits & Inspections',   desc: 'Clinical audit scheduling and verification' },
    { key: 'settings',  label: 'System Settings',        desc: 'LDAP syncing, password policies and audit logs' }
  ];

  const permActions = [
    { action: 'read',   label: 'Read',   icon: Eye       },
    { action: 'write',  label: 'Write',  icon: Edit3     },
    { action: 'delete', label: 'Delete', icon: Trash2    },
    { action: 'audit',  label: 'Audit',  icon: FileCheck }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">

        {/* ── Page Header ── */}
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">
            <span>Home</span>
            <ChevronRight className="w-2.5 h-2.5" />
            <span>Security & Access</span>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-black">Application Roles Matrix</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">Application Roles & Permissions</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Roles Panel ── */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">

              {/* panel header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h4 className="text-[10px] font-black text-black uppercase tracking-widest">System Roles</h4>
                </div>
                {/* Add Role — primary black icon button */}
                <button onClick={openAdd} title="Add New Role" className={btnPrimary + ' px-3 py-2'}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              {/* role list */}
              <div className="p-4 space-y-2">
                {roles.map((r) => {
                  const isActive = activeRole === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveRole(r.id)}
                      className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-150 ${
                        isActive
                          ? 'bg-black border-black'
                          : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className={`font-bold text-sm tracking-tight ${isActive ? 'text-white' : 'text-black'}`}>
                            {r.label}
                          </div>
                          <p className={`text-[10px] font-medium leading-relaxed mt-1 ${isActive ? 'text-white/60' : 'text-slate-500'}`}>
                            {r.description}
                          </p>
                        </div>
                        {/* inline action icons — appear on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                            title="Edit Role"
                            className={isActive ? 'inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95' : btnIcon}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {r.id !== 'SuperAdmin' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                              title="Delete Role"
                              className={isActive ? 'inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500 text-white transition-all active:scale-95' : btnIconDanger}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* security notice */}
            <div className="p-6 rounded-[2rem] bg-black text-white flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Security Warning</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-white/60">
                Changes to the roles permissions matrix instantly affect active user sessions.
                Grant permissions with caution. Ensure at least one role maintains SuperAdmin
                access to prevent lockout.
              </p>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

          {/* ── Right: Permissions Matrix ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">

              {/* matrix header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Module Authorization Matrix</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Editing:&nbsp;<span className="font-black text-black uppercase">{activeRole}</span>
                  </p>
                </div>
                {/* Save — primary black */}
                <button onClick={handleSave} className={btnPrimary}>
                  Save Matrix
                </button>
              </div>

              {/* rows */}
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                {modules.map((m) => {
                  const perms = permissions[activeRole]?.[m.key] || { read: false, write: false, delete: false, audit: false };
                  return (
                    <div key={m.key} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div>
                        <div className="font-bold text-black text-sm tracking-tight">{m.label}</div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{m.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {permActions.map(({ action, label, icon: Icon }) => (
                          <button
                            key={action}
                            onClick={() => handleToggle(m.key, action)}
                            className={perms[action] ? permOn : permOff}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Add / Edit Role Modal ── */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
            <div className="bg-white rounded-[2rem] shadow-2xl relative w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

              {/* modal header */}
              <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black tracking-tight">
                      {isEditingRole ? 'Edit Role' : 'Add New Role'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {isEditingRole ? 'Update label and description' : 'Define a custom role and its scope'}
                    </p>
                  </div>
                </div>
                {/* Close — icon button */}
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={btnIcon}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* modal form */}
              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Role Label</label>
                  <input
                    value={roleForm.label}
                    onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })}
                    required
                    placeholder="e.g. Clinical Director"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-black transition-all text-sm font-semibold text-black placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Role Description</label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    required
                    rows={3}
                    placeholder="Describe the access permissions and scope of this role..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-black transition-all text-sm font-semibold text-black resize-none placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>

                {/* form actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRoleModal(false)} className={btnSecondary + ' flex-1'}>
                    Cancel
                  </button>
                  <button type="submit" className={btnPrimary + ' flex-[2]'}>
                    {isEditingRole ? 'Save Changes' : 'Publish Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </div>
    </DashboardLayout>
  );
};

export default ApplicationRoles;
