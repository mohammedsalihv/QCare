import Select from '../components/Select.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useNotification } from '../components/NotificationContext';
import AssetRegisterTable from '../components/fms/AssetRegisterTable';
import { 
  Wrench, 
  Plus, 
  XCircle, 
  Loader2, 
  Calendar, 
  FileSpreadsheet, 
  Clock, 
  History, 
  CheckCircle,
  FileText,
  AlertTriangle,
  Heart
} from 'lucide-react';

const EquipmentManagement = () => {
  const { showNotification } = useNotification();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Selected Asset for Maintenance or History
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add Asset Form State
  const [assetId, setAssetId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [department, setDepartment] = useState('');
  const [ward, setWard] = useState('');
  const [criticality, setCriticality] = useState('non-critical');
  const [calibrationFrequencyMonths, setCalibrationFrequencyMonths] = useState(12);
  const [ppmFrequencyMonths, setPpmFrequencyMonths] = useState(6);
  const [lastCalibrationDate, setLastCalibrationDate] = useState('');
  const [lastPPMDate, setLastPPMDate] = useState('');
  const [status, setStatus] = useState('active');

  // Log Maintenance Form State
  const [logType, setLogType] = useState('calibration');
  const [performedBy, setPerformedBy] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [findings, setFindings] = useState('');
  const [result, setResult] = useState('pass');

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isManager = ['SuperAdmin', 'QualityManager', 'admin'].includes(userInfo.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [statsRes, assetsRes] = await Promise.all([
        axios.get('/api/fms/dashboard', config),
        axios.get('/api/fms/assets', config)
      ]);
      
      setStats(statsRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      showNotification('Failed to load equipment assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = {
        assetId,
        equipmentName,
        model,
        serialNumber,
        manufacturer,
        department,
        ward,
        criticality,
        calibrationFrequencyMonths: Number(calibrationFrequencyMonths),
        ppmFrequencyMonths: Number(ppmFrequencyMonths),
        lastCalibrationDate: lastCalibrationDate || new Date(),
        lastPPMDate: lastPPMDate || new Date(),
        status
      };
      
      await axios.post('/api/fms/assets', body, config);
      showNotification('Biomedical Asset added successfully!', 'success');
      setShowAddModal(false);
      
      // Reset Form
      setAssetId('');
      setEquipmentName('');
      setModel('');
      setSerialNumber('');
      setManufacturer('');
      setDepartment('');
      setWard('');
      setCriticality('non-critical');
      setLastCalibrationDate('');
      setLastPPMDate('');
      
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to add asset', 'error');
    }
  };

  const handleLogMaintenance = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = {
        assetId: selectedAsset._id,
        logType,
        performedBy,
        vendorName,
        cost: cost ? Number(cost) : undefined,
        description,
        findings,
        result
      };
      
      await axios.post('/api/fms/maintenance', body, config);
      showNotification('Maintenance log registered successfully!', 'success');
      setShowMaintModal(false);
      
      // Reset Form
      setPerformedBy('');
      setVendorName('');
      setCost('');
      setDescription('');
      setFindings('');
      setResult('pass');
      
      fetchData();
    } catch (error) {
      showNotification('Failed to log maintenance', 'error');
    }
  };

  const handleViewHistory = async (id) => {
    try {
      setShowHistoryModal(true);
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/fms/assets/${id}/history`, config);
      setHistoryLogs(res.data);
    } catch (error) {
      showNotification('Failed to fetch maintenance history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <DashboardLayout title="Equipment & Assets Management">
      <div className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-[#040404] text-white rounded-[2rem] shadow-xl">
                 <Wrench className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-black font-bold dark:text-white tracking-tight uppercase">Equipment Management</h2>
                 <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest mt-1">Biomedical Registries • Calibration Due • PPM Maintenance Scheduler</p>
              </div>
           </div>

           {isManager && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
             >
               <Plus className="w-4 h-4" />
               Register Asset
             </button>
           )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Total Assets</p>
              <h3 className="text-3xl font-black text-black font-bold mt-2">{stats?.totalAssets || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-black font-bold rounded-2xl flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Uptime Rate</p>
              <h3 className="text-3xl font-black text-teal-600 mt-2">{stats?.uptimeRate || 0}%</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Calibration Due (&lt;30d)</p>
              <h3 className="text-3xl font-black text-rose-600 mt-2">{stats?.calibrationDue || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 animate-pulse" /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-black font-bold uppercase tracking-widest">Next Calibration Pending</p>
              <h3 className="text-sm font-black text-black font-bold mt-4 uppercase">Routine Checks Daily</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Assets Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-black font-bold" />
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-black font-bold uppercase tracking-[0.2em] px-2">Biomedical Registry Inventory</h3>
            
            <AssetRegisterTable 
              assets={assets}
              onMaintenance={(asset) => {
                setSelectedAsset(asset);
                setShowMaintModal(true);
              }}
              onHistory={(id) => {
                const assetObj = assets.find(a => a._id === id);
                setSelectedAsset(assetObj);
                handleViewHistory(id);
              }}
            />
          </div>
        )}

        {/* Add Asset Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black font-bold uppercase tracking-tight">Register Biomedical Asset</h3>
                  <p className="text-[10px] font-bold text-black font-bold uppercase tracking-widest mt-1">Register devices to automate tracking and calibration workflows</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-black font-bold hover:text-black font-bold rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Asset ID (Unique Reference)</label>
                    <input 
                      type="text" 
                      required
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      placeholder="e.g. BIO-MED-091"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Equipment / Device Name</label>
                    <input 
                      type="text" 
                      required
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      placeholder="e.g. ICU Ventilator"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Model</label>
                    <input 
                      type="text" 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. V-Series Pro"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Serial Number</label>
                    <input 
                      type="text" 
                      required
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. SN-9982312"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Manufacturer</label>
                    <input 
                      type="text" 
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="Philips Healthcare"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Department</label>
                    <input 
                      type="text" 
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Intensive Care"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Ward / Location</label>
                    <input 
                      type="text" 
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="Ward A"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Criticality Level</label>
                    <Select 
                      value={criticality}
                      onChange={(e) => setCriticality(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold bg-white"
                    >
                      <option value="non-critical">Non-Critical</option>
                      <option value="critical">Critical</option>
                      <option value="life-saving">Life-Saving</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">Calibration Frequency (Months)</label>
                    <input 
                      type="number" 
                      value={calibrationFrequencyMonths}
                      onChange={(e) => setCalibrationFrequencyMonths(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-black font-bold uppercase tracking-widest block">PPM Frequency (Months)</label>
                    <input 
                      type="number" 
                      value={ppmFrequencyMonths}
                      onChange={(e) => setPpmFrequencyMonths(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-black font-bold rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Save Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log Maintenance Modal */}
        {showMaintModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black font-bold uppercase tracking-tight">Log Maintenance / Calibration</h3>
                  <p className="text-[10px] font-bold text-black font-bold uppercase tracking-widest mt-1">
                    Asset: {selectedAsset?.assetId} — {selectedAsset?.equipmentName}
                  </p>
                </div>
                <button 
                  onClick={() => setShowMaintModal(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-black font-bold hover:text-black font-bold rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleLogMaintenance} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Activity Type</label>
                    <Select 
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold bg-white"
                    >
                      <option value="calibration">Calibration Check</option>
                      <option value="PPM">Planned Preventive Maintenance (PPM)</option>
                      <option value="repair">Fault Repair</option>
                      <option value="inspection">Routine Safety Inspection</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Activity Result</label>
                    <Select 
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold bg-white"
                    >
                      <option value="pass">Pass (Compliant & Functional)</option>
                      <option value="fail">Fail (Needs Repair / Quarantined)</option>
                      <option value="conditional">Conditional Pass (Under Watch)</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Technician Name</label>
                    <input 
                      type="text" 
                      required
                      value={performedBy}
                      onChange={(e) => setPerformedBy(e.target.value)}
                      placeholder="John Technician"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Vendor Name (If External)</label>
                    <input 
                      type="text" 
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="Philips Support"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Servicing Cost (AED)</label>
                    <input 
                      type="number" 
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Work Description</label>
                  <textarea 
                    rows="2"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific actions taken (e.g. replaced power cable)..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black font-bold uppercase tracking-widest block">Observations / Findings</label>
                  <textarea 
                    rows="2"
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    placeholder="Note down deviation details, electrical test results, calibration values..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowMaintModal(false)}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-black font-bold rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Save Maintenance Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black font-bold uppercase tracking-tight">Maintenance History</h3>
                  <p className="text-[10px] font-bold text-black font-bold uppercase tracking-widest mt-1">
                    Asset: {selectedAsset?.assetId} — {selectedAsset?.equipmentName}
                  </p>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-black font-bold hover:text-black font-bold rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-black font-bold" />
                </div>
              ) : historyLogs.length === 0 ? (
                <p className="text-center py-12 text-[10px] font-black text-black font-bold uppercase tracking-widest">
                  No servicing history logs found for this asset.
                </p>
              ) : (
                <div className="space-y-4">
                  {historyLogs.map((log) => (
                    <div key={log._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {log.logType}
                          </span>
                          <p className="text-xs font-black text-black font-bold uppercase tracking-tight mt-2">{log.description}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                          log.result === 'pass' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'
                        }`}>{log.result}</span>
                      </div>
                      
                      {log.findings && (
                        <p className="text-xs text-black font-bold bg-white p-3 rounded-xl border border-slate-100">
                          <span className="font-bold text-[8px] uppercase tracking-wider block text-black font-bold mb-1">Findings:</span>
                          {log.findings}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-[9px] font-black uppercase tracking-wider text-black font-bold border-t border-slate-100/50 pt-3">
                        <div>
                          <span>Performed By</span>
                          <span className="block text-black font-bold">{log.performedBy || log.vendorName || 'N/A'}</span>
                        </div>
                        <div>
                          <span>Verified By</span>
                          <span className="block text-black font-bold">{log.verifiedBy?.employeeName || 'System'}</span>
                        </div>
                        <div>
                          <span>Serviced On</span>
                          <span className="block text-black font-bold">{new Date(log.maintenanceDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default EquipmentManagement;
