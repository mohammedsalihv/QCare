import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ProfileDrawer from './ProfileDrawer';
import { io } from 'socket.io-client';
import { useNotification } from './NotificationContext';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const { showNotification, setFeedNotifications: setNotifications } = useNotification();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get user info from localStorage
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

  // Format user for components
  const user = userInfo ? {
    _id: userInfo._id,
    name: userInfo.employeeName,
    id: userInfo.employeeId,
    dept: userInfo.department,
    role: userInfo.role,
    designation: userInfo.designation,
    email: userInfo.email,
    photo: userInfo.photo,
    lastLogin: userInfo.lastLogin
  } : null;

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000');

    // Join personal room
    socket.emit('join', user._id);

    // Join admins room if applicable
    if (user.role === 'admin' || user.role === 'superadmin') {
      socket.emit('join-admins');
    }

    // Listen for notifications
    socket.on('new-notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      showNotification(data.message, 'success'); // Also show a toast
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, user?.role]);

  const openProfileDrawer = () => setIsProfileDrawerOpen(true);
  const closeProfileDrawer = () => setIsProfileDrawerOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div 
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Navbar 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          openProfileDrawer={openProfileDrawer} 
          user={user} 
        />
        
        <main className="p-6 md:p-8 max-w-[1600px] mx-auto pb-20">
          {children}
        </main>

        <footer className={`fixed bottom-0 right-0 h-10 bg-white/80 backdrop-blur-md border-t border-slate-200 flex items-center justify-between px-8 z-40 transition-all duration-300 ${
          isSidebarOpen ? 'left-64' : 'left-20'
        }`}>
          <div className="flex-1 hidden md:block">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">© {new Date().getFullYear()} CMC Holding</span>
          </div>
          
          <div className="flex-1 text-center">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
               Designed & Developed by <span className="text-[#b59662] font-black border-b-2 border-[#b59662]/30">IT Department</span>
             </span>
          </div>
          
          <div className="flex-1 text-right hidden sm:block">
             <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
               Quality Management System
             </span>
          </div>
        </footer>
      </div>

      <ProfileDrawer 
        isOpen={isProfileDrawerOpen} 
        onClose={closeProfileDrawer} 
        user={user}
      />
    </div>
  );
};

export default DashboardLayout;
