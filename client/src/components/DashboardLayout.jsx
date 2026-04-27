import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ProfileDrawer from './ProfileDrawer';
import { io } from 'socket.io-client';
import { useNotification } from './NotificationContext';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const { showNotification, setFeedNotifications: setNotifications } = useNotification();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="min-h-screen bg-white font-sans relative overflow-hidden text-slate-900">
      <style>{`
        @keyframes ekg-pulse {
          0% { stroke-dashoffset: 2500; opacity: 0; }
          10% { opacity: 0.3; }
          40% { opacity: 0.3; }
          50% { stroke-dashoffset: 0; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        .ekg-line-medical {
          stroke-dasharray: 2500;
          stroke-dashoffset: 2500;
          animation: ekg-pulse 12s linear infinite;
        }
        @keyframes cell-float {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.15; }
          80% { opacity: 0.15; }
          100% { transform: translate(100px, -100px) rotate(360deg); opacity: 0; }
        }
        .animate-cell {
          animation: cell-float 20s ease-in-out infinite;
        }
        @keyframes scan-horizontal {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 0.05; }
          100% { left: 100%; opacity: 0; }
        }
        .medical-scan-line {
          position: absolute;
          top: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, #2dd4bf, transparent);
          animation: scan-horizontal 8s linear infinite;
        }
      `}</style>

      {/* Global Medical Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Refined EKG Monitor */}
        <div className="absolute top-[20%] left-0 w-full h-80 opacity-30">
          <svg viewBox="0 0 2000 200" className="w-full h-full">
            <path
              d="M0 100 L400 100 L415 80 L430 120 L445 100 L800 100 L815 50 L835 150 L855 100 L1200 100 L1215 80 L1230 120 L1245 100 L1600 100 L1615 40 L1640 160 L1665 100 L2000 100"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeLinecap="round"
              className="ekg-line-medical"
            />
          </svg>
        </div>
        
        {/* Floating Biological Cells */}
        <div className="absolute top-[10%] left-[5%] w-16 h-16 rounded-full border-2 border-[#2dd4bf]/20 animate-cell" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-[60%] left-[15%] w-12 h-12 rounded-full border border-[#2dd4bf]/10 animate-cell" style={{ animationDelay: '5s' }}></div>
        <div className="absolute top-[30%] right-[10%] w-20 h-20 rounded-full border-2 border-[#2dd4bf]/15 animate-cell" style={{ animationDelay: '10s' }}></div>
        <div className="absolute top-[80%] right-[20%] w-14 h-14 rounded-full border border-[#2dd4bf]/20 animate-cell" style={{ animationDelay: '15s' }}></div>
        
        {/* Subtle Horizontal Scan */}
        <div className="medical-scan-line"></div>
        
        {/* Static Medical Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.2]"></div>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isMobile={isMobile}
      />
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={toggleSidebar}
        ></div>
      )}
      
      <div 
        className={`relative z-10 transition-all duration-300 ${
          isMobile ? 'ml-0' : (isSidebarOpen ? 'ml-72' : 'ml-20')
        }`}
      >
        <Navbar 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          openProfileDrawer={openProfileDrawer} 
          user={user} 
        />
        
        <main className="p-6 md:p-10 max-w-[1700px] mx-auto pb-32 min-h-[calc(100vh-100px)]">
          {children}
        </main>

        <footer className={`fixed bottom-0 right-0 h-12 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-between px-6 sm:px-10 z-40 transition-all duration-300 ${
          isMobile ? 'left-0' : (isSidebarOpen ? 'left-72' : 'left-20')
        }`}>
          <div className="flex-1 hidden md:block">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">© {new Date().getFullYear()} CMC Holding</span>
          </div>
          
          <div className="flex-1 text-center">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
               System Intelligence <span className="text-[#2dd4bf] font-black border-b border-[#2dd4bf]/30 ml-1">Portal v3.0</span>
             </span>
          </div>
          
          <div className="flex-1 text-right hidden sm:block">
             <div className="flex items-center justify-end gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.5)]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Connection</span>
             </div>
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
