import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ShieldCheck } from 'lucide-react';
import { roleOptions } from '../utils/roles';
const descriptions = {
 SuperAdmin: 'Full system administration, user management, and quality workflow review.',
 admin: 'User and operational administration. Audit approval remains with Quality Manager or Superadmin.',
 QualityManager: 'Quality oversight, audit approval, assessment review and template management. Audit schedules created or edited by this role publish immediately.',
 QualityOfficer: 'Submit audit schedules for Quality Manager approval and work on assigned or requested audits. Cannot approve schedules or delete audits.',
 user: 'Use assigned services, submit requests and view permitted records.'
};
export default function ApplicationRoles() {
 return <DashboardLayout><section className="p-6 max-w-6xl mx-auto"><div className="flex items-center gap-3 mb-4"><ShieldCheck className="text-teal-700"/><h1 className="text-2xl font-bold text-slate-800">Application roles</h1></div><p className="text-slate-600 mb-6">The portal uses five fixed roles. Permissions are enforced by the application. Assign a role from User Management.</p><div className="grid gap-4 md:grid-cols-2">{roleOptions.map(role=><article key={role.value} className="bg-white border border-slate-200 rounded-xl p-6"><h2 className="font-bold text-lg text-slate-800 mb-2">{role.label}</h2><p className="text-sm text-slate-600 leading-relaxed">{descriptions[role.value]}</p></article>)}</div></section></DashboardLayout>;
}
