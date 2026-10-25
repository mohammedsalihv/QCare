import Table from '../Table.jsx';
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
    if (days <= 0) return <span className="px-2 py-1 bg-red-100 text-red-700 text-[12px] font-semibold rounded-full normal-case">Expired</span>;
    if (days <= 30) return <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[12px] font-semibold rounded-full normal-case">Critical</span>;
    if (days <= 90) return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[12px] font-semibold rounded-full normal-case">Expiring Soon</span>;
    return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[12px] font-semibold rounded-full normal-case">Active</span>;
  };

  const renderFacilityTable = () => (
    <div className="overflow-x-auto">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 ">
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">License No</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Type</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Expiry Date</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-center">Days Left</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(facilityLicenses) && facilityLicenses.map((lic) => {
            const days = getDaysRemaining(lic.expiryDate);
            return (
              <tr key={lic._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{lic.licenseNumber}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-[13px] font-medium text-slate-800 font-semibold capitalize">{lic.licenseType}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-800 font-semibold">
                    <Calendar className="w-3 h-3" />
                    {new Date(lic.expiryDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[13px] font-semibold ${days < 30 ? 'text-rose-600' : days < 90 ? 'text-amber-600' : 'text-slate-800 font-semibold'}`}>
                    {days}
                  </span>
                </td>
                <td className="p-4">{getStatusBadge(lic.expiryDate)}</td>
                <td className="p-4 text-right">
                  <button className="p-2 text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          {(!Array.isArray(facilityLicenses) || facilityLicenses.length === 0) && (
            <tr>
              <td colSpan="6" className="p-10 text-center text-[13px] font-semibold text-slate-800 normal-case tracking-normal">
                No facility licenses found
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );

  const renderStaffTable = () => (
    <div className="overflow-x-auto">
      <Table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 ">
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Provider</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">License No</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Specialty</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Expiry Date</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal">Status</th>
            <th className="p-4 text-[12px] font-semibold text-slate-800 normal-case tracking-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(staffLicenses) && staffLicenses.map((lic) => (
            <tr key={lic._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">{lic.staffId?.employeeName}</span>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className="text-[13px] font-semibold text-slate-800">{lic.licenseNumber}</span>
              </td>
              <td className="p-4">
                <span className="text-[13px] font-medium text-slate-800 font-semibold">{lic.specialty}</span>
              </td>
              <td className="p-4">
                <span className="text-[13px] font-medium text-slate-800 font-semibold">{new Date(lic.expiryDate).toLocaleDateString()}</span>
              </td>
              <td className="p-4">{getStatusBadge(lic.expiryDate)}</td>
              <td className="p-4 text-right">
                <button className="p-2 text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {(!Array.isArray(staffLicenses) || staffLicenses.length === 0) && (
            <tr>
              <td colSpan="6" className="p-10 text-center text-[13px] font-semibold text-slate-800 normal-case tracking-normal">
                No staff licenses found
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex border-b border-slate-100 ">
        <button
          onClick={() => setActiveTab('facility')}
          className={`px-8 py-4 text-[13px] font-semibold normal-case tracking-normal transition-all ${
            activeTab === 'facility' ? 'border-b-2 border-[#040404] text-slate-800 bg-slate-100/30' : 'text-slate-800 font-semibold hover:text-slate-800'
          }`}
        >
          Facility Licenses
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-8 py-4 text-[13px] font-semibold normal-case tracking-normal transition-all ${
            activeTab === 'staff' ? 'border-b-2 border-[#040404] text-slate-800 bg-slate-100/30' : 'text-slate-800 font-semibold hover:text-slate-800'
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
