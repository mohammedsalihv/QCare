import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  FileEdit, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const ContactInformationMaster = () => {
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Emergency Control Room', phone: '+971 2 611 1111', email: 'emergency.hq@cmcholding.local', department: 'Emergency Medicine', designation: 'HQ Dispatcher', status: 'Active' },
    { id: 2, name: 'Quality Assurance Hotline', phone: '+971 2 611 2233', email: 'quality.support@cmcholding.local', department: 'Quality & Compliance', designation: 'QA Lead Auditor', status: 'Active' },
    { id: 3, name: 'Infection Control Unit Desk', phone: '+971 2 611 4455', email: 'ipc.desk@cmcholding.local', department: 'Infection Prevention', designation: 'IPC Nurse Station', status: 'Active' },
    { id: 4, name: 'IT Helpdesk Support Escalation', phone: '+971 2 611 9999', email: 'it.escalations@cmcholding.local', department: 'Information Technology', designation: 'Operations Manager', status: 'Active' },
    { id: 5, name: 'Medical Director Secretariat', phone: '+971 2 611 8888', email: 'medical.director@cmcholding.local', department: 'Medical Affairs', designation: 'Executive Assistant', status: 'Inactive' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    designation: '',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      department: '',
      designation: '',
      status: 'Active'
    });
    setIsEditing(false);
    setCurrentContact(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (contact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      department: contact.department,
      designation: contact.designation,
      status: contact.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const toggleStatus = (id) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setContacts(prev => prev.map(c => c.id === currentContact.id ? { ...c, ...formData } : c));
    } else {
      const newContact = {
        id: Date.now(),
        ...formData
      };
      setContacts(prev => [newContact, ...prev]);
    }
    setShowModal(false);
    resetForm();
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredContacts.slice(indexOfFirstRecord, indexOfLastRecord);

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
              <span className="text-[#b59662]">Contact Information Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black font-bold tracking-tight">Contact Information Master</h1>
          </div>

          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Add Contact Directory</span>
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
                 placeholder="Search contacts by name, email, department..."
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
                  <th className="w-1/4 px-7 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Contact Title</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Phone / Extension</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Email Address</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Department</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Designation</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-black font-bold text-[10px]">
                          <User className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 leading-snug">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700 font-mono">{contact.phone}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{contact.email}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{contact.department}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">{contact.designation}</span>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => toggleStatus(contact.id)}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                           contact.status === 'Active' 
                           ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/50' 
                           : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                         }`}
                       >
                          {contact.status === 'Active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                       <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleEditClick(contact)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(contact.id)}
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
                        <span className="text-xs font-bold uppercase tracking-widest">No emergency directory records found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          <Pagination 
            totalRecords={filteredContacts.length} 
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
                      <Phone className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-black font-bold tracking-tight">
                        {isEditing ? 'Modify Directory Contact' : 'Establish Corporate Contact'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Setup clinic helpline numbers and references</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Contact Name / Title</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Pharmacy Desk" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Phone Number / Ext</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="e.g. +971 2 611 1234" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="e.g. pharm@cmcholding.local" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Department</label>
                    <input name="department" value={formData.department} onChange={handleInputChange} required placeholder="e.g. Clinical Pharmacy" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Designation</label>
                    <input name="designation" value={formData.designation} onChange={handleInputChange} required placeholder="e.g. Senior Pharmacist" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Status</label>
                    <Select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-[#040404] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                     {isEditing ? 'Save Contact Profile' : 'Publish Contact'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-black font-bold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[10px] font-bold tracking-tight text-slate-800 uppercase">QCare Corporate Directory System</span>
           </div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enterprise Administrative Master</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactInformationMaster;
