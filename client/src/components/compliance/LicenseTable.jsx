import React, { useState } from 'react';
import { FileText, ExternalLink, Calendar, User, Building } from 'lucide-react';

const LicenseTable = ({ facilityLicenses, staffLicenses }) => {
  const [activeTab, setActiveTab] = useState('facility');

  const getDaysRemaining = (expiryDate) => {
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (expiryDate) => {
    const days = getDaysRemaining(expiryDate);
    if (days <= 0) return <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase">Expired</span>;
    if (days <= 30) return <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full uppercase">Critical</span>;
    if (days <= 90) return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">Expiring Soon</span>;
    return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Active</span>;
  };

  const renderFacilityTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">License No</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Days Left</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(facilityLicenses) && facilityLicenses.map((lic) => {
            const days = getDaysRemaining(lic.expiryDate);
            return (
              <tr key={lic._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{lic.licenseNumber}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">{lic.licenseType}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(lic.expiryDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-xs font-black ${days < 30 ? 'text-rose-600' : days < 90 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {days}
                  </span>
                </td>
                <td className="p-4">{getStatusBadge(lic.expiryDate)}</td>
                <td className="p-4 text-right">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          {(!Array.isArray(facilityLicenses) || facilityLicenses.length === 0) && (
            <tr>
              <td colSpan="6" className="p-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                No facility licenses found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderStaffTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Provider</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">License No</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialty</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(staffLicenses) && staffLicenses.map((lic) => (
            <tr key={lic._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{lic.staffId?.employeeName}</span>
                    <span className="text-[10px] text-slate-500">{lic.staffId?.employeeId}</span>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className="text-xs font-bold text-blue-600">{lic.licenseNumber}</span>
              </td>
              <td className="p-4">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{lic.specialty}</span>
              </td>
              <td className="p-4">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{new Date(lic.expiryDate).toLocaleDateString()}</span>
              </td>
              <td className="p-4">{getStatusBadge(lic.expiryDate)}</td>
              <td className="p-4 text-right">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {(!Array.isArray(staffLicenses) || staffLicenses.length === 0) && (
            <tr>
              <td colSpan="6" className="p-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                No staff licenses found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('facility')}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'facility' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Facility Licenses
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'staff' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Staff Licenses
        </button>
      </div>
      <div className="p-2">
        {activeTab === 'facility' ? renderFacilityTable() : renderStaffTable()}
      </div>
    </div>
  );
};

export default LicenseTable;
