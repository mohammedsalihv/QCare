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
import SystemManagementDrawer from './SystemManagementDrawer';

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
  const [isManagementDrawerOpen, setIsManagementDrawerOpen] = useState(false);

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
    }
  };

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem('userInfo');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleSidebar}
            className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-[#2dd4bf] hover:bg-slate-100 transition-all active:scale-95 border border-slate-100 shadow-sm group"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </div>

        <div className="flex-1 max-w-2xl mx-4 lg:mx-12 hidden lg:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#2dd4bf] transition-colors" />
            <input 
              type="text" 
              placeholder="Search medical records, audits, or clinical data..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] focus:ring-8 focus:ring-[#2dd4bf]/10 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Mobile Search Toggle */}
        <div className="lg:hidden flex-1 flex justify-center">
           <button 
             onClick={() => setShowMobileSearch(!showMobileSearch)}
             className="p-3 text-slate-400 hover:text-[#2dd4bf] transition-all"
           >
             <Search className="w-5 h-5" />
           </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-slate-100">
             <button 
               onClick={() => navigate('/dashboard/manuals')}
               className="p-3 text-slate-400 hover:text-[#2dd4bf] hover:bg-[#2dd4bf]/10 rounded-2xl transition-all duration-500 active:scale-95 hidden sm:block"
               title="Documentation"
             >
               <BookOpen className="w-5 h-5" />
             </button>
             <button 
               onClick={() => navigate('/dashboard/support')}
               className="p-3 text-slate-400 hover:text-[#2dd4bf] hover:bg-[#2dd4bf]/10 rounded-2xl transition-all duration-500 active:scale-95 hidden sm:block"
               title="Help Desk"
             >
               <HelpCircle className="w-5 h-5" />
             </button>
              {(user.role === 'superadmin' || user.role === 'admin') && (
                <button 
                  onClick={() => setIsManagementDrawerOpen(true)}
                  className="px-3 sm:px-4 py-2 bg-slate-900 text-[#2dd4bf] hover:bg-slate-800 rounded-2xl transition-all duration-300 active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-200 border border-slate-800 group"
                  title="System Management"
                >
                  <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Admin Control</span>
                </button>
              )}
          </div>

          <div className="relative">
               <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all duration-500 group active:scale-95 border border-slate-100 shadow-sm"
               >
                  <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in zoom-in duration-500">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
               </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-[-60px] sm:right-0 mt-4 w-[320px] sm:w-96 bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.25em]">Notifications</h4>
                   {notifications.length > 0 && (
                     <button 
                      onClick={clearAll}
                      className="text-[9px] font-black text-[#2dd4bf] uppercase tracking-widest hover:underline"
                     >
                       Clear All
                     </button>
                   )}
                </div>
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                   {notifications.length > 0 ? (
                     notifications.map((n, idx) => (
                       <div 
                        key={idx} 
                        onClick={() => markAsRead(n._id)}
                        className={`p-5 border-b border-slate-50 hover:bg-slate-50 transition-all group cursor-pointer ${!n.isRead ? 'bg-slate-50/30' : ''}`}
                       >
                          <div className="flex gap-4">
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-50 ${
                                n.type === 'incident_report' ? 'bg-rose-50 text-rose-500' :
                                n.type === 'document_upload' ? 'bg-teal-50 text-[#2dd4bf]' : 
                                n.type === 'document_like' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                             }`}>
                                {n.type === 'incident_report' ? <AlertTriangle className="w-5 h-5" /> : 
                                 n.type === 'document_upload' ? <Monitor className="w-5 h-5" /> : 
                                 n.type === 'document_like' ? <ThumbsUp className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                             </div>
                             <div className="flex flex-col gap-1.5 relative w-full">
                                {!n.isRead && <div className="absolute -left-14 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#2dd4bf] rounded-full shadow-[0_0_8px_rgba(45,212,191,0.3)]"></div>}
                                <p className="text-[11px] font-bold text-slate-900 leading-relaxed pr-4">{n.message}</p>
                                <div className="flex items-center gap-3">
                                   <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{n.user}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                   <span className="text-[9px] text-[#3b82f6] font-black uppercase tracking-widest">
                                     {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="p-16 text-center space-y-4 opacity-20">
                        <Bell className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Pending Notifications</p>
                     </div>
                   )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="w-full py-5 text-[9px] font-black text-slate-400 hover:text-slate-900 bg-slate-50/50 border-t border-slate-100 transition-all uppercase tracking-[0.2em]"
                  >
                    View All
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="h-10 w-px bg-slate-100 mx-3 hidden sm:block"></div>
          
          <Dropdown 
            options={profileOptions}
            onSelect={handleProfileSelect}
            trigger={
              <button 
                className="flex items-center gap-4 p-1.5 rounded-2xl hover:bg-slate-50 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm relative">
                   {user.photo ? (
                     <img 
                       src={`http://localhost:5000${user.photo}`} 
                       alt={user.name} 
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <User className="w-5 h-5 text-slate-400" />
                   )}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-black text-slate-900 leading-tight tracking-tight">{user.name}</span>
                  <span className="text-[10px] text-[#2dd4bf] font-black uppercase tracking-[0.15em] opacity-80">{user.designation || user.role}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            }
          />
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="lg:hidden fixed inset-x-0 top-20 p-4 bg-white border-b border-slate-100 z-50 animate-in slide-in-from-top duration-300">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text" 
              autoFocus
              placeholder="Search..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm font-medium"
            />
          </div>
        </div>
      )}

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

      {/* System Management Drawer */}
      <SystemManagementDrawer 
        isOpen={isManagementDrawerOpen} 
        onClose={() => setIsManagementDrawerOpen(false)} 
      />
    </>
  );
};

export default Navbar;
