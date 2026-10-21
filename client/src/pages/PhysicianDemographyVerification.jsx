import Table from '../components/Table.jsx';
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Search, 
  ChevronRight, 
  UserSquare2,
  CheckCircle2, 
  XCircle, 
  Clock,
  ShieldCheck,
  X,
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

const PhysicianDemographyVerification = () => {
  const [queues, setQueues] = useState([
    { id: 1, name: 'Dr. Sarah Wilson', employeeId: 'EMP-0010', specialty: 'Cardiology', licenseType: 'DOH', licenseNumber: 'DOH-LIC-98122', requestedDate: '2026-06-01', verificationStatus: 'pending', verifier: '', remarks: '' },
    { id: 2, name: 'Dr. Clara Thorne', employeeId: 'EMP-0022', specialty: 'Neurology', licenseType: 'DOH', licenseNumber: 'DOH-LIC-22104', requestedDate: '2026-06-02', verificationStatus: 'pending', verifier: '', remarks: '' },
    { id: 3, name: 'Dr. John Doe', employeeId: 'EMP-0005', specialty: 'Orthopedics', licenseType: 'MOHAP', licenseNumber: 'MOH-LIC-77612', requestedDate: '2026-05-25', verificationStatus: 'verified', verifier: 'Mohammed Salih', remarks: 'All credentials cleared.' },
    { id: 4, name: 'Dr. Aaron Patel', employeeId: 'EMP-0015', specialty: 'Pediatrics', licenseType: 'DHA', licenseNumber: 'DHA-LIC-44510', requestedDate: '2026-05-28', verificationStatus: 'rejected', verifier: 'Mohammed Salih', remarks: 'License copy blurred, re-upload needed.' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const [activeTab, setActiveTab] = useState('pending');

  const handleVerify = (id) => {
    setQueues(prev => prev.map(q => q.id === id ? { 
      ...q, 
      verificationStatus: 'verified', 
      verifier: 'Quality Manager',
      remarks: 'Profile audited and verified.'
    } : q));
  };

  const handleRejectClick = (id) => {
    setCurrentId(id);
    setRejectRemarks('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    setQueues(prev => prev.map(q => q.id === currentId ? { 
      ...q, 
      verificationStatus: 'rejected', 
      verifier: 'Quality Manager',
      remarks: rejectRemarks 
    } : q));
    setShowRejectModal(false);
  };

  const filteredQueue = queues.filter(q => {
    const matchesTab = activeTab === 'All' || q.verificationStatus === activeTab;
    const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredQueue.slice(indexOfFirstRecord, indexOfLastRecord);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600';
      case 'rejected':
        return 'bg-rose-50 border-rose-200 text-rose-600';
      default:
        return 'bg-amber-50 border-amber-200 text-amber-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 normal-case tracking-normal mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Demography Verification</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Physician Demography Verification</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20">
            <div className="relative w-full sm:w-[350px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 font-semibold" />
               <input 
                 type="text" 
                 placeholder="Search verification queue..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-[13px] font-semibold"
               />
            </div>
            
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
              {['pending', 'verified', 'rejected', 'All'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`px-5 py-2 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all ${
                    activeTab === tab ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Physician Profile</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Employee ID</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Clinical Specialty</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">License Verification</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Requested Date</th>
                  <th className="px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200">Audit Status</th>
                  <th className="w-48 px-6 py-5 text-[12px] font-semibold text-slate-800 tracking-normal border-b-2 border-slate-200 text-right pr-8">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-slate-800 font-semibold text-[12px]">
                          <UserSquare2 className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-800 leading-snug">{req.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-mono text-slate-700 font-semibold">{req.employeeId}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-700">{req.specialty}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-slate-800 font-mono">{req.licenseNumber}</span>
                          <span className="text-[12px] text-[var(--color-primary)] font-semibold normal-case tracking-normal">{req.licenseType}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[13px] text-slate-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{req.requestedDate}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1 items-start">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[12px] font-semibold normal-case tracking-normal ${getStatusBadge(req.verificationStatus)}`}>
                            {req.verificationStatus === 'verified' && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {req.verificationStatus === 'pending' && <Clock className="w-2.5 h-2.5" />}
                            {req.verificationStatus === 'rejected' && <XCircle className="w-2.5 h-2.5" />}
                            <span>{req.verificationStatus}</span>
                         </span>
                         {req.verifier && (
                           <span className="text-[12px] text-slate-500 font-medium">Verified by: {req.verifier}</span>
                         )}
                         {req.remarks && (
                           <span className="text-[12px] text-slate-500 italic max-w-[200px] line-clamp-1" title={req.remarks}>"{req.remarks}"</span>
                         )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       {req.verificationStatus === 'pending' ? (
                         <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleVerify(req.id)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                            >
                               <FileCheck className="w-3.5 h-3.5" />
                               <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => handleRejectClick(req.id)}
                              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-semibold normal-case tracking-normal transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                            >
                               <XCircle className="w-3.5 h-3.5" />
                               <span>Reject</span>
                            </button>
                         </div>
                       ) : (
                         <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal">Audit Completed</span>
                       )}
                    </td>
                  </tr>
                ))}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <AlertCircle className="w-10 h-10" />
                        <span className="text-[13px] font-semibold normal-case tracking-normal">No matching records in verification queue</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          <Pagination 
            totalRecords={filteredQueue.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowRejectModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Audit Rejection</h3>
                <button onClick={() => setShowRejectModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="p-6 space-y-6 bg-white">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal ml-1">Provide Audit Remarks (Reason for Rejection)</label>
                  <textarea 
                    value={rejectRemarks} 
                    onChange={(e) => setRejectRemarks(e.target.value)} 
                    required 
                    rows={4} 
                    placeholder="Provide specific notes regarding why this profile was rejected (e.g. invalid license number, missing attachment)..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-[13px] font-semibold text-slate-800 resize-none animate-none" 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setShowRejectModal(false)} className="flex-1 py-3 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 normal-case tracking-normal active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-rose-500 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl hover:bg-rose-600 transition-all active:scale-[0.98]">
                     Confirm Rejection
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-slate-800 font-semibold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[12px] font-semibold tracking-tight text-slate-800 normal-case">QCare Clinical Audit System</span>
           </div>
           <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal">Enterprise Credential Verification Queue</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PhysicianDemographyVerification;
