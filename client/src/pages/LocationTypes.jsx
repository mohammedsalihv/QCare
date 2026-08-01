import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import Dropdown from '../components/Dropdown';
import { useNotification } from '../components/NotificationContext';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  MapPin, 
  FileEdit, 
  Trash2, 
  X, 
  ArrowUpRight, 
  ShieldCheck
} from 'lucide-react';

const statusOptions = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const LocationTypes = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const navigate = useNavigate();
  const { showNotification, confirm } = useNotification();
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true
  });

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { role } = JSON.parse(userInfo);
      setIsAdmin(!!role?.toLowerCase().includes('admin'));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return {};
    const { token } = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://192.168.1.160:5000/api/locations', getAuthConfig());
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      isActive: true
    });
    setIsEditing(false);
    setCurrentLocation(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (loc) => {
    setCurrentLocation(loc);
    setFormData({
      name: loc.name || '',
      code: loc.code || '',
      isActive: loc.isActive !== undefined ? loc.isActive : true
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    confirm({
      title: 'Delete Location',
      message: 'Are you sure you want to remove this hospital location? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://192.168.1.160:5000/api/locations/${id}`, getAuthConfig());
          showNotification('Location removed successfully', 'success');
          fetchLocations();
        } catch (err) {
          showNotification(err.response?.data?.message || 'Error deleting location', 'error');
        }
      }
    });
  };

  const toggleStatus = async (loc) => {
    try {
      const updatedStatus = !loc.isActive;
      await axios.put(`http://192.168.1.160:5000/api/locations/${loc._id}`, {
        ...loc,
        isActive: updatedStatus
      }, getAuthConfig());
      showNotification(`Location marked as ${updatedStatus ? 'Active' : 'Inactive'}`, 'success');
      fetchLocations();
    } catch (err) {
      showNotification('Error updating status', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://192.168.1.160:5000/api/locations/${currentLocation._id}`, formData, getAuthConfig());
        showNotification('Location details updated successfully', 'success');
      } else {
        await axios.post('http://192.168.1.160:5000/api/locations', formData, getAuthConfig());
        showNotification('New hospital zone published successfully', 'success');
      }
      setShowModal(false);
      fetchLocations();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving location', 'error');
    }
  };

  const filteredLocations = locations.filter(l => 
    (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredLocations.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-black uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Master Configuration</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-[#b59662]">Location Master</span>
            </div>
            <h1 className="text-2xl font-extrabold text-black tracking-tight">Location Master</h1>
          </div>

          {isAdmin && (
            <button 
              onClick={handleAddClick}
              className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg active:scale-95 group text-sm"
            >
               <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                  <span>Establish Zone</span>
               </div>
               <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
            <div className="relative w-full sm:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
               <input 
                 type="text" 
                 placeholder="Search locations by name or code..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all text-xs font-semibold"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
<thead>
                <tr className="bg-slate-100/50">
                  <th className="w-20 px-7 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">S.No</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Location Name</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Code</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Created By</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Updated At</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200">Status</th>
                  <th className="w-36 px-6 py-5 text-[12px] font-bold text-black tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((loc, index) => (
                  <tr key={loc._id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-7 py-4 text-xs font-semibold text-slate-800">
                      {indexOfFirstRecord + index + 1}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {loc.name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {loc.code || '—'}
                    </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {loc.createdBy || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {loc.updatedAt ? new Date(loc.updatedAt).toLocaleString() : (loc.createdAt ? new Date(loc.createdAt).toLocaleString() : '—')}
                      </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {loc.isActive ? (
                        <span className="px-1.5 py-0.5 text-[8px] font-bold bg-green-100 text-green-800 rounded-md">Active</span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-100 text-slate-400 rounded-md">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                      <div className="flex items-center justify-end gap-2.5">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleEditClick(loc)}
                              className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:border-slate-800 hover:text-slate-800 transition-all duration-300 active:scale-95 shadow-sm"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(loc._id)}
                              className="w-9 h-9 rounded-md border border-slate-200 bg-white text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all duration-300 active:scale-95 shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {loading ? 'Fetching locations...' : 'No locations registered'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={filteredLocations.length} 
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
                      <MapPin className="w-7 h-7 text-[var(--color-primary)]" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-black tracking-tight">
                        {isEditing ? 'Modify Location Profile' : 'Register Structural Location'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Setup building structure, department, and responsible headers</p>
                   </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100 shadow-sm active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>
 
              <form onSubmit={handleSubmit} className="p-8 pb-12 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Zone / Room Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Dental Suite Room B" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Location / Zone Code</label>
                    <input name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g. DEN-SB" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all text-xs font-bold text-slate-800 font-mono" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Status</label>
                    <Dropdown
                      options={statusOptions}
                      value={formData.isActive ? 'true' : 'false'}
                      onSelect={(val) => setFormData({ ...formData, isActive: val === 'true' })}
                      placeholder="Select Status"
                      fullWidth
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all border border-slate-200 uppercase tracking-[0.15em] active:scale-95">
                     Discard
                   </button>
                   <button type="submit" className="flex-[2] py-3 bg-[#040404] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                     {isEditing ? 'Save Location Details' : 'Publish Zone'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

          {/* Footer / branding removed */}
      </div>
    </DashboardLayout>
  );
};

export default LocationTypes;
