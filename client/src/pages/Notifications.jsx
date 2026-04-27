import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Search,
  ExternalLink,
  MoreVertical,
  Check,
  Shield,
  Monitor,
  User,
  Calendar,
  ThumbsUp
} from 'lucide-react';
import { useNotification } from '../components/NotificationContext';

const Notifications = () => {
  const { 
    feedNotifications: notifications, 
    setFeedNotifications: setNotifications, 
    fetchFeed: fetchNotifications,
    clearFeed,
    showNotification, 
    confirm 
  } = useNotification();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    loadData();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, getAuthConfig());
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      showNotification('Error updating notification', 'error');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, getAuthConfig());
      setNotifications(prev => prev.filter(n => n._id !== id));
      showNotification('Notification removed', 'success');
    } catch (error) {
      showNotification('Error deleting notification', 'error');
    }
  };

  const clearAll = async () => {
    if (!notifications || notifications.length === 0) {
      showNotification('Notifications are already empty', 'info');
      return;
    }

    confirm({
      title: 'Clear Notifications',
      message: 'Are you sure you want to permanently clear all notifications? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await clearFeed();
          showNotification('All notifications cleared', 'success');
        } catch (error) {
          showNotification('Error clearing notifications', 'error');
        }
      }
    });
  };

  const filteredNotifications = Array.isArray(notifications) 
    ? notifications.filter(n => {
        const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              n.user.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || (activeFilter === 'unread' && !n.isRead);
        return matchesSearch && matchesFilter;
      })
    : [];

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredNotifications.slice(indexOfFirstRecord, indexOfLastRecord);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'incident_report': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'document_upload': return <Monitor className="w-5 h-5 text-blue-500" />;
      case 'document_like':
      case 'document_endorsement': return <ThumbsUp className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notification Center</h1>
             <p className="text-xs text-slate-500 font-medium mt-1">History of all system activities and your personalized alerts.</p>
          </div>
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
             <Trash2 className="w-4 h-4" />
             <span>Clear Notifications</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Filters Sidebar */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Quick Filters</h4>
                 <div className="flex flex-col gap-2">
                    {[
                      { id: 'all', label: 'All Activities', icon: Bell },
                      { id: 'unread', label: 'Unread Only', icon: Clock },
                    ].map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                          activeFilter === filter.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                         <div className="flex items-center gap-3">
                            <filter.icon className="w-4 h-4" />
                            <span className="text-xs font-bold">{filter.label}</span>
                         </div>
                         {filter.id === 'unread' && notifications.filter(n => !n.isRead).length > 0 && (
                           <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                             {notifications.filter(n => !n.isRead).length}
                           </span>
                         )}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="bg-gradient-to-br from-[#3b82f6] to-[#2dd4bf] p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 text-slate-950 relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                 <Shield className="w-8 h-8 mb-4 opacity-50" />
                 <h5 className="font-black text-sm uppercase tracking-widest mb-2">Notification Guard</h5>
                 <p className="text-[10px] text-slate-950/80 font-medium leading-relaxed">Notifications are retained for 30 days. Please ensure critical alerts are reviewed regularly.</p>
              </div>
           </div>

           {/* Notifications List */}
           <div className="lg:col-span-3">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="text" 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         placeholder="Search by activity or user..." 
                         className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#2dd4bf]/5 transition-all text-sm"
                       />
                    </div>
                    <div className="flex items-center gap-2">
                       <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                          <Filter className="w-5 h-5" />
                       </button>
                    </div>
                 </div>

                 <div className="divide-y divide-slate-100">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <div key={i} className="p-8 animate-pulse flex gap-6">
                           <div className="w-12 h-12 bg-slate-100 rounded-2xl shrink-0"></div>
                           <div className="flex-1 space-y-3">
                              <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                              <div className="h-3 bg-slate-50 rounded-full w-1/4"></div>
                           </div>
                        </div>
                      ))
                    ) : currentRecords.length > 0 ? (
                      currentRecords.map((n) => (
                        <div 
                          key={n._id} 
                          className={`p-6 md:p-8 flex items-start gap-6 hover:bg-slate-50 transition-all group relative ${!n.isRead ? 'bg-slate-50/30' : ''}`}
                        >
                           {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2dd4bf]"></div>}
                           
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                              {getTypeIcon(n.type)}
                           </div>

                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-4 mb-2">
                                 <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-[0.2em]">{n.type.replace('_', ' ')}</span>
                                 <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    {new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              </div>
                              <h4 className="text-sm md:text-base font-bold text-slate-900 mb-2 leading-snug">{n.message}</h4>
                              
                              <div className="flex flex-wrap items-center gap-6 mt-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                       <User className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{n.user}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                       <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Action Recorded</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {!n.isRead && (
                                <button 
                                  onClick={() => markAsRead(n._id)}
                                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                  title="Mark as read"
                                >
                                   <Check className="w-5 h-5" />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNotification(n._id)}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                title="Delete notification"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              {n.actionLink && (
                                <button 
                                  onClick={() => navigate(n.actionLink)}
                                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                  title="View target"
                                >
                                   <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-24 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-10 h-10 text-slate-200" />
                         </div>
                         <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">No notifications found</h3>
                         <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Your notification feed is currently empty.</p>
                      </div>
                    )}
                 </div>

                 <Pagination 
                    totalRecords={filteredNotifications.length}
                    recordsPerPage={recordsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                 />
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
