import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  ChevronDown,
  Monitor,
  Settings,
  LogOut,
  Shield,
  HelpCircle,
  AlertTriangle,
  X,
  ThumbsUp,
  PanelLeftOpen,
  PanelLeftClose,
  BookOpen
} from 'lucide-react';
import Dropdown from './Dropdown';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../utils/authConfig';
import { useNotification } from './NotificationContext';

const Navbar = ({ toggleSidebar, isSidebarOpen, openProfileDrawer, user }) => {
  const navigate = useNavigate();
  const { 
    feedNotifications: notifications, 
    setFeedNotifications: setNotifications,
    fetchFeed: fetchNotifications,
    clearFeed
  } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user?._id]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, getAuthConfig());
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length === 0) return;

    try {
      // Mark all in state first for instant UI feedback
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      // Update backend
      await Promise.all(unreadIds.map(id => 
        axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, getAuthConfig())
      ));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    if (showNotifications && notifications.some(n => !n.isRead)) {
      markAllAsRead();
    }
  }, [showNotifications]);

  const clearAll = async () => {
    if (!notifications || notifications.length === 0) return;
    await clearFeed();
  };

  const profileOptions = [
    { label: 'My Profile', icon: User, value: 'profile' },
    ...(user.role === 'superadmin' || user.role === 'admin' ? [{ label: 'System Settings', icon: Settings, value: 'settings' }] : []),
    { label: 'Notifications', icon: Bell, value: 'notifications' },
    { label: 'Logout', icon: LogOut, value: 'logout', variant: 'danger' }
  ];

  const handleProfileSelect = (val) => {
    if (val === 'logout') {
      setShowLogoutConfirm(true);
    } else if (val === 'notifications') {
      navigate('/notifications');
    } else if (val === 'profile') {
      openProfileDrawer();
    } else if (val === 'settings') {
      navigate('/dashboard/settings');
    }
  };

  const confirmLogout = () => {
    localStorage.removeItem('userInfo');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-[#b59662] hover:bg-slate-100 transition-all active:scale-95 border border-slate-100 shadow-sm group"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </div>

        <div className="flex-1 max-w-xl mx-8 hidden lg:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#b59662] transition-colors" />
            <input 
              type="text" 
              placeholder="Search documents, incidents, or KPIs..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#b59662] focus:ring-4 focus:ring-[#b59662]/10 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-100 hidden md:flex">
             <button 
               onClick={() => navigate('/dashboard/manuals')}
               className="p-2.5 text-slate-400 hover:text-[#b59662] hover:bg-[#b59662]/10 rounded-xl transition-all duration-300 active:scale-95"
               title="Documentation"
             >
               <BookOpen className="w-5 h-5" />
             </button>
             <button 
               onClick={() => navigate('/dashboard/support')}
               className="p-2.5 text-slate-400 hover:text-[#b59662] hover:bg-[#b59662]/10 rounded-xl transition-all duration-300 active:scale-95"
               title="Help Desk"
             >
               <HelpCircle className="w-5 h-5" />
             </button>
          </div>

          <div className="relative">
               <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-300 group active:scale-95 border border-slate-100 shadow-sm"
               >
                  <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in zoom-in duration-300">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-50 group-hover:scale-0 transition-transform"></span>
                  )}
               </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recent Activity</h4>
                   {notifications.length > 0 && (
                     <button 
                      onClick={clearAll}
                      className="text-[9px] font-black text-[#b59662] uppercase tracking-widest hover:underline"
                     >
                       Clear All
                     </button>
                   )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                   {notifications.length > 0 ? (
                     notifications.map((n, idx) => (
                       <div 
                        key={idx} 
                        onClick={() => markAsRead(n._id)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer ${!n.isRead ? 'bg-slate-50/50' : ''}`}
                       >
                          <div className="flex gap-3">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                               n.type === 'incident_report' ? 'bg-red-50 text-red-500' :
                               n.type === 'document_upload' ? 'bg-blue-50 text-blue-500' : 
                               n.type === 'document_like' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                             }`}>
                                {n.type === 'incident_report' ? <AlertTriangle className="w-4 h-4" /> : 
                                 n.type === 'document_upload' ? <Monitor className="w-4 h-4" /> : 
                                 n.type === 'document_like' ? <ThumbsUp className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                             </div>
                             <div className="flex flex-col gap-1 relative w-full">
                                {!n.isRead && <div className="absolute -left-11 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#b59662] rounded-full"></div>}
                                <p className="text-[11px] font-bold text-slate-900 leading-tight pr-4">{n.message}</p>
                                <div className="flex items-center gap-2">
                                   <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{n.user}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                   <span className="text-[9px] text-[#b59662] font-black uppercase tracking-widest">
                                     {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="p-10 text-center space-y-3 opacity-20">
                        <Bell className="w-10 h-10 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">All Caught Up</p>
                     </div>
                   )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="w-full py-4 text-[9px] font-black text-slate-400 hover:text-slate-900 bg-slate-50/30 border-t border-slate-100 transition-colors uppercase tracking-widest"
                  >
                    View Notification Center
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
          
          <Dropdown 
            options={profileOptions}
            onSelect={handleProfileSelect}
            trigger={
              <button 
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 overflow-hidden">
                   <img 
                     src={`https://ui-avatars.com/api/?name=${user.name}&background=b59662&color=fff&bold=true`} 
                     alt={user.name} 
                   />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-[10px] text-[#b59662] font-black uppercase tracking-[0.15em]">{user.designation || user.role}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            }
          />
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)} 
          />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            {/* Modal Header */}
            <div className="p-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-red-50 mx-auto mb-6 flex items-center justify-center shadow-inner-sm">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">End Session?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                You are about to log out of the <span className="font-bold text-slate-700">QCare Portal</span>. Any unsaved changes will be lost.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-8 pt-0 flex flex-col gap-3">
              <button
                onClick={confirmLogout}
                className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/30 active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Confirm Logout</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-4 rounded-2xl border-2 border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
