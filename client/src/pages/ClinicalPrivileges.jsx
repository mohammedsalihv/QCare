import UserSelect from '../components/UserSelect';
import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
import { useNotification } from '../components/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Shield, 
  ShieldCheck, 
  Award, 
  FileText, 
  Search, 
  UserCheck, 
  History, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  UserX, 
  Layers, 
  Settings, 
  ClipboardList, 
  Bell, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  ArrowRight,
  UploadCloud,
  ChevronRight,
  Download
} from 'lucide-react';

const ClinicalPrivileges = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('procedures-master');

  // Sidebar Menu Items
  const menuItems = [
    { id: 'procedures-master', label: 'Procedures Master', icon: BookOpen },
    { id: 'privilege-submaster', label: 'Privilege SubMaster', icon: Layers },
    { id: 'notification-master', label: 'Notification Master', icon: Bell },
    { id: 'privilege-search', label: 'Privilege Search', icon: Search },
    { id: 'apply-renew', label: 'Apply/Renew Privilege', icon: FileText },
    { id: 'privilege-approval', label: 'Privilege Approval', icon: UserCheck },
    { id: 'privilege-approval-master', label: 'Privilege Approval Master', icon: ClipboardList },
    { id: 'amend-privilege', label: 'Amend Privilege', icon: Edit3 },
    { id: 'hold-terminate', label: 'Hold/Unhold/Terminate Privilege', icon: UserX },
    { id: 'privilege-archive', label: 'Privilege Archive', icon: History },
    { id: 'document-expiry-monitor', label: 'Document Expiry Monitor', icon: Calendar },
    { id: 'normal-dashboard', label: 'Normal Dashboard', icon: TrendingUp },
    { id: 'hod-dashboard', label: 'HOD Dashboard', icon: ShieldCheck }
  ];

  // ---------------------------------------------------------------------------
  // MOCK DATA & STATES
  // ---------------------------------------------------------------------------
  
  // Procedures Master State
  const [procedureType, setProcedureType] = useState('');
  const [procCategorySearch, setProcCategorySearch] = useState('');
  const [procSearch, setProcSearch] = useState('');
  
  const [categories, setCategories] = useState([
    { id: 1, name: 'Cardiology Procedures', addedBy: 'Dr. Sarah Connor', date: '2026-05-12' },
    { id: 2, name: 'Orthopedic Surgery', addedBy: 'Admin User', date: '2026-06-01' },
    { id: 3, name: 'General Anaesthesia', addedBy: 'Dr. John Doe', date: '2026-06-15' }
  ]);

  const [procedures, setProcedures] = useState([
    { id: 1, category: 'Cardiology Procedures', name: 'Diagnostic Cardiac Catheterization', req: 'ACLS, Logbook (50 cases)' },
    { id: 2, category: 'Orthopedic Surgery', name: 'Total Knee Arthroplasty', req: 'Board Certification, Logbook (30 cases)' },
    { id: 3, category: 'General Anaesthesia', name: 'Intubation & Airway Management', req: 'BLS, ACLS' }
  ]);

  const [approvers, setApprovers] = useState([
    { id: 1, name: 'Dr. Yahya Mannooparambil', dept: 'Cardiology / Medical Director' },
    { id: 2, name: 'Dr. Robert Fischer', dept: 'Orthopedics / HOD' }
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newProcName, setNewProcName] = useState('');
  const [newProcCat, setNewProcCat] = useState('');
  const [newProcReq, setNewProcReq] = useState('');

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddProcModal, setShowAddProcModal] = useState(false);

  // Privilege SubMaster State
  const [submasterRole, setSubmasterRole] = useState('Consultant');
  const [submasterSpecialty, setSubmasterSpecialty] = useState('Cardiology');
  const [submasterReqs, setSubmasterReqs] = useState({
    bls: true,
    acls: true,
    pals: false,
    boardCert: true,
    logbook: true
  });

  // Notification Master State
  const [notifTrigger, setNotifTrigger] = useState('Application Received');
  const [notifCC, setNotifCC] = useState(true);
  const [notifRules, setNotifRules] = useState([
    { id: 1, trigger: 'Application Received', cc: 'Yes', template: 'Dear HOD, a new application has been submitted...' },
    { id: 2, trigger: 'Expiring in 30 Days', cc: 'No', template: 'Dear Clinician, your privilege for [Procedure] is expiring soon...' }
  ]);

  // Privilege Search State
  const [searchClinician, setSearchClinician] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchStatus, setSearchStatus] = useState('All');
  const [searchResults, setSearchResults] = useState([
    { id: 1, name: 'Dr. James Smith', specialty: 'Cardiology', approvedCount: 12, expiry: '2027-02-14', status: 'Active' },
    { id: 2, name: 'Dr. Emily Watson', specialty: 'Orthopedics', approvedCount: 8, expiry: '2026-08-30', status: 'Expiring Soon' },
    { id: 3, name: 'Dr. Alistair Cook', specialty: 'Pediatrics', approvedCount: 5, expiry: '2026-05-10', status: 'Expired' }
  ]);

  // Apply/Renew State
  const [applyStep, setApplyStep] = useState(1);
  const [applyClinician, setApplyClinician] = useState('');
  const [applySpecialty, setApplySpecialty] = useState('Cardiology');
  const [applyProcs, setApplyProcs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Approvals Queue State
  const [approvals, setApprovals] = useState([
    { id: 1, applicant: 'Dr. Emily Watson', specialty: 'Orthopedics', dateApplied: '2026-07-02', status: 'Pending HOD Approval' },
    { id: 2, applicant: 'Dr. Alistair Cook', specialty: 'Pediatrics', dateApplied: '2026-07-04', status: 'Pending Committee Review' }
  ]);

  // Approval Workflow Master State
  const [workflowLevels, setWorkflowLevels] = useState([
    { level: 1, role: 'Department Head (HOD)', mandate: 'Clinical verification of cases logbook' },
    { level: 2, role: 'Credentialing Committee Chair', mandate: 'Secondary source verification check' },
    { level: 3, role: 'Chief Medical Director', mandate: 'Final execution and registry stamp' }
  ]);

  // Expiry Monitor State
  const [expiryDocs, setExpiryDocs] = useState([
    { id: 1, doctor: 'Dr. Emily Watson', docName: 'BLS Certificate', daysLeft: 12, status: 'Critical' },
    { id: 2, doctor: 'Dr. James Smith', docName: 'DOH Professional License', daysLeft: 45, status: 'Warning' },
    { id: 3, doctor: 'Dr. Sarah Connor', docName: 'Medical Malpractice Insurance', daysLeft: 80, status: 'Healthy' }
  ]);

  // ---------------------------------------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleAddCategory = () => {
    if (!newCatName) return;
    setCategories([
      ...categories,
      { id: Date.now(), name: newCatName, addedBy: 'Current User', date: new Date().toISOString().split('T')[0] }
    ]);
    setNewCatName('');
    setShowAddCatModal(false);
  };

  const handleAddProcedure = () => {
    if (!newProcName || !newProcCat) return;
    setProcedures([
      ...procedures,
      { id: Date.now(), category: newProcCat, name: newProcName, req: newProcReq || 'None' }
    ]);
    setNewProcName('');
    setNewProcReq('');
    setShowAddProcModal(false);
  };

  const handleApplyProcToggle = (procName) => {
    if (applyProcs.includes(procName)) {
      setApplyProcs(applyProcs.filter(p => p !== procName));
    } else {
      setApplyProcs([...applyProcs, procName]);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles([...uploadedFiles, ...files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(2) }))]);
  };

  // ---------------------------------------------------------------------------
  // TAB CONDITIONAL RENDERING
  // ---------------------------------------------------------------------------
  const renderTabContent = () => {
    switch (activeTab) {
      // 1. PROCEDURES MASTER
      case 'procedures-master':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Procedures Master</h3>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Configure Clinical Privilege Procedures and Approvers</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Fetch Approver List
                </button>
                <button className="px-4 py-2.5 bg-primary hover:bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5" /> Replace Approvers
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-end gap-4">
              <div className="flex-1">
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Procedure Type*</label>
                <Select 
                  value={procedureType} 
                  onChange={(e) => setProcedureType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="">Select</option>
                  <option value="Surgical">Surgical</option>
                  <option value="Non-Surgical">Non-Surgical</option>
                  <option value="Diagnostic">Diagnostic</option>
                  <option value="Interventional">Interventional</option>
                </Select>
              </div>
              <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">
                Fetch Details
              </button>
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Procedure Categories</h4>
                  <button 
                    onClick={() => setShowAddCatModal(true)}
                    className="px-3 py-1.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Procedure Category
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search Procedure Category..."
                    value={procCategorySearch}
                    onChange={(e) => setProcCategorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                        <th className="p-3">S.No</th>
                        <th className="p-3">Procedure Category</th>
                        <th className="p-3">Added/Edited By</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categories.filter(c => c.name.toLowerCase().includes(procCategorySearch.toLowerCase())).map((cat, idx) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-700">{cat.name}</td>
                          <td className="p-3 text-slate-500">{cat.addedBy}</td>
                          <td className="p-3">
                            <button className="text-red-500 hover:text-red-600 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Procedures Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Procedures</h4>
                  <button 
                    onClick={() => setShowAddProcModal(true)}
                    className="px-3 py-1.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Procedure
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search Procedure Name..."
                    value={procSearch}
                    onChange={(e) => setProcSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                        <th className="p-3">S.No</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Procedure Name</th>
                        <th className="p-3">Requirements</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {procedures.filter(p => p.name.toLowerCase().includes(procSearch.toLowerCase())).map((proc, idx) => (
                        <tr key={proc.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-slate-500">{proc.category}</td>
                          <td className="p-3 font-semibold text-slate-700">{proc.name}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[12px] font-semibold rounded-lg border border-amber-100">{proc.req}</span>
                          </td>
                          <td className="p-3">
                            <button className="text-red-500 hover:text-red-600 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Approvers Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Approvers</h4>
              <div className="overflow-x-auto">
                <Table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                      <th className="p-3">S.No</th>
                      <th className="p-3">Approver Name</th>
                      <th className="p-3">Department/Speciality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {approvers.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-700">{app.name}</td>
                        <td className="p-3 text-slate-500">{app.dept}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* MODALS */}
            {showAddCatModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddCatModal(false)}></div>
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                  <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal mb-4">Add Procedure Category</h3>
                  <input 
                    type="text" 
                    placeholder="Enter Category Name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800 mb-4"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddCatModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Cancel</button>
                    <button onClick={handleAddCategory} className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Save</button>
                  </div>
                </div>
              </div>
            )}

            {showAddProcModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddProcModal(false)}></div>
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal">Add New Procedure</h3>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-1">Category</label>
                    <Select 
                      value={newProcCat}
                      onChange={(e) => setNewProcCat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-1">Procedure Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter Procedure Name..."
                      value={newProcName}
                      onChange={(e) => setNewProcName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-1">Clinical Requirements</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ACLS, Logbook Cases"
                      value={newProcReq}
                      onChange={(e) => setNewProcReq(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowAddProcModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Cancel</button>
                    <button onClick={handleAddProcedure} className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // 2. PRIVILEGE SUBMASTER
      case 'privilege-submaster':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Privilege SubMaster</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Design Roles, Criteria, and Qualifications by Specialty</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Clinician Grade/Role</label>
                <Select 
                  value={submasterRole}
                  onChange={(e) => setSubmasterRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="Consultant">Consultant</option>
                  <option value="Specialist">Specialist</option>
                  <option value="Resident">Resident</option>
                  <option value="Fellow">Fellow</option>
                </Select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Specialty Specialty</label>
                <Select 
                  value={submasterSpecialty}
                  onChange={(e) => setSubmasterSpecialty(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Anaesthesia">Anaesthesia</option>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[13px] font-semibold text-slate-700 normal-case tracking-normal">Mandatory Credentials Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(submasterReqs).map((reqKey) => (
                  <label key={reqKey} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100/75 transition-all border border-slate-100">
                    <input 
                      type="checkbox" 
                      checked={submasterReqs[reqKey]}
                      onChange={(e) => setSubmasterReqs({ ...submasterReqs, [reqKey]: e.target.checked })}
                      className="w-4.5 h-4.5 text-[var(--color-primary)] focus:ring-[var(--color-primary)] rounded border-slate-350"
                    />
                    <span className="text-[13px] font-semibold text-slate-700 capitalize">{reqKey.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button className="px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all shadow-lg shadow-none">
                Save Criteria Configuration
              </button>
            </div>
          </div>
        );

      // 3. NOTIFICATION MASTER
      case 'notification-master':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Notification Master</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Manage Auto-Alert email Rules and Templates</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Trigger Event</label>
                <Select 
                  value={notifTrigger}
                  onChange={(e) => setNotifTrigger(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="Application Received">Application Received</option>
                  <option value="Approval Granted">Approval Granted</option>
                  <option value="Rejection Alert">Rejection Alert</option>
                  <option value="Expiring in 30 Days">Expiring in 30 Days</option>
                  <option value="Expiring in 90 Days">Expiring in 90 Days</option>
                </Select>
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifCC}
                    onChange={(e) => setNotifCC(e.target.checked)}
                    className="w-4.5 h-4.5 text-[var(--color-primary)] focus:ring-[var(--color-primary)] rounded border-slate-350"
                  />
                  <span className="text-[13px] font-semibold text-slate-700">Auto-CC Department Head</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Email Template Content</label>
              <textarea 
                rows="4"
                placeholder="Dear Clinician..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800 font-mono"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button className="px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">
                Add Rule
              </button>
            </div>

            <div className="overflow-x-auto pt-4 border-t border-slate-100">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">S.No</th>
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">CC Department Head</th>
                    <th className="p-3">Template Preview</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {notifRules.map((rule, idx) => (
                    <tr key={rule.id}>
                      <td className="p-3 text-slate-500 font-semibold">{idx+1}</td>
                      <td className="p-3 font-semibold text-slate-700">{rule.trigger}</td>
                      <td className="p-3 text-slate-500">{rule.cc}</td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate">{rule.template}</td>
                      <td className="p-3">
                        <button className="text-red-500 hover:text-red-600 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 4. PRIVILEGE SEARCH
      case 'privilege-search':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Privilege Search</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Lookup Clinician Privilege Registries</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Clinician Name</label>
                <input 
                  type="text" 
                  placeholder="Search Doctor..."
                  value={searchClinician}
                  onChange={(e) => setSearchClinician(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Specialty</label>
                <Select 
                  value={searchSpecialty}
                  onChange={(e) => setSearchSpecialty(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="">All Specialties</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                </Select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Status</label>
                <Select 
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto pt-4">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Clinician</th>
                    <th className="p-3">Specialty</th>
                    <th className="p-3">Core Privileges</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {searchResults.filter(r => 
                    r.name.toLowerCase().includes(searchClinician.toLowerCase()) &&
                    (searchSpecialty === '' || r.specialty === searchSpecialty) &&
                    (searchStatus === 'All' || r.status === searchStatus)
                  ).map((res) => (
                    <tr key={res.id}>
                      <td className="p-3 font-semibold text-slate-700">{res.name}</td>
                      <td className="p-3 text-slate-500">{res.specialty}</td>
                      <td className="p-3 font-semibold text-slate-600">{res.approvedCount} approved</td>
                      <td className="p-3 text-slate-500">{res.expiry}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold normal-case tracking-normal ${
                          res.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                          res.status === 'Expiring Soon' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>{res.status}</span>
                      </td>
                      <td className="p-3">
                        <button className="text-[var(--color-primary)] font-semibold hover:underline">View Registry</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 5. APPLY/RENEW PRIVILEGE
      case 'apply-renew':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Apply/Renew Privilege</h3>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Submit clinician privilege portfolio</p>
              </div>
              <div className="flex gap-1 items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                {[1, 2, 3].map((step) => (
                  <div key={step} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-semibold transition-all ${
                    applyStep === step ? 'bg-[var(--color-primary)] text-white' : 'text-slate-500'
                  }`}>{step}</div>
                ))}
              </div>
            </div>

            {applyStep === 1 && (
              <div className="space-y-6">
                <h4 className="text-[13px] font-semibold text-slate-700 normal-case tracking-normal">Step 1: Specialty & Clinician Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Select Clinician</label>
                    <UserSelect aria-label="Clinician" value={applyClinician} valueField="employeeName" onChange={event => setApplyClinician(event.target.value)} placeholder="Select clinician from users" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Medical Specialty</label>
                    <Select 
                      value={applySpecialty}
                      onChange={(e) => setApplySpecialty(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Orthopedics">Orthopedics</option>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setApplyStep(2)} className="px-6 py-3 bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all flex items-center gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {applyStep === 2 && (
              <div className="space-y-6">
                <h4 className="text-[13px] font-semibold text-slate-700 normal-case tracking-normal">Step 2: Request Procedures & Scope</h4>
                <div className="space-y-3">
                  {procedures.filter(p => p.category.includes(applySpecialty)).map(proc => (
                    <label key={proc.id} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input 
                        type="checkbox" 
                        checked={applyProcs.includes(proc.name)}
                        onChange={() => handleApplyProcToggle(proc.name)}
                        className="mt-1 w-4.5 h-4.5 text-[var(--color-primary)] rounded border-slate-350"
                      />
                      <div className="flex-1">
                        <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal block">{proc.name}</span>
                        <span className="text-[12px] text-slate-500 font-semibold block mt-1">Requirement: {proc.req}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setApplyStep(1)} className="px-6 py-3 bg-slate-100 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl">Back</button>
                  <button onClick={() => setApplyStep(3)} className="px-6 py-3 bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all flex items-center gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {applyStep === 3 && (
              <div className="space-y-6">
                <h4 className="text-[13px] font-semibold text-slate-700 normal-case tracking-normal">Step 3: Upload Evidence Documents</h4>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 relative hover:bg-slate-100/50 transition-all">
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-[13px] font-semibold text-slate-700">Drag & Drop certificate files or click to browse</p>
                  <p className="text-[12px] text-slate-500 mt-1">PDF, JPG, PNG formats up to 5MB</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Uploaded Portfolio Files ({uploadedFiles.length})</span>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
                        <span className="text-[13px] font-semibold text-slate-700">{file.name}</span>
                        <span className="text-[12px] text-slate-500 font-semibold">{file.size} MB</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button onClick={() => setApplyStep(2)} className="px-6 py-3 bg-slate-100 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl">Back</button>
                  <button onClick={() => {
                    showNotification('Privilege request submitted successfully', 'success');
                    setApplyStep(1);
                    setApplyProcs([]);
                    setUploadedFiles([]);
                  }} className="px-6 py-3 bg-emerald-600 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-emerald-700 transition-all">
                    Submit Application
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      // 6. PRIVILEGE APPROVAL
      case 'privilege-approval':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Privilege Approval Queue</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Clinical reviews and credential committee authorizations</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Applicant</th>
                    <th className="p-3">Specialty</th>
                    <th className="p-3">Submission Date</th>
                    <th className="p-3">Review Level</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {approvals.map((app) => (
                    <tr key={app.id}>
                      <td className="p-3 font-semibold text-slate-700">{app.applicant}</td>
                      <td className="p-3 text-slate-500">{app.specialty}</td>
                      <td className="p-3 text-slate-500">{app.dateApplied}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[12px] font-semibold">{app.status}</span>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => {
                          showNotification(`Approved application from ${app.applicant}`, 'success');
                          setApprovals(approvals.filter(a => a.id !== app.id));
                        }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all">Approve</button>
                        <button onClick={() => {
                          showNotification(`Rejected application from ${app.applicant}`, 'info');
                          setApprovals(approvals.filter(a => a.id !== app.id));
                        }} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 7. PRIVILEGE APPROVAL MASTER
      case 'privilege-approval-master':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Privilege Approval Master</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Configure multi-stage approval levels and signing mandates</p>
            </div>
            <div className="space-y-4">
              {workflowLevels.map((lvl) => (
                <div key={lvl.level} className="flex gap-4 items-start p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold text-[13px] shrink-0">{lvl.level}</div>
                  <div className="flex-1">
                    <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">{lvl.role}</h4>
                    <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">{lvl.mandate}</p>
                  </div>
                  <button className="text-slate-500 hover:text-slate-600 transition-colors p-1">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button className="px-5 py-3.5 bg-primary hover:bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Approval Stage
              </button>
            </div>
          </div>
        );

      // 8. AMEND PRIVILEGE
      case 'amend-privilege':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Amend Privileges</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Alter scope of active privileges</p>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Search Clinician</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Doctor Name..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                />
              </div>
            </div>
            <div className="p-12 text-center opacity-30 flex flex-col items-center gap-2 border border-dashed border-slate-200 rounded-2xl">
              <Info className="w-8 h-8 text-slate-500" />
              <p className="text-[12px] font-semibold normal-case tracking-normal">Select active doctor to view/amend scope</p>
            </div>
          </div>
        );

      // 9. HOLD/UNHOLD/TERMINATE
      case 'hold-terminate':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Hold/Unhold/Terminate Privilege</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Administrative blocks and terminations</p>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Select Doctor</label>
              <UserSelect aria-label="Doctor" value={applyClinician} valueField="employeeName" onChange={event => setApplyClinician(event.target.value)} placeholder="Select doctor from users" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => showNotification('Privileges put on hold', 'warning')} className="p-6 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl transition-all text-left">
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
                <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Place Privileges on Hold</h4>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Suspend status temporarily</p>
              </button>
              <button onClick={() => showNotification('Privileges terminated', 'error')} className="p-6 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all text-left">
                <UserX className="w-8 h-8 text-red-500 mb-3" />
                <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Terminate Scope</h4>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Revoke clinical credential permanently</p>
              </button>
            </div>
          </div>
        );

      // 10. ARCHIVE
      case 'privilege-archive':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Privilege Archive</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Historical files and audit trails</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Authorized By</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="text-slate-500">
                    <td className="p-3 font-semibold">#ARC-9021</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-[12px] font-semibold normal-case">Terminated</span></td>
                    <td className="p-3 font-semibold text-slate-700">Dr. Sarah Connor</td>
                    <td className="p-3">Credentialing Committee</td>
                    <td className="p-3 text-[12px]">2026-07-01 10:15</td>
                  </tr>
                  <tr className="text-slate-500">
                    <td className="p-3 font-semibold">#ARC-9019</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[12px] font-semibold normal-case">Approved</span></td>
                    <td className="p-3 font-semibold text-slate-700">Dr. James Smith</td>
                    <td className="p-3">Dr. Yahya Mannooparambil</td>
                    <td className="p-3 text-[12px]">2026-06-25 14:30</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 11. DOCUMENT EXPIRY MONITOR
      case 'document-expiry-monitor':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Document Expiry Monitor</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Live tracking of clinician certificate validity</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {expiryDocs.map(doc => (
                <div key={doc.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  doc.status === 'Critical' ? 'bg-red-50/50 border-red-200' :
                  doc.status === 'Warning' ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold normal-case tracking-normal ${
                      doc.status === 'Critical' ? 'bg-red-100 text-red-700' :
                      doc.status === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{doc.status}</span>
                    <h4 className="text-[13px] font-semibold text-slate-850 normal-case tracking-normal mt-3">{doc.doctor}</h4>
                    <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">{doc.docName}</p>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-[12px] font-semibold text-slate-500">{doc.daysLeft} days remaining</span>
                    <button onClick={() => showNotification('Notification email dispatched', 'success')} className="px-3 py-1.5 bg-slate-855 hover:bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all">Send Alert</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // 12. NORMAL DASHBOARD
      case 'normal-dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-slate-450 normal-case tracking-normal block">My Active Privileges</span>
                  <span className="text-xl font-semibold text-slate-800 block mt-1">12</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-slate-450 normal-case tracking-normal block">Pending Submissions</span>
                  <span className="text-xl font-semibold text-slate-800 block mt-1">2</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-red-50 text-red-650 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-slate-450 normal-case tracking-normal block">Critical Expiries</span>
                  <span className="text-xl font-semibold text-slate-800 block mt-1">1</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Clinician Quick Actions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('apply-renew')} className="p-4 bg-slate-50 border border-slate-200/50 hover:bg-slate-100/50 rounded-2xl transition-all text-left flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal block">Apply for New Privileges</span>
                    <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal block mt-1">Submit logbooks and licenses</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
                <button onClick={() => setActiveTab('document-expiry-monitor')} className="p-4 bg-slate-50 border border-slate-200/50 hover:bg-slate-100/50 rounded-2xl transition-all text-left flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal block">Manage Credentials</span>
                    <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal block mt-1">Verify training logs validity</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        );

      // 13. HOD DASHBOARD
      case 'hod-dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Department Clinicians</span>
                <span className="text-xl font-semibold text-slate-800 block mt-2">24</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Compliance Rate</span>
                <span className="text-xl font-semibold text-emerald-600 block mt-2">91.6%</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Pending HOD Signatures</span>
                <span className="text-xl font-semibold text-amber-600 block mt-2">{approvals.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Expired Privileges</span>
                <span className="text-xl font-semibold text-rose-600 block mt-2">2</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">HOD Action Desk</h4>
                <div className="space-y-3">
                  {approvals.map(app => (
                    <div key={app.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div>
                        <span className="text-[13px] font-semibold text-slate-850 block">{app.applicant}</span>
                        <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal block mt-0.5">{app.specialty} • Submitted {app.dateApplied}</span>
                      </div>
                      <button onClick={() => setActiveTab('privilege-approval')} className="px-3 py-1.5 bg-slate-850 hover:bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all">Review App</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Clinical Auditing Status</h4>
                  <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Review departmental cases verification compliance</p>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-[13px] font-semibold text-slate-600">
                    <span>Orthopedics Case Logs Verified</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-primary)] h-full rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Invalid selection</div>;
    }
  };

  return (
    <DashboardLayout>
      <header className="qc-module-heading">
        <h1>Clinical privileges</h1>
        <p>Manage clinical eligibility, privilege requests and professional reviews.</p>
      </header>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Clinical Privileges Submenu Sidebar */}
        <aside className="qc-module-sidebar w-full lg:w-64 shrink-0 sticky top-24 select-none">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-5">
            <div className="p-3 bg-[var(--color-primary)] text-white rounded-2xl shadow-lg shadow-none">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">Clinical Privileges</h2>
              <span className="text-[12px] text-[var(--color-primary)] font-semibold normal-case tracking-normal block mt-0.5">CMC Master Portal</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] font-semibold normal-case tracking-normal transition-all text-left ${
                    isActive 
                      ? 'qc-module-active'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[var(--color-primary)]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Side: Tab/Subpoint Content Area */}
        <section className="qc-module-content" aria-label="Clinical privileges workspace">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {renderTabContent()}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default ClinicalPrivileges;
