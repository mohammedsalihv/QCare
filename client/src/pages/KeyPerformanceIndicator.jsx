import MasterSelect from '../components/MasterSelect';
import Table from '../components/Table.jsx';
import Select from '../components/Select.jsx';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../components/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import { 
  BarChart2, 
  Search, 
  RefreshCw, 
  Plus, 
  Printer, 
  Edit, 
  Trash, 
  Bell, 
  BookOpen, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Sliders,
  Settings,
  Mail,
  Filter,
  Check,
  X,
  Activity,
  Award,
  ChevronRight,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const KeyPerformanceIndicator = () => {
  const { showNotification, confirm } = useNotification();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Authenticated user checks
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isQualityManager = ['qualitymanager', 'superadmin', 'admin'].includes(user.role?.toLowerCase());

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  // State loaded from DB
  const [criteriaSearch, setCriteriaSearch] = useState('');
  const [criteriaList, setCriteriaList] = useState([]);

  const [typeSearch, setTypeSearch] = useState('');
  const [typeList, setTypeList] = useState([]);

  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');

  // Notification master states
  const [notifTrigger, setNotifTrigger] = useState('Indicator Critical');
  const [notifCC, setNotifCC] = useState(true);
  const [notifTemplateBody, setNotifTemplateBody] = useState('');
  const [notifTemplates, setNotifTemplates] = useState([]);

  // Master definitions states
  const [definitionView, setDefinitionView] = useState('list');
  const [selectedKpiDetails, setSelectedKpiDetails] = useState(null);
  const [indicatorActiveTab, setIndicatorActiveTab] = useState('Active');
  const [allIndicators, setAllIndicators] = useState([]);
  const [definedIndicators, setDefinedIndicators] = useState([]);

  // Add definition form states
  const [newKpiName, setNewKpiName] = useState('');
  const [newKpiCat, setNewKpiCat] = useState('patient-safety');
  const [newKpiMainCat, setNewKpiMainCat] = useState('Ambulatory');
  const [newKpiSubCat, setNewKpiSubCat] = useState('Clinical');
  const [newKpiCrit, setNewKpiCrit] = useState('');
  const [newKpiOwner, setNewKpiOwner] = useState(user.employeeName || '');
  const [newKpiFreq, setNewKpiFreq] = useState('Monthly');
  const [newKpiDesc, setNewKpiDesc] = useState('');
  const [newKpiRat, setNewKpiRat] = useState('');
  const [newKpiNum, setNewKpiNum] = useState('');
  const [newKpiDen, setNewKpiDen] = useState('');
  const [newKpiTarget, setNewKpiTarget] = useState('');
  const [newKpiUnit, setNewKpiUnit] = useState('%');

  // Submission States
  const [submissionKpi, setSubmissionKpi] = useState('');
  const [numeratorVal, setNumeratorVal] = useState('');
  const [denominatorVal, setDenominatorVal] = useState('');
  const [submissionPeriod, setSubmissionPeriod] = useState('Q1');
  const [submissionYear, setSubmissionYear] = useState(new Date().getFullYear());
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  // Validation & Approval queues
  const [validationQueue, setValidationQueue] = useState([]);
  const [approvalQueue, setApprovalQueue] = useState([]);

  // Search filter
  const [searchKpiQuery, setSearchKpiQuery] = useState('');

  // Dashboard Stats
  const [dashboardData, setDashboardData] = useState({
    stats: { total: 0, onTrack: 0, atRisk: 0, breached: 0, avgAchievement: 0 },
    trend: [],
    topBreached: []
  });

  // Sidebar Menu Items
  const menuItems = [
    { id: 'dashboard', label: 'Analytics Dashboard', icon: BarChart2 },
    { id: 'indicator-submaster', label: 'Indicator SubMaster', icon: Sliders },
    { id: 'notification-master', label: 'Notification Master', icon: Bell },
    { id: 'master-indicator-definition', label: 'Master Indicator Definition', icon: BookOpen },
    { id: 'indicator-data-submission', label: 'Indicator Data Submission', icon: FileText },
    { id: 'indicator-validation', label: 'Indicator Validation', icon: CheckCircle2 },
    { id: 'indicator-approval', label: 'Indicator Approval', icon: UserCheck },
    { id: 'actions', label: 'Actions', icon: Activity },
    { id: 'search-indicator', label: 'Search Indicator', icon: Search }
  ];

  // Helper: Get distinct KPIs by code (base definition)
  const getDistinctDefinitions = (items) => {
    const map = new Map();
    const sorted = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    sorted.forEach(item => {
      if (!map.has(item.indicatorCode)) {
        map.set(item.indicatorCode, item);
      }
    });
    return Array.from(map.values());
  };

  // Fetch all data from Backend API
  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();
      
      const [
        criteriaRes,
        typesRes,
        notifRes,
        indicatorsRes,
        dashboardRes
      ] = await Promise.all([
        axios.get('/api/kpi/submaster/criteria', config),
        axios.get('/api/kpi/submaster/type', config),
        axios.get('/api/kpi/notifications', config),
        axios.get('/api/kpi', config),
        axios.get('/api/kpi/dashboard?all=true', config) // fetch dashboard stats including pending ones for internal team
      ]);

      setCriteriaList(criteriaRes.data);
      setTypeList(typesRes.data);
      setNotifTemplates(notifRes.data);

      const allItems = indicatorsRes.data;
      setAllIndicators(allItems);

      // Unique definitions
      const distinctDefs = getDistinctDefinitions(allItems);
      setDefinedIndicators(distinctDefs);

      // Submission queue (recent entries)
      setRecentSubmissions(allItems.filter(k => k.validationStatus === 'Pending Validation'));
      
      // Validation & Approval queues
      setValidationQueue(allItems.filter(k => k.validationStatus === 'Pending Validation'));
      setApprovalQueue(allItems.filter(k => k.validationStatus === 'Pending Approval'));

      if (dashboardRes.data) {
        setDashboardData(dashboardRes.data);
      }
    } catch (err) {
      console.error('Failed to load KPI DB data', err);
      showNotification('Failed to fetch KPI records from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------------------------------------------------------------------
  // SUBMASTER CONTROLLER WRAPPERS
  // ---------------------------------------------------------------------------
  const handleAddCriteria = async () => {
    if (!newCriteriaName.trim()) return;
    try {
      const response = await axios.post('/api/kpi/submaster/criteria', { criteria: newCriteriaName }, getAuthConfig());
      setCriteriaList([...criteriaList, response.data]);
      setNewCriteriaName('');
      setShowAddCriteriaModal(false);
      showNotification('Selection Criteria added successfully', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error adding criteria', 'error');
    }
  };

  const handleDeleteCriteria = async (id) => {
    try {
      await axios.delete(`/api/kpi/submaster/criteria/${id}`, getAuthConfig());
      setCriteriaList(criteriaList.filter(c => c._id !== id));
      showNotification('Selection Criteria deleted', 'info');
    } catch (err) {
      showNotification('Failed to delete criteria', 'error');
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const response = await axios.post('/api/kpi/submaster/type', { type: newTypeName }, getAuthConfig());
      setTypeList([...typeList, response.data]);
      setNewTypeName('');
      setShowAddTypeModal(false);
      showNotification('Indicator Type added successfully', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error adding type', 'error');
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await axios.delete(`/api/kpi/submaster/type/${id}`, getAuthConfig());
      setTypeList(typeList.filter(t => t._id !== id));
      showNotification('Indicator Type deleted', 'info');
    } catch (err) {
      showNotification('Failed to delete indicator type', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // NOTIFICATION RULES WRAPPERS
  // ---------------------------------------------------------------------------
  const handleAddNotificationRule = async (e) => {
    if (e) e.preventDefault();
    if (!notifTemplateBody.trim()) return;
    try {
      const response = await axios.post('/api/kpi/notifications', {
        trigger: notifTrigger,
        sendTo: notifTrigger === 'Indicator Critical' ? 'Quality Director' : 'Department HOD',
        template: notifTemplateBody,
        ccQualityDirector: notifCC
      }, getAuthConfig());
      setNotifTemplates([response.data, ...notifTemplates]);
      setNotifTemplateBody('');
      showNotification('Notification alert rule configured', 'success');
    } catch (err) {
      showNotification('Error creating alert rule', 'error');
    }
  };

  const handleDeleteNotificationRule = async (id) => {
    try {
      await axios.delete(`/api/kpi/notifications/${id}`, getAuthConfig());
      setNotifTemplates(notifTemplates.filter(t => t._id !== id));
      showNotification('Notification rule deleted', 'info');
    } catch (err) {
      showNotification('Failed to delete notification rule', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // MASTER DEFINITION WRAPPERS
  // ---------------------------------------------------------------------------
  const handleAddKpi = async (e) => {
    if (e) e.preventDefault();
    if (!newKpiName.trim()) return;
    try {
      const kpiCode = 'KPI-' + Math.floor(1000 + Math.random() * 9000);
      const payload = {
        indicatorCode: kpiCode,
        indicatorName: newKpiName,
        category: newKpiCat,
        mainCategory: newKpiMainCat,
        subCategory: newKpiSubCat,
        owner: newKpiOwner,
        reportingFrequency: newKpiFreq,
        description: newKpiDesc,
        rationale: newKpiRat,
        criteria: newKpiCrit || (criteriaList[0]?.criteria || 'Problem Prone'),
        numeratorDesc: newKpiNum,
        denominatorDesc: newKpiDen,
        target: parseFloat(newKpiTarget) || 0,
        unit: newKpiUnit,
        reportingPeriod: 'Q1',
        reportingYear: new Date().getFullYear(),
        validationStatus: 'Draft'
      };

      const response = await axios.post('/api/kpi', payload, getAuthConfig());
      setDefinedIndicators([response.data, ...definedIndicators]);
      setNewKpiName('');
      setNewKpiDesc('');
      setNewKpiRat('');
      setNewKpiNum('');
      setNewKpiDen('');
      setNewKpiTarget('');
      setDefinitionView('list');
      showNotification('New Indicator definition saved to DB', 'success');
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving indicator', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // PERIODIC DATA SUBMISSION WRAPPERS
  // ---------------------------------------------------------------------------
  const handleDataSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(numeratorVal);
    const den = parseFloat(denominatorVal);
    if (isNaN(num) || isNaN(den) || den === 0) {
      showNotification('Please enter valid numerator and denominator values', 'error');
      return;
    }

    // Find definition item by name or code
    const baseDef = definedIndicators.find(k => k.indicatorCode === submissionKpi || k.indicatorName === submissionKpi);
    if (!baseDef) {
      showNotification('Please select a valid KPI Indicator definition', 'error');
      return;
    }

    try {
      await axios.post('/api/kpi/submit-data', {
        indicatorCode: baseDef.indicatorCode,
        reportingPeriod: submissionPeriod,
        reportingYear: submissionYear,
        numerator: num,
        denominator: den
      }, getAuthConfig());

      setNumeratorVal('');
      setDenominatorVal('');
      showNotification('Indicator metrics submitted to Quality team validation queue', 'success');
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Submission failed', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // VALIDATION & APPROVAL PIPELINES
  // ---------------------------------------------------------------------------
  const handleValidateApprove = async (id) => {
    try {
      await axios.post(`/api/kpi/${id}/validate`, { action: 'approve' }, getAuthConfig());
      showNotification('Data approved & validated successfully', 'success');
      fetchData();
    } catch (err) {
      showNotification('Validation sign-off failed', 'error');
    }
  };

  const handleValidateReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      await axios.post(`/api/kpi/${id}/validate`, { action: 'reject', rejectionReason: reason }, getAuthConfig());
      showNotification('Data rejected and returned to Draft', 'info');
      fetchData();
    } catch (err) {
      showNotification('Rejection failed', 'error');
    }
  };

  const handleApprovePublish = async (id) => {
    try {
      await axios.post(`/api/kpi/${id}/approve`, {}, getAuthConfig());
      showNotification('KPI authorized & published successfully', 'success');
      fetchData();
    } catch (err) {
      showNotification('Final authorization failed', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // TAB CONTITIONAL RENDERING
  // ---------------------------------------------------------------------------
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
          <p className="text-[13px] font-semibold text-slate-500 normal-case tracking-normal">Synchronizing Module Data...</p>
        </div>
      );
    }

    switch (activeTab) {
      // 0. ANALYTICS DASHBOARD (NEW TAB)
      case 'dashboard':
        const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
        const statCards = [
          { title: 'Total KPIs in System', value: dashboardData.stats?.total || 0, icon: Award, color: 'text-slate-800', bg: 'bg-slate-100' },
          { title: 'On Track Metrics', value: dashboardData.stats?.onTrack || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'At Risk Thresholds', value: dashboardData.stats?.atRisk || 0, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Breached Limits', value: dashboardData.stats?.breached || 0, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' }
        ];

        // Format chart data for recharts
        const chartData = dashboardData.trend?.map(t => ({
          name: `${t._id.period} ${t._id.year}`,
          Actual: parseFloat(t.avgValue?.toFixed(1) || 0),
          Target: parseFloat(t.avgTarget?.toFixed(1) || 0)
        })) || [];

        return (
          <div className="space-y-8">
            {/* Upper Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:scale-[1.01]">
                  <div className={`p-3.5 rounded-2xl ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <span className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal block">{card.title}</span>
                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight mt-0.5">{card.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recharts Bar Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">KPI Performance History</h4>
                    <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-0.5">Quarterly averages comparison against target values</p>
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--color-primary)] bg-amber-50 px-3 py-1.5 rounded-full normal-case tracking-normal">
                    Avg. Success: {dashboardData.stats?.avgAchievement}%
                  </span>
                </div>
                <div className="h-[300px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                        <Bar dataKey="Actual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px] font-semibold text-slate-500 normal-case tracking-normal">No Trend Data Registered</div>
                  )}
                </div>
              </div>

              {/* Pie Breakdown & Breaches */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">Status Breakdown</h4>
                  <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-0.5">Aggregate values breakdown status</p>
                </div>
                <div className="h-[180px] my-4 flex items-center justify-center">
                  {dashboardData.stats?.total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'On Track', value: dashboardData.stats.onTrack },
                            { name: 'At Risk', value: dashboardData.stats.atRisk },
                            { name: 'Breached', value: dashboardData.stats.breached }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, idx) => (
                            <Cell key={`cell-${idx}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-[13px] font-semibold text-slate-500 normal-case tracking-normal">No stats</div>
                  )}
                </div>
                <div className="flex justify-around text-[12px] font-semibold normal-case tracking-normal text-slate-500 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> On Track</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> At Risk</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Breached</div>
                </div>
              </div>
            </div>

            {/* Top breaches table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">Top Breached Quality Indicators</h4>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-0.5">Alerting metrics experiencing negative target variances</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.topBreached?.length > 0 ? (
                  dashboardData.topBreached.map((kpi, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[12px] font-semibold normal-case tracking-normal rounded">{kpi.indicatorCode}</span>
                          <span className="text-[12px] font-semibold text-rose-600">{kpi.variance}{kpi.unit || '%'} Variance</span>
                        </div>
                        <h5 className="text-[13px] font-semibold text-slate-800 normal-case tracking-tight line-clamp-2">{kpi.indicatorName}</h5>
                      </div>
                      <div className="mt-6 space-y-1.5">
                        <div className="flex justify-between text-[12px] font-semibold normal-case text-slate-500">
                          <span>Actual: {kpi.calculatedValue}%</span>
                          <span>Target: {kpi.target}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${Math.min(kpi.calculatedValue, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-10 text-center text-[13px] font-semibold text-slate-500 normal-case tracking-normal">No indicators currently breached</div>
                )}
              </div>
            </div>
          </div>
        );

      // 1. INDICATOR SUBMASTER
      case 'indicator-submaster':
        return (
          <div className="space-y-8">
            
            {/* selection criteria section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">Selection Criteria</h4>
                  <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-0.5">Determine key metrics prioritisation reasons</p>
                </div>
                {isQualityManager && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddCriteriaModal(true)}
                      className="px-4 py-2.5 bg-primary hover:bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Selection Criteria
                    </button>
                  </div>
                )}
              </div>

              {/* search input */}
              <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search Selection Criteria..."
                    value={criteriaSearch}
                    onChange={(e) => setCriteriaSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* criteria grid table */}
              <div className="overflow-x-auto">
                <Table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-primary text-white font-semibold normal-case tracking-normal">
                      <th className="p-3.5 rounded-l-xl">S.No</th>
                      <th className="p-3.5">Selection Criteria</th>
                      <th className="p-3.5">Added/Edited By</th>
                      <th className="p-3.5">Added/Edited Date</th>
                      {isQualityManager && <th className="p-3.5 rounded-r-xl">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criteriaList.filter(c => c.criteria.toLowerCase().includes(criteriaSearch.toLowerCase())).map((item, idx) => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{item.criteria}</td>
                        <td className="p-3.5 font-semibold text-slate-600">{item.addedBy}</td>
                        <td className="p-3.5 text-slate-500">{item.date}</td>
                        {isQualityManager && (
                          <td className="p-3.5">
                            <button 
                              onClick={() => handleDeleteCriteria(item._id)}
                              className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* indicator type section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">Indicator Type</h4>
                  <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-0.5">Determine indicator classifications</p>
                </div>
                {isQualityManager && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddTypeModal(true)}
                      className="px-4 py-2.5 bg-primary hover:bg-primary text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Indicator Type
                    </button>
                  </div>
                )}
              </div>

              {/* search input */}
              <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search Indicator Type..."
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* type grid table */}
              <div className="overflow-x-auto">
                <Table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-primary text-white font-semibold normal-case tracking-normal">
                      <th className="p-3.5 rounded-l-xl">S.No</th>
                      <th className="p-3.5">Indicator Type</th>
                      <th className="p-3.5">Added/Edited By</th>
                      <th className="p-3.5">Added/Edited Date</th>
                      {isQualityManager && <th className="p-3.5 rounded-r-xl">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {typeList.filter(t => t.type.toLowerCase().includes(typeSearch.toLowerCase())).map((item, idx) => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{item.type}</td>
                        <td className="p-3.5 font-semibold text-slate-600">{item.addedBy}</td>
                        <td className="p-3.5 text-slate-500">{item.date}</td>
                        {isQualityManager && (
                          <td className="p-3.5">
                            <button 
                              onClick={() => handleDeleteType(item._id)}
                              className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Selection Criteria Modal */}
            {showAddCriteriaModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddCriteriaModal(false)}></div>
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                  <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal mb-4">Add Selection Criteria</h3>
                  <input 
                    type="text" 
                    placeholder="Enter Criteria Title..."
                    value={newCriteriaName}
                    onChange={(e) => setNewCriteriaName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800 mb-4"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddCriteriaModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Cancel</button>
                    <button onClick={handleAddCriteria} className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Save</button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicator Type Modal */}
            {showAddTypeModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddTypeModal(false)}></div>
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                  <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-normal mb-4">Add Indicator Classification</h3>
                  <input 
                    type="text" 
                    placeholder="Enter Classification Type..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800 mb-4"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddTypeModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Cancel</button>
                    <button onClick={handleAddType} className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // 2. NOTIFICATION MASTER
      case 'notification-master':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">KPI Notification Master</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Configure automated alert thresholds and email rules</p>
            </div>
            
            {isQualityManager && (
              <form onSubmit={handleAddNotificationRule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Trigger Threshold</label>
                    <Select 
                      value={notifTrigger}
                      onChange={(e) => setNotifTrigger(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="Indicator Critical">KPI Dropped Below Critical</option>
                      <option value="Validation Overdue">Data Verification Overdue</option>
                    </Select>
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notifCC}
                        onChange={(e) => setNotifCC(e.target.checked)}
                        className="w-4.5 h-4.5 text-[var(--color-primary)] focus:ring-[var(--color-primary)] rounded border-slate-350"
                      />
                      <span className="text-[13px] font-semibold text-slate-700">Auto-Alert Quality Director</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Alert Template Body</label>
                  <textarea 
                    rows="3"
                    value={notifTemplateBody}
                    onChange={(e) => setNotifTemplateBody(e.target.value)}
                    placeholder="Alert: The KPI [KPI_Name] values dropped below critical limit..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800 font-mono"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit"
                    className="px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all"
                  >
                    Add Alert Rule
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto pt-4 border-t border-slate-100">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">S.No</th>
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Template Preview</th>
                    {isQualityManager && <th className="p-3">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {notifTemplates.map((item, idx) => (
                    <tr key={item._id}>
                      <td className="p-3 text-slate-500 font-semibold">{idx+1}</td>
                      <td className="p-3 font-semibold text-slate-700">{item.trigger}</td>
                      <td className="p-3 text-slate-500">{item.sendTo}</td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate">{item.template}</td>
                      {isQualityManager && (
                        <td className="p-3">
                          <button 
                            onClick={() => handleDeleteNotificationRule(item._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 3. MASTER INDICATOR DEFINITION
      case 'master-indicator-definition':
        if (definitionView === 'detail' && selectedKpiDetails) {
          return (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Breadcrumbs */}
              <div className="flex justify-between items-center text-[12px] font-semibold text-slate-500 normal-case tracking-normal">
                <span>Indicator Definition Master / Indicator Detail View</span>
                <span className="text-slate-350">Home / Master Indicator Definition</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center gap-4">
                <button 
                  onClick={() => setDefinitionView('list')}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all"
                >
                  &larr; Back to Registry
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Definition
                </button>
              </div>

              {/* View Indicator Title Header */}
              <div className="bg-[var(--color-primary)] text-white py-3.5 px-6 rounded-2xl font-semibold text-sm normal-case tracking-normal shadow-sm flex items-center gap-2">
                <BarChart2 className="w-5 h-5" /> View Indicator Definition: {selectedKpiDetails.indicatorCode}
              </div>

              {/* Detail Fields Layout */}
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Main Category</span>
                    <span className="text-[13px] font-semibold text-slate-700 block mt-1">{selectedKpiDetails.mainCategory}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Sub Category</span>
                    <span className="text-[13px] font-semibold text-slate-700 block mt-1">{selectedKpiDetails.subCategory}</span>
                  </div>
                </div>

                <div className="border-b border-slate-100 pb-6">
                  <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Indicator Name</span>
                  <span className="text-sm font-semibold text-[var(--color-primary)] block mt-1 normal-case tracking-tight">{selectedKpiDetails.indicatorName}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Indicator Description</span>
                    <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{selectedKpiDetails.description || 'No description configured'}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Rationale</span>
                    <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{selectedKpiDetails.rationale || 'No rationale configured'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Indicator Owner</span>
                    <span className="text-[13px] font-semibold text-slate-700 block mt-1">{selectedKpiDetails.owner}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Selection Criteria</span>
                    <span className="text-[13px] font-semibold text-slate-700 block mt-1">{selectedKpiDetails.criteria}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Reporting Frequency</span>
                    <span className="text-[13px] font-semibold text-slate-700 block mt-1">{selectedKpiDetails.reportingFrequency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6 pt-4">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Numerator Definition</span>
                    <p className="text-[13px] text-slate-700 font-semibold mt-1.5">{selectedKpiDetails.numeratorDesc || 'Not defined'}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Denominator Definition</span>
                    <p className="text-[13px] text-slate-700 font-semibold mt-1.5">{selectedKpiDetails.denominatorDesc || 'Not defined'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Sample Size / Scope</span>
                    <span className="text-[13px] font-semibold text-slate-750 block mt-1">{selectedKpiDetails.sampleSize || 'All'}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block">Target Value & Unit</span>
                    <span className="text-[13px] font-semibold text-[var(--color-primary)] block mt-1">{selectedKpiDetails.target} {selectedKpiDetails.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (definitionView === 'add') {
          return (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Add New KPI Indicator</h3>
                <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Design a new quality and clinical metric standard</p>
              </div>

              <form onSubmit={handleAddKpi} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Indicator Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Facility Safety & Security Inspection Compliance Rate"
                      value={newKpiName}
                      onChange={(e) => setNewKpiName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Indicator Owner</label>
                    <MasterSelect resource="users" valueKey="employeeName"
                      value={newKpiOwner}
                      onChange={(e) => setNewKpiOwner(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">KPI Category (DB Code)</label>
                    <Select 
                      value={newKpiCat}
                      onChange={(e) => setNewKpiCat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="patient-safety">Patient Safety</option>
                      <option value="clinical-effectiveness">Clinical Effectiveness</option>
                      <option value="patient-experience">Patient Experience</option>
                      <option value="efficiency">Efficiency</option>
                      <option value="access">Access</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Main Category (UI)</label>
                    <Select 
                      value={newKpiMainCat}
                      onChange={(e) => setNewKpiMainCat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="Ambulatory">Ambulatory</option>
                      <option value="Inpatient">Inpatient</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Sub Category</label>
                    <Select 
                      value={newKpiSubCat}
                      onChange={(e) => setNewKpiSubCat(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="Clinical">Clinical</option>
                      <option value="Facility Management and Safety">Facility Management and Safety</option>
                      <option value="IPSG">IPSG</option>
                      <option value="Operational">Operational</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Selection Criteria</label>
                    <Select 
                      value={newKpiCrit}
                      onChange={(e) => setNewKpiCrit(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="">Select Criteria...</option>
                      {criteriaList.map(c => <option key={c._id} value={c.criteria}>{c.criteria}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Reporting Frequency</label>
                    <Select 
                      value={newKpiFreq}
                      onChange={(e) => setNewKpiFreq(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Target & Unit</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Target"
                        value={newKpiTarget}
                        onChange={(e) => setNewKpiTarget(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                        required
                      />
                      <Select 
                        value={newKpiUnit}
                        onChange={(e) => setNewKpiUnit(e.target.value)}
                        className="w-20 px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                      >
                        <option value="%">%</option>
                        <option value="mins">mins</option>
                        <option value="hrs">hrs</option>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Indicator Description</label>
                    <textarea 
                      rows="2"
                      value={newKpiDesc}
                      onChange={(e) => setNewKpiDesc(e.target.value)}
                      placeholder="Enter description..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Rationale</label>
                    <textarea 
                      rows="2"
                      value={newKpiRat}
                      onChange={(e) => setNewKpiRat(e.target.value)}
                      placeholder="Enter rationale..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Numerator Definition</label>
                    <textarea 
                      rows="2"
                      value={newKpiNum}
                      onChange={(e) => setNewKpiNum(e.target.value)}
                      placeholder="Numerator definition..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Denominator Definition</label>
                    <textarea 
                      rows="2"
                      value={newKpiDen}
                      onChange={(e) => setNewKpiDen(e.target.value)}
                      placeholder="Denominator definition..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setDefinitionView('list')} 
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all shadow-md"
                  >
                    Save Definition
                  </button>
                </div>
              </form>
            </div>
          );
        }

        // list view
        const displayedDefinitions = definedIndicators.filter(k => k.validationStatus === (indicatorActiveTab === 'Active' ? 'Approved' : 'Draft'));
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            {/* Breadcrumbs */}
            <div className="flex justify-between items-center text-[12px] font-semibold text-slate-500 normal-case tracking-normal border-b border-slate-100 pb-3">
              <span>Master Indicator Definition / Home / KPI Registry</span>
            </div>

            {/* Action Buttons */}
            {isQualityManager && (
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setDefinitionView('add')}
                  className="px-5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add New Indicator Definition
                </button>
              </div>
            )}

            {/* Active / Inactive Tabs */}
            <div className="flex border-b border-slate-200 mt-4 select-none">
              {['Active (Approved)', 'Drafts / Inactive'].map((tab, idx) => {
                const targetVal = idx === 0 ? 'Active' : 'Inactive';
                return (
                  <button
                    key={tab}
                    onClick={() => setIndicatorActiveTab(targetVal)}
                    className={`px-8 py-3.5 text-[13px] font-semibold normal-case tracking-normal border-t border-x rounded-t-2xl transition-all ${
                      indicatorActiveTab === targetVal 
                        ? 'bg-slate-100 text-[var(--color-primary)] border-slate-200 border-b-white z-10'
                        : 'bg-white text-slate-500 border-transparent hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Table registry */}
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px] border border-slate-200 rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-[var(--color-primary)] text-white font-semibold normal-case tracking-normal">
                    <th className="p-3.5 border-r border-slate-200">S.No</th>
                    <th className="p-3.5 border-r border-slate-200">Code</th>
                    <th className="p-3.5 border-r border-slate-200">Indicator Name</th>
                    <th className="p-3.5 border-r border-slate-200">Main Category</th>
                    <th className="p-3.5 border-r border-slate-200">Sub Category</th>
                    <th className="p-3.5 border-r border-slate-200">Indicator Owner</th>
                    <th className="p-3.5 border-r border-slate-200">Target Value</th>
                    <th className="p-3.5">Approval Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedDefinitions.map((item, idx) => (
                    <tr 
                      key={item._id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedKpiDetails(item);
                        setDefinitionView('detail');
                      }}
                    >
                      <td className="p-3.5 border-r border-slate-200 text-slate-500 font-semibold text-center">{idx + 1}</td>
                      <td className="p-3.5 border-r border-slate-200 text-slate-600 font-semibold">{item.indicatorCode}</td>
                      <td className="p-3.5 border-r border-slate-200 font-semibold text-slate-800 hover:text-[var(--color-primary)] transition-colors max-w-xs">{item.indicatorName}</td>
                      <td className="p-3.5 border-r border-slate-200 text-slate-600">{item.mainCategory || 'Ambulatory'}</td>
                      <td className="p-3.5 border-r border-slate-200 text-slate-600">{item.subCategory || 'Clinical'}</td>
                      <td className="p-3.5 border-r border-slate-200 font-semibold text-slate-600 truncate max-w-[120px]">{item.owner}</td>
                      <td className="p-3.5 border-r border-slate-200 text-slate-700 font-semibold">{item.target}{item.unit || '%'}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[12px] font-semibold">
                          {item.validationStatus === 'Approved' ? 'Validated & Approved' : 'Draft / Sign-off Required'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayedDefinitions.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-10 text-center text-[13px] font-semibold text-slate-500 normal-case tracking-normal">
                        No defined indicators found in this category
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 4. INDICATOR DATA SUBMISSION
      case 'indicator-data-submission':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Indicator Data Submission</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Submit numerator & denominator values for the current period</p>
            </div>
            
            {(
              <form onSubmit={handleDataSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Select KPI Indicator</label>
                    <Select 
                      value={submissionKpi}
                      onChange={(e) => setSubmissionKpi(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                      required
                    >
                      <option value="">Select KPI...</option>
                      {getDistinctDefinitions(definedIndicators).map(k => (
                        <option key={k._id} value={k.indicatorCode}>{k.indicatorCode} - {k.indicatorName}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Numerator (Cases)</label>
                    <input 
                      type="number" 
                      placeholder="Enter Numerator..."
                      value={numeratorVal}
                      onChange={(e) => setNumeratorVal(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Denominator (Sample Scope)</label>
                    <input 
                      type="number" 
                      placeholder="Enter Denominator..."
                      value={denominatorVal}
                      onChange={(e) => setDenominatorVal(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Reporting Period</label>
                    <Select 
                      value={submissionPeriod}
                      onChange={(e) => setSubmissionPeriod(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    >
                      <option value="Q1">Quarter 1 (Q1)</option>
                      <option value="Q2">Quarter 2 (Q2)</option>
                      <option value="Q3">Quarter 3 (Q3)</option>
                      <option value="Q4">Quarter 4 (Q4)</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Reporting Year</label>
                    <input 
                      type="number" 
                      value={submissionYear}
                      onChange={(e) => setSubmissionYear(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] font-semibold normal-case tracking-normal rounded-xl transition-all">
                    Submit Values
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto pt-6 border-t border-slate-100">
              <h4 className="text-[13px] font-semibold text-slate-700 normal-case tracking-normal mb-3">Pending Validation Queue</h4>
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Indicator Code</th>
                    <th className="p-3">Indicator Name</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Numerator</th>
                    <th className="p-3">Denominator</th>
                    <th className="p-3">Calculated Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSubmissions.map((item) => (
                    <tr key={item._id}>
                      <td className="p-3 text-slate-600 font-semibold">{item.indicatorCode}</td>
                      <td className="p-3 font-semibold text-slate-700 truncate max-w-xs">{item.indicatorName}</td>
                      <td className="p-3 text-slate-500">{item.reportingPeriod} {item.reportingYear}</td>
                      <td className="p-3 text-slate-500">{item.numerator}</td>
                      <td className="p-3 text-slate-500">{item.denominator}</td>
                      <td className="p-3 font-semibold text-slate-850">{item.calculatedValue}{item.unit || '%'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[12px] font-semibold normal-case">{item.validationStatus}</span>
                      </td>
                    </tr>
                  ))}
                  {recentSubmissions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-[13px] font-semibold text-slate-500 normal-case tracking-normal">No pending validation submissions</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 5. INDICATOR VALIDATION
      case 'indicator-validation':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Indicator Data Validation</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Audit and verify incoming metrics reports accuracy</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Code</th>
                    <th className="p-3">Indicator Name</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Submitted Value</th>
                    <th className="p-3">Reporter</th>
                    {isQualityManager && <th className="p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {validationQueue.map((item) => (
                    <tr key={item._id}>
                      <td className="p-3 font-semibold text-slate-600">{item.indicatorCode}</td>
                      <td className="p-3 font-semibold text-slate-700 max-w-xs truncate">{item.indicatorName}</td>
                      <td className="p-3 text-slate-500">{item.reportingPeriod} {item.reportingYear}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.calculatedValue}{item.unit || '%'} ({item.numerator}/{item.denominator})</td>
                      <td className="p-3 text-slate-500">{item.createdBy?.employeeName || 'Quality Manager'}</td>
                      {isQualityManager && (
                        <td className="p-3 flex gap-2">
                          <button 
                            onClick={() => handleValidateApprove(item._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all"
                          >
                            Approve Validation
                          </button>
                          <button 
                            onClick={() => handleValidateReject(item._id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all"
                          >
                            Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {validationQueue.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-[13px] font-semibold text-slate-500 normal-case tracking-normal">
                        Validation queue is clear
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 6. INDICATOR APPROVAL
      case 'indicator-approval':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Indicator Sign-off Approval</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">HOD and Quality Directors metrics release sign-offs</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Code</th>
                    <th className="p-3">Indicator Name</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Validated Value</th>
                    <th className="p-3">Audited By</th>
                    {isQualityManager && <th className="p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {approvalQueue.map((item) => (
                    <tr key={item._id}>
                      <td className="p-3 font-semibold text-slate-600">{item.indicatorCode}</td>
                      <td className="p-3 font-semibold text-slate-700 max-w-xs truncate">{item.indicatorName}</td>
                      <td className="p-3 text-slate-500">{item.reportingPeriod} {item.reportingYear}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.calculatedValue}{item.unit || '%'}</td>
                      <td className="p-3 text-slate-500">{item.validatedBy?.employeeName || 'Quality Validator'}</td>
                      {isQualityManager && (
                        <td className="p-3">
                          <button 
                            onClick={() => handleApprovePublish(item._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold normal-case tracking-normal rounded-lg transition-all"
                          >
                            Sign & Publish
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {approvalQueue.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-[13px] font-semibold text-slate-500 normal-case tracking-normal">
                        Approval queue is clear
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 7. ACTIONS (CAPA)
      case 'actions':
        // Filter any breached indicator that needs corrective action
        const breachedKpis = allIndicators.filter(k => k.status === 'breached' && k.validationStatus === 'Approved');

        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">KPI Corrective Actions (CAPA)</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Mitigate KPIs missing target standards</p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">KPI Code</th>
                    <th className="p-3">KPI Indicator</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Target Variance</th>
                    <th className="p-3">Action Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {breachedKpis.map((item) => (
                    <tr key={item._id}>
                      <td className="p-3 font-semibold text-slate-500">{item.indicatorCode}</td>
                      <td className="p-3 font-semibold text-slate-700">{item.indicatorName}</td>
                      <td className="p-3 text-slate-500">{item.reportingPeriod} {item.reportingYear}</td>
                      <td className="p-3 text-rose-600 font-semibold">{item.variance}%</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[12px] font-semibold normal-case">CAPA Open</span>
                      </td>
                    </tr>
                  ))}
                  {breachedKpis.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[13px] font-semibold text-slate-500 normal-case tracking-normal">
                        No critical KPI breaches requiring CAPA actions
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        );

      // 8. SEARCH INDICATOR
      case 'search-indicator':
        return (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 normal-case tracking-tight">Search Indicators Registry</h3>
              <p className="text-[12px] text-slate-500 font-semibold normal-case tracking-normal mt-1">Lookup historical metrics records</p>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-500 normal-case tracking-normal block mb-2">Indicator Name</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Enter KPI indicator query..."
                  value={searchKpiQuery}
                  onChange={(e) => setSearchKpiQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[var(--color-primary)] text-[13px] font-semibold text-slate-800"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold normal-case tracking-normal border-b border-slate-100">
                    <th className="p-3">Code</th>
                    <th className="p-3">Indicator Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Actual Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allIndicators.filter(k => 
                    k.indicatorName.toLowerCase().includes(searchKpiQuery.toLowerCase()) || 
                    k.indicatorCode.toLowerCase().includes(searchKpiQuery.toLowerCase())
                  ).map((item) => (
                    <tr key={item._id}>
                      <td className="p-3 text-slate-500 font-semibold">{item.indicatorCode}</td>
                      <td className="p-3 font-semibold text-slate-700">{item.indicatorName}</td>
                      <td className="p-3 text-slate-500 capitalize">{item.category.replace('-', ' ')}</td>
                      <td className="p-3 text-slate-500">{item.reportingPeriod} {item.reportingYear}</td>
                      <td className="p-3 text-slate-600">{item.target}{item.unit}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.calculatedValue}{item.unit}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[12px] font-semibold normal-case ${
                          item.status === 'on-track' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'at-risk' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        );

      default:
        return <div>Invalid selection</div>;
    }
  };

  return (
    <DashboardLayout>
      <header className="qc-module-heading">
        <h1>Indicator management</h1>
        <p>Monitor performance, manage indicator definitions and review submissions.</p>
      </header>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Submenu Sidebar */}
        <aside className="qc-module-sidebar w-full lg:w-64 shrink-0 sticky top-24 select-none">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-5">
            <div className="p-3 bg-[var(--color-primary)] text-white rounded-2xl shadow-lg shadow-none">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 normal-case tracking-tight">KPI Manager</h2>
              <span className="text-[12px] text-[var(--color-primary)] font-semibold normal-case tracking-normal block mt-0.5">CMC Master Portal</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] font-semibold normal-case tracking-normal transition-all text-left ${
                    isActive 
                      ? 'qc-module-active'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[var(--color-primary)]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Side: Content Area */}
        <section className="qc-module-content" aria-label="Indicator workspace">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {renderTabContent()}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default KeyPerformanceIndicator;

