import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Award,
  FileEdit, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';

const MallCredential = () => {
  const [credentials, setCredentials] = useState([
    { id: 1, staffName: 'Dr. Sarah Wilson', type: 'ACLS', documentNumber: 'ACLS-2026-9081', issuingAuthority: 'American Heart Association', verificationStatus: 'verified', expiryDate: '2028-04-15' },
    { id: 2, staffName: 'Mohammed Salih', type: 'BLS', documentNumber: 'BLS-2026-1102', issuingAuthority: 'European Resuscitation Council', verificationStatus: 'pending', expiryDate: '2026-09-30' },
    { id: 3, staffName: 'Dr. Aaron Patel', type: 'Malpractice-Insurance', documentNumber: 'INS-MAL-88219', issuingAuthority: 'ADNIC Insurance Corp', verificationStatus: 'verified', expiryDate: '2027-01-01' },
    { id: 4, staffName: 'Clara Thorne', type: 'Dataflow-Report', documentNumber: 'DF-VER-66721', issuingAuthority: 'Dataflow Group Dubai', verificationStatus: 'rejected', expiryDate: '2029-12-31' },
    { id: 5, staffName: 'Dr. Arthur Pendelton', type: 'PALS', documentNumber: 'PALS-2025-0043', issuingAuthority: 'AHA International', verificationStatus: 'expired', expiryDate: '2026-05-10' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCredential, setCurrentCredential] = useState(null);

  const [formData, setFormData] = useState({
    staffName: '',
    type: 'BLS',
    documentNumber: '',
    issuingAuthority: '',
    verificationStatus: 'pending',
    expiryDate: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      staffName: '',
      type: 'BLS',
      documentNumber: '',
      issuingAuthority: '',
      verificationStatus: 'pending',
      expiryDate: ''
    });
    setIsEditing(false);
    setCurrentCredential(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (cred) => {
    setCurrentCredential(cred);
    setFormData({
      staffName: cred.staffName,
      type: cred.type,
      documentNumber: cred.documentNumber,
      issuingAuthority: cred.issuingAuthority,
      verificationStatus: cred.verificationStatus,
      expiryDate: cred.expiryDate
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const setStatus = (id, status) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, verificationStatus: status } : c));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setCredentials(prev => prev.map(c => c.id === currentCredential.id ? { ...c, ...formData } : c));
    } else {
      const newCred = {
        id: Date.now(),
        ...formData
      };
      setCredentials(prev => [newCred, ...prev]);
    }
    setShowModal(false);
    resetForm();
  };

  const filteredCredentials = credentials.filter(c => 
    c.staffName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredCredentials.slice(indexOfFirstRecord, indexOfLastRecord);

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'verified':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600';
      case 'pending':
        return 'bg-amber-50 border-amber-200 text-amber-600';
      case 'rejected':
        return 'bg-rose-50 border-rose-200 text-rose-600';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-black font-bold uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Mall Credential Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black font-bold tracking-tight">Mall Credential Master</h1>
          </div>

          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Upload Credential</span>
             </div>
             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black font-bold" />
               <input 
                 type="text" 
                 placeholder="Search credentials by staff name, type..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Staff Name</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Document Type</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Document Number</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Issuing Authority</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Expiry Date</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Verification Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((cred) => (
                  <tr key={cred.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-black font-bold text-[10px]">
                          <Award className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 leading-snug">{cred.staffName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">{cred.type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 font-bold">{cred.documentNumber}</td>
                    <td className="px-6 py-4 text-xs text-slate-700">{cred.issuingAuthority}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-xs font-medium ${new Date(cred.expiryDate) < new Date() ? 'text-rose-500 font-bold' : 'text-slate-700'}`}>{cred.expiryDate}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(cred.verificationStatus)}`}>
                          {cred.verificationStatus === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {cred.verificationStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {cred.verificationStatus === 'rejected' && <XCircle className="w-3 h-3" />}
                          {cred.verificationStatus === 'expired' && <AlertCircle className="w-3 h-3" />}
                          <span>{cred.verificationStatus}</span>
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleEditClick(cred)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(cred.id)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">No credential records loaded</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          <Pagination 
            totalRecords={filteredCredentials.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="p-8 border-b border-slate-150 flex items-center justify-between bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-transparent opacity-20"></div>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/5 flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner">
                      <Award className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-black font-bold tracking-tight">
                        {isEditing ? 'Modify Credentials Profile' : 'Upload Staff Credential'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Setup clinical training and medical credentials</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Staff Member Name</label>
                    <input name="staffName" value={formData.staffName} onChange={handleInputChange} required placeholder="e.g. Dr. Arthur Pendelton" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Credential Type</label>
                    <Select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="BLS">BLS (Basic Life Support)</option>
                      <option value="ACLS">ACLS (Adv Cardiac Life Support)</option>
                      <option value="PALS">PALS (Pediatric Adv Life Support)</option>
                      <option value="NRP">NRP (Neonatal Resuscitation Program)</option>
                      <option value="Malpractice-Insurance">Malpractice Insurance</option>
                      <option value="Dataflow-Report">Dataflow Verification Report</option>
                      <option value="Degree-Verification">Medical Degree Verification</option>
                      <option value="Police-Clearance">Police Clearance Certificate</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Document Number</label>
                    <input name="documentNumber" value={formData.documentNumber} onChange={handleInputChange} required placeholder="e.g. BLS-ERC-7782" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-bold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Issuing Authority</label>
                    <input name="issuingAuthority" value={formData.issuingAuthority} onChange={handleInputChange} required placeholder="e.g. American Heart Association" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Expiry Date</label>
                    <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Verification Status</label>
                    <Select name="verificationStatus" value={formData.verificationStatus} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="pending">Pending Verification</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-[#040404] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                     {isEditing ? 'Save Credential' : 'Publish Credential'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-black font-bold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[10px] font-bold tracking-tight text-slate-800 uppercase">QCare Clinical Credentialing Hub</span>
           </div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enterprise Clinical Master</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MallCredential;
