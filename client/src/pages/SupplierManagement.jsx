import Select from '../components/Select.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import { 
  Building2, 
  Plus, 
  XCircle, 
  Loader2, 
  Calendar,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Star,
  ShieldAlert,
  Mail,
  Phone
} from 'lucide-react';

const SupplierManagement = () => {
  const { showNotification } = useNotification();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Medical Equipment');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(4);
  const [status, setStatus] = useState('Under Evaluation');
  const [lastAuditDate, setLastAuditDate] = useState('');
  const [nextAuditDate, setNextAuditDate] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isManager = ['SuperAdmin', 'QualityManager', 'admin'].includes(userInfo.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/qms/suppliers', config);
      setSuppliers(res.data);
    } catch (error) {
      showNotification('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = {
        name,
        category,
        contactPerson,
        email,
        phone,
        rating: Number(rating),
        status,
        lastAuditDate: lastAuditDate || null,
        nextAuditDate: nextAuditDate || null
      };
      await axios.post('/api/qms/suppliers', body, config);
      showNotification('Supplier registered successfully!', 'success');
      setShowModal(false);

      // Reset form
      setName('');
      setCategory('Medical Equipment');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setRating(4);
      setStatus('Under Evaluation');
      setLastAuditDate('');
      setNextAuditDate('');

      fetchData();
    } catch (error) {
      showNotification('Failed to register supplier', 'error');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/qms/suppliers/${id}`, { status: newStatus }, config);
      showNotification(`Supplier status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to update status', 'error');
    }
  };

  const handleRatingChange = async (id, newRating) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/qms/suppliers/${id}`, { rating: Number(newRating) }, config);
      showNotification(`Supplier rating updated to ${newRating} Stars`, 'success');
      fetchData();
    } catch (error) {
      showNotification('Failed to update rating', 'error');
    }
  };

  // Stats calculation
  const total = suppliers.length;
  const approved = suppliers.filter(s => s.status === 'Approved').length;
  const underEval = suppliers.filter(s => s.status === 'Under Evaluation').length;
  const blacklisted = suppliers.filter(s => s.status === 'Blacklisted').length;

  return (
    <DashboardLayout title="Supplier Management">
      <div className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-[#040404] text-white rounded-[2rem] shadow-xl">
                 <Building2 className="w-8 h-8 text-teal-400" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-black font-bold dark:text-white tracking-tight uppercase">Supplier & Vendor Directory</h2>
                 <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest mt-1">Vendor Evaluations • SLA Monitoring • Regulatory Safety Auditing</p>
              </div>
           </div>

           <button 
             onClick={() => setShowModal(true)}
             className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
           >
             <Plus className="w-4 h-4" />
             Register Supplier
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Total Suppliers</p>
              <h3 className="text-3xl font-black text-black font-bold mt-2">{total}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-black font-bold rounded-2xl flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Approved Vendors</p>
              <h3 className="text-3xl font-black text-teal-600 mt-2">{approved}</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Under Evaluation</p>
              <h3 className="text-3xl font-black text-amber-600 mt-2">{underEval}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Blacklisted</p>
              <h3 className="text-3xl font-black text-rose-600 mt-2">{blacklisted}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><ShieldAlert className="w-6 h-6 animate-bounce" /></div>
          </div>
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-black font-bold" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-black font-bold">
            No suppliers registered. Click "Register Supplier" to populate the database.
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-black font-bold uppercase tracking-[0.2em] px-2">Approved & Verified Supplier Directory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <div key={supplier._id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Category and Status Badge */}
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[9px] font-black text-black font-bold bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{supplier.category}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                        supplier.status === 'Approved' ? 'bg-teal-50 text-teal-600' :
                        supplier.status === 'Blacklisted' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>{supplier.status}</span>
                    </div>

                    <h4 className="text-lg font-black text-black font-bold uppercase tracking-tight mb-2">{supplier.name}</h4>
                    <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest mb-6">Supplier ID: {supplier.supplierId}</p>
                    
                    {/* Contact Details */}
                    <div className="space-y-3 border-t border-slate-100 pt-4 mb-6">
                      <div className="flex items-center gap-3 text-xs font-bold text-black font-bold">
                        <Building2 className="w-4 h-4 text-black font-bold" />
                        <span>Contact: {supplier.contactPerson || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-black font-bold">
                        <Mail className="w-4 h-4 text-black font-bold" />
                        <span>{supplier.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-black font-bold">
                        <Phone className="w-4 h-4 text-black font-bold" />
                        <span>{supplier.phone || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 mb-6">
                      <span className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">Performance Rating</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            onClick={() => isManager && handleRatingChange(supplier._id, star)}
                            className={`w-4 h-4 cursor-pointer transition-colors ${
                              star <= supplier.rating ? 'text-amber-500 fill-amber-500' : 'text-black font-bold'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-black text-black font-bold ml-2">{supplier.rating || 0} / 5</span>
                      </div>
                    </div>

                    {/* Audits info */}
                    <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-wider text-black font-bold bg-slate-50/50 p-4 rounded-xl">
                      <div>
                        <span className="block text-black font-bold text-[8px]">Last Audit</span>
                        <span className="text-black font-bold">{supplier.lastAuditDate ? new Date(supplier.lastAuditDate).toLocaleDateString() : 'Never'}</span>
                      </div>
                      <div>
                        <span className="block text-black font-bold text-[8px]">Next Audit</span>
                        <span className="text-black font-bold">{supplier.nextAuditDate ? new Date(supplier.nextAuditDate).toLocaleDateString() : 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  {isManager && (
                    <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                      {supplier.status !== 'Approved' && (
                        <button 
                          onClick={() => handleStatusChange(supplier._id, 'Approved')}
                          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Approve
                        </button>
                      )}
                      {supplier.status !== 'Under Evaluation' && (
                        <button 
                          onClick={() => handleStatusChange(supplier._id, 'Under Evaluation')}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Evaluate
                        </button>
                      )}
                      {supplier.status !== 'Blacklisted' && (
                        <button 
                          onClick={() => handleStatusChange(supplier._id, 'Blacklisted')}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Blacklist
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Register Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black font-bold uppercase tracking-tight">Register Vendor / Supplier</h3>
                  <p className="text-[10px] font-bold text-black font-bold uppercase tracking-widest mt-1">Initiate safety audit and qualification workflow</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-black font-bold hover:text-black font-bold rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Supplier / Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Apex Biotech Diagnostics"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Supply Category</label>
                    <Select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold bg-white"
                    >
                      <option value="Medical Equipment">Medical Equipment</option>
                      <option value="Consumables">Consumables / Supplies</option>
                      <option value="Pharmaceuticals">Pharmaceuticals</option>
                      <option value="IT & Software">IT & Software Systems</option>
                      <option value="Facilities">Facilities & Support</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Contact Person</label>
                    <input 
                      type="text" 
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@supplier.com"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Last Audit Date (Optional)</label>
                    <input 
                      type="date" 
                      value={lastAuditDate}
                      onChange={(e) => setLastAuditDate(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Next Audit Date (Optional)</label>
                    <input 
                      type="date" 
                      value={nextAuditDate}
                      onChange={(e) => setNextAuditDate(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-black font-bold rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Register Vendor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default SupplierManagement;
