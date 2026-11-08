import PrivilegeApplication from '../components/PrivilegeApplication';
import TableToolbar from '../components/TableToolbar';
import CompactSearch from './../components/CompactSearch';
import './ClinicalPrivileges.css';
import UserSelect from '../components/UserSelect';
import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
import { useNotification } from "../components/NotificationContext";
import DashboardLayout from "../components/DashboardLayout";
import { ShieldCheck, FileText, Search, UserCheck, History, Calendar, AlertTriangle, TrendingUp, Layers, ClipboardList, BookOpen, Plus, Edit3, Clock, ChevronRight } from 'lucide-react';

const ClinicalPrivileges = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(new URLSearchParams(window.location.search).get('tab') === 'apply' ? 'apply-renew' : new URLSearchParams(window.location.search).get('tab') === 'reviews' ? 'privilege-approval' : 'normal-dashboard');

  // Sidebar Menu Items
  const menuItems = [
    { id: 'normal-dashboard', label: 'Overview', icon: TrendingUp, group: 'Workspace' },
    { id: 'privilege-search', label: 'Privilege register', icon: Search },
    { id: 'apply-renew', label: 'Apply or renew', icon: FileText },
    { id: 'privilege-approval', label: 'Approval queue', icon: UserCheck },
    { id: 'document-expiry-monitor', label: 'Credential expiry', icon: Calendar },
    { id: 'privilege-archive', label: 'Activity history', icon: History },
    { id: 'procedures-master', label: 'Procedure library', icon: BookOpen, group: 'Configuration' },
    { id: 'privilege-submaster', label: 'Eligibility criteria', icon: Layers },
    { id: 'privilege-approval-master', label: 'Approval workflow', icon: ClipboardList }
  ];

  // ---------------------------------------------------------------------------
  // MOCK DATA & STATES
  // ---------------------------------------------------------------------------
  
  // Procedure library State
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

  const [approvers] = useState([
    { id: 1, name: 'Dr. Yahya Mannooparambil', dept: 'Cardiology / Medical Director' },
    { id: 2, name: 'Dr. Robert Fischer', dept: 'Orthopedics / HOD' }
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newProcName, setNewProcName] = useState('');
  const [newProcCat, setNewProcCat] = useState('');
  const [newProcReq, setNewProcReq] = useState('');

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddProcModal, setShowAddProcModal] = useState(false);

  // Eligibility criteria State
  const [submasterRole, setSubmasterRole] = useState('Consultant');
  const [submasterSpecialty, setSubmasterSpecialty] = useState('Cardiology');
  const [submasterReqs, setSubmasterReqs] = useState({
    bls: true,
    acls: true,
    pals: false,
    boardCert: true,
    logbook: true
  });

  // Privilege register State
  const [searchClinician, setSearchClinician] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchStatus, setSearchStatus] = useState('All');
  const [searchResults] = useState([
    { id: 1, name: 'Dr. James Smith', specialty: 'Cardiology', approvedCount: 12, expiry: '2027-02-14', status: 'Active' },
    { id: 2, name: 'Dr. Emily Watson', specialty: 'Orthopedics', approvedCount: 8, expiry: '2026-08-30', status: 'Expiring Soon' },
    { id: 3, name: 'Dr. Alistair Cook', specialty: 'Pediatrics', approvedCount: 5, expiry: '2026-05-10', status: 'Expired' }
  ]);

  // Approvals Queue State
  const [approvals] = useState([
    { id: 1, applicant: 'Dr. Emily Watson', specialty: 'Orthopedics', dateApplied: '2026-07-02', status: 'Pending HOD Approval' },
    { id: 2, applicant: 'Dr. Alistair Cook', specialty: 'Pediatrics', dateApplied: '2026-07-04', status: 'Pending Committee Review' }
  ]);

  // Approval Workflow Master State
  const [workflowLevels] = useState([
    { level: 1, role: 'Department Head (HOD)', mandate: 'Clinical verification of cases logbook' },
    { level: 2, role: 'Credentialing Committee Chair', mandate: 'Secondary source verification check' },
    { level: 3, role: 'Chief Medical Director', mandate: 'Final execution and registry stamp' }
  ]);

  // Expiry Monitor State
  const [expiryDocs] = useState([
    { id: 1, doctor: 'Dr. Emily Watson', docName: 'BLS Certificate', daysLeft: 12, status: 'Critical' },
    { id: 2, doctor: 'Dr. James Smith', docName: 'DOH Professional License', daysLeft: 45, status: 'Warning' },
    { id: 3, doctor: 'Dr. Sarah Connor', docName: 'Medical Malpractice Insurance', daysLeft: 80, status: 'Healthy' }
  ]);

  // ---------------------------------------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    setCategories([
      ...categories,
      { id: Date.now(), name: newCatName.trim(), addedBy: 'Current User', date: new Date().toISOString().split('T')[0] }
    ]);
    setNewCatName('');
    setShowAddCatModal(false);
  };

  const handleAddProcedure = () => {
    if (!newProcName.trim() || !newProcCat) return;
    setProcedures([
      ...procedures,
      { id: Date.now(), category: newProcCat, name: newProcName, req: newProcReq || 'None' }
    ]);
    setNewProcName('');
    setNewProcReq('');
    setShowAddProcModal(false);
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
                <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Procedure library</h3>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Configure Clinical Privilege Procedures and Approvers</p>
              </div>
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 gap-6">
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
                <TableToolbar>

                  <CompactSearch
                    type="text" 
                    placeholder="Search Procedure Category..."
                    value={procCategorySearch}
                    onChange={(e) => setProcCategorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                  />
                </TableToolbar>
                <div className="overflow-x-auto">
                  <Table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                        <th className="p-3">S.No</th>
                        <th className="p-3">Procedure Category</th>
                        <th className="p-3">Added/Edited By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categories.filter(c => c.name.toLowerCase().includes(procCategorySearch.toLowerCase())).map((cat, idx) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-700">{cat.name}</td>
                          <td className="p-3 text-slate-500">{cat.addedBy}</td>
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
                <TableToolbar>

                  <CompactSearch
                    type="text" 
                    placeholder="Search Procedure Name..."
                    value={procSearch}
                    onChange={(e) => setProcSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                  />
                </TableToolbar>
                <div className="overflow-x-auto">
                  <Table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                        <th className="p-3">S.No</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Procedure Name</th>
                        <th className="p-3">Requirements</th>
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
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Eligibility criteria</h3>
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
                <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Specialty</label>
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

      // 4. PRIVILEGE SEARCH
      case 'privilege-search':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Privilege register</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Lookup Clinician Privilege Registries</p>
            </div>
            <TableToolbar>
              <div>
                <CompactSearch
                  type="text" 
                  placeholder="Search Doctor..."
                  value={searchClinician}
                  onChange={(e) => setSearchClinician(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                />
              </div>
              <div>
                <Select compact aria-label="Filter by specialty" value={searchSpecialty}
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
                <Select compact aria-label="Filter by status" value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </Select>
              </div>
            </TableToolbar>

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

      case 'apply-renew': return <PrivilegeApplication />;
      case 'privilege-approval': return <PrivilegeApplication key="reviews" reviewQueue />;

      // 7. PRIVILEGE APPROVAL MASTER
      case 'privilege-approval-master':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Approval workflow</h3>
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

      // 10. ARCHIVE
      case 'privilege-archive':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Activity history</h3>
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
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Credential expiry</h3>
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
                  <span className="text-[12px] font-semibold text-slate-450 normal-case tracking-normal block">Active privileges</span>
                  <span className="text-xl font-semibold text-slate-800 block mt-1">{searchResults.filter(record => record.status === "Active").reduce((total, record) => total + record.approvedCount, 0)}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-slate-450 normal-case tracking-normal block">Pending Submissions</span>
                  <span className="text-xl font-semibold text-slate-800 block mt-1">{approvals.length}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-red-50 text-red-650 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[12px] font-semibold text-slate-450 normal-case tracking-normal block">Critical Expiries</span>
                  <span className="text-xl font-semibold text-slate-800 block mt-1">{expiryDocs.filter(doc => doc.status === "Critical").length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Quick actions</h4>
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

      default:
        return <div>Invalid selection</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="clinical-privileges">
      <header className="qc-module-heading">
        <h1>Clinical privileges</h1>
        <p>Manage clinical scope, applications and credential reviews in one place.</p>
        {!['apply-renew', 'privilege-approval'].includes(activeTab) && <div className="cp-preview-note">Preview workspace · Other tabs show sample data. Applications and application reviews use saved records.</div>}
      </header>
      <div className="cp-workspace">
        
        {/* Left Side: Clinical Privileges Submenu Sidebar */}
        <aside className="qc-module-sidebar cp-sidebar">
          <nav aria-label="Clinical privileges navigation" className="cp-navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <React.Fragment key={item.id}>
                {item.group && <p className="cp-group-label">{item.group}</p>}
                <button
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
                </React.Fragment>
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
      </div>
    </DashboardLayout>
  );
};

export default ClinicalPrivileges;
