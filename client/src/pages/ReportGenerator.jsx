import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';
import { fetchMasterData } from '../utils/masterData';
import { useNotification } from '../components/NotificationContext';
import MasterSelect from '../components/MasterSelect';
import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  ChevronRight,
  BarChart3,
  FileText,
  Download,
  RefreshCcw,
  Calendar,
  Filter,
  CheckCircle2,
  Printer,
  TableProperties,
  ClipboardList,
  ShieldCheck,
  ChevronDown,
  Loader2
} from 'lucide-react';

const reportTypes = [
  {
    id: 'incident',
    category: 'Clinical Quality',
    icon: ClipboardList,
    label: 'Incident Report Summary',
    description: 'All incidents by type, severity, and department within the date range.'
  },
  {
    id: 'credential',
    category: 'Clinical Quality',
    icon: ShieldCheck,
    label: 'Credentialing Status Report',
    description: 'Physician credentialing and privilege status across the organization.'
  },
  {
    id: 'license',
    category: 'Staff Management',
    icon: FileText,
    label: 'Staff License Expiry Report',
    description: 'Upcoming or expired professional licenses by department and designation.'
  },
  {
    id: 'auditLog',
    category: 'Security & Access',
    icon: TableProperties,
    label: 'Audit Log Report',
    description: 'System-wide user activity, login events, and configuration changes.'
  },
  {
    id: 'userRole',
    category: 'Security & Access',
    icon: ShieldCheck,
    label: 'User Role & Permissions Report',
    description: 'User-to-role assignments and module access permissions summary.'
  },
  {
    id: 'department',
    category: 'Master Data',
    icon: BarChart3,
    label: 'Department & Staff Report',
    description: 'Staff count, designations, and specialities grouped by department.'
  }
];

const reportLayouts = {
  incident: {
    columns: ['Incident ID','Type','Department','Severity','Date','Status'],
    rows: []
  },
  credential: {
    columns: ['Physician ID','Name','Speciality','Status','Approval Date','Expiry'],
    rows: []
  },
  license: {
    columns: ['Staff ID','Name','License No.','Authority','Issue Date','Expiry','Days Left'],
    rows: []
  },
  auditLog: {
    columns: ['Timestamp','User','Action','Module','IP Address','Result'],
    rows: []
  },
  userRole: {
    columns: ['User','Department','Role','Modules','Assigned On'],
    rows: []
  },
  department: {
    columns: ['Dept. Code','Department','Head','Staff Count','Specialities'],
    rows: []
  }
};

const ReportGenerator = () => {
  const { showNotification } = useNotification();
  const [selectedReport, setSelectedReport] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [department, setDepartment] = useState('All');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setIsGenerating(true);
    const date = value => value ? new Date(value).toLocaleDateString() : '—';
    const matchesDepartment = value => department === 'All' || !department || value === department;
    const matchesDate = value => (!dateFrom || (value && new Date(value) >= new Date(dateFrom))) && (!dateTo || (value && new Date(value) < new Date(new Date(dateTo).getTime() + 86400000)));
    try {
      let rows = [];
      if (selectedReport === 'userRole') {
        const users = await fetchMasterData('accounts');
        rows = users.filter(user => matchesDepartment(user.department)).map(user => [user.employeeName, user.department, user.role, '—', date(user.createdAt)]);
      } else if (selectedReport === 'department') {
        const [departments, users, specialties] = await Promise.all([fetchMasterData('departments'), fetchMasterData('users'), fetchMasterData('specialties')]);
        rows = departments.filter(item => matchesDepartment(item.name)).map(item => [item.code, item.name, item.head, users.filter(user => user.department === item.name).length, specialties.filter(spec => spec.department === item.name).map(spec => spec.name).join(', ')]);
      } else {
        const urls = { credential: '/api/cp/privileges', license: '/api/compliance/licenses/staff', auditLog: '/api/settings/audit-logs', incident: '/api/incidents' };
        const { data } = await axios.get(urls[selectedReport], getAuthConfig());
        const source = data.filter(item => matchesDepartment(item.staffId?.department || item.performedBy?.department || item.reportedBy?.department || item.department) && matchesDate(item.dateOfIncident || item.createdAt));
        if (selectedReport === 'credential') rows = source.map(item => [item.staffId?.employeeId || '—', item.staffId?.employeeName || '—', item.specialty, item.status, date(item.approvalDate), date(item.expiryDate)]);
        if (selectedReport === 'license') rows = source.map(item => [item.staffId?.employeeId || '—', item.staffId?.employeeName || '—', item.licenseNumber, item.licenseType, date(item.issuedDate), date(item.expiryDate), Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000)]);
        if (selectedReport === 'auditLog') rows = source.map(item => [date(item.createdAt), item.performedBy?.employeeName || '—', item.action, item.module, item.ipAddress, '—']);
        if (selectedReport === 'incident') rows = source.map(item => [item.incidentId, item.category, item.reportedBy?.department || '—', item.severity, date(item.dateOfIncident), item.status]);
      }
      setGeneratedReport({ ...reportLayouts[selectedReport], rows });
    } catch (error) { setGeneratedReport(null); showNotification(error.response?.data?.message || 'Unable to load report records', 'error'); }
    finally { setIsGenerating(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  const getSelected = () => reportTypes.find(r => r.id === selectedReport);

  const categories = [...new Set(reportTypes.map(r => r.category))];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold normal-case tracking-normal mb-1">
              <span>Home</span><ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span><ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Report Generator</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Report Generator</h1>
          </div>
          {generatedReport && (
            <div className="flex gap-3">
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 bg-white text-slate-700 hover:border-slate-900 rounded-xl text-[13px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                className="flex items-center gap-2 px-5 py-3 bg-[var(--color-primary)] hover:bg-[#7a6119] text-white rounded-xl text-[13px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-md">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Config Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-sm font-semibold text-slate-800 normal-case tracking-normal flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--color-primary)]" /> Configure Report
            </h2>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Report Type */}
            <div className="md:col-span-2">
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-3">Report Type</label>
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat}>
                    <div className="text-[12px] font-semibold text-[var(--color-primary)] normal-case tracking-normal mb-2 pl-1">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reportTypes.filter(r => r.category === cat).map(report => (
                        <button key={report.id}
                          onClick={() => { setSelectedReport(report.id); setGeneratedReport(null); }}
                          className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all group active:scale-95 ${selectedReport === report.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedReport === report.id ? 'bg-[var(--color-primary)]/10' : 'bg-slate-100 group-hover:bg-slate-200'} transition-colors`}>
                            <report.icon className={`w-5 h-5 ${selectedReport === report.id ? 'text-[var(--color-primary)]' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className={`text-[13px] font-semibold tracking-tight mb-1 ${selectedReport === report.id ? 'text-[var(--color-primary)]' : 'text-slate-800'}`}>{report.label}</div>
                            <div className="text-[12px] text-slate-500 font-medium leading-relaxed">{report.description}</div>
                          </div>
                          {selectedReport === report.id && (
                            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] ml-auto shrink-0 mt-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> From Date
              </label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> To Date
              </label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-3">Department Filter</label>
              <div className="relative">
                <MasterSelect resource="departments" valueKey="name" value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-3 border rounded-xl"><option value="All">All Departments</option></MasterSelect>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                disabled={!selectedReport || isGenerating}
                onClick={handleGenerate}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-sm normal-case tracking-normal transition-all active:scale-95 shadow-md w-full justify-center ${!selectedReport ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-[var(--color-primary)] hover:bg-[#7a6119] text-white'}`}>
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Output */}
        {generatedReport && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 normal-case tracking-normal flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  {getSelected()?.label}
                </h2>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  Period: {dateFrom} to {dateTo} &nbsp;|&nbsp; Department: {department}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100/50">
                    {generatedReport.columns.map(c => (
                      <th key={c} className="px-6 py-4 text-[12px] font-semibold normal-case tracking-normal text-slate-500 border-b-2 border-slate-200">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedReport.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-4 text-[13px] text-slate-700 font-medium whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="px-8 py-4 bg-slate-50/20 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal">
                {generatedReport.rows.length} record(s) found
              </span>
              <span className="text-[12px] text-slate-300 font-semibold normal-case tracking-normal">Generated on {new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-[12px] font-semibold text-slate-800 normal-case">QCare Reporting Engine</span>
          </div>
          <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Enterprise Analytics & Reporting</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportGenerator;
