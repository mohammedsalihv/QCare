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

const demoData = {
  incident: {
    columns: ['Incident ID','Type','Department','Severity','Date','Status'],
    rows: [
      ['INC-2026-001','Patient Fall','Emergency','High','2026-05-01','Closed'],
      ['INC-2026-002','Medication Error','Pharmacy','Critical','2026-05-03','Under Review'],
      ['INC-2026-003','Equipment Fault','Radiology','Medium','2026-05-07','Resolved'],
      ['INC-2026-004','Near Miss','ICU','Low','2026-05-12','Closed']
    ]
  },
  credential: {
    columns: ['Physician ID','Name','Speciality','Status','Approval Date','Expiry'],
    rows: [
      ['PHY-001','Dr. Sarah Wilson','Cardiology','Active','2025-01-10','2027-01-09'],
      ['PHY-002','Dr. Aaron Patel','Neurology','Active','2024-11-15','2026-11-14'],
      ['PHY-003','Dr. Clara Thorne','Oncology','Pending','—','—']
    ]
  },
  license: {
    columns: ['Staff ID','Name','License No.','Authority','Issue Date','Expiry','Days Left'],
    rows: [
      ['STF-101','Mohammed Salih','DOH-LIC-98122','DOH','2024-06-01','2026-06-01','0'],
      ['STF-102','Yahiya Mannooparambil','HAAD-LIC-77432','HAAD','2023-08-15','2026-08-15','70'],
      ['STF-103','Dr. John Doe','MOH-LIC-44321','MOH','2022-12-01','2026-12-01','178']
    ]
  },
  auditLog: {
    columns: ['Timestamp','User','Action','Module','IP Address','Result'],
    rows: [
      ['2026-06-06 09:12','m.salih','LOGIN','Auth',  '192.168.1.44','Success'],
      ['2026-06-06 10:30','a.patel','UPDATE_RECORD','Credentialing','192.168.1.51','Success'],
      ['2026-06-06 11:45','j.doe','FAILED_LOGIN','Auth','10.0.0.12','Failed']
    ]
  },
  userRole: {
    columns: ['User','Department','Role','Modules','Assigned On'],
    rows: [
      ['m.salih','ICT','Super Admin','All Modules','2024-01-01'],
      ['y.mannooparambil','Quality','Quality Manager','QMS, Incidents, Documents','2024-03-05'],
      ['dr.wilson','Cardiology','Physician','Clinical Privileges, CP Search','2025-01-10']
    ]
  },
  department: {
    columns: ['Dept. Code','Department','Head','Staff Count','Specialities'],
    rows: [
      ['DEPT-001','Emergency Medicine','Dr. Ahmed Karim','28','Emergency Medicine'],
      ['DEPT-002','Cardiology','Dr. Sarah Wilson','14','Cardiology, Interventional'],
      ['DEPT-003','Neurology','Dr. Aaron Patel','11','Neurology, Neurophysiology'],
      ['DEPT-004','Pharmacy','—','9','Pharmacy, Clinical Pharmacy']
    ]
  }
};

const ReportGenerator = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-06-06');
  const [department, setDepartment] = useState('All');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!selectedReport) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedReport(demoData[selectedReport]);
      setIsGenerating(false);
    }, 1200);
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
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-1">
              <span>Home</span><ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span><ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Report Generator</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Report Generator</h1>
          </div>
          {generatedReport && (
            <div className="flex gap-3">
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 bg-white text-slate-700 hover:border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                className="flex items-center gap-2 px-5 py-3 bg-[var(--color-primary)] hover:bg-[#7a6119] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Config Panel */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--color-primary)]" /> Configure Report
            </h2>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Report Type */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Report Type</label>
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat}>
                    <div className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest mb-2 pl-1">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reportTypes.filter(r => r.category === cat).map(report => (
                        <button key={report.id}
                          onClick={() => { setSelectedReport(report.id); setGeneratedReport(null); }}
                          className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all group active:scale-95 ${selectedReport === report.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedReport === report.id ? 'bg-[var(--color-primary)]/10' : 'bg-slate-100 group-hover:bg-slate-200'} transition-colors`}>
                            <report.icon className={`w-5 h-5 ${selectedReport === report.id ? 'text-[var(--color-primary)]' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className={`text-xs font-black tracking-tight mb-1 ${selectedReport === report.id ? 'text-[var(--color-primary)]' : 'text-slate-800'}`}>{report.label}</div>
                            <div className="text-[9px] text-slate-400 font-medium leading-relaxed">{report.description}</div>
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> From Date
              </label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> To Date
              </label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Department Filter</label>
              <div className="relative">
                <Select value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all pr-8">
                  <option value="All">All Departments</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="ICU">ICU</option>
                  <option value="Pharmacy">Pharmacy</option>
                </Select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                disabled={!selectedReport || isGenerating}
                onClick={handleGenerate}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-md w-full justify-center ${!selectedReport ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[var(--color-primary)] hover:bg-[#7a6119] text-white'}`}>
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Output */}
        {generatedReport && (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  {getSelected()?.label}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
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
                      <th key={c} className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b-2 border-slate-200">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedReport.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-4 text-xs text-slate-700 font-medium whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="px-8 py-4 bg-slate-50/20 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                {generatedReport.rows.length} record(s) found
              </span>
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Generated on {new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-[10px] font-bold text-slate-800 uppercase">QCare Reporting Engine</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise Analytics & Reporting</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportGenerator;
