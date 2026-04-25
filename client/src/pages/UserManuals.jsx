import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  BookOpen, 
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  Library,
  Users,
  Building2,
  ShieldCheck,
  FileCheck,
  MessageSquare,
  BarChart3,
  Server,
  Lock,
  X
} from 'lucide-react';

const UserManuals = () => {
  const [role, setRole] = useState('user');
  const [selectedGuide, setSelectedGuide] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setRole(JSON.parse(userInfo).role);
    }
  }, []);

  const isAdmin = role === 'admin' || role === 'superadmin';

  const userGuides = [
    {
      title: 'Incident Management',
      icon: AlertTriangle,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      description: 'Learn how to report safety incidents, track their status, and communicate with the Quality Control team regarding investigations.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>The Incident Management module is your primary tool for reporting any adverse events, near-misses, or safety concerns within the hospital.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">How to Report an Incident</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Navigate to the <strong>Incidents</strong> tab in the sidebar.</li>
            <li>Click the gold <strong>+ Report Incident</strong> button in the top right.</li>
            <li>Fill out the classification, severity, and specific location.</li>
            <li>Provide a detailed, objective description of what occurred.</li>
            <li>Submit the form. A unique tracking ID (e.g., CMCINC-001) will be generated.</li>
          </ol>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Tracking Status</h4>
          <p>Once submitted, the Quality Control team will review it. You can check back on the Incidents page to see if the status changes from <em>Open</em> to <em>Under Investigation</em> or <em>Closed</em>.</p>
        </div>
      )
    },
    {
      title: 'Document Library',
      icon: Library,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
      description: 'Navigate the centralized repository of hospital policies, procedures, and forms. Learn how to preview and download approved documents.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>The Document Library acts as the single source of truth for all QCare standard operating procedures, policies, and blank forms.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Browsing & Searching</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the search bar to find documents by title, ID, or keyword.</li>
            <li>Filter by classification (Clinical, Administrative, IT, etc.) to narrow down results.</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Viewing Documents</h4>
          <p>Click the <strong>View</strong> button (eye icon) next to any document to open the built-in PDF viewer. You can read the document directly within the application without needing external software.</p>
        </div>
      )
    },
    {
      title: 'Help Desk & Support',
      icon: HelpCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      description: 'Submit IT or maintenance tickets, track issue resolution progress, and contact administrative support for system access problems.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>If you encounter technical issues with the portal or need assistance with your credentials, the Help Desk is your direct line to the IT Department.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Creating a Ticket</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Go to <strong>Help Desk</strong> in the sidebar.</li>
            <li>Select the category (IT Issue, Access Request, General Inquiry).</li>
            <li>Provide a clear description of your problem.</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Contacting the Team Directly</h4>
          <p>Emergency contact numbers and direct IT extension lines are listed at the top of the Help Desk page for critical system outages.</p>
        </div>
      )
    },
    {
      title: 'Profile Management',
      icon: Lock,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      description: 'Update your personal details, change your password, and view your recent system activity via the slide-out profile drawer.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>Your profile drawer allows you to manage your personal credentials and preferences without leaving the page you are currently on.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Accessing Your Profile</h4>
          <p>Click on your name or avatar in the top-right corner of the top navigation bar. The profile drawer will slide out from the right side of the screen.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Changing Passwords</h4>
          <p>If your account is a "Local" account, you can change your password directly in the drawer. <em>Note: If you are authenticated via Active Directory (LDAP), password changes must be done through your standard Windows/IT process.</em></p>
        </div>
      )
    }
  ];

  const adminGuides = [
    {
      title: 'User & Access Management',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      description: 'Onboard new professionals, assign roles, block accounts, and oversee Active Directory (LDAP) synchronization workflows.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <h4 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">Overview</h4>
          <p>The User Management module allows Administrators to control who has access to the QCare system and what level of privilege they possess.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Adding Users Manually</h4>
          <p>Click <strong>Add New Professional</strong> to create a local account. You must assign an Employee ID, Name, Department, and Role. This is useful for external contractors who are not in Active Directory.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Managing LDAP Users</h4>
          <p>Users synchronized from Active Directory will have an "LDAP" badge next to their name. If AD is missing a specific attribute (like Department), you can click Edit to manually override it within QCare. The nightly sync will respect your manual overrides.</p>
        </div>
      )
    },
    {
      title: 'System Settings & LDAP',
      icon: Server,
      color: 'text-[#b59662]',
      bg: 'bg-[#b59662]/10',
      description: 'Configure multiple Active Directory servers, map attributes, set global branding colors, and define system-wide security policies.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
           <h4 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">Active Directory (LDAP) Configurations</h4>
           <p>The system supports multiple Active Directory domain configurations. To manage an existing AD connection, click <strong>Edit</strong> on the specific card, modify the Bind DN, URL, or Password, and click <strong>Save</strong>.</p>
           <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Triggering a Sync</h4>
           <p>While the system runs an automated background sync every night at midnight, you can force an immediate sync from the <strong>System Logs</strong> tab by clicking "Trigger Manual Sync".</p>
           <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Global Preferences</h4>
           <p>Use the Global tab to change the organization name and the primary brand color (which updates the gold accents across the portal).</p>
        </div>
      )
    },
    {
      title: 'Risk & Audit Control',
      icon: ShieldCheck,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      description: 'Manage the hospital risk register, schedule internal/external compliance audits, and generate non-conformity reports.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>This module provides advanced oversight into clinical and operational risks.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Risk Register</h4>
          <p>Log identified risks, calculate their inherent risk score (Probability × Impact), and assign mitigation strategies. Risks should be reviewed periodically based on their severity.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Audit Management</h4>
          <p>Schedule internal audits across various departments. Once an audit is completed, log the non-conformities found and track corrective actions directly through the system.</p>
        </div>
      )
    },
    {
      title: 'KPI & Analytics Dashboard',
      icon: BarChart3,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      description: 'Monitor hospital performance metrics, create custom data visualizations, and export monthly quality reports.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>The KPI Monitor aggregates data across the hospital to provide a bird's-eye view of operational performance.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Key Capabilities</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>Track target vs actual performance across different clinical indicators.</li>
            <li>Identify underperforming departments using heatmaps.</li>
            <li>Export visual charts for monthly board meetings.</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Department Master',
      icon: Building2,
      color: 'text-teal-500',
      bg: 'bg-teal-50',
      description: 'Add new clinical and non-clinical departments, assign department heads, and structure the organizational hierarchy.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>Maintain the foundational organizational structure of the hospital.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Managing Departments</h4>
          <p>When you add or rename a department in the Master list, the change instantly ripples through the entire system. Dropdowns in Incident Reporting, Document Library, and User Management will automatically reflect the latest department names.</p>
        </div>
      )
    },
    {
      title: 'Patient Feedback',
      icon: MessageSquare,
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      description: 'Review patient satisfaction surveys, respond to complaints, and analyze feedback trends over time.',
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>Monitor the voice of the patient through automated feedback analysis.</p>
          <h4 className="font-bold text-slate-800 mt-6 text-base border-b border-slate-100 pb-2">Handling Complaints</h4>
          <p>When a negative piece of feedback is registered, Quality Control admins can open the record, investigate the claim, and log corrective actions taken to satisfy the patient complaint.</p>
        </div>
      )
    }
  ];

  const activeGuides = isAdmin ? [...userGuides, ...adminGuides] : userGuides;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto min-h-[calc(100vh-160px)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Help</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">User Manuals</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Documentation</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-80">
              {isAdmin ? 'Complete Administrator & User Guides' : 'Employee Portal Guides'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeGuides.map((guide, index) => (
            <div key={index} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
               <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-slate-50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
               
               <div className="relative z-10 flex flex-col flex-1">
                 <div className={`w-14 h-14 rounded-2xl ${guide.bg} flex items-center justify-center mb-6`}>
                    <guide.icon className={`w-7 h-7 ${guide.color}`} />
                 </div>
                 
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">
                   {guide.title}
                 </h3>
                 
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8 flex-1">
                   {guide.description}
                 </p>
                 
                 <button 
                   onClick={() => setSelectedGuide(guide)}
                   className="flex items-center gap-2 text-[10px] font-black text-[#b59662] uppercase tracking-widest group/btn mt-auto self-start"
                 >
                   <span>Read Documentation</span>
                   <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedGuide(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl relative w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-xl ${selectedGuide.bg} flex items-center justify-center`}>
                    <selectedGuide.icon className={`w-6 h-6 ${selectedGuide.color}`} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {selectedGuide.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      Module Documentation
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)} 
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
              {selectedGuide.content}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 shrink-0 bg-white flex justify-end">
              <button 
                onClick={() => setSelectedGuide(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors active:scale-95"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserManuals;
