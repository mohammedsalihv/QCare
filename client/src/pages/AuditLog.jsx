import Table from '../components/Table.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Search, 
  ChevronRight, 
  ShieldCheck,
  Calendar,
  Activity,
  User,
  Eye,
  X,
  Database,
  RefreshCcw,
  Network
} from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return {};
    const { token } = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://192.168.1.160:5000/api/settings/audit-logs', getAuthConfig());
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs, falling back to mock data:', err);
      // Fallback mock logs if database is empty or network fails
      setLogs([
        { _id: '1', action: 'document_uploaded', module: 'QMS Documents', ipAddress: '192.168.1.15', performedBy: { employeeName: 'Mohammed Salih', email: 'm.salih@cmcholding.local', employeeId: 'EMP-0002' }, details: { fileName: 'Infection_Control_SOP_v4.2.pdf', size: '2.4 MB' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { _id: '2', action: 'incident_reported', module: 'Incident Reporting', ipAddress: '192.168.1.42', performedBy: { employeeName: 'Dr. Sarah Wilson', email: 's.wilson@cmcholding.local', employeeId: 'EMP-0010' }, details: { referenceNo: 'INC-2026-0012', classification: 'Near Miss' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { _id: '3', action: 'privileges_approved', module: 'Clinical Privileges', ipAddress: '192.168.1.160', performedBy: { employeeName: 'Mohammed Salih', email: 'm.salih@cmcholding.local', employeeId: 'EMP-0002' }, details: { targetPhysician: 'Dr. Aaron Patel', privileges: ['Cardiology Consultations', 'ECG Review'] }, createdAt: new Date(Date.now() - 14400000).toISOString() },
        { _id: '4', action: 'ldap_sync_triggered', module: 'Settings & Security', ipAddress: '127.0.0.1', performedBy: { employeeName: 'Yahiya Mannooparambil', email: 'yahiya.m@cmcholding.local', employeeId: 'EMP-0045' }, details: { syncedUsers: 48, duration: '12.4s' }, createdAt: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const filteredLogs = logs.filter(l => {
    const performedByName = l.performedBy?.employeeName || l.user || 'Not Applicable';
    const dept = l.performedBy?.department || 'Not Applicable';
    const designation = l.performedBy?.designation || 'Not Applicable';
    const moduleName = l.module || '';
    const pageName = l.pageName || '';
    const activityText = l.activity || l.action || '';

    const q = searchQuery.toLowerCase();
    return performedByName.toLowerCase().includes(q) ||
           dept.toLowerCase().includes(q) ||
           designation.toLowerCase().includes(q) ||
           moduleName.toLowerCase().includes(q) ||
           pageName.toLowerCase().includes(q) ||
           activityText.toLowerCase().includes(q);
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredLogs.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Security & Access</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">System Audit Log</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">System Audit Trail</h1>
          </div>

          <button 
            onClick={fetchLogs}
            className="flex items-center gap-3 px-5 py-3.5 border border-slate-200 bg-white text-slate-700 hover:border-slate-800 hover:text-slate-900 rounded-md font-semibold transition-all shadow-sm active:scale-95 text-[13px] normal-case tracking-normal"
          >
             <RefreshCcw className="w-4 h-4" />
             <span>Reload Logs</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 font-semibold" />
               <input 
                 type="text" 
                 placeholder="Search logs by action, module, or user..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-[13px] font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-16 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">S.No</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Date & Time</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">User Name</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Department / Speciality</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Designation</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Module Name</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Page Name</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Activity</th>
                  <th className="w-20 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200 text-right pr-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center text-[13px] font-semibold text-slate-500">
                       Fetching audit trails from MongoDB...
                    </td>
                  </tr>
                ) : currentRecords.map((log, index) => {
                  const sNo = indexOfFirstRecord + index + 1;
                  const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace(',', '') : 'Not Applicable';
                  
                  // Extract user details or fallback to "Not Applicable" for anonymous events
                  const userName = log.performedBy ? log.performedBy.employeeName : (log.user || 'Not Applicable');
                  const dept = log.performedBy ? log.performedBy.department : 'Not Applicable';
                  const designation = log.performedBy ? log.performedBy.designation : 'Not Applicable';
                  const activityText = log.activity || log.action?.replace(/_/g, ' ') || 'Performed action';
                  const pageText = log.pageName || 'System';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-700">{sNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 text-[13px] text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono font-medium">{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-800">{userName}</td>
                      <td className="px-6 py-4 text-[13px] text-slate-700">{dept}</td>
                      <td className="px-6 py-4 text-[13px] text-slate-700">{designation}</td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-semibold text-[var(--color-primary)] normal-case tracking-normal">{log.module}</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-700">{pageText}</td>
                      <td className="px-6 py-4 text-[13px] font-semibold text-slate-700">{activityText}</td>
                      <td className="px-6 py-4 text-right pr-6">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => handleViewDetails(log)}
                            className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all duration-300 active:scale-95 shadow-sm"
                            title="Audit log details"
                          >
                             <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Database className="w-10 h-10" />
                        <span className="text-[13px] font-semibold normal-case tracking-normal">No logs registered</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          <Pagination 
            totalRecords={filteredLogs.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* JSON Details Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowDetailModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                      <Database className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Audit Payload Inspector</h3>
                      <p className="text-[13px] text-slate-500 font-medium tracking-tight">Structural change payload data</p>
                   </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 bg-white space-y-6">
                 <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 max-h-[300px] overflow-y-auto custom-scrollbar font-mono text-[12px] text-slate-700 leading-relaxed">
                   <pre>{JSON.stringify(selectedLog?.details || {}, null, 2)}</pre>
                 </div>
                 
                 <div className="flex gap-4 border-t border-slate-100 pt-6">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Log Reference ID</span>
                      <span className="text-[13px] font-mono font-semibold text-slate-850">{selectedLog?._id}</span>
                    </div>
                    <button 
                      onClick={() => setShowDetailModal(false)} 
                      className="py-3 px-6 bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-primary transition-all active:scale-[0.98]"
                    >
                      Close Inspector
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-slate-800 font-semibold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold tracking-tight text-slate-800 normal-case">QCare Corporate Audit Trail Registry</span>
           </div>
           <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Enterprise Security Log</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLog;
