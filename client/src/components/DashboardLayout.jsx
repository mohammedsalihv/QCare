import React, { useState, useEffect } from 'react';
import WorkspaceNav from './WorkspaceNav';
import AppFooter from './AppFooter';
import ProfileDrawer from './ProfileDrawer';
import { io } from 'socket.io-client';
import { useNotification } from './NotificationContext';

const DashboardLayout = ({ children }) => {
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const { fetchFeed } = useNotification();

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

    // Connect Socket.IO directly to the current origin
    const socket = io(window.location.origin);

    fetchFeed();

    // Join personal room
    socket.emit('join', user._id);

    // Join admins room if applicable
    if (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'superadmin') {
      socket.emit('join-admins');
    }

    // Listen for notifications
    socket.on('new-notification', () => { fetchFeed(); });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, user?.role, fetchFeed]);

  const openProfileDrawer = () => setIsProfileDrawerOpen(true);
  const closeProfileDrawer = () => setIsProfileDrawerOpen(false);

  return (
    <div className="qc-app">
      <WorkspaceNav openProfileDrawer={openProfileDrawer} user={user} />
      <main className="qc-main">{children}<AppFooter /></main>
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={closeProfileDrawer}
        user={user}
      />
    </div>
  );
};

export default DashboardLayout;
