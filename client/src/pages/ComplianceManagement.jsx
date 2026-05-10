import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import ComplianceDashboard from '../components/compliance/ComplianceDashboard';
import LicenseTable from '../components/compliance/LicenseTable';
import CircularList from '../components/compliance/CircularList';
import { useNotification } from '../components/NotificationContext';
import { Plus, ShieldCheck } from 'lucide-react';

const ComplianceManagement = () => {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [facilityLicenses, setFacilityLicenses] = useState([]);
  const [staffLicenses, setStaffLicenses] = useState([]);
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isAdmin = ['SuperAdmin', 'QualityManager', 'admin'].includes(userInfo.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, fLicRes, sLicRes, circRes] = await Promise.all([
        axios.get('/api/compliance/dashboard', config),
        axios.get('/api/compliance/licenses/facility', config),
        axios.get('/api/compliance/licenses/staff', config),
        axios.get('/api/compliance/circulars', config)
      ]);

      setStats(statsRes.data.stats);
      setFacilityLicenses(Array.isArray(fLicRes.data) ? fLicRes.data : []);
      setStaffLicenses(Array.isArray(sLicRes.data) ? sLicRes.data : []);
      setCirculars(Array.isArray(circRes.data) ? circRes.data : []);
    } catch (error) {
      showNotification('Failed to load compliance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/compliance/circulars/${id}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Circular acknowledged successfully', 'success');
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Acknowledgment failed', 'error');
    }
  };

  return (
    <DashboardLayout title="DOH Compliance & Licensing">
      <div className="space-y-8 pb-10">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Compliance Center</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Regulatory & Licensing Management</p>
             </div>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                <Plus className="w-4 h-4" />
                Add License
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <ComplianceDashboard stats={stats} />

        {/* Licenses Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Licensing Inventory</h3>
          <LicenseTable 
            facilityLicenses={facilityLicenses} 
            staffLicenses={staffLicenses} 
          />
        </div>

        {/* Circulars Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Regulatory Circulars</h3>
          <CircularList 
            circulars={circulars} 
            onAcknowledge={handleAcknowledge}
            currentUserId={userInfo._id}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComplianceManagement;
