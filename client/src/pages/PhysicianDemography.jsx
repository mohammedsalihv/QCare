import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  UserSquare2,
  FileEdit, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Hash,
  Activity,
  Calendar,
  GraduationCap
} from 'lucide-react';

const PhysicianDemography = () => {
  const [physicians, setPhysicians] = useState([
    { id: 1, name: 'Dr. Sarah Wilson', employeeId: 'EMP-0010', gender: 'Female', specialty: 'Cardiology', qualification: 'MD, FACC', licenseType: 'DOH', licenseNumber: 'DOH-LIC-98122', expiryDate: '2028-09-12', status: 'Active' },
    { id: 2, name: 'Dr. Aaron Patel', employeeId: 'EMP-0015', gender: 'Male', specialty: 'Pediatrics', qualification: 'MD, FAAP', licenseType: 'DHA', licenseNumber: 'DHA-LIC-44510', expiryDate: '2026-11-20', status: 'Active' },
    { id: 3, name: 'Dr. Clara Thorne', employeeId: 'EMP-0022', gender: 'Female', specialty: 'Neurology', qualification: 'MD, PhD', licenseType: 'DOH', licenseNumber: 'DOH-LIC-22104', expiryDate: '2027-04-18', status: 'Active' },
    { id: 4, name: 'Dr. John Doe', employeeId: 'EMP-0005', gender: 'Male', specialty: 'Orthopedics', qualification: 'MBBS, MS', licenseType: 'MOHAP', licenseNumber: 'MOH-LIC-77612', expiryDate: '2026-03-01', status: 'Inactive' },
    { id: 5, name: 'Dr. Elena Rostova', employeeId: 'EMP-0044', gender: 'Female', specialty: 'Dermatology', qualification: 'MD', licenseType: 'DHA', licenseNumber: 'DHA-LIC-99081', expiryDate: '2027-12-15', status: 'Active' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPhysician, setCurrentPhysician] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    gender: 'Female',
    specialty: '',
    qualification: '',
    licenseType: 'DOH',
    licenseNumber: '',
    expiryDate: '',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      employeeId: '',
      gender: 'Female',
      specialty: '',
      qualification: '',
      licenseType: 'DOH',
      licenseNumber: '',
      expiryDate: '',
      status: 'Active'
    });
    setIsEditing(false);
    setCurrentPhysician(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (phys) => {
    setCurrentPhysician(phys);
    setFormData({
      name: phys.name,
      employeeId: phys.employeeId,
      gender: phys.gender,
      specialty: phys.specialty,
      qualification: phys.qualification,
      licenseType: phys.licenseType,
      licenseNumber: phys.licenseNumber,
      expiryDate: phys.expiryDate,
      status: phys.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setPhysicians(prev => prev.filter(p => p.id !== id));
  };

  const toggleStatus = (id) => {
    setPhysicians(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setPhysicians(prev => prev.map(p => p.id === currentPhysician.id ? { ...p, ...formData } : p));
    } else {
      const newPhys = {
        id: Date.now(),
        ...formData
      };
      setPhysicians(prev => [newPhys, ...prev]);
    }
    setShowModal(false);
    resetForm();
  };

  const filteredPhysicians = physicians.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPhysicians.slice(indexOfFirstRecord, indexOfLastRecord);

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
              <span className="text-[#b59662]">Physician Demography Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black font-bold tracking-tight">Physician Demography Master</h1>
          </div>

          <button 
            onClick={handleAddClick}
            className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg active:scale-95 group text-sm"
          >
             <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Add Physician Profile</span>
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
                 placeholder="Search physicians by name, employee ID, specialty..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-1/4 px-7 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Physician Name</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">ID / Gender</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Clinical Specialty</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Qualifications</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">License Details</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">License Expiry</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-black font-bold tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((phys) => (
                  <tr key={phys.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-medium text-black font-bold text-[10px]">
                          <UserSquare2 className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 leading-snug">{phys.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 font-mono">{phys.employeeId}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{phys.gender}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{phys.specialty}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{phys.qualification}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--color-primary)] font-mono">{phys.licenseNumber}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{phys.licenseType}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-xs font-medium ${new Date(phys.expiryDate) < new Date() ? 'text-rose-500 font-bold' : 'text-slate-700'}`}>{phys.expiryDate}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => toggleStatus(phys.id)}
                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                           phys.status === 'Active' 
                           ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/50' 
                           : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                         }`}
                       >
                          {phys.status === 'Active' ? (
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
                            onClick={() => handleEditClick(phys)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(phys.id)}
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
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">No physician profiles found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={filteredPhysicians.length} 
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
                      <UserSquare2 className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-black font-bold tracking-tight">
                        {isEditing ? 'Modify Physician Profile' : 'Establish Physician Profile'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Setup physician demographic and clinical information</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Physician Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Dr. Arthur Pendelton" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Employee ID</label>
                    <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} required placeholder="e.g. EMP-0091" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-bold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Clinical Specialty</label>
                    <input name="specialty" value={formData.specialty} onChange={handleInputChange} required placeholder="e.g. Cardiology" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Qualifications</label>
                    <input name="qualification" value={formData.qualification} onChange={handleInputChange} required placeholder="e.g. MD, PhD" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">License Type</label>
                    <select name="licenseType" value={formData.licenseType} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="DOH">DOH (Abu Dhabi)</option>
                      <option value="DHA">DHA (Dubai)</option>
                      <option value="MOHAP">MOHAP (UAE)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">License Number</label>
                    <input name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} required placeholder="e.g. DOH-LIC-88120" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-bold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Expiry Date</label>
                    <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-[#040404] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                     {isEditing ? 'Save Physician Profile' : 'Publish Profile'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 text-black font-bold">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-[10px] font-bold tracking-tight text-slate-800 uppercase">QCare Physician Demography Directory</span>
           </div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enterprise Clinical Master</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PhysicianDemography;
