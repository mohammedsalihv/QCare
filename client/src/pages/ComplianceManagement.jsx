import CreateRecordDialog from '../components/records/CreateRecordDialog';
import { getAuthConfig } from '../utils/authConfig';
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
  const [createKind, setCreateKind] = useState(null);
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
      const config = getAuthConfig();

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
      await axios.post(`/api/compliance/circulars/${id}/acknowledge`, {}, {
        ...getAuthConfig()
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
                <h2 className="text-xl font-semibold text-slate-800 normal-case tracking-tight">Compliance Center</h2>
                <p className="text-[13px] font-semibold text-slate-800 normal-case tracking-normal">Regulatory & Licensing Management</p>
             </div>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              {userInfo.role?.toLowerCase() === 'superadmin' && <button type="button" onClick={() => setCreateKind('staffLicense')} className="flex items-center gap-2 border px-4 py-2 rounded-xl"><Plus className="w-4 h-4" />Add Staff License</button>}
              <button type="button" onClick={() => setCreateKind(userInfo.role?.toLowerCase() === 'superadmin' ? 'facilityLicense' : 'staffLicense')} className="flex items-center gap-2 bg-primary hover:bg-primary text-white px-4 py-2 rounded-xl text-[13px] font-semibold normal-case tracking-normal transition-all">
                <Plus className="w-4 h-4" />
                {userInfo.role?.toLowerCase() === 'superadmin' ? 'Add Facility License' : 'Add Staff License'}
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <ComplianceDashboard stats={stats} />

        {/* Licenses Section */}
        <div className="space-y-4">
          <h3 className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal px-2">Licensing Inventory</h3>
          <LicenseTable 
            facilityLicenses={facilityLicenses} 
            staffLicenses={staffLicenses} 
          />
        </div>

        {/* Circulars Section */}
        <div className="space-y-4">
          <h3 className="text-[12px] font-semibold text-slate-800 normal-case tracking-normal px-2">Regulatory Circulars</h3>
          <CircularList 
            circulars={circulars} 
            onAcknowledge={handleAcknowledge}
            currentUserId={userInfo._id}
          />
        </div>
      </div>
    {createKind && <CreateRecordDialog key={createKind} kind={createKind} onClose={() => setCreateKind(null)} onCreated={() => { showNotification('License saved successfully', 'success'); fetchData(); }} />}
    </DashboardLayout>
  );
};

export default ComplianceManagement;
